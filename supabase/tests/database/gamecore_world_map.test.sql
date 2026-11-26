-- Module: gamecore — World Map levels from the build map (requirement.md v1.48 §7.4, §9).
begin;
select plan(9);

delete from gamecore.community_snapshots;
delete from gamecore.place_lots;  -- seeded from the island plans; each test adds what it needs
delete from gamecore.actions;
delete from gamecore.projects;

create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.snap(code text, level integer, vitality integer default 50, residents integer default 3) returns void language sql as $$
  insert into gamecore.community_snapshots (community_id, calgary_day, built_at, state)
  values (pg_temp.c(code), date '2026-12-01', now(), jsonb_build_object(
    'community', jsonb_build_object('level', level, 'vitality', vitality, 'residents', residents), 'buildings', '[]'::jsonb))
$$;
create function pg_temp.level(code text) returns integer language sql as $$
  select (r ->> 'level')::integer from jsonb_array_elements(gamecore.world_map()) r where r ->> 'code' = code
$$;

select pg_temp.snap('MAH', 2);
select pg_temp.snap('BEL', 4, 80, 60);
select is(pg_temp.level('BOW'), 0, 'no snapshot yet: unsettled');
select is(pg_temp.level('MAH'), 2, 'the map shows the level stored in the snapshot');
select is((select r from jsonb_array_elements(gamecore.world_map()) r where r ->> 'code' = 'BEL') - 'id',
  '{"code": "BEL", "level": 4, "vitality": 80, "residents": 60}'::jsonb, 'level, Vitality and residents');

-- The level itself (§7.4): built the day after its goal was reached (one action each here).
insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a1', 'lv1@test.local'), ('00000000-0000-4000-8000-0000000000a2', 'lv2@test.local');
create function pg_temp.build(code text, key text, who text, slot integer) returns void language sql as $$
  with p as (
    insert into gamecore.projects (community_id, building_key, level, required_actions, started_on)
    values (pg_temp.c(code), key, 1, 1, date '2026-12-01') returning id
  )
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
  select gen_random_uuid(), who::uuid, pg_temp.c(code), p.id, date '2026-12-01', slot from p
$$;
select is(gamecore.development_level(pg_temp.c('ACA'), date '2026-12-02'), 0, 'nothing built: level 0');
select pg_temp.build('ACA', 'welcome-sign', '00000000-0000-4000-8000-0000000000a1', 1);
select is(gamecore.development_level(pg_temp.c('ACA'), date '2026-12-02'), 1, 'Welcome sign: level 1');
select pg_temp.build('ACA', 'place.mature-suburb.tennis-courts', '00000000-0000-4000-8000-0000000000a1', 2);
select is(gamecore.development_level(pg_temp.c('ACA'), date '2026-12-02'), 2, 'the first persona place: level 2');
select pg_temp.build('ACA', 'community-hall', '00000000-0000-4000-8000-0000000000a1', 3);
select is(gamecore.development_level(pg_temp.c('ACA'), date '2026-12-02'), 3, 'Community hall: level 3');
select pg_temp.build('ACA', 'place.mature-suburb.leisure-centre', '00000000-0000-4000-8000-0000000000a2', 1);
select is(gamecore.development_level(pg_temp.c('ACA'), date '2026-12-02'), 4, 'the signature landmark (here the pattern landmark): level 4');

create temp table n as select count(*)::int as c from gamecore.communities;
grant select on n to anon;
set local role anon;
select ok(jsonb_array_length(public.gamecore_world_map()) = (select c from n), 'visitors can read the map: every community is listed (with its id)');
reset role;

select * from finish();
rollback;
