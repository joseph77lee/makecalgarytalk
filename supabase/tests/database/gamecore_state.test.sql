-- Module: gamecore — community state: members, streak, Vitality, tree conditions, changes,
-- snapshots (requirement.md v1.21 §7.2–§7.5, §7.8, §20.3).
--
-- Days are simulated: actions are inserted directly on chosen Calgary days (one per player per
-- day is enough for these rules). Day N = date '2026-12-01' + N; its noon is 18:00Z (UTC-6).
begin;
select plan(49);

delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;
delete from gamecore.community_days;
delete from gamecore.community_snapshots;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid, 'u' || n || '@test.local'
from generate_series(1, 20) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$
  select id from gamecore.communities where communities.code = c.code
$$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2026-12-01' + n $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select (pg_temp.d(n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.join_(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(n));
  select gamecore.ensure_tree(pg_temp.c(code), pg_temp.d(n));
$$;
-- One action by a player in a community on a day (on any of its projects).
create function pg_temp.act_(who integer, code text, n integer) returns void language sql as $$
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
  select gen_random_uuid(), pg_temp.u(who), pg_temp.c(code),
         (select p.id from gamecore.projects p where p.community_id = pg_temp.c(code) order by p.started_on, p.building_key limit 1),
         pg_temp.d(n),
         coalesce((select max(a.energy_slot) from gamecore.actions a where a.user_id = pg_temp.u(who) and a.calgary_day = pg_temp.d(n)), 0) + 1
$$;
create function pg_temp.stats(code text, n integer) returns text language sql as $$
  select s.active_residents || '/' || s.acted || '/' || s.shown_residents || '/' || s.attended
  from gamecore.day_stats(pg_temp.c(code), pg_temp.d(n)) s
$$;
create function pg_temp.building(s jsonb, key text) returns jsonb language sql as $$
  select b from jsonb_array_elements(s -> 'buildings') b where b ->> 'key' = key
$$;
create function pg_temp.state(code text, n integer) returns jsonb language sql as $$
  select gamecore.community_state_at(pg_temp.c(code), pg_temp.noon(n), null)
$$;

-- Members and cumulative residents (§7.8) -----------------------------------------------
select pg_temp.join_(1, 'MAH', 0);
select pg_temp.join_(3, 'MAH', 0);
select pg_temp.join_(2, 'MAH', 2);
select pg_temp.join_(3, 'AUB', 3);
select pg_temp.join_(3, 'AUB', 4); -- verified again in the same community: no new record

select is((select array_agg(m.user_id order by m.user_id) from gamecore.members_on(pg_temp.c('MAH'), pg_temp.d(4)) m),
          array[pg_temp.u(1), pg_temp.u(2)], 'members on a day: the latest join decides');
select is((select array_agg(m.user_id order by m.user_id) from gamecore.members_on(pg_temp.c('MAH'), pg_temp.d(1)) m),
          array[pg_temp.u(1), pg_temp.u(3)], 'members before a later move are still members on earlier days');
select is(gamecore.cumulative_residents(pg_temp.c('MAH')), 3, 'cumulative residents count everyone who ever joined');
select is(gamecore.cumulative_residents_on(pg_temp.c('MAH'), pg_temp.d(1)), 2, 'cumulative residents on a day');
select is(gamecore.cumulative_residents(pg_temp.c('AUB')), 1, 'the same person verified twice in a community counts once');
select is(gamecore.first_day(pg_temp.c('AUB')), pg_temp.d(3), 'first resident day of a community');

-- Attendance: at least half (rounded up) of the 7-day active residents (§7.5) ------------
-- BLN: 5 residents, all act on day 0.
select pg_temp.join_(n, 'BLN', 0) from generate_series(4, 8) n;
select pg_temp.act_(n, 'BLN', 0) from generate_series(4, 8) n;
select pg_temp.act_(n, 'BLN', 1) from generate_series(4, 6) n;   -- 3 of 5
select pg_temp.act_(n, 'BLN', 2) from generate_series(4, 5) n;   -- 2 of 5
select is(pg_temp.stats('BLN', 0), '5/5/5/true', '5 of 5 acted');
select is(pg_temp.stats('BLN', 1), '5/3/5/true', '5 active → 3 needed: 3 is enough');
select is(pg_temp.stats('BLN', 2), '5/2/5/false', '5 active → 3 needed: 2 is not');

-- BOW: 6 residents.
select pg_temp.join_(n, 'BOW', 0) from generate_series(9, 14) n;
select pg_temp.act_(n, 'BOW', 0) from generate_series(9, 14) n;
select pg_temp.act_(n, 'BOW', 1) from generate_series(9, 11) n;  -- 3 of 6
select pg_temp.act_(n, 'BOW', 2) from generate_series(9, 10) n;  -- 2 of 6
select is(pg_temp.stats('BOW', 1), '6/3/6/true', '6 active → 3 needed (exactly half)');
select is(pg_temp.stats('BOW', 2), '6/2/6/false', '6 active → 2 is not enough');

-- Streak, one resident (DIA) ------------------------------------------------------------
select pg_temp.join_(15, 'DIA', 0);
select is(pg_temp.stats('DIA', 0), '0/0/1/false', 'nobody active: the day does not count (yet)');
select pg_temp.act_(15, 'DIA', 0);
select is(pg_temp.stats('DIA', 0), '1/1/1/true', 'one active resident: that one person is enough');
select is(gamecore.community_streak(pg_temp.c('DIA'), pg_temp.d(1)), 1, 'next day before acting: yesterday counts');
select pg_temp.act_(15, 'DIA', 1);
select is(gamecore.community_streak(pg_temp.c('DIA'), pg_temp.d(1)), 2, 'acting today adds today at once');
select is(gamecore.community_streak(pg_temp.c('DIA'), pg_temp.d(2)), 2, 'today without action yet does not break it');
select is(gamecore.community_streak(pg_temp.c('DIA'), pg_temp.d(3)), 0, 'a missed day (day 2) breaks it');
select pg_temp.act_(15, 'DIA', 3);
select is(gamecore.community_streak(pg_temp.c('DIA'), pg_temp.d(3)), 1, 'and it starts again');
select is((select count(*)::int from gamecore.community_days where community_id = pg_temp.c('DIA')), 3, 'finished days are recorded once (days 0–2)');

-- Dormant residents do not block the streak (EVN) ---------------------------------------
select pg_temp.join_(n, 'EVN', 0) from generate_series(16, 18) n;
select pg_temp.act_(n, 'EVN', 0) from generate_series(16, 18) n;
select pg_temp.act_(16, 'EVN', n) from generate_series(1, 8) n;  -- only one keeps playing
select is(pg_temp.stats('EVN', 6), '3/1/3/false', 'day 6: the others acted within 7 days, so 2 are needed');
select is(pg_temp.stats('EVN', 7), '1/1/3/true', 'day 7: the others are no longer active; 1 is enough');
select is(gamecore.community_streak(pg_temp.c('EVN'), pg_temp.d(9)), 2, 'streak of days 7 and 8');

-- Vitality (§7.4): 100 × max(3-day, 7-day average) of finished days ------------------------
select is(gamecore.vitality(pg_temp.c('DIA'), pg_temp.d(0)), null::int, 'no finished day yet: not shown');
select is(gamecore.vitality(pg_temp.c('DIA'), pg_temp.d(1)), 100, 'after one full day');
-- DIA ratios: day0 1, day1 1, day2 0, day3 1, then nothing.
select is(gamecore.vitality(pg_temp.c('DIA'), pg_temp.d(3)), 67, 'day 3: max(3-day 2/3, 7-day 2/3)');
select is(gamecore.vitality(pg_temp.c('DIA'), pg_temp.d(4)), 75, 'day 4: the 7-day average (3/4) holds it up');
select is(gamecore.vitality(pg_temp.c('DIA'), pg_temp.d(5)), 60, 'day 5: falls slowly (3/5)');
-- EVN: 1 of 3 acts from day 1 on → ratio 1/3; rises fast when everyone returns.
select pg_temp.act_(n, 'EVN', 9) from generate_series(16, 18) n;
select pg_temp.act_(n, 'EVN', 10) from generate_series(16, 18) n;
select is(gamecore.vitality(pg_temp.c('EVN'), pg_temp.d(9)), 33, 'one of three residents: 33');
select is(gamecore.vitality(pg_temp.c('EVN'), pg_temp.d(11)), 78, 'two full days lift the 3-day average fast');
-- 30-day rule: a resident inactive for 30+ days leaves the denominator (FAL).
select pg_temp.join_(19, 'FAL', 0);
select pg_temp.join_(20, 'FAL', 0);
select pg_temp.act_(19, 'FAL', 0);
select pg_temp.act_(20, 'FAL', n) from generate_series(0, 31) n;
select is(pg_temp.stats('FAL', 29), '1/1/2/true', 'day 29: the quiet resident is still shown (2 houses) but not active');
select is((select ratio from gamecore.day_stats(pg_temp.c('FAL'), pg_temp.d(29))), 0.5, 'day 29: ratio 1 of 2');
select is(pg_temp.stats('FAL', 30), '1/1/1/true', 'day 30: their last active day is 30 days ago → not counted');
select is((select ratio from gamecore.day_stats(pg_temp.c('FAL'), pg_temp.d(30))), 1::numeric, 'day 30: ratio 1 of 1');
select is(gamecore.mini_villagers(0, null), 3, 'mini villagers: at least 3');
select is(gamecore.mini_villagers(100, 100), 20, 'mini villagers: at most 20');
select is(gamecore.mini_villagers(10, 50), 10, 'mini villagers: residents × (0.5 + Vitality)');

-- Build map conditions use the real streak (GLA, one resident) ----------------------------------
select pg_temp.join_(1, 'GLA', 10);
select is(
  (select array_agg(s) from (select coalesce(r ->> 'reason', r ->> 'status') s from jsonb_array_elements(gamecore.submit_actions_at(
    pg_temp.u(1),
    (select jsonb_agg(jsonb_build_object('id', gen_random_uuid(), 'project_id', p.id)) from gamecore.projects p, generate_series(1, 3)
     where p.community_id = pg_temp.c('GLA') and p.building_key = 'welcome-sign'),
    pg_temp.noon(10)) -> 'results') r) x),
  array['accepted', 'accepted', 'accepted'], 'a single resident builds the Welcome sign on day one'
);
select is((pg_temp.state('GLA', 11) -> 'changes') - 'opened',
  jsonb_build_object(
    'actions', 3,
    'progress', jsonb_build_array(jsonb_build_object('building_key', 'welcome-sign', 'title', 'Welcome sign', 'level', 1, 'added', 3)),
    'built', jsonb_build_array(jsonb_build_object('building_key', 'welcome-sign', 'title', 'Welcome sign', 'level', 1)),
    'new_residents', 1,
    'land_grew', false,
    'vitality_before', null
  ), 'next day: what changed since yesterday');
select is(jsonb_array_length(pg_temp.state('GLA', 11) -> 'changes' -> 'opened'), 3, 'the built root opened the first step of each track');
select gamecore.submit_actions_at(pg_temp.u(1), (select jsonb_agg(jsonb_build_object('id', gen_random_uuid(), 'project_id', p.id))
  from gamecore.projects p, generate_series(1, 3) where p.community_id = pg_temp.c('GLA') and p.building_key = 'fire-pit'), pg_temp.noon(11));
select is((pg_temp.state('GLA', 11) -> 'streak' ->> 'days')::int, 2, 'the live streak counts today''s action at once (snapshot not rebuilt)');
select is(pg_temp.state('GLA', 11) -> 'streak' -> 'today', '{"acted": 1, "needed": 1, "attended": true, "active_residents": 1}'::jsonb, 'today''s progress');
select ok(not exists (select 1 from gamecore.building_openings where community_id = pg_temp.c('GLA') and building_key = 'warming-hut'), 'the Warming hut still locked at a 2-day streak');
select gamecore.submit_actions_at(pg_temp.u(1), jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'project_id',
  (select id from gamecore.projects where community_id = pg_temp.c('GLA') and building_key = 'playground'))), pg_temp.noon(12));

-- Snapshots (§20.3) --------------------------------------------------------------------------
select is((select calgary_day from gamecore.community_snapshots where community_id = pg_temp.c('GLA')), pg_temp.d(11), 'a snapshot is kept per community and day');
select is(pg_temp.building(pg_temp.state('GLA', 12), 'warming-hut') ->> 'status', 'building', 'a new day rebuilds the snapshot: the Fire pit built and the third streak day opened the Warming hut (started at once)');
select is((select opened_on from gamecore.building_openings where community_id = pg_temp.c('GLA') and building_key = 'warming-hut'),
          pg_temp.d(12), 'opened on the day the streak reached 3');
select is(pg_temp.state('GLA', 13) -> 'changes' -> 'opened', '[{"title": "Warming hut", "building_key": "warming-hut"}]'::jsonb,
          'the next day lists it as unlocked, even once its construction started');
select is(gamecore.refresh_snapshots(pg_temp.noon(12)), 8, 'the 5-minute job rebuilds every community with residents');
select pg_temp.join_(2, 'GLA', 12);
select ok(residency.changed_at(pg_temp.c('GLA')) >= (select built_at from gamecore.community_snapshots where community_id = pg_temp.c('GLA')), 'a verification makes the community''s snapshot stale');
select is(pg_temp.state('GLA', 12) -> 'community' ->> 'residents', '2', 'and the next read shows the new resident');

select * from finish();
rollback;
