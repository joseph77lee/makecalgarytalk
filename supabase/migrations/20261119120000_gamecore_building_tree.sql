-- Module: gamecore — building tree (requirement.md v1.20 §7.1, §7.6, §7.6b, §7.7, §7.8).
--
-- Replaces the M3 project catalog: a project is now the construction (level 1) or an
-- upgrade (level 2+) of one building of the tree. The tree is data (seeded from
-- supabase/data/building_tree.json by the next migration).
--
-- Rules (compute-on-read from the action log; the only writes are one-time records):
--   * A building OPENS when its required buildings are built and the community has enough
--     cumulative residents and streak days. The opening is recorded once, so it never re-locks.
--   * At most 3 constructions at a time; opened buildings start in tree order.
--   * When nothing opened is waiting, the newest building of each growth chain is upgraded
--     (lowest level first).
--   * Required actions = max(10, 5 × active residents) × stage multiplier (stage 1: at least 3)
--     × 1.25^(level − 1), frozen when the project starts.
--   * A building is built the day after its goal was reached (progress shows the next day).
--
-- TEMPORARY inputs until later modules:
--   * cumulative residents = players currently in the community (M7: distinct Verified Residents)
--   * community streak = 0 (M5), so buildings with a streak condition stay locked until then

-- Pre-launch: development data under the old catalog is discarded (local databases only).
delete from gamecore.actions;
delete from gamecore.projects;

drop function if exists gamecore.ensure_projects(uuid, date);
drop function if exists gamecore.completed_on(uuid);
drop function if exists gamecore.required_actions(integer, integer);

-- Tree data ----------------------------------------------------------------------

create table gamecore.building_types (
  key text primary key,
  position smallint not null unique,
  name text not null,
  stage smallint not null check (stage between 1 and 5),
  -- Lot key in the island plans; null for buildings without a lot (e.g. pathway lights).
  lot text,
  grows_from text references gamecore.building_types (key),
  residents integer not null default 0 check (residents >= 0),
  streak_days integer not null default 0 check (streak_days >= 0)
);
alter table gamecore.building_types enable row level security;

create table gamecore.building_requires (
  building_key text not null references gamecore.building_types (key),
  requires_key text not null references gamecore.building_types (key),
  primary key (building_key, requires_key)
);
alter table gamecore.building_requires enable row level security;

create table gamecore.stage_multipliers (
  stage smallint primary key,
  multiplier numeric not null check (multiplier > 0)
);
alter table gamecore.stage_multipliers enable row level security;

create table gamecore.land_tiers (
  stage smallint primary key,
  min_residents integer not null check (min_residents >= 0)
);
alter table gamecore.land_tiers enable row level security;

-- One row the first day a building's conditions were met (never deleted: no re-locking).
create table gamecore.building_openings (
  community_id uuid not null references gamecore.communities (id),
  building_key text not null references gamecore.building_types (key),
  opened_on date not null,
  primary key (community_id, building_key)
);
alter table gamecore.building_openings enable row level security;

-- Projects are buildings of the tree.
alter table gamecore.projects drop column seq;
alter table gamecore.projects drop column kind;
alter table gamecore.projects drop column title;
alter table gamecore.projects add column building_key text not null references gamecore.building_types (key);
alter table gamecore.projects add constraint projects_building_level_key unique (community_id, building_key, level);
drop table gamecore.project_catalog;

revoke all on all tables in schema gamecore from public, anon, authenticated;

-- Inputs ---------------------------------------------------------------------------

-- TEMPORARY until Residency (M7): players currently in the community.
create function gamecore.cumulative_residents(p_community_id uuid)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from gamecore.players pl where pl.community_id = p_community_id
$$;

-- TEMPORARY until Community State (M5): no streak yet.
create function gamecore.community_streak(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select 0
$$;

create function gamecore.land_stage(p_residents integer)
returns integer
language sql stable set search_path = ''
as $$
  select coalesce(max(t.stage), 0)::integer from gamecore.land_tiers t where t.min_residents <= p_residents
$$;

create function gamecore.required_actions(p_members integer, p_stage integer, p_level integer)
returns integer
language sql stable set search_path = ''
as $$
  select ceil(
    greatest(
      case when p_stage = 1 then 3 else 0 end,
      greatest(10, 5 * greatest(p_members, 0)) * coalesce((select m.multiplier from gamecore.stage_multipliers m where m.stage = p_stage), 1)
    ) * power(1.25, greatest(p_level, 1) - 1)
  )::integer
$$;

-- Highest level of a building completed (visible) on a day; 0 if not built.
create function gamecore.built_level(p_community_id uuid, p_building_key text, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select coalesce(max(p.level), 0)::integer
  from gamecore.projects p
  where p.community_id = p_community_id and p.building_key = p_building_key
    and p.started_on <= p_day
    and gamecore.applied_progress(p.id, p_day) >= p.required_actions
$$;

-- The project in progress for a building on a day, if any.
create function gamecore.active_project(p_community_id uuid, p_building_key text, p_day date)
returns uuid
language sql stable set search_path = ''
as $$
  select p.id from gamecore.projects p
  where p.community_id = p_community_id and p.building_key = p_building_key
    and p.started_on <= p_day
    and gamecore.applied_progress(p.id, p_day) < p.required_actions
  order by p.level desc
  limit 1
$$;

create function gamecore.active_count(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from gamecore.projects p
  where p.community_id = p_community_id and p.started_on <= p_day
    and gamecore.applied_progress(p.id, p_day) < p.required_actions
$$;

-- Opens buildings whose conditions are met and starts projects (up to 3 at a time).
create function gamecore.ensure_tree(p_community_id uuid, p_day date)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_residents integer;
  v_streak integer;
  v_members integer;
  v_next record;
begin
  -- Serialize per community: openings and project starts are written once.
  perform pg_advisory_xact_lock(hashtextextended('gamecore.tree:' || p_community_id::text, 0));
  v_residents := gamecore.cumulative_residents(p_community_id);
  v_streak := gamecore.community_streak(p_community_id, p_day);

  insert into gamecore.building_openings (community_id, building_key, opened_on)
  select p_community_id, b.key, p_day
  from gamecore.building_types b
  where b.residents <= v_residents
    and b.streak_days <= v_streak
    and not exists (select 1 from gamecore.building_requires r
                    where r.building_key = b.key and gamecore.built_level(p_community_id, r.requires_key, p_day) = 0)
  on conflict do nothing;

  v_members := gamecore.member_count(p_community_id, p_day);
  while gamecore.active_count(p_community_id, p_day) < 3 loop
    -- 1. the next opened building that has never been started (tree order)
    select b.key, b.stage, 1 as level into v_next
    from gamecore.building_types b
    join gamecore.building_openings o on o.community_id = p_community_id and o.building_key = b.key and o.opened_on <= p_day
    where not exists (select 1 from gamecore.projects p where p.community_id = p_community_id and p.building_key = b.key)
    order by b.position
    limit 1;

    -- 2. otherwise upgrade the newest building of a growth chain (lowest level first)
    if v_next is null then
      select b.key, b.stage, gamecore.built_level(p_community_id, b.key, p_day) + 1 as level into v_next
      from gamecore.building_types b
      where gamecore.built_level(p_community_id, b.key, p_day) > 0
        and gamecore.active_project(p_community_id, b.key, p_day) is null
        and not exists (select 1 from gamecore.building_types c
                        where c.grows_from = b.key and gamecore.built_level(p_community_id, c.key, p_day) > 0)
        and not exists (select 1 from gamecore.projects p
                        where p.community_id = p_community_id and p.building_key = b.key and p.started_on > p_day)
      order by gamecore.built_level(p_community_id, b.key, p_day), b.position
      limit 1;
    end if;

    exit when v_next is null;
    insert into gamecore.projects (community_id, building_key, level, required_actions, started_on)
    values (p_community_id, v_next.key, v_next.level, gamecore.required_actions(v_members, v_next.stage, v_next.level), p_day);
    v_next := null;
  end loop;
end;
$$;

-- Community state on the Calgary day of p_now. p_uid may be null (visitor).
create or replace function gamecore.community_state_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community gamecore.communities;
  v_residents integer;
  v_streak integer;
  v_buildings jsonb;
  v_projects jsonb;
  v_me jsonb := null;
  v_player_community uuid;
begin
  select c.* into v_community from gamecore.communities c where c.id = p_community_id;
  if not found then
    raise exception 'community not found' using errcode = 'P0002';
  end if;

  perform gamecore.ensure_tree(p_community_id, v_day);
  v_residents := gamecore.cumulative_residents(p_community_id);
  v_streak := gamecore.community_streak(p_community_id, v_day);

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

  if p_uid is not null then
    select pl.community_id into v_player_community from gamecore.players pl where pl.user_id = p_uid;
    v_me := jsonb_build_object(
      'member', v_player_community is not distinct from p_community_id,
      'energy_max', gamecore.energy_per_day(),
      'energy_left', gamecore.energy_per_day() - gamecore.energy_used(p_uid, v_day)
    );
  end if;

  return gamecore.day_info(v_day) || jsonb_build_object(
    'community', jsonb_build_object(
      'id', v_community.id, 'code', v_community.code, 'name', v_community.name,
      'sector', v_community.sector, 'population', v_community.population,
      'residents', v_residents,
      'land_stage', gamecore.land_stage(v_residents),
      'settled', gamecore.built_level(p_community_id, 'welcome-sign', v_day) > 0
    ),
    'buildings', v_buildings,
    'projects', v_projects,
    'me', v_me
  );
end;
$$;

-- Submissions keep their rules; the projects they target now come from the tree.
create or replace function gamecore.submit_actions_at(p_uid uuid, p_actions jsonb, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_max integer := gamecore.energy_per_day();
  v_community uuid;
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

  select pl.community_id into v_community from gamecore.players pl where pl.user_id = p_uid;
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
          insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
          values (v_id, p_uid, v_community, v_project.id, v_day, v_used + 1)
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
    'energy_max', v_max,
    'energy_left', v_max - v_used,
    'results', v_results
  );
end;
$$;

comment on function public.gamecore_get_community_state(uuid) is
  'Community state on the current Calgary day: every building of the tree (status, level, progress, what is missing), the active constructions, land stage, and my energy when signed in.';

revoke all on all functions in schema gamecore from public, anon, authenticated;
