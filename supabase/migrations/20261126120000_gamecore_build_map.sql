-- Module: gamecore — build map (requirement.md v1.48 §7.4, §7.6, §7.6b, §7.9).
--
-- Replaces the building tree: one root (the Welcome sign) opens three tracks (community, persona,
-- nature & leisure), each built in order. Which steps a community has depends on its persona and
-- its own landmarks: among the steps with the same track and step number, the most specific one
-- wins (this community > this persona > every community). Seeded from supabase/data/build_map.json
-- by the next migration.
--
-- A step OPENS when the previous step of its track is built (step 1: the Welcome sign), the
-- community has the step's cumulative residents and streak days, and the risen land holds the
-- step's lot (gamecore.place_lots, written by the island plan generator; no row = no land
-- condition). The opening is recorded once, so it never re-locks. At most 3 constructions at a
-- time, taking turns between the tracks. No upgrades in place any more: the nature track keeps
-- going with decoration steps instead.

-- Pre-launch: development data under the old tree is discarded (local databases only; never
-- repeat after launch).
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from gamecore.community_snapshots;
delete from gamecore.building_requires;
update gamecore.building_types set grows_from = null;

-- Step data ------------------------------------------------------------------------

alter table gamecore.building_types drop constraint building_types_stage_check;
alter table gamecore.building_types add constraint building_types_stage_check check (stage between 0 and 6);
alter table gamecore.building_types
  add column track text check (track in ('root', 'community', 'persona', 'nature')),
  add column step smallint check (step >= 0),
  add column persona text,
  add column community_code text,
  add column landmark_order smallint check (landmark_order between 1 and 3),
  add column tiles_w smallint not null default 0 check (tiles_w >= 0),
  add column tiles_d smallint not null default 0 check (tiles_d >= 0),
  add column site text;

-- Every community's persona (one of 10 patterns), from supabase/data/community_personas.csv.
create table gamecore.community_personas (
  community_id uuid primary key references gamecore.communities (id),
  persona text not null check (persona in ('lake', 'river', 'downtown', 'historic_main_street', 'golf', 'new_suburb',
                                           'hill_view', 'food_street', 'mature_suburb', 'special_district'))
);
alter table gamecore.community_personas enable row level security;

-- The land stage at which a step's lot rises on a community's island (from the island plan
-- generator). A step without a row has no land condition (e.g. pathway lights, no lot).
create table gamecore.place_lots (
  community_id uuid not null references gamecore.communities (id),
  building_key text not null references gamecore.building_types (key) on delete cascade,
  land_stage smallint not null check (land_stage >= 0),
  primary key (community_id, building_key)
);
alter table gamecore.place_lots enable row level security;

revoke all on all tables in schema gamecore from public, anon, authenticated;

-- Rules ----------------------------------------------------------------------------

create function gamecore.track_order(p_track text)
returns integer
language sql immutable set search_path = ''
as $$
  select case p_track when 'root' then 0 when 'community' then 1 when 'persona' then 2 when 'nature' then 3 end
$$;

-- The steps of one community's build map: per (track, step) the most specific applicable row.
create function gamecore.community_steps(p_community_id uuid)
returns setof gamecore.building_types
language sql stable set search_path = ''
as $$
  select distinct on (b.track, b.step) b.*
  from gamecore.building_types b
  join gamecore.communities c on c.id = p_community_id
  left join gamecore.community_personas cp on cp.community_id = c.id
  where b.track is not null
    and (b.persona is null or b.persona = cp.persona)
    and (b.community_code is null or b.community_code = c.code)
  order by b.track, b.step, (b.community_code is not null) desc, (b.persona is not null) desc, b.position
$$;

-- The step a step waits for: the previous step of its track, or the root for a first step.
create function gamecore.previous_step(p_community_id uuid, p_track text, p_step integer)
returns text
language sql stable set search_path = ''
as $$
  select s.key from gamecore.community_steps(p_community_id) s
  where (p_track <> 'root')
    and ((p_step = 1 and s.track = 'root') or (p_step > 1 and s.track = p_track and s.step = p_step - 1))
  limit 1
$$;

create or replace function gamecore.required_actions(p_members integer, p_stage integer, p_level integer)
returns integer
language sql stable set search_path = ''
as $$
  select ceil(greatest(
    case when p_stage <= 1 then 3 else 0 end,
    greatest(10, 5 * greatest(p_members, 0)) * coalesce((select m.multiplier from gamecore.stage_multipliers m where m.stage = p_stage), 1)
  ))::integer
$$;

-- Land still missing for a step: residents until its lot rises (0 when it has risen or has no lot).
create function gamecore.land_residents_missing(p_community_id uuid, p_key text, p_residents integer)
returns integer
language sql stable set search_path = ''
as $$
  select coalesce((
    select greatest(0, t.min_residents - p_residents)
    from gamecore.place_lots l join gamecore.land_tiers t on t.stage = l.land_stage
    where l.community_id = p_community_id and l.building_key = p_key), 0)
$$;

drop function gamecore.ensure_tree(uuid, date);
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
  select p_community_id, s.key, p_day
  from gamecore.community_steps(p_community_id) s
  where s.residents <= v_residents
    and s.streak_days <= v_streak
    and gamecore.land_residents_missing(p_community_id, s.key, v_residents) = 0
    and (s.track = 'root'
         or gamecore.built_level(p_community_id, gamecore.previous_step(p_community_id, s.track, s.step), p_day) > 0)
  on conflict do nothing;

  v_members := gamecore.member_count(p_community_id, p_day);
  while gamecore.active_count(p_community_id, p_day) < 3 loop
    -- the opened step never started yet, taking turns between the tracks
    select s.key, s.stage into v_next
    from gamecore.community_steps(p_community_id) s
    join gamecore.building_openings o on o.community_id = p_community_id and o.building_key = s.key and o.opened_on <= p_day
    where not exists (select 1 from gamecore.projects p where p.community_id = p_community_id and p.building_key = s.key)
    order by o.opened_on, s.step, gamecore.track_order(s.track)
    limit 1;
    exit when v_next is null;
    insert into gamecore.projects (community_id, building_key, level, required_actions, started_on)
    values (p_community_id, v_next.key, 1, gamecore.required_actions(v_members, v_next.stage, 1), p_day);
    v_next := null;
  end loop;
end;
$$;

-- Development level 0–4 (§7.4): Welcome sign, first persona place, Community hall, signature landmark.
create function gamecore.development_level(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  with s as (select st.track, st.step, st.key, gamecore.built_level(p_community_id, st.key, p_day) > 0 as built
             from gamecore.community_steps(p_community_id) st)
  select case
    when not coalesce((select bool_or(built) from s where track = 'root'), false) then 0
    when coalesce((select bool_or(built) from s where track = 'persona' and step = 4), false) then 4
    when coalesce((select bool_or(built) from s where key = 'community-hall'), false) then 3
    when coalesce((select bool_or(built) from s where track = 'persona' and step = 1), false) then 2
    else 1 end
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

  v_houses := gamecore.houses_at(p_community_id, v_day);

  return jsonb_build_object(
    'houses', v_houses -> 'houses',
    'hidden_houses', (v_houses ->> 'hidden')::integer,
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

-- World Map: the level now comes from the snapshot (computed by the build map rules above).
create or replace function gamecore.world_map()
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'code', c.code,
      'id', c.id,
      'level', coalesce((s.state -> 'community' ->> 'level')::integer, 0),
      'vitality', s.state -> 'community' -> 'vitality',
      'residents', coalesce((s.state -> 'community' ->> 'residents')::integer, 0)
    ) order by c.code), '[]'::jsonb)
  from gamecore.communities c
  left join gamecore.community_snapshots s on s.community_id = c.id
$$;

revoke all on all functions in schema gamecore from public, anon, authenticated;
