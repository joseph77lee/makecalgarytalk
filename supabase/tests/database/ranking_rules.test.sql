-- Module: ranking — weekly community ranking (requirement.md v1.31 §12.1).
-- Day N = Monday 2026-12-07 + N (week W0 = days 0..6, W1 = days 7..13).
begin;
select plan(30);

delete from ranking.results;
delete from ranking.weeks;
delete from ranking.live;
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from gamecore.community_days;
delete from gamecore.community_snapshots;
delete from gamecore.house_lots;
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000011' || lpad(n::text, 2, '0'))::uuid, 'r' || n || '@test.local'
from generate_series(1, 40) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000011' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2026-12-07' + n $$;
-- A Calgary wall-clock time on day N.
create function pg_temp.at(n integer, t text default '12:00') returns timestamptz language sql as $$
  select (pg_temp.d(n)::text || ' ' || t)::timestamp at time zone 'America/Edmonton'
$$;
create function pg_temp.verify(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.at(n))
$$;
create function pg_temp.act(who integer, code text, n integer) returns void language sql as $$
  select gamecore.ensure_tree(pg_temp.c(code), pg_temp.d(n));
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot, created_at)
  select gen_random_uuid(), pg_temp.u(who), pg_temp.c(code),
         (select p.id from gamecore.projects p where p.community_id = pg_temp.c(code) and p.building_key = 'welcome-sign' order by p.level desc limit 1),
         pg_temp.d(n),
         coalesce((select max(a.energy_slot) from gamecore.actions a where a.user_id = pg_temp.u(who) and a.calgary_day = pg_temp.d(n)), 0) + 1,
         clock_timestamp()
$$;
create function pg_temp.board(who integer, n integer, t text default '12:00') returns jsonb language sql as $$
  select ranking.weekly_at(pg_temp.u(who), pg_temp.at(n, t))
$$;
create function pg_temp.entry(b jsonb, week text, code text) returns jsonb language sql as $$
  select e from jsonb_array_elements(b -> week -> 'top') e where e ->> 'code' = code
$$;

update gamecore.communities set population = 500 where code = 'CRA';
update gamecore.communities set population = null where code = 'AUB';
update gamecore.communities set population = 5000 where code = 'MAH';

-- Residents (verified the week before W0).
select pg_temp.verify(n, 'MAH', -10) from generate_series(1, 5) n;
select pg_temp.verify(n, 'CRA', -10) from generate_series(11, 15) n;
select pg_temp.verify(n, 'AUB', -10) from generate_series(21, 25) n;
select pg_temp.verify(n, 'ACA', -10) from generate_series(31, 34) n;

-- W0 activity, day by day (days are recorded once finished, as in real play).
select pg_temp.act(n, 'CRA', 0) from generate_series(11, 15) n;
select pg_temp.act(n, 'AUB', 0) from generate_series(21, 25) n;
select pg_temp.act(n, 'MAH', 0) from generate_series(1, 5) n;
select pg_temp.act(6, 'MAH', 0);                       -- not a Verified Resident: not counted
select pg_temp.act(n, 'ACA', 0) from generate_series(31, 34) n;  -- only 4 acting
select pg_temp.act(n, 'CRA', 1) from generate_series(11, 15) n;  -- CRA, AUB: 10 resident-days
select pg_temp.act(n, 'AUB', 1) from generate_series(21, 25) n;
select pg_temp.act(n, 'MAH', 1) from generate_series(1, 3) n;    -- MAH: 5 + 3
select pg_temp.act(1, 'MAH', 1);                       -- second action the same day: still once
select pg_temp.act(1, 'MAH', 6);                       -- Sunday: in W0 (MAH: 9)

-- Week boundaries -------------------------------------------------------------------------------
select is(ranking.week_start(pg_temp.d(0)), pg_temp.d(0), 'Monday starts its week');
select is(ranking.week_start(pg_temp.d(6)), pg_temp.d(0), 'Sunday belongs to the week of the Monday before');
select is(ranking.week_start(pg_temp.d(7)), pg_temp.d(7), 'the next Monday starts a new week');

-- This week so far (Sunday 23:59) ---------------------------------------------------------------
create temp table b_sun as select pg_temp.board(1, 6, '23:50') as b;
select is((select b -> 'this_week' ->> 'week_start' from b_sun), pg_temp.d(0)::text, 'Sunday 23:59 Calgary: still this week');
select is((select pg_temp.entry(b, 'this_week', 'CRA') ->> 'score' from b_sun), '1.43',
  'score = resident-days ÷ 7 ÷ max(population, 1,000) × 1,000 (population 500 counts as 1,000)');
select is((select pg_temp.entry(b, 'this_week', 'AUB') ->> 'score' from b_sun), '1.43', 'no population figure counts as 1,000');
select is((select pg_temp.entry(b, 'this_week', 'MAH') ->> 'score' from b_sun), '0.26',
  'MAH: 9 resident-days (twice the same day counts once, Sunday counts, non-residents do not) ÷ 7 ÷ 5');
select is((select (pg_temp.entry(b, 'this_week', 'CRA') ->> 'rank')::int from b_sun), 1, 'equal scores share a rank (CRA)');
select is((select (pg_temp.entry(b, 'this_week', 'AUB') ->> 'rank')::int from b_sun), 1, 'equal scores share a rank (AUB)');
select is((select (pg_temp.entry(b, 'this_week', 'MAH') ->> 'rank')::int from b_sun), 3, 'the next rank skips the shared ones');
select is((select jsonb_path_query_array(b, '$.this_week.top[*].code') from b_sun), '["AUB", "CRA", "MAH"]'::jsonb,
  'only communities with 5+ acting Verified Residents are ranked; ties listed by name');
select is((select b -> 'this_week' -> 'champions' from b_sun), '["AUB", "CRA"]'::jsonb, 'both share #1');
select is((select b -> 'this_week' -> 'mine' from b_sun),
  '{"code": "MAH", "name": "Mahogany", "rank": 3, "score": 0.26, "needed": 0, "acting_residents": 5}'::jsonb, 'my community with its rank');
select is((select b -> 'home' ->> 'code' from b_sun), 'MAH', 'home community');
select is((select b -> 'results_day' from b_sun), 'false'::jsonb, 'Sunday is not the results day');

create temp table b_aca as select pg_temp.board(31, 6, '23:50') as b;
select is((select b -> 'this_week' -> 'mine' -> 'rank' from b_aca), 'null'::jsonb, '4 acting residents: not ranked');
select is((select (b -> 'this_week' -> 'mine' ->> 'needed')::int from b_aca), 1, '1 more resident to enter the ranking');
select is((select b -> 'this_week' -> 'mine' from (select pg_temp.board(40, 6, '23:50') as b) x), 'null'::jsonb,
  'a player without a community has no "mine"');
select is((select b -> 'home' from (select ranking.weekly_at(null, pg_temp.at(6, '23:50')) as b) x), 'null'::jsonb, 'visitors have no home');

-- Cache: a new action shows only after 5 minutes ------------------------------------------------
select pg_temp.act(n, 'MAH', 6) from generate_series(2, 5) n;   -- Sunday: 5 acted → 13 resident-days
select is((select pg_temp.entry(pg_temp.board(1, 6, '23:54'), 'this_week', 'MAH') ->> 'score'), '0.26', 'within 5 minutes: cached');
select is((select pg_temp.entry(pg_temp.board(1, 6, '23:56'), 'this_week', 'MAH') ->> 'score'), '0.37', 'after 5 minutes: recomputed (13 ÷ 7 ÷ 5)');
select is((select pg_temp.entry(pg_temp.board(1, 5), 'this_week', 'MAH') ->> 'score'), '0.23',
  'a clock before the cache recomputes for that day (time travel): Saturday = 8 resident-days');

-- Monday 00:00: last week is fixed --------------------------------------------------------------
create temp table b_mon as select pg_temp.board(1, 7, '00:00') as b;
select is((select b -> 'last_week' ->> 'week_start' from b_mon), pg_temp.d(0)::text, 'Monday 00:00 Calgary: W0 is last week');
select is((select b -> 'results_day' from b_mon), 'true'::jsonb, 'Monday is the results day');
select is((select pg_temp.entry(b, 'last_week', 'MAH') ->> 'score' from b_mon), '0.37',
  'the fixed week includes everything up to Sunday 23:59');
select is((select b -> 'this_week' -> 'top' from b_mon), '[]'::jsonb, 'the new week starts empty');

-- Later actions dated last week do not change the fixed result; next week counts separately.
select pg_temp.act(5, 'MAH', 5);
select pg_temp.act(1, 'MAH', 7);
select is((select pg_temp.entry(pg_temp.board(1, 8), 'last_week', 'MAH') ->> 'score'), '0.37', 'fixed results never change');
select is((select count(*)::int from ranking.weeks where week_start = pg_temp.d(0)), 1, 'a week is fixed once');

-- Moves: a resident counts where they lived on the day they acted.
select pg_temp.verify(5, 'CRA', 9);
select pg_temp.act(5, 'CRA', 9);
select is((select (pg_temp.board(1, 13, '23:00') -> 'this_week' -> 'mine' ->> 'acting_residents')::int), 1,
  'W1 in MAH: only resident 1 acted (Monday); resident 5 acted after moving away');

-- Visitors can read the board -------------------------------------------------------------------
set local role anon;
select ok(public.ranking_weekly() ? 'this_week', 'visitors can read the ranking');
reset role;

select * from finish();
rollback;
