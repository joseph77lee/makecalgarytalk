-- Module: gamecore — houses are scenery (requirement.md v1.48 §7.2).
--
--   * Houses stand on every house lot of the risen land; they never stand for players. The public
--     state lists no residents' houses any more (no names, no lights by activity, no "+N").
--   * My house: every Verified Resident gets a fixed slot once (slots = the island plan's house lots
--     ordered by land stage, then plan order; the client maps slots to tiles): the lowest free slot
--     on land that has risen. When all of those have an owner, residents SHARE lots: the slot with
--     the fewest owners (lowest first). Only the owner sees their marker, so sharing looks normal.
--     Lots are never taken back (no 30-day archive); people who moved away free theirs.
--   * gamecore.house_capacity (from the island plans, supabase/data/place_lots_seed.py): how many
--     house lots each land stage holds.

-- Pre-launch: lots are reassigned on the regenerated plans (local databases only).
delete from gamecore.house_lots;

create table gamecore.house_capacity (
  community_id uuid not null references gamecore.communities (id),
  land_stage smallint not null check (land_stage >= 0),
  slots smallint not null check (slots >= 0),
  primary key (community_id, land_stage)
);
alter table gamecore.house_capacity enable row level security;
revoke all on gamecore.house_capacity from public, anon, authenticated;

alter table gamecore.house_lots drop constraint house_lots_pkey;
alter table gamecore.house_lots drop constraint house_lots_slot_check;
alter table gamecore.house_lots add constraint house_lots_slot_check check (slot >= 0);
alter table gamecore.house_lots drop constraint house_lots_community_id_user_id_key;
alter table gamecore.house_lots add primary key (community_id, user_id);
create index house_lots_slot_idx on gamecore.house_lots (community_id, slot);

drop function gamecore.houses_at(uuid, date);
drop function gamecore.house_slots();

-- House lots on a community's land at a land stage (0 if the plan has none).
create function gamecore.house_slots_on(p_community_id uuid, p_land_stage integer)
returns integer
language sql stable set search_path = ''
as $$
  select coalesce((select c.slots from gamecore.house_capacity c
                   where c.community_id = p_community_id and c.land_stage = p_land_stage), 0)
$$;

-- Gives every resident without a lot their fixed slot (lowest free, else the least shared).
create function gamecore.assign_houses(p_community_id uuid, p_day date)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_user record;
  v_slots integer;
  v_slot integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('gamecore.houses:' || p_community_id::text, 0));

  -- People who no longer live here (moved away) free their lot.
  delete from gamecore.house_lots l
  where l.community_id = p_community_id
    and l.user_id not in (select r.user_id from residency.residents_on(p_community_id, p_day) r);

  v_slots := gamecore.house_slots_on(p_community_id, gamecore.land_stage(gamecore.cumulative_residents(p_community_id)));
  if v_slots = 0 then
    return;
  end if;
  for v_user in
    select r.user_id from residency.residents_on(p_community_id, p_day) r
    where not exists (select 1 from gamecore.house_lots l where l.community_id = p_community_id and l.user_id = r.user_id)
    order by r.verified_on, r.user_id
  loop
    select g.s into v_slot
    from generate_series(0, v_slots - 1) g(s)
    order by (select count(*) from gamecore.house_lots l where l.community_id = p_community_id and l.slot = g.s), g.s
    limit 1;
    insert into gamecore.house_lots (community_id, slot, user_id, assigned_on)
    values (p_community_id, v_slot, v_user.user_id, p_day);
  end loop;
end;
$$;

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
                   where o.community_id = p_community_id and o.building_key = b.key and o.opened_on <= v_day) as opened,
           gamecore.previous_step(p_community_id, b.track, b.step) as prev_key
    from gamecore.community_steps(p_community_id) b
  ), v as (
    select s.*, p.required_actions as required,
           least(gamecore.applied_progress(p.id, v_day), p.required_actions) as progress
    from s left join gamecore.projects p on p.id = s.active_id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'key', v.key, 'name', v.name, 'track', v.track, 'step', v.step, 'stage', v.stage,
      'landmark_order', v.landmark_order, 'tiles', jsonb_build_array(v.tiles_w, v.tiles_d), 'site', v.site,
      'status', case when v.active_id is not null then 'building'
                     when v.built > 0 then 'built'
                     when v.opened then 'opened'
                     else 'locked' end,
      'level', 1,
      'progress', case when v.active_id is not null then v.progress::numeric / v.required else case when v.built > 0 then 1 else 0 end end,
      'remaining', case when v.active_id is null and v.built = 0 and not v.opened then jsonb_build_object(
          'residents', greatest(0, v.residents - v_residents),
          'streak_days', greatest(0, v.streak_days - v_streak),
          'land_residents', gamecore.land_residents_missing(p_community_id, v.key, v_residents),
          'requires', case when v.prev_key is not null and gamecore.built_level(p_community_id, v.prev_key, v_day) = 0
                           then jsonb_build_array(v.prev_key) else '[]'::jsonb end
        ) else null end
    ) order by gamecore.track_order(v.track), v.step), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', v.active_id, 'building_key', v.key, 'title', v.name, 'level', 1,
      'required', v.required, 'progress', v.progress,
      'stage', case when v.progress * 2 < v.required then 'scaffolding' else 'frame' end
    ) order by gamecore.track_order(v.track), v.step) filter (where v.active_id is not null), '[]'::jsonb)
  into v_buildings, v_projects
  from v;

  -- What changed since yesterday: yesterday's help shows today.
  v_changes := jsonb_build_object(
    'actions', (select count(*) from gamecore.actions a where a.community_id = p_community_id and gamecore.action_applied_on(a) = v_day - 1),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', x.building_key, 'title', b.name, 'level', 1, 'added', x.added) order by gamecore.track_order(b.track), b.step)
      from (select p.building_key, count(*)::integer as added
            from gamecore.actions a join gamecore.projects p on p.id = a.project_id
            where a.community_id = p_community_id and gamecore.action_applied_on(a) = v_day - 1
            group by p.building_key) x
      join gamecore.building_types b on b.key = x.building_key), '[]'::jsonb),
    'built', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', b.key, 'title', b.name, 'level', 1) order by gamecore.track_order(b.track), b.step)
      from gamecore.community_steps(p_community_id) b
      where gamecore.built_level(p_community_id, b.key, v_day) > gamecore.built_level(p_community_id, b.key, v_day - 1)), '[]'::jsonb),
    'opened', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', b.key, 'title', b.name) order by gamecore.track_order(b.track), b.step)
      from gamecore.building_openings o join gamecore.building_types b on b.key = o.building_key
      where o.community_id = p_community_id and o.opened_on >= v_day - 1
        and gamecore.built_level(p_community_id, b.key, v_day) = 0
        and b.track <> 'root'), '[]'::jsonb),  -- the root is open from the start: not news
    'new_residents', gamecore.cumulative_residents_on(p_community_id, v_day - 1) - gamecore.cumulative_residents_on(p_community_id, v_day - 2),
    'land_grew', gamecore.land_stage(gamecore.cumulative_residents_on(p_community_id, v_day - 1))
                 > gamecore.land_stage(gamecore.cumulative_residents_on(p_community_id, v_day - 2)),
    'vitality_before', gamecore.vitality(p_community_id, v_day - 1)
  );

  perform gamecore.assign_houses(p_community_id, v_day);

  return jsonb_build_object(
    'community', jsonb_build_object(
      'id', v_community.id, 'code', v_community.code, 'name', v_community.name,
      'sector', v_community.sector, 'population', v_community.population,
      'persona', (select cp.persona from gamecore.community_personas cp where cp.community_id = p_community_id),
      'residents', v_residents,
      'land_stage', gamecore.land_stage(v_residents),
      'next_land_residents', case when v_next_tier is null then null else v_next_tier - v_residents end,
      'settled', gamecore.built_level(p_community_id, 'welcome-sign', v_day) > 0,
      'level', gamecore.development_level(p_community_id, v_day),
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

revoke all on all functions in schema gamecore from public, anon, authenticated;

comment on function public.gamecore_get_community_state(uuid) is
  'Community state on the current Calgary day: build map, constructions, land, development level, Vitality, streak, changes, today''s actions for the replay, and me (energy, member, pending, my house slot). Houses are scenery: no residents'' houses are listed.';
