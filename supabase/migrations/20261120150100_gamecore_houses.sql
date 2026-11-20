-- Module: gamecore — resident houses and today's actions (requirement.md v1.26 §7.2, §7.3).
--
--   * Houses: Verified Residents of the community (movers keep theirs, §6.4) whose last active day
--     (later of their verification and last action here) is within the last 30 Calgary days.
--   * Each resident keeps a fixed house lot (slot 0..149 = the stored plan's house lots ordered by
--     land stage, then plan order; the client maps slots to tiles). Lots are assigned while
--     building the snapshot (no extra request): the lowest free slot; when none is free, the
--     lowest slot of a resident whose house is archived. Slots of people who no longer live here
--     (moved away) are freed. Lowest-free keeps used slots below the cumulative resident count,
--     which every land stage can hold (plan test), so a house is always on land.
--   * Today's actions (live, at most 20, newest first, no clock times): nickname + building, for
--     the mini villagers' action replay. Pending (unverified) help is left out.
--   * Public data has no user ids: houses are identified by slot; `me.house_slot` is mine.

create function gamecore.house_slots() returns integer language sql immutable as $$ select 150 $$;

create table gamecore.house_lots (
  community_id uuid not null references gamecore.communities (id),
  slot smallint not null check (slot >= 0 and slot < 150),
  user_id uuid not null references auth.users (id) on delete cascade,
  assigned_on date not null,
  primary key (community_id, slot),
  unique (community_id, user_id)
);
alter table gamecore.house_lots enable row level security;
revoke all on gamecore.house_lots from public, anon, authenticated;

-- Residents whose houses are shown on a day, with their last active day.
create function gamecore.shown_houses(p_community_id uuid, p_day date)
returns table (user_id uuid, verified_on date, last_active date)
language sql stable set search_path = ''
as $$
  select r.user_id, r.verified_on, x.last_active
  from residency.residents_on(p_community_id, p_day) r
  cross join lateral (
    select greatest(r.verified_on,
                    coalesce((select max(a.calgary_day) from gamecore.actions a
                              where a.user_id = r.user_id and a.community_id = p_community_id and a.calgary_day <= p_day),
                             r.verified_on)) as last_active
  ) x
  where x.last_active > p_day - 30
$$;

-- Assigns lots and returns {houses: [{slot, nickname, active_today, founding}], hidden: n}.
create function gamecore.houses_at(p_community_id uuid, p_day date)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_user record;
  v_slot integer;
  v_founder uuid := residency.founder_of(p_community_id);
begin
  perform pg_advisory_xact_lock(hashtextextended('gamecore.houses:' || p_community_id::text, 0));

  -- People who no longer live here (moved away) free their lot.
  delete from gamecore.house_lots l
  where l.community_id = p_community_id
    and l.user_id not in (select r.user_id from residency.residents_on(p_community_id, p_day) r);

  for v_user in
    select h.user_id from gamecore.shown_houses(p_community_id, p_day) h
    where not exists (select 1 from gamecore.house_lots l where l.community_id = p_community_id and l.user_id = h.user_id)
    order by h.verified_on, h.user_id
  loop
    select min(g.s) into v_slot
    from generate_series(0, gamecore.house_slots() - 1) g(s)
    where not exists (select 1 from gamecore.house_lots l where l.community_id = p_community_id and l.slot = g.s);
    if v_slot is null then
      -- Full: take the lowest lot of a resident whose house is archived (not shown).
      select min(l.slot) into v_slot from gamecore.house_lots l
      where l.community_id = p_community_id
        and l.user_id not in (select h.user_id from gamecore.shown_houses(p_community_id, p_day) h);
      if v_slot is null then
        continue; -- even active residents exceed the lots: this house is not drawn
      end if;
      update gamecore.house_lots set user_id = v_user.user_id, assigned_on = p_day
      where community_id = p_community_id and slot = v_slot;
    else
      insert into gamecore.house_lots (community_id, slot, user_id, assigned_on)
      values (p_community_id, v_slot, v_user.user_id, p_day);
    end if;
  end loop;

  return (
    select jsonb_build_object(
      'houses', coalesce(jsonb_agg(jsonb_build_object(
          'slot', l.slot,
          'nickname', coalesce(identity.nickname(h.user_id), 'Neighbour'),
          'active_today', exists (select 1 from gamecore.actions a
                                  where a.user_id = h.user_id and a.community_id = p_community_id and a.calgary_day = p_day),
          'founding', h.user_id is not distinct from v_founder
        ) order by l.slot) filter (where l.slot is not null), '[]'::jsonb),
      'hidden', count(*) filter (where l.slot is null)
    )
    from gamecore.shown_houses(p_community_id, p_day) h
    left join gamecore.house_lots l on l.community_id = p_community_id and l.user_id = h.user_id
  );
end;
$$;

-- Today's real actions for the action replay (newest first, at most 20; no times).
create function gamecore.today_actions(p_community_id uuid, p_day date)
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('nickname', x.nickname, 'building_key', x.building_key, 'title', x.title) order by x.created_at desc), '[]'::jsonb)
  from (
    select coalesce(identity.nickname(a.user_id), 'A neighbour') as nickname, p.building_key, b.name as title, a.created_at
    from gamecore.actions a
    join gamecore.projects p on p.id = a.project_id
    join gamecore.building_types b on b.key = p.building_key
    where a.community_id = p_community_id and a.calgary_day = p_day and not a.pending
    order by a.created_at desc
    limit 20
  ) x
$$;

-- The shared state of a community on the Calgary day of p_now (no personal data).
create or replace function gamecore.community_snapshot_at(p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community gamecore.communities;
  v_residents integer;
  v_streak integer;
  v_vitality integer;
  v_today record;
  v_buildings jsonb;
  v_projects jsonb;
  v_next_tier integer;
  v_changes jsonb;
  v_houses jsonb;
begin
  select c.* into v_community from gamecore.communities c where c.id = p_community_id;
  if not found then
    raise exception 'community not found' using errcode = 'P0002';
  end if;

  perform gamecore.ensure_tree(p_community_id, v_day);
  v_residents := gamecore.cumulative_residents(p_community_id);
  v_streak := gamecore.community_streak(p_community_id, v_day);
  v_vitality := gamecore.vitality(p_community_id, v_day);
  select * into v_today from gamecore.day_stats(p_community_id, v_day);
  select min(t.min_residents) into v_next_tier from gamecore.land_tiers t where t.min_residents > v_residents;

  with s as (
    select b.*,
           gamecore.built_level(p_community_id, b.key, v_day) as built,
           gamecore.active_project(p_community_id, b.key, v_day) as active_id,
           exists (select 1 from gamecore.building_openings o
                   where o.community_id = p_community_id and o.building_key = b.key and o.opened_on <= v_day) as opened
    from gamecore.building_types b
  ), v as (
    select s.*, p.level as active_level, p.required_actions as required,
           least(gamecore.applied_progress(p.id, v_day), p.required_actions) as progress
    from s left join gamecore.projects p on p.id = s.active_id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'key', v.key, 'name', v.name, 'stage', v.stage,
      'status', case when v.active_id is not null then 'building'
                     when v.built > 0 then 'built'
                     when v.opened then 'opened'
                     else 'locked' end,
      'level', coalesce(v.active_level, greatest(v.built, 1)),
      'progress', case when v.active_id is not null then v.progress::numeric / v.required else case when v.built > 0 then 1 else 0 end end,
      'remaining', case when v.active_id is null and v.built = 0 and not v.opened then jsonb_build_object(
          'residents', greatest(0, v.residents - v_residents),
          'streak_days', greatest(0, v.streak_days - v_streak),
          'requires', coalesce((select jsonb_agg(r.requires_key order by t.position)
                                from gamecore.building_requires r join gamecore.building_types t on t.key = r.requires_key
                                where r.building_key = v.key and gamecore.built_level(p_community_id, r.requires_key, v_day) = 0), '[]'::jsonb)
        ) else null end
    ) order by v.position), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', v.active_id, 'building_key', v.key, 'title', v.name, 'level', v.active_level,
      'required', v.required, 'progress', v.progress,
      'stage', case when v.progress * 2 < v.required then 'scaffolding' else 'frame' end
    ) order by v.position) filter (where v.active_id is not null), '[]'::jsonb)
  into v_buildings, v_projects
  from v;

  -- What changed since yesterday: yesterday's help shows today.
  v_changes := jsonb_build_object(
    'actions', (select count(*) from gamecore.actions a where a.community_id = p_community_id and gamecore.action_applied_on(a) = v_day - 1),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', x.building_key, 'title', b.name, 'level', x.level, 'added', x.added) order by b.position, x.level)
      from (select p.building_key, p.level, count(*)::integer as added
            from gamecore.actions a join gamecore.projects p on p.id = a.project_id
            where a.community_id = p_community_id and gamecore.action_applied_on(a) = v_day - 1
            group by p.building_key, p.level) x
      join gamecore.building_types b on b.key = x.building_key), '[]'::jsonb),
    'built', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', b.key, 'title', b.name, 'level', gamecore.built_level(p_community_id, b.key, v_day)) order by b.position)
      from gamecore.building_types b
      where gamecore.built_level(p_community_id, b.key, v_day) > gamecore.built_level(p_community_id, b.key, v_day - 1)), '[]'::jsonb),
    'opened', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', b.key, 'title', b.name) order by b.position)
      from gamecore.building_openings o join gamecore.building_types b on b.key = o.building_key
      where o.community_id = p_community_id and o.opened_on >= v_day - 1
        and gamecore.built_level(p_community_id, b.key, v_day) = 0
        -- the seeds are open from the start: not news
        and (b.residents > 0 or b.streak_days > 0
             or exists (select 1 from gamecore.building_requires r where r.building_key = b.key))), '[]'::jsonb),
    'new_residents', gamecore.cumulative_residents_on(p_community_id, v_day - 1) - gamecore.cumulative_residents_on(p_community_id, v_day - 2),
    'land_grew', gamecore.land_stage(gamecore.cumulative_residents_on(p_community_id, v_day - 1))
                 > gamecore.land_stage(gamecore.cumulative_residents_on(p_community_id, v_day - 2)),
    'vitality_before', gamecore.vitality(p_community_id, v_day - 1)
  );

  v_houses := gamecore.houses_at(p_community_id, v_day);

  return jsonb_build_object(
    'houses', v_houses -> 'houses',
    'hidden_houses', (v_houses ->> 'hidden')::integer,
    'community', jsonb_build_object(
      'id', v_community.id, 'code', v_community.code, 'name', v_community.name,
      'sector', v_community.sector, 'population', v_community.population,
      'residents', v_residents,
      'land_stage', gamecore.land_stage(v_residents),
      'next_land_residents', case when v_next_tier is null then null else v_next_tier - v_residents end,
      'settled', gamecore.built_level(p_community_id, 'welcome-sign', v_day) > 0,
      'vitality', v_vitality,
      'mini_villagers', gamecore.mini_villagers(v_today.shown_residents, v_vitality)
    ),
    'streak_before_today', gamecore.streak_before(p_community_id, v_day),
    'buildings', v_buildings,
    'projects', v_projects,
    'changes', v_changes
  );
end;
$$;

create or replace function gamecore.community_state_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_state jsonb;
  v_today record;
  v_me jsonb := null;
  v_play record;
begin
  select s.state into v_state from gamecore.community_snapshots s
  where s.community_id = p_community_id and s.calgary_day = v_day
    -- strictly newer: a change in the same instant (same transaction time) must rebuild
    and s.built_at > coalesce(residency.changed_at(p_community_id), '-infinity'::timestamptz);
  if v_state is null then
    v_state := gamecore.refresh_snapshot(p_community_id, p_now);
  end if;

  select * into v_today from gamecore.day_stats(p_community_id, v_day);

  if p_uid is not null then
    select * into v_play from residency.play_on(p_uid, v_day);
    v_me := jsonb_build_object(
      'house_slot', (select l.slot from gamecore.house_lots l where l.community_id = p_community_id and l.user_id = p_uid),
      'member', v_play.community_id is not distinct from p_community_id,
      'pending', v_play.community_id is not distinct from p_community_id and coalesce(v_play.pending, false),
      'energy_max', gamecore.energy_per_day(),
      'energy_left', gamecore.energy_per_day() - gamecore.energy_used(p_uid, v_day)
    );
  end if;

  return gamecore.day_info(v_day) || (v_state - 'streak_before_today') || jsonb_build_object(
    'streak', jsonb_build_object(
      'days', (v_state ->> 'streak_before_today')::integer + case when v_today.attended then 1 else 0 end,
      'today', jsonb_build_object(
        'acted', v_today.acted,
        'active_residents', v_today.active_residents,
        'needed', greatest(1, ceil(v_today.active_residents / 2.0))::integer,
        'attended', v_today.attended
      )
    ),
    'today_actions', gamecore.today_actions(p_community_id, v_day),
    'me', v_me
  );
end;
$$;


comment on function public.gamecore_get_community_state(uuid) is
  'Community state on the current Calgary day: buildings, constructions, land, Vitality, streak, changes, resident houses (slot, nickname, active today, founding; hidden_houses when lots run out), today''s actions for the replay, and me (energy, member, pending, my house slot).';

revoke all on all functions in schema gamecore from public, anon, authenticated;
