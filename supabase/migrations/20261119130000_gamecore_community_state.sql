-- Module: gamecore — community state (requirement.md v1.21 §7.2–§7.5, §7.8, §20.3).
--
-- Adds the inputs the building tree was waiting for and the shared state served to every viewer:
--   * Membership events: one row each time a player joins a community (append-only). They give
--     the members on any day and the cumulative residents (distinct people ever joined, §7.8).
--     TEMPORARY stand-in for Verified Residents until Residency (M7): joining = verification day.
--   * Community days: the stats of each finished Calgary day, written once (finished days never
--     change: actions and joins always land on the server's current day).
--   * Community streak (§7.5): consecutive attendance days up to yesterday, +1 once today is one.
--   * Vitality (§7.4): 100 × max(3-day average, 7-day average) of the daily active ratio of
--     finished days since the first resident; null before the first finished day.
--   * Snapshots (§20.3): the shared state per community, rebuilt every 5 minutes by pg_cron and
--     lazily on the first read of a new Calgary day. Reads add only cheap live parts (today's
--     streak count and my energy).

-- Membership events --------------------------------------------------------------------

create table gamecore.membership_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  community_id uuid not null references gamecore.communities (id),
  joined_on date not null,
  created_at timestamptz not null default now()
);
alter table gamecore.membership_events enable row level security;
create index membership_events_community_idx on gamecore.membership_events (community_id, joined_on);
create index membership_events_user_idx on gamecore.membership_events (user_id, joined_on, id);

create function gamecore.membership_events_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'gamecore.membership_events is append-only' using errcode = '42501';
end;
$$;

create trigger membership_events_no_update
before update on gamecore.membership_events
for each row execute function gamecore.membership_events_append_only();

-- Current players become their first membership event.
insert into gamecore.membership_events (user_id, community_id, joined_on)
select pl.user_id, pl.community_id, pl.joined_on from gamecore.players pl;

-- Community days and snapshots ----------------------------------------------------------

create table gamecore.community_days (
  community_id uuid not null references gamecore.communities (id),
  day date not null,
  -- Members who acted within the last 7 days, incl. this day (streak denominator, §7.5).
  active_residents integer not null check (active_residents >= 0),
  -- Members who acted on this day.
  acted integer not null check (acted >= 0),
  -- Members whose last active day is within the last 30 days, incl. this day (§7.2, §7.4).
  shown_residents integer not null check (shown_residents >= 0),
  attended boolean not null,
  -- Daily active resident ratio (Vitality input), 0..1.
  ratio numeric not null check (ratio between 0 and 1),
  primary key (community_id, day)
);
alter table gamecore.community_days enable row level security;

create table gamecore.community_snapshots (
  community_id uuid primary key references gamecore.communities (id),
  calgary_day date not null,
  built_at timestamptz not null,
  state jsonb not null
);
alter table gamecore.community_snapshots enable row level security;

revoke all on all tables in schema gamecore from public, anon, authenticated;

-- Members and residents -----------------------------------------------------------------

-- Members of a community on a day: players whose latest join on or before that day was into
-- it, with the day they joined.
create function gamecore.members_on(p_community_id uuid, p_day date)
returns table (user_id uuid, joined_on date)
language sql stable set search_path = ''
as $$
  select e.user_id, e.joined_on
  from (
    select distinct on (m.user_id) m.user_id, m.community_id, m.joined_on
    from gamecore.membership_events m
    where m.joined_on <= p_day
      and m.user_id in (select x.user_id from gamecore.membership_events x where x.community_id = p_community_id)
    order by m.user_id, m.joined_on desc, m.id desc
  ) e
  where e.community_id = p_community_id
$$;

-- Cumulative residents: distinct people who have ever joined (never shrinks, §7.8).
create or replace function gamecore.cumulative_residents(p_community_id uuid)
returns integer
language sql stable set search_path = ''
as $$
  select count(distinct m.user_id)::integer from gamecore.membership_events m where m.community_id = p_community_id
$$;

create function gamecore.cumulative_residents_on(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(distinct m.user_id)::integer from gamecore.membership_events m
  where m.community_id = p_community_id and m.joined_on <= p_day
$$;

create function gamecore.first_day(p_community_id uuid)
returns date
language sql stable set search_path = ''
as $$
  select min(m.joined_on) from gamecore.membership_events m where m.community_id = p_community_id
$$;

-- Stats of one day (finished or today).
create function gamecore.day_stats(p_community_id uuid, p_day date)
returns table (active_residents integer, acted integer, shown_residents integer, attended boolean, ratio numeric)
language sql stable set search_path = ''
as $$
  with m as (
    select mo.user_id, mo.joined_on,
           (select max(a.calgary_day) from gamecore.actions a
            where a.user_id = mo.user_id and a.community_id = p_community_id and a.calgary_day <= p_day) as last_action
    from gamecore.members_on(p_community_id, p_day) mo
  ), c as (
    select count(*) filter (where m.last_action > p_day - 7)::integer as active_residents,
           count(*) filter (where m.last_action = p_day)::integer as acted,
           count(*) filter (where greatest(m.joined_on, coalesce(m.last_action, m.joined_on)) > p_day - 30)::integer as shown_residents
    from m
  )
  select c.active_residents, c.acted, c.shown_residents,
         c.active_residents > 0 and c.acted >= ceil(c.active_residents / 2.0),
         case when c.shown_residents = 0 then 0 else least(1, c.acted::numeric / c.shown_residents) end
  from c
$$;

-- Active residents for project size (§7.6): members whose last active day is within 30 days.
create or replace function gamecore.member_count(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select s.shown_residents from gamecore.day_stats(p_community_id, p_day) s
$$;

-- Records every finished day from the first resident up to yesterday (once).
create function gamecore.ensure_days(p_community_id uuid, p_today date)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_from date;
begin
  v_from := coalesce((select max(d.day) + 1 from gamecore.community_days d where d.community_id = p_community_id),
                     gamecore.first_day(p_community_id));
  if v_from is null or v_from >= p_today then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('gamecore.days:' || p_community_id::text, 0));
  v_from := coalesce((select max(d.day) + 1 from gamecore.community_days d where d.community_id = p_community_id), v_from);
  insert into gamecore.community_days (community_id, day, active_residents, acted, shown_residents, attended, ratio)
  select p_community_id, g.day::date, s.active_residents, s.acted, s.shown_residents, s.attended, s.ratio
  from generate_series(v_from, p_today - 1, interval '1 day') as g(day)
  cross join lateral gamecore.day_stats(p_community_id, g.day::date) s
  on conflict do nothing;
end;
$$;

-- Streak and Vitality -------------------------------------------------------------------

-- Consecutive attendance days up to yesterday.
create function gamecore.streak_before(p_community_id uuid, p_day date)
returns integer
language plpgsql set search_path = ''
as $$
declare
  v_first date;
  v_break date;
begin
  perform gamecore.ensure_days(p_community_id, p_day);
  v_first := gamecore.first_day(p_community_id);
  if v_first is null or v_first >= p_day then
    return 0;
  end if;
  select max(d.day) into v_break from gamecore.community_days d
  where d.community_id = p_community_id and d.day < p_day and not d.attended;
  return (p_day - 1) - coalesce(v_break, v_first - 1);
end;
$$;

-- Streak shown on a day: up to yesterday, +1 once today is an attendance day (§7.5).
create or replace function gamecore.community_streak(p_community_id uuid, p_day date)
returns integer
language plpgsql set search_path = ''
as $$
begin
  return gamecore.streak_before(p_community_id, p_day)
    + case when (select s.attended from gamecore.day_stats(p_community_id, p_day) s) then 1 else 0 end;
end;
$$;

-- Vitality shown on a day (finished days only); null before the first finished day.
create function gamecore.vitality(p_community_id uuid, p_day date)
returns integer
language plpgsql set search_path = ''
as $$
declare
  v_result numeric;
begin
  perform gamecore.ensure_days(p_community_id, p_day);
  select round(100 * greatest(avg(d.ratio) filter (where d.day >= p_day - 3), avg(d.ratio)))
  into v_result
  from gamecore.community_days d
  where d.community_id = p_community_id and d.day between p_day - 7 and p_day - 1;
  return v_result::integer;
end;
$$;

-- Ambient villagers: min 3, max 20, more with residents and Vitality (§7.3).
create function gamecore.mini_villagers(p_shown_residents integer, p_vitality integer)
returns integer
language sql immutable set search_path = ''
as $$
  select least(20, greatest(3, ceil(p_shown_residents * (0.5 + coalesce(p_vitality, 50) / 100.0))))::integer
$$;

-- Snapshot ------------------------------------------------------------------------------

-- The shared state of a community on the Calgary day of p_now (no personal data).
create function gamecore.community_snapshot_at(p_community_id uuid, p_now timestamptz)
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
    'actions', (select count(*) from gamecore.actions a where a.community_id = p_community_id and a.calgary_day = v_day - 1),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object('building_key', x.building_key, 'title', b.name, 'level', x.level, 'added', x.added) order by b.position, x.level)
      from (select p.building_key, p.level, count(*)::integer as added
            from gamecore.actions a join gamecore.projects p on p.id = a.project_id
            where a.community_id = p_community_id and a.calgary_day = v_day - 1
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
        and gamecore.active_project(p_community_id, b.key, v_day) is null
        and gamecore.built_level(p_community_id, b.key, v_day) = 0), '[]'::jsonb),
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

-- Rebuilds and stores one community's snapshot.
create function gamecore.refresh_snapshot(p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_state jsonb := gamecore.community_snapshot_at(p_community_id, p_now);
begin
  insert into gamecore.community_snapshots (community_id, calgary_day, built_at, state)
  values (p_community_id, common.calgary_day(p_now), p_now, v_state)
  on conflict (community_id) do update
    set calgary_day = excluded.calgary_day, built_at = excluded.built_at, state = excluded.state;
  return v_state;
end;
$$;

-- pg_cron job: rebuild every community that has residents. One failure does not stop the rest.
create function gamecore.refresh_snapshots(p_now timestamptz default now())
returns integer
language plpgsql set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  for v_id in select distinct m.community_id from gamecore.membership_events m loop
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

-- Community state = snapshot (rebuilt when missing or from an earlier Calgary day)
-- + today's streak progress + my energy.
create or replace function gamecore.community_state_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_state jsonb;
  v_today record;
  v_me jsonb := null;
  v_player_community uuid;
begin
  select s.state into v_state from gamecore.community_snapshots s
  where s.community_id = p_community_id and s.calgary_day = v_day;
  if v_state is null then
    v_state := gamecore.refresh_snapshot(p_community_id, p_now);
  end if;

  select * into v_today from gamecore.day_stats(p_community_id, v_day);

  if p_uid is not null then
    select pl.community_id into v_player_community from gamecore.players pl where pl.user_id = p_uid;
    v_me := jsonb_build_object(
      'member', v_player_community is not distinct from p_community_id,
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

-- Joining records a membership event when the community changes and drops the stale snapshots.
create or replace function gamecore.choose_community_at(p_uid uuid, p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_old uuid;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from gamecore.communities c where c.id = p_community_id) then
    raise exception 'community not found' using errcode = 'P0002';
  end if;
  select pl.community_id into v_old from gamecore.players pl where pl.user_id = p_uid for update;
  insert into gamecore.players (user_id, community_id, joined_on)
  values (p_uid, p_community_id, v_day)
  on conflict (user_id) do update
    set community_id = excluded.community_id,
        joined_on = case when gamecore.players.community_id = excluded.community_id
                         then gamecore.players.joined_on else excluded.joined_on end;
  if v_old is distinct from p_community_id then
    insert into gamecore.membership_events (user_id, community_id, joined_on) values (p_uid, p_community_id, v_day);
    delete from gamecore.community_snapshots s where s.community_id in (p_community_id, v_old);
  end if;
  return gamecore.me_at(p_uid, p_now);
end;
$$;

comment on function public.gamecore_get_community_state(uuid) is
  'Community state on the current Calgary day: buildings of the tree, active constructions, land stage, Vitality, streak (with today''s progress), what changed since yesterday, and my energy when signed in. Shared parts come from a snapshot rebuilt every 5 minutes.';

revoke all on all functions in schema gamecore from public, anon, authenticated;

-- Snapshots every 5 minutes (§20.3).
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('gamecore-snapshots', '*/5 * * * *', 'select gamecore.refresh_snapshots()');
