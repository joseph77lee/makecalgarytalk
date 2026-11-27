-- Module: news — newspaper lines from yesterday's real records, stored edition, locks,
-- announcements, roadmap, permissions (requirement.md v1.27 §11). Day N = 2026-12-01 + N.
begin;
select plan(24);

delete from news.editions;
delete from news.announcements;
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
select ('00000000-0000-4000-8000-0000000004' || lpad(n::text, 2, '0'))::uuid, 'w' || n || '@test.local'
from generate_series(1, 12) n;
insert into identity.profiles (user_id, nickname, shirt)
select ('00000000-0000-4000-8000-0000000004' || lpad(n::text, 2, '0'))::uuid, 'Neighbour ' || n, 1
from generate_series(1, 12) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000004' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2026-12-01' + n $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select (pg_temp.d(n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.verify(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(n))
$$;
create function pg_temp.act(who integer, n integer, building text default 'welcome-sign') returns void language sql as $$
  select gamecore.ensure_tree(pg_temp.c('MAH'), pg_temp.d(n));
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot, created_at)
  select gen_random_uuid(), pg_temp.u(who), pg_temp.c('MAH'),
         (select p.id from gamecore.projects p where p.community_id = pg_temp.c('MAH') and p.building_key = building order by p.level desc limit 1),
         pg_temp.d(n),
         coalesce((select max(a.energy_slot) from gamecore.actions a where a.user_id = pg_temp.u(who) and a.calgary_day = pg_temp.d(n)), 0) + 1,
         clock_timestamp()
$$;
create function pg_temp.paper(n integer) returns jsonb language sql as $$ select news.newspaper_at(pg_temp.c('MAH'), pg_temp.noon(n), null) $$;
create function pg_temp.text(n integer) returns text language sql as $$
  select string_agg(l ->> 'text', ' | ') from jsonb_array_elements(pg_temp.paper(n) -> 'lines') l
$$;

insert into news.announcements (title, body, starts_on, ends_on) values
  ('Maintenance Sunday', 'Short break at night.', date '2026-12-01', date '2026-12-03'),
  ('Old news', '', date '2026-11-01', date '2026-11-05');

-- Locked until the Welcome sign is built ---------------------------------------------------------
select pg_temp.verify(1, 'MAH', 0);
select pg_temp.verify(2, 'MAH', 0);
select is(pg_temp.paper(0) ->> 'locked', 'welcome_sign', 'locked until the Welcome sign is built');
select is(pg_temp.paper(0) -> 'lines', '[]'::jsonb, 'no news lines while locked');
select is(jsonb_path_query_array(pg_temp.paper(0), '$.announcements[*].title'), '["Maintenance Sunday"]'::jsonb,
  'announcements always show, only those running today');
select is((select count(*)::int from news.editions), 0, 'no edition is written while locked');

-- Day 1: three neighbours build the Welcome sign (3 actions)
select pg_temp.act(1, 1); select pg_temp.act(2, 1); select pg_temp.act(1, 1);
select is(pg_temp.paper(1) ->> 'locked', 'welcome_sign', 'help shows the next day: still locked on day 1');
select is(pg_temp.paper(2) ->> 'locked', null, 'day 2: the Welcome sign is built, the newspaper opens');
select is(pg_temp.text(2), null, 'no people news on day 2 (game events are not in the newspaper)');
select ok(pg_temp.paper(2) -> 'lines' = '[]'::jsonb, 'buildings and helpers stay in the Since yesterday panel');

-- Stored once per day
select pg_temp.act(3, 2);
select pg_temp.verify(3, 'MAH', 1);
select is((select count(*)::int from news.editions where calgary_day = pg_temp.d(2)), 1, 'the edition is stored');
select ok(coalesce(pg_temp.text(2), '') !~ 'Neighbour 3', 'it does not change during the day (Neighbour 3 joined on day 1, after it was written)');
select is(pg_temp.paper(2) -> 'announcements' -> 0 ->> 'title', 'Maintenance Sunday', 'announcements are live, not stored with the edition');

-- Day 3: many helpers, a new neighbour, a streak
select pg_temp.verify(n, 'MAH', 2) from generate_series(4, 9) n;
select pg_temp.act(n, 2, 'fire-pit') from generate_series(4, 9) n;
select is(pg_temp.text(3), '6 new neighbours joined yesterday: Neighbour 4, Neighbour 5, Neighbour 6, Neighbour 7, Neighbour 8 and Neighbour 9. Welcome!',
  'how many new neighbours joined yesterday, with their names');
select ok(pg_temp.text(3) !~ 'Neighbour 3', 'yesterday''s arrivals only (Neighbour 3 arrived the day before)');
select ok(pg_temp.text(3) !~ 'streak|helped|completed', 'no game news');
select pg_temp.verify(10, 'MAH', 3);
select pg_temp.verify(11, 'MAH', 3);
select pg_temp.verify(12, 'MAH', 3);
select ok(pg_temp.text(4) ~ '^3 new neighbours joined yesterday: Neighbour 10, Neighbour 11 and Neighbour 12\. Welcome!', 'three new neighbours');

select is((select array_agg(distinct k order by k) from jsonb_array_elements(pg_temp.paper(3) -> 'lines') l, jsonb_object_keys(l) k),
  array['icon', 'text'], 'lines are icon + text only');
select ok(coalesce(pg_temp.text(3), '') !~ '[0-9]{1,2}:[0-9]{2}', 'no clock times in the news');

-- Day 5: a farewell
select pg_temp.verify(9, 'AUB', 4);
select ok(pg_temp.text(5) ~ 'Neighbour 9 moved to Auburn Bay — thanks for everything, neighbour!', 'farewell line with the new community');
select is(jsonb_array_length(pg_temp.paper(5) -> 'lines'), 1, 'only the farewell that day');

-- Board: part of the newspaper from the Welcome sign on (v1.49: no Warming hut lock)
select is(pg_temp.paper(0) -> 'board', '{"open": false, "roadmap": []}'::jsonb, 'no board before the Welcome sign');
select is(pg_temp.paper(5) -> 'board' -> 'roadmap', coalesce((select jsonb_agg(jsonb_build_object('title', r.title, 'detail', r.detail) order by r.position) from news.roadmap r where not r.done), '[]'::jsonb),
  'the board (roadmap) opens with the newspaper, without a Warming hut');

-- Permissions ---------------------------------------------------------------------------------
create temp table aub as select pg_temp.c('AUB') as id;
grant select on aub to anon;
set local role anon;
select is(public.news_get_newspaper((select id from aub)) ->> 'locked', 'welcome_sign', 'visitors can read a newspaper');
select throws_ok($$ select * from news.editions $$, '42501', null, 'but not the tables');
reset role;
select throws_ok($$ select news.lines_at(gen_random_uuid(), now()) $$, 'P0002', null, 'unknown community');

select * from finish();
rollback;
