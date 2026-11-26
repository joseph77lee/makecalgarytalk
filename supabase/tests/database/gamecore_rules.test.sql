-- Module: gamecore — build map, energy, next-day progress, idempotency, security.
--
-- Times are fixed instants so the Calgary day is known (Alberta is UTC-6 year-round
-- since 2026-11-01): day D = 2026-12-01 runs from 2026-12-01T06:00Z to 2026-12-02T06:00Z.
begin;
select plan(62);

-- Start from an empty game (local seed data such as the dev users must not affect results;
-- everything is rolled back at the end).
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;
delete from gamecore.community_days;
delete from gamecore.community_snapshots;
delete from gamecore.place_lots;  -- seeded from the island plans; each test adds what it needs

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000001', 'a@test.local'),
  ('00000000-0000-4000-8000-000000000002', 'b@test.local'),
  ('00000000-0000-4000-8000-000000000003', 'c@test.local'),
  ('00000000-0000-4000-8000-000000000004', 'd@test.local'),
  ('00000000-0000-4000-8000-000000000005', 'e@test.local');

create temp table t (k text primary key, v text);
grant all on t to anon, authenticated;
insert into t values
  ('mah', (select id::text from gamecore.communities where code = 'MAH')),
  ('aub', (select id::text from gamecore.communities where code = 'AUB')),
  ('a', '00000000-0000-4000-8000-000000000001'),
  ('b', '00000000-0000-4000-8000-000000000002'),
  ('c', '00000000-0000-4000-8000-000000000003'),
  ('d', '00000000-0000-4000-8000-000000000004'),
  ('e', '00000000-0000-4000-8000-000000000005'),
  ('d0', '2026-12-01T18:00:00Z'),        -- D 12:00
  ('d0_last', '2026-12-02T05:59:59Z'),   -- D 23:59:59
  ('d1', '2026-12-02T18:00:00Z'),        -- D+1 12:00
  ('d1_midnight', '2026-12-02T06:00:00Z'),
  ('d2', '2026-12-03T18:00:00Z'),
  ('d3', '2026-12-04T18:00:00Z');

create function pg_temp.v(key text) returns text language sql as $$ select v from t where k = key $$;
create function pg_temp.uid(key text) returns uuid language sql as $$ select v::uuid from t where k = key $$;
create function pg_temp.at(key text) returns timestamptz language sql as $$ select v::timestamptz from t where k = key $$;
create function pg_temp.state(community text, at text, who text default null) returns jsonb language sql as $$
  select gamecore.community_state_at(pg_temp.uid(community), pg_temp.at(at), case when who is null then null else pg_temp.uid(who) end)
$$;
create function pg_temp.building(s jsonb, key text) returns jsonb language sql as $$
  select b from jsonb_array_elements(s -> 'buildings') b where b ->> 'key' = key
$$;
create function pg_temp.statuses(j jsonb) returns text[] language sql as $$
  select array_agg(coalesce(r ->> 'reason', r ->> 'status') order by ord)
  from jsonb_array_elements(j -> 'results') with ordinality as x(r, ord)
$$;
-- The newest project of a building in a community.
create function pg_temp.project(community text, key text) returns uuid language sql as $$
  select id from gamecore.projects where community_id = pg_temp.uid(community) and building_key = key order by level desc limit 1
$$;
create function pg_temp.act(project uuid) returns jsonb language sql as $$
  select jsonb_build_object('id', gen_random_uuid(), 'project_id', project)
$$;

-- Build map data -----------------------------------------------------------------
select is((select count(*)::int from gamecore.building_types), 95, 'the build map has 95 steps (seeded from build_map.json)');
select is((select array_agg(key) from gamecore.building_types where track = 'root'), array['welcome-sign'], 'one root: the Welcome sign');
select is((select count(*)::int from gamecore.community_personas), 223, 'every community has a persona');
select is(
  (select array_agg(s.key order by s.step) from gamecore.community_steps(pg_temp.uid('mah')) s where s.track = 'persona'),
  array['place.lake.sailing-dock', 'place.lake.boardwalk', 'place.lake.beach-house', 'landmark.mah', 'landmark-2', 'landmark-3'],
  'Mahogany: lake places, its own beach club replaces the pattern landmark, later landmarks without a model use the generic slots'
);
select is(
  (select array_agg(s.key order by s.step) from gamecore.community_steps((select id from gamecore.communities where code = 'DNC')) s where s.track = 'persona' and s.step >= 4),
  array['landmark.dnc', 'landmark.dnc.2', 'landmark-3'], 'a community with two landmark models gets both, in order'
);
select is(
  (select s.key from gamecore.community_steps((select id from gamecore.communities where code = 'ACA')) s where s.track = 'persona' and s.step = 4),
  'place.mature-suburb.leisure-centre', 'without its own model, a community ends its persona places with the pattern landmark'
);
select is(
  (select count(*)::int from (select s.name from gamecore.community_steps((select id from gamecore.communities where code = 'ACA')) s
                              where s.key not like 'decoration-%' and s.key not like 'landmark-%' group by s.name having count(*) > 1) d),
  0, 'no place twice on one build map'
);
select is(
  (select array_agg(s.key order by s.step) from gamecore.community_steps(pg_temp.uid('mah')) s where s.track = 'community'),
  array['fire-pit', 'warming-hut', 'skating-rink', 'community-hall', 'neighbourhood-park'], 'the community track starts after the root'
);

-- Fixed values ----------------------------------------------------------------------
select is(gamecore.required_actions(0, 0, 1), 3, 'the root: a single resident can finish it on day one (3)');
select is(gamecore.required_actions(4, 1, 1), 6, 'step 1: ×0.3 of 5 per resident');
select is(gamecore.required_actions(1, 2, 1), 10, 'step 2: ×1, minimum 10');
select is(gamecore.required_actions(4, 3, 1), 30, 'step 3: ×1.5');
select is(gamecore.required_actions(4, 4, 1), 40, 'step 4: ×2');
select is(gamecore.required_actions(10, 6, 1), 150, 'landmarks and step 6: ×3');
select is(
  array[gamecore.land_stage(0), gamecore.land_stage(2), gamecore.land_stage(3), gamecore.land_stage(6), gamecore.land_stage(11), gamecore.land_stage(26), gamecore.land_stage(51)],
  array[0, 0, 1, 2, 3, 4, 5], 'land stage follows cumulative residents (§7.8)'
);

-- A new community: only the root starts ---------------------------------------------
select is(jsonb_path_query_array(pg_temp.state('mah', 'd0'), '$.projects[*].building_key'), '["welcome-sign"]'::jsonb, 'a new community starts with the Welcome sign only');
select is(jsonb_path_query_array(pg_temp.state('mah', 'd0'), '$.projects[*].required'), '[3]'::jsonb, 'it needs 3 actions');
select is((pg_temp.state('mah', 'd0') -> 'community' ->> 'settled')::boolean, false, 'not settled before the Welcome sign is built');
select is(
  pg_temp.building(pg_temp.state('mah', 'd0'), 'fire-pit'),
  '{"key": "fire-pit", "name": "Fire pit", "track": "community", "step": 1, "stage": 1, "landmark_order": null, "tiles": [3, 3], "site": "plaza",
    "level": 1, "status": "locked", "progress": 0,
    "remaining": {"requires": ["welcome-sign"], "residents": 0, "streak_days": 0, "land_residents": 0}}'::jsonb,
  'a first step waits for the root and says so'
);
select is(
  pg_temp.building(pg_temp.state('mah', 'd0'), 'skating-rink') -> 'remaining',
  '{"requires": ["warming-hut"], "residents": 3, "streak_days": 0, "land_residents": 0}'::jsonb, 'resident conditions count what is missing'
);
select is((select count(*)::int from gamecore.projects where community_id = pg_temp.uid('mah')), 1,
  'reading the state again does not start more projects');
select is(pg_temp.state('mah', 'd0') -> 'me', 'null'::jsonb, 'visitors get no personal data');
select throws_ok($$ select gamecore.community_state_at(gen_random_uuid(), now(), null) $$, 'P0002', 'community not found', 'unknown community');

-- Membership and energy ---------------------------------------------------------------
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(pg_temp.act(pg_temp.project('mah', 'welcome-sign'))), pg_temp.at('d0'))),
  array['not_member'], 'a player without a community cannot act'
);
select residency.add_verified_resident_at(pg_temp.uid('a'), pg_temp.uid('mah'), pg_temp.at('d0'));
select is(gamecore.me_at(pg_temp.uid('a'), pg_temp.at('d0')) ->> 'community_id', pg_temp.v('mah'), 'a Verified Resident plays in their community');
insert into t values ('a1', gen_random_uuid());
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 'welcome-sign')),
    pg_temp.act(pg_temp.project('mah', 'welcome-sign')),
    pg_temp.act(pg_temp.project('mah', 'welcome-sign')),
    pg_temp.act(pg_temp.project('mah', 'welcome-sign'))
  ), pg_temp.at('d0'))),
  array['accepted', 'accepted', 'accepted', 'no_energy'], 'a first resident builds the Welcome sign on day one; the 4th action has no energy'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(pg_temp.act(pg_temp.project('mah', 'welcome-sign'))), pg_temp.at('d0_last'))),
  array['no_energy'], 'still no energy at 23:59:59 Calgary time'
);
select is((gamecore.me_at(pg_temp.uid('a'), pg_temp.at('d1_midnight')) ->> 'energy_left')::int, 3, 'energy resets at Calgary midnight');

-- Idempotency
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 'welcome-sign'))), pg_temp.at('d1'))),
  array['duplicate'], 'a retry (even after midnight) is a duplicate and spends no energy'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('b'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 'welcome-sign'))), pg_temp.at('d1'))),
  array['id_conflict'], 'another player cannot reuse an action id'
);

-- Next day: the root is built and opens the three tracks -------------------------------
select is(
  (pg_temp.state('mah', 'd0_last') -> 'projects' -> 0 ->> 'progress')::int, 0,
  'same day: the Welcome sign still shows 0 progress'
);
select is((pg_temp.state('mah', 'd1') -> 'community' ->> 'settled')::boolean, true, 'the next day the Welcome sign is built and the community is settled');
select is(
  jsonb_path_query_array(pg_temp.state('mah', 'd1'), '$.projects[*].building_key'),
  '["fire-pit", "place.lake.sailing-dock", "playground"]'::jsonb, 'the root opens the three tracks: each first step starts'
);
select is(jsonb_path_query_array(pg_temp.state('mah', 'd1'), '$.projects[*].required'), '[3, 3, 3]'::jsonb, 'a single resident can finish a first step in a day');
select is((pg_temp.state('mah', 'd1') -> 'community' ->> 'level')::int, 1, 'development level 1: the Welcome sign');
select is(
  pg_temp.building(pg_temp.state('mah', 'd1'), 'warming-hut') -> 'remaining',
  '{"requires": ["fire-pit"], "residents": 0, "streak_days": 2, "land_residents": 0}'::jsonb, 'a second step waits for the first and the streak; yesterday counted'
);
select ok(not exists (select 1 from gamecore.projects where level > 1), 'no upgrades in place any more');
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid(), 'project_id', pg_temp.project('mah', 'welcome-sign'))
  ), pg_temp.at('d1'))),
  array['project_not_active'], 'a finished place takes no more actions'
);

-- Residents, land and at most 3 constructions -------------------------------------------
select residency.add_verified_resident_at(pg_temp.uid(k), pg_temp.uid('mah'), pg_temp.at('d1')) from unnest(array['b', 'c']) k;
select is((pg_temp.state('mah', 'd1') -> 'community' ->> 'residents')::int, 3, 'three residents');
select is((pg_temp.state('mah', 'd1') -> 'community' ->> 'land_stage')::int, 1, 'three residents → land stage 1');
select is(jsonb_array_length(pg_temp.state('mah', 'd1') -> 'projects'), 3, 'three constructions at most');
-- the island plan puts the beach house on land that rises at 6 residents (stage 2)
insert into gamecore.place_lots (community_id, building_key, land_stage) values (pg_temp.uid('mah'), 'place.lake.beach-house', 2);
select is(
  (pg_temp.building(pg_temp.state('mah', 'd1'), 'place.lake.beach-house') -> 'remaining' ->> 'land_residents')::int, 3,
  'a step whose lot has not risen yet waits for the land: 3 more neighbours'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('b'), jsonb_build_array(
    pg_temp.act(pg_temp.project('mah', 'fire-pit')), pg_temp.act(pg_temp.project('mah', 'fire-pit')), pg_temp.act(pg_temp.project('mah', 'fire-pit'))
  ), pg_temp.at('d1'))),
  array['accepted', 'accepted', 'accepted'], 'the Fire pit gets its 3 actions'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('c'), jsonb_build_array(
    pg_temp.act(pg_temp.project('mah', 'place.lake.sailing-dock')), pg_temp.act(pg_temp.project('mah', 'place.lake.sailing-dock')), pg_temp.act(pg_temp.project('mah', 'place.lake.sailing-dock'))
  ), pg_temp.at('d1'))),
  array['accepted', 'accepted', 'accepted'], 'the Sailing dock gets its 3 actions'
);
select is(pg_temp.building(pg_temp.state('mah', 'd2'), 'place.lake.sailing-dock') ->> 'status', 'built', 'next day: the Sailing dock is built');
select is((pg_temp.state('mah', 'd2') -> 'community' ->> 'level')::int, 2, 'development level 2: the first persona place');
select is(
  jsonb_path_query_array(pg_temp.state('mah', 'd2'), '$.projects[*].building_key'), '["playground"]'::jsonb,
  'the next steps wait for the 3-day streak; nothing is upgraded in their place'
);

-- Nothing re-locks -------------------------------------------------------------------
select residency.add_verified_resident_at(pg_temp.uid('c'), pg_temp.uid('aub'), pg_temp.at('d2'));
select is((pg_temp.state('mah', 'd2') -> 'community' ->> 'residents')::int, 3, 'cumulative residents do not shrink when a resident moves away');
select is(
  (select count(*)::int from gamecore.building_openings where community_id = pg_temp.uid('mah')), 4,
  'openings are kept: root and the three first steps stay open'
);

-- Own community only -------------------------------------------------------------------
select is(jsonb_array_length(pg_temp.state('aub', 'd3') -> 'projects'), 1, 'another community starts its own root');
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(pg_temp.act(
    (select id from gamecore.projects where community_id = pg_temp.uid('aub') limit 1)
  )), pg_temp.at('d3'))),
  array['other_community'], 'cannot act on another community''s building'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('project_id', pg_temp.project('mah', 'fire-pit')),
    jsonb_build_object('id', 'not-a-uuid', 'project_id', pg_temp.project('mah', 'fire-pit')),
    jsonb_build_object('id', gen_random_uuid(), 'project_id', gen_random_uuid())
  ), pg_temp.at('d3'))),
  array['invalid', 'invalid', 'project_not_found'], 'malformed entries are rejected one by one'
);
select throws_ok(
  format($$ select gamecore.submit_actions_at(%L, (select jsonb_agg(jsonb_build_object('id', gen_random_uuid())) from generate_series(1, 11)), now()) $$, pg_temp.v('a')),
  '22023', 'at most 10 actions per call', 'more than 10 actions per call is an error'
);

-- Database-level guarantees -------------------------------------------------------------
select throws_ok(
  format($$ insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
            values (gen_random_uuid(), %L, %L, %L, '2026-12-01', 1) $$, pg_temp.v('a'), pg_temp.v('mah'), pg_temp.project('mah', 'fire-pit')),
  '23505', null, 'an energy slot can be used only once per day'
);
select throws_ok($$ update gamecore.actions set calgary_day = calgary_day + 1 $$, '42501', 'gamecore.actions is append-only', 'actions cannot be updated');
select throws_ok(
  format($$ insert into gamecore.projects (community_id, building_key, level, required_actions, started_on)
            values (%L, 'fire-pit', 1, 3, '2026-12-01') $$, pg_temp.v('mah')),
  '23505', null, 'a building level is started only once per community'
);

-- API surface and permissions -----------------------------------------------------------
set local role anon;
select throws_ok($$ select count(*) from gamecore.building_openings $$, '42501', null, 'anon cannot read gamecore tables');
select throws_ok($$ select public.gamecore_submit_actions('[]'::jsonb) $$, '42501', null, 'anon cannot submit actions');
select is(jsonb_array_length(public.gamecore_get_community_state((select v from t where k = 'mah')::uuid) -> 'buildings'), 27, 'anon can view a community''s build map (root, 5 community, 6 persona, 15 nature)');
reset role;

set local role authenticated;
select throws_ok($$ select public.gamecore_submit_actions('[]'::jsonb) $$, '28000', 'not authenticated', 'a signed-in role without a user id is rejected');
set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select is(public.gamecore_get_me() ->> 'community_id', null, 'a signed-in player with no residency plays nowhere yet');
select throws_ok($$ select public.gamecore_choose_community(gen_random_uuid()) $$, '42883', null, 'the temporary manual community choice is gone');
reset role;

select * from finish();
rollback;
