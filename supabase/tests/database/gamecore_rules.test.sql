-- Module: gamecore — rules: energy, active projects, next-day progress, idempotency, security.
--
-- Times are fixed instants so the Calgary day is known (Alberta is UTC-6 year-round
-- since 2026-11-01): day D = 2026-12-01 runs from 2026-12-01T06:00Z to 2026-12-02T06:00Z.
begin;
select plan(57);

-- Fixtures -------------------------------------------------------------------
-- Start from an empty game (local seed data such as the dev user must not affect results;
-- everything is rolled back at the end).
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.players;

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
  ('noon_d', '2026-12-01T18:00:00Z'),          -- D 12:00
  ('last_second_d', '2026-12-02T05:59:59Z'),   -- D 23:59:59
  ('midnight_d1', '2026-12-02T06:00:00Z'),     -- D+1 00:00
  ('noon_d1', '2026-12-02T18:00:00Z');

create function pg_temp.v(key text) returns text language sql as $$ select v from t where k = key $$;
create function pg_temp.uid(key text) returns uuid language sql as $$ select v::uuid from t where k = key $$;
create function pg_temp.at(key text) returns timestamptz language sql as $$ select v::timestamptz from t where k = key $$;
create function pg_temp.statuses(j jsonb) returns text[] language sql as $$
  select array_agg(coalesce(r ->> 'reason', r ->> 'status') order by ord)
  from jsonb_array_elements(j -> 'results') with ordinality as x(r, ord)
$$;
create function pg_temp.project(community text, seq int) returns uuid language sql as $$
  select id from gamecore.projects where community_id = pg_temp.v(community)::uuid and projects.seq = $2
$$;
create function pg_temp.act(project uuid) returns jsonb language sql as $$
  select jsonb_build_object('id', gen_random_uuid(), 'project_id', project)
$$;

-- Communities ------------------------------------------------------------------
select is(jsonb_array_length(public.gamecore_list_communities()), 223, '223 residential Calgary communities are seeded');
select is(
  (select population from gamecore.communities where code = 'MAH'),
  13860, 'Mahogany has its 2021 census population'
);
select ok(
  exists (select 1 from gamecore.communities where population is null),
  'brand-new communities without census data have a null population'
);

-- Fixed values ---------------------------------------------------------------------
select is(gamecore.required_actions(0, 1), 10, 'required actions: minimum 10 (no residents yet)');
select is(gamecore.required_actions(1, 1), 10, 'required actions: 1 resident -> 10');
select is(gamecore.required_actions(4, 1), 20, 'required actions: 5 per resident');
select is(gamecore.required_actions(4, 2), 25, 'required actions: x1.25 on the second catalog cycle');
select is(gamecore.required_actions(4, 3), 32, 'required actions: x1.25^2, rounded up');

-- First look at a community starts 3 projects ---------------------------------------
select is(
  jsonb_path_query_array(gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('noon_d'), null), '$.projects[*].kind'),
  '["ice-rink", "flower-path", "holiday-decorations"]'::jsonb,
  'a community starts with the first three catalog projects'
);
select is(
  (select array_agg(required_actions order by seq) from gamecore.projects where community_id = pg_temp.uid('mah')),
  array[10, 10, 10], 'with no residents each project needs 10 actions'
);
select is(
  gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('noon_d'), null) -> 'projects' -> 0 ->> 'stage',
  'scaffolding', 'a new project is at the scaffolding stage'
);
select is((select count(*) from gamecore.projects where community_id = pg_temp.uid('mah'))::int, 3,
  'reading the state again does not create more projects');
select is(gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('noon_d'), null) -> 'me', 'null'::jsonb,
  'visitors get no personal data');
select is(
  gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('noon_d'), null) ->> 'next_day_start',
  '2026-12-02T06:00:00+00:00', 'state reports the next Calgary midnight'
);
select throws_ok(
  $$ select gamecore.community_state_at(gen_random_uuid(), now(), null) $$,
  'P0002', 'community not found', 'unknown community is an error'
);

-- Membership ------------------------------------------------------------------------
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'),
    jsonb_build_array(pg_temp.act(pg_temp.project('mah', 1))), pg_temp.at('noon_d'))),
  array['not_member'], 'a player without a community cannot act'
);
select is(
  gamecore.choose_community_at(pg_temp.uid('a'), pg_temp.uid('mah'), pg_temp.at('noon_d')) ->> 'community_id',
  pg_temp.v('mah'), 'choosing a community makes the player a member'
);
select is(
  (gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('noon_d'), pg_temp.uid('a')) -> 'me' ->> 'member')::boolean,
  true, 'state shows membership'
);

-- Energy: 3 per Calgary day -----------------------------------------------------------
insert into t values ('a1', gen_random_uuid()), ('a2', gen_random_uuid()), ('a3', gen_random_uuid()), ('a4', gen_random_uuid());
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 1)),
    jsonb_build_object('id', pg_temp.v('a2'), 'project_id', pg_temp.project('mah', 1))
  ), pg_temp.at('noon_d'))),
  array['accepted', 'accepted'], 'two actions accepted'
);
select is(
  gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a3'), 'project_id', pg_temp.project('mah', 2)),
    jsonb_build_object('id', pg_temp.v('a4'), 'project_id', pg_temp.project('mah', 2))
  ), pg_temp.at('noon_d')) - 'calgary_day' - 'next_day_start',
  jsonb_build_object('energy_max', 3, 'energy_left', 0, 'results', jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a3'), 'status', 'accepted'),
    jsonb_build_object('id', pg_temp.v('a4'), 'status', 'rejected', 'reason', 'no_energy')
  )),
  'the 4th action of the day is rejected (no energy) and energy is 0'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'),
    jsonb_build_array(pg_temp.act(pg_temp.project('mah', 3))), pg_temp.at('last_second_d'))),
  array['no_energy'], 'still no energy at 23:59:59 Calgary time'
);
select is(
  (gamecore.me_at(pg_temp.uid('a'), pg_temp.at('midnight_d1')) ->> 'energy_left')::int, 3,
  'energy resets to 3 at Calgary midnight'
);
select is((select count(*) from gamecore.actions where user_id = pg_temp.uid('a'))::int, 3,
  'only 3 actions were stored');

-- Idempotency ---------------------------------------------------------------------------
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 1))
  ), pg_temp.at('noon_d'))),
  array['duplicate'], 'resubmitting an accepted id is a duplicate (no error)'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 1))
  ), pg_temp.at('noon_d1'))),
  array['duplicate'], 'a retry after midnight is still a duplicate and spends no new energy'
);
select is((gamecore.me_at(pg_temp.uid('a'), pg_temp.at('noon_d1')) ->> 'energy_left')::int, 3,
  'the late retry did not use D+1 energy');
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('b'), jsonb_build_array(
    jsonb_build_object('id', pg_temp.v('a1'), 'project_id', pg_temp.project('mah', 1))
  ), pg_temp.at('noon_d'))),
  array['id_conflict'], 'another player cannot reuse an action id'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('id', 'b5f1c2c4-0000-4000-8000-0000000000aa', 'project_id', pg_temp.project('mah', 1)),
    jsonb_build_object('id', 'b5f1c2c4-0000-4000-8000-0000000000aa', 'project_id', pg_temp.project('mah', 1))
  ), pg_temp.at('noon_d1'))),
  array['accepted', 'duplicate'], 'the same id twice in one batch counts once'
);

-- Invalid input ----------------------------------------------------------------------------
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'), jsonb_build_array(
    jsonb_build_object('project_id', pg_temp.project('mah', 1)),
    jsonb_build_object('id', 'not-a-uuid', 'project_id', pg_temp.project('mah', 1)),
    jsonb_build_object('id', gen_random_uuid()),
    jsonb_build_object('id', gen_random_uuid(), 'project_id', gen_random_uuid())
  ), pg_temp.at('noon_d1'))),
  array['invalid', 'invalid', 'invalid', 'project_not_found'], 'malformed entries are rejected one by one'
);
select throws_ok(
  format($$ select gamecore.submit_actions_at(%L, '{"id": 1}'::jsonb, now()) $$, pg_temp.v('a')),
  '22023', 'actions must be a JSON array', 'a non-array body is an error'
);
select throws_ok(
  format($$ select gamecore.submit_actions_at(%L, (select jsonb_agg(jsonb_build_object('id', gen_random_uuid())) from generate_series(1, 11)), now()) $$, pg_temp.v('a')),
  '22023', 'at most 10 actions per call', 'more than 10 actions per call is an error'
);
select throws_ok(
  $$ select gamecore.submit_actions_at(null, '[]'::jsonb, now()) $$,
  '28000', 'not authenticated', 'submitting without a user is an error'
);

-- Own community only ---------------------------------------------------------------------------
select lives_ok(
  format($$ select gamecore.community_state_at(%L, %L, null) $$, pg_temp.v('aub'), pg_temp.v('noon_d')),
  'visitors can view another community'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('a'),
    jsonb_build_array(pg_temp.act(pg_temp.project('aub', 1))), pg_temp.at('noon_d1'))),
  array['other_community'], 'cannot act on another community''s project'
);

-- Progress shows the next day; completion starts the next project ---------------------------
-- Day D: B, C, D join Mahogany; together with A's 2 actions, 12 actions go to project 1 (needs 10).
select gamecore.choose_community_at(pg_temp.uid(k), pg_temp.uid('mah'), pg_temp.at('noon_d')) from unnest(array['b', 'c', 'd']) k;
select is(
  (select array_agg(s) from (
    select unnest(pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid(k), jsonb_build_array(
      pg_temp.act(pg_temp.project('mah', 1)), pg_temp.act(pg_temp.project('mah', 1)), pg_temp.act(pg_temp.project('mah', 1))
    ), pg_temp.at('noon_d')))) s
    from unnest(array['b', 'c', 'd']) k
  ) x),
  array_fill('accepted'::text, array[9]),
  'actions past the goal on the same day are still accepted (progress is applied tomorrow)'
);
select is(
  (gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('last_second_d'), null) -> 'projects' -> 0 ->> 'progress')::int,
  0, 'same day: project 1 still shows 0 progress'
);
select is(
  jsonb_path_query_array(gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('midnight_d1'), null), '$.projects[*].seq'),
  '[2, 3, 4]'::jsonb, 'after Calgary midnight project 1 is complete and project 4 has started'
);
select is(
  gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('midnight_d1'), null) -> 'completed_projects',
  jsonb_build_array(jsonb_build_object(
    'id', pg_temp.project('mah', 1), 'seq', 1, 'kind', 'ice-rink', 'title', 'Build an ice rink',
    'level', 1, 'completed_on', '2026-12-02'
  )),
  'the completed project is listed with the day its completion became visible'
);
select is(
  gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('midnight_d1'), null) -> 'projects' -> 0 -> 'progress',
  '1'::jsonb, 'project 2 shows yesterday''s 1 action'
);
select is(
  (select row(kind, level, required_actions, started_on)::text from gamecore.projects where id = pg_temp.project('mah', 4)),
  row('snowman-garden', 1, 20, '2026-12-02'::date)::text,
  'project 4 is the next catalog kind, sized for 4 active residents, started today'
);
select is(
  pg_temp.statuses(gamecore.submit_actions_at(pg_temp.uid('b'),
    jsonb_build_array(pg_temp.act(pg_temp.project('mah', 1)), pg_temp.act(pg_temp.project('mah', 4))), pg_temp.at('noon_d1'))),
  array['project_not_active', 'accepted'], 'a completed project takes no more actions; the new one does'
);
select is(
  (gamecore.community_state_at(pg_temp.uid('mah'), pg_temp.at('midnight_d1'), null) -> 'projects' -> 0 ->> 'stage'),
  'scaffolding', 'stage is scaffolding below half'
);

-- Frame stage at half progress: 5 more actions on project 2 by day D+1 → shows on D+2.
select gamecore.submit_actions_at(pg_temp.uid('c'), jsonb_build_array(
  pg_temp.act(pg_temp.project('mah', 2)), pg_temp.act(pg_temp.project('mah', 2)), pg_temp.act(pg_temp.project('mah', 2))
), pg_temp.at('noon_d1'));
select gamecore.submit_actions_at(pg_temp.uid('d'), jsonb_build_array(
  pg_temp.act(pg_temp.project('mah', 2))
), pg_temp.at('noon_d1'));
select is(
  gamecore.community_state_at(pg_temp.uid('mah'), '2026-12-03T06:00:00Z', null) -> 'projects' -> 0 ->> 'stage',
  'frame', 'stage is frame from half progress (5 of 10)'
);

-- Catalog cycles with levels ---------------------------------------------------------------
-- Insert projects 5..7 directly to check the generator's 7th project (cycle 2).
select gamecore.ensure_projects(pg_temp.uid('aub'), '2026-12-01');
delete from gamecore.projects where community_id = pg_temp.uid('aub');
insert into gamecore.projects (community_id, seq, kind, title, level, required_actions, started_on)
select pg_temp.uid('aub'), s, c.kind, c.title, 1, 1, '2026-11-01'
from generate_series(1, 6) s join gamecore.project_catalog c on c.position = s;
insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
select gen_random_uuid(), pg_temp.uid('e'), pg_temp.uid('aub'), p.id, '2026-11-01'::date + p.seq, 1
from gamecore.projects p where p.community_id = pg_temp.uid('aub') and p.seq <= 4;
select gamecore.ensure_projects(pg_temp.uid('aub'), '2026-12-01');
select is(
  (select row(kind, level, required_actions)::text from gamecore.projects where community_id = pg_temp.uid('aub') and seq = 7),
  row('ice-rink', 2, 13)::text, 'after six projects the catalog repeats at level 2 (x1.25)'
);

-- Member count (who sizes new projects) -------------------------------------------------
select is(gamecore.member_count(pg_temp.uid('mah'), '2026-12-02'), 4, 'four recently active members');
select is(gamecore.member_count(pg_temp.uid('mah'), '2027-01-02'), 0,
  'members inactive for 30+ days no longer count');
select is(gamecore.member_count(pg_temp.uid('mah'), '2026-11-30'), 0,
  'members who had not joined yet do not count');

-- Database-level guarantees -------------------------------------------------------------------
select throws_ok(
  format($$ insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
            values (gen_random_uuid(), %L, %L, %L, '2026-12-01', 1) $$, pg_temp.v('a'), pg_temp.v('mah'), pg_temp.project('mah', 2)),
  '23505', null, 'an energy slot can be used only once per day (unique constraint backs the limit)'
);
select throws_ok(
  format($$ insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
            values (gen_random_uuid(), %L, %L, %L, '2026-12-05', 4) $$, pg_temp.v('a'), pg_temp.v('mah'), pg_temp.project('mah', 2)),
  '23514', null, 'there is no 4th energy slot'
);
select throws_ok(
  $$ update gamecore.actions set calgary_day = calgary_day + 1 $$,
  '42501', 'gamecore.actions is append-only', 'actions cannot be updated'
);

-- API surface and permissions ---------------------------------------------------------------
set local role anon;
select throws_ok($$ select count(*) from gamecore.actions $$, '42501', null, 'anon cannot read gamecore tables');
select throws_ok($$ select public.gamecore_submit_actions('[]'::jsonb) $$, '42501', null, 'anon cannot submit actions');
select is(jsonb_array_length(public.gamecore_list_communities()), 223, 'anon can list communities');
select lives_ok(format($$ select public.gamecore_get_community_state(%L) $$, pg_temp.v('mah')), 'anon can view a community');
reset role;

set local role authenticated;
select throws_ok($$ select public.gamecore_submit_actions('[]'::jsonb) $$, '28000', 'not authenticated',
  'a signed-in role without a user id is rejected');
set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select is(
  (public.gamecore_choose_community(pg_temp.uid('aub')) ->> 'community_id'), pg_temp.v('aub'),
  'a signed-in player can choose a community through the RPC'
);
select is(
  pg_temp.statuses(public.gamecore_submit_actions(jsonb_build_array(
    jsonb_build_object('id', gen_random_uuid(), 'project_id', (select v from t where k = 'mah'))
  ))),
  array['project_not_found'], 'the RPC uses the caller''s identity and returns per-action results'
);
reset role;

select * from finish();
rollback;
