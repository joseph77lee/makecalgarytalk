-- Module: ranking — weekly community ranking (requirement.md v1.31 §12.1).
--
--   * Week = Monday 00:00 – Sunday 23:59, Calgary time (days from common.calgary_day only).
--   * Score = (sum of daily active Verified Residents over the week ÷ 7) ÷ max(population, 1,000)
--     × 1,000; a community without a population figure counts as 1,000.
--   * Ranked only with 5+ Verified Residents who acted during the week. Equal scores share a rank.
--   * Last week is fixed once (first read on or after Monday) and stored; this week so far is
--     computed on read and cached for 5 minutes (compute-on-read + snapshot, §20.3).
--   * Reads other modules only through functions: gamecore.week_activity / home_community.

create schema ranking;
revoke all on schema ranking from public, anon, authenticated;

-- Weeks whose results are fixed (also weeks where no community was ranked).
create table ranking.weeks (
  week_start date primary key check (extract(isodow from week_start) = 1),
  fixed_at timestamptz not null default now()
);
alter table ranking.weeks enable row level security;

-- Fixed results of a week: every community with residents; rank is null when not ranked.
create table ranking.results (
  week_start date not null references ranking.weeks (week_start),
  community_id uuid not null references gamecore.communities (id),
  rank integer check (rank >= 1),
  score numeric not null check (score >= 0),
  acting_residents integer not null check (acting_residents >= 0),
  primary key (week_start, community_id)
);
alter table ranking.results enable row level security;

-- This week so far (one row per week, replaced at most every 5 minutes).
create table ranking.live (
  week_start date primary key,
  computed_at timestamptz not null,
  rows jsonb not null
);
alter table ranking.live enable row level security;

create function ranking.min_residents()
returns integer
language sql immutable set search_path = ''
as $$ select 5 $$;

-- Monday of the week of a day.
create function ranking.week_start(p_day date)
returns date
language sql immutable set search_path = ''
as $$ select p_day - (extract(isodow from p_day)::integer - 1) $$;

-- Rows of a week as known on p_today: [{community_id, code, name, rank|null, score, acting_residents}],
-- ranked first (score desc, then name), then the rest by name.
create function ranking.compute(p_week_start date, p_today date)
returns jsonb
language sql set search_path = ''
as $$
  with a as (
    select w.*, w.acted_days / 7.0 / greatest(coalesce(w.population, 0), 1000) * 1000 as score,
           w.acting_residents >= ranking.min_residents() as ranked
    from gamecore.week_activity(p_week_start, p_week_start + 6, p_today) w
  ), r as (
    select a.*, case when a.ranked then rank() over (partition by a.ranked order by a.score desc) end as rank
    from a
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'community_id', r.community_id, 'code', r.code, 'name', r.name, 'rank', r.rank,
      'score', r.score, 'acting_residents', r.acting_residents
    ) order by r.rank nulls last, r.name), '[]'::jsonb)
  from r
$$;

-- Fixes a finished week once (idempotent; concurrent callers wait for the first).
create function ranking.fix_week(p_week_start date, p_today date)
returns void
language plpgsql set search_path = ''
as $$
begin
  if p_week_start + 6 >= p_today or exists (select 1 from ranking.weeks w where w.week_start = p_week_start) then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ranking.week:' || p_week_start::text, 0));
  if exists (select 1 from ranking.weeks w where w.week_start = p_week_start) then
    return;
  end if;
  insert into ranking.weeks (week_start) values (p_week_start);
  insert into ranking.results (week_start, community_id, rank, score, acting_residents)
  select p_week_start, (x ->> 'community_id')::uuid, (x ->> 'rank')::integer, (x ->> 'score')::numeric,
         (x ->> 'acting_residents')::integer
  from jsonb_array_elements(ranking.compute(p_week_start, p_today)) x;
end;
$$;

create function ranking.fixed_rows(p_week_start date)
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'community_id', r.community_id, 'code', c.code, 'name', c.name, 'rank', r.rank,
      'score', r.score, 'acting_residents', r.acting_residents
    ) order by r.rank nulls last, c.name), '[]'::jsonb)
  from ranking.results r join gamecore.communities c on c.id = r.community_id
  where r.week_start = p_week_start
$$;

-- This week so far, from the cache when it is under 5 minutes old.
create function ranking.live_rows(p_week_start date, p_now timestamptz)
returns table (rows jsonb, computed_at timestamptz)
language plpgsql set search_path = ''
as $$
declare
  v_row ranking.live;
begin
  select * into v_row from ranking.live l where l.week_start = p_week_start;
  if found and v_row.computed_at between p_now - interval '5 minutes' and p_now then
    return query select v_row.rows, v_row.computed_at;
    return;
  end if;
  delete from ranking.live l where l.week_start < p_week_start;
  insert into ranking.live as l (week_start, computed_at, rows)
  values (p_week_start, p_now, ranking.compute(p_week_start, common.calgary_day(p_now)))
  on conflict (week_start) do update set computed_at = excluded.computed_at, rows = excluded.rows
  returning l.* into v_row;
  return query select v_row.rows, v_row.computed_at;
end;
$$;

-- Public view of a week: top 10 and my community (rank, or how many more acting residents it needs).
create function ranking.board(p_rows jsonb, p_home uuid)
returns jsonb
language sql immutable set search_path = ''
as $$
  with e as (
    select x, (x ->> 'rank')::integer as rank, ord
    from jsonb_array_elements(p_rows) with ordinality as t(x, ord)
  ), pub as (
    select e.ord, e.x ->> 'community_id' as community_id, jsonb_build_object(
      'rank', e.rank, 'code', e.x ->> 'code', 'name', e.x ->> 'name',
      'score', round((e.x ->> 'score')::numeric, 2),
      'acting_residents', (e.x ->> 'acting_residents')::integer,
      'needed', greatest(0, ranking.min_residents() - (e.x ->> 'acting_residents')::integer)
    ) as entry, e.rank
    from e
  )
  select jsonb_build_object(
    'top', coalesce((select jsonb_agg(p.entry order by p.ord) from pub p where p.rank is not null and p.ord <= 10), '[]'::jsonb),
    'ranked', (select count(*) from pub p where p.rank is not null),
    'mine', (select p.entry from pub p where p.community_id = p_home::text),
    'champions', coalesce((select jsonb_agg(p.entry ->> 'code' order by p.ord) from pub p where p.rank = 1), '[]'::jsonb)
  )
$$;

create function ranking.weekly_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_today date := common.calgary_day(p_now);
  v_week date := ranking.week_start(v_today);
  v_home record;
  v_live record;
  v_last jsonb;
  v_this jsonb;
  v_none jsonb;
begin
  select * into v_home from gamecore.home_community(p_uid, v_today) h limit 1;
  perform ranking.fix_week(v_week - 7, v_today);
  select * into v_live from ranking.live_rows(v_week, p_now);
  v_last := ranking.board(ranking.fixed_rows(v_week - 7), v_home.id);
  v_this := ranking.board(v_live.rows, v_home.id);
  -- My community without any resident yet: not in the rows.
  if v_home.id is not null then
    v_none := jsonb_build_object('rank', null, 'code', v_home.code, 'name', v_home.name, 'score', 0,
                                 'acting_residents', 0, 'needed', ranking.min_residents());
    if v_last -> 'mine' = 'null'::jsonb then v_last := jsonb_set(v_last, '{mine}', v_none); end if;
    if v_this -> 'mine' = 'null'::jsonb then v_this := jsonb_set(v_this, '{mine}', v_none); end if;
  end if;
  return jsonb_build_object(
    'min_residents', ranking.min_residents(),
    'results_day', v_today = v_week,
    'home', case when v_home.id is null then null
                 else jsonb_build_object('code', v_home.code, 'name', v_home.name) end,
    'last_week', v_last || jsonb_build_object('week_start', v_week - 7),
    'this_week', v_this || jsonb_build_object('week_start', v_week, 'updated_at', v_live.computed_at)
  );
end;
$$;

revoke all on function ranking.min_residents() from public, anon, authenticated;
revoke all on function ranking.week_start(date) from public, anon, authenticated;
revoke all on function ranking.compute(date, date) from public, anon, authenticated;
revoke all on function ranking.fix_week(date, date) from public, anon, authenticated;
revoke all on function ranking.fixed_rows(date) from public, anon, authenticated;
revoke all on function ranking.live_rows(date, timestamptz) from public, anon, authenticated;
revoke all on function ranking.board(jsonb, uuid) from public, anon, authenticated;
revoke all on function ranking.weekly_at(uuid, timestamptz) from public, anon, authenticated;

create function public.ranking_weekly()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select ranking.weekly_at(auth.uid(), now())
$$;
comment on function public.ranking_weekly() is
  'Weekly ranking: {min_residents, results_day, home, last_week: {week_start, top, ranked, mine, champions}, '
  'this_week: {..., updated_at}}. Entries: {rank|null, code, name, score (2 decimals), acting_residents, needed}.';

revoke all on function public.ranking_weekly() from public;
grant execute on function public.ranking_weekly() to anon, authenticated;
