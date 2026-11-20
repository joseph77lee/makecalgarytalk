-- Module: gamecore — residents come from Residency (requirement.md v1.23 §6.3–§6.4).
--
-- Replaces the temporary manual community choice (M4/M5): gamecore.players,
-- gamecore.membership_events and gamecore_choose_community are gone. gamecore now reads
-- residents only through residency.* functions:
--   * members per day      → residency.counted_residents_on (movers excluded, §6.4)
--   * cumulative residents → residency.cumulative_residents_on (distinct people ever verified)
--   * where a player plays → residency.play_on (verified community, or the candidate: pending)
--   * pending actions      → count toward progress from residency.applied_on (verification day)
-- Snapshots are rebuilt when residency.changed_at is not older than the snapshot.

-- Existing joins become verifications (local data from the temporary choice).
select residency.record_verification(m.user_id, m.community_id, m.joined_on, m.created_at)
from gamecore.membership_events m
order by m.id;

-- Pending actions: given before the player was verified in that community (§6.3).
alter table gamecore.actions add column pending boolean not null default false;

-- Day an action starts to count toward progress (null = never).
create function gamecore.action_applied_on(p_action gamecore.actions)
returns date
language sql stable set search_path = ''
as $$
  select case when p_action.pending
              then residency.applied_on(p_action.user_id, p_action.community_id, p_action.calgary_day)
              else p_action.calgary_day end
$$;

-- Progress shown on a day = actions applied on earlier days.
create or replace function gamecore.applied_progress(p_project_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from gamecore.actions a
  where a.project_id = p_project_id
    and a.calgary_day < p_day
    and (not a.pending or residency.applied_on(a.user_id, a.community_id, a.calgary_day) < p_day)
$$;

-- Residents ------------------------------------------------------------------------------

create or replace function gamecore.members_on(p_community_id uuid, p_day date)
returns table (user_id uuid, joined_on date)
language sql stable set search_path = ''
as $$
  select r.user_id, r.verified_on from residency.counted_residents_on(p_community_id, p_day) r
$$;

create or replace function gamecore.cumulative_residents(p_community_id uuid)
returns integer
language sql stable set search_path = ''
as $$
  select residency.cumulative_residents_on(p_community_id, 'infinity'::date)
$$;

create or replace function gamecore.cumulative_residents_on(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select residency.cumulative_residents_on(p_community_id, p_day)
$$;

create or replace function gamecore.first_day(p_community_id uuid)
returns date
language sql stable set search_path = ''
as $$
  select residency.first_day(p_community_id)
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

  return jsonb_build_object(
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

create or replace function gamecore.refresh_snapshots(p_now timestamptz default now())
returns integer
language plpgsql set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in select r from residency.communities_with_residents() r loop
    begin
      perform gamecore.refresh_snapshot(v_id, p_now);
      v_count := v_count + 1;
    exception when others then
      raise warning 'gamecore snapshot failed for %: %', v_id, sqlerrm;
    end;
  end loop;
  return v_count;
end;
$$;

-- Community state = snapshot (rebuilt when missing, from an earlier Calgary day, or older than
-- the last residency change) + today's streak progress + me.
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
    'me', v_me
  );
end;
$$;

create or replace function gamecore.submit_actions_at(p_uid uuid, p_actions jsonb, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_max integer := gamecore.energy_per_day();
  v_community uuid;
  v_pending boolean;
  v_used integer;
  v_results jsonb := '[]'::jsonb;
  v_entry jsonb;
  v_id uuid;
  v_project_id uuid;
  v_project gamecore.projects;
  v_existing gamecore.actions;
  v_inserted uuid;
  v_status text;
  v_reason text;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_actions is null or jsonb_typeof(p_actions) <> 'array' then
    raise exception 'actions must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_actions) > gamecore.max_actions_per_call() then
    raise exception 'at most % actions per call', gamecore.max_actions_per_call() using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gamecore.energy:' || p_uid::text, 0));

  select p.community_id, p.pending into v_community, v_pending from residency.play_on(p_uid, v_day) p;
  v_used := gamecore.energy_used(p_uid, v_day);
  if v_community is not null then
    perform gamecore.ensure_tree(v_community, v_day);
  end if;

  for v_entry in select e from jsonb_array_elements(p_actions) e loop
    v_status := 'rejected';
    v_reason := null;
    v_id := null;
    v_project_id := null;
    begin
      v_id := (v_entry ->> 'id')::uuid;
      v_project_id := (v_entry ->> 'project_id')::uuid;
    exception when invalid_text_representation then
      null;
    end;

    if v_id is null or v_project_id is null then
      v_reason := 'invalid';
    else
      select a.* into v_existing from gamecore.actions a where a.id = v_id;
      if found then
        if v_existing.user_id = p_uid then
          v_status := 'duplicate';
        else
          v_reason := 'id_conflict';
        end if;
      elsif v_community is null then
        v_reason := 'not_member';
      else
        select p.* into v_project from gamecore.projects p where p.id = v_project_id;
        if not found then
          v_reason := 'project_not_found';
        elsif v_project.community_id <> v_community then
          v_reason := 'other_community';
        elsif v_project.started_on > v_day
           or gamecore.applied_progress(v_project.id, v_day) >= v_project.required_actions then
          v_reason := 'project_not_active';
        elsif v_used >= v_max then
          v_reason := 'no_energy';
        else
          insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot, pending)
          values (v_id, p_uid, v_community, v_project.id, v_day, v_used + 1, coalesce(v_pending, false))
          on conflict (id) do nothing
          returning id into v_inserted;
          if v_inserted is null then
            v_reason := 'id_conflict';
          else
            v_used := v_used + 1;
            v_status := 'accepted';
          end if;
          v_inserted := null;
        end if;
      end if;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_strip_nulls(jsonb_build_object('id', v_entry -> 'id', 'status', v_status, 'reason', v_reason))
    );
  end loop;

  return gamecore.day_info(v_day) || jsonb_build_object(
    'pending', coalesce(v_pending, false),
    'energy_max', v_max,
    'energy_left', v_max - v_used,
    'results', v_results
  );
end;
$$;

create or replace function gamecore.me_at(p_uid uuid, p_now timestamptz)
returns jsonb
language sql stable set search_path = ''
as $$
  select gamecore.day_info(common.calgary_day(p_now)) || jsonb_build_object(
    'community_id', (select p.community_id from residency.play_on(p_uid, common.calgary_day(p_now)) p),
    'pending', coalesce((select p.pending from residency.play_on(p_uid, common.calgary_day(p_now)) p), false),
    'energy_max', gamecore.energy_per_day(),
    'energy_left', gamecore.energy_per_day() - gamecore.energy_used(p_uid, common.calgary_day(p_now))
  )
$$;

comment on function public.gamecore_get_me() is
  'The community I play in (my verified community, or my candidate while verifying: pending), and my energy for the current Calgary day.';
comment on function public.gamecore_submit_actions(jsonb) is
  'Submit actions [{id, project_id}] (idempotent by id) in the community I play in. Returns per-action status, whether they are pending, and energy left.';

-- The temporary manual choice is gone.
drop function public.gamecore_choose_community(uuid);
drop function gamecore.choose_community_at(uuid, uuid, timestamptz);
drop table gamecore.membership_events;
drop function gamecore.membership_events_append_only();
drop table gamecore.players;

revoke all on all functions in schema gamecore from public, anon, authenticated;
