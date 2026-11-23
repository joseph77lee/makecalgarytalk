-- Module: gamecore — World Map levels from built buildings (requirement.md v1.29 §9).
begin;
select plan(9);

delete from gamecore.community_snapshots;

create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.snap(code text, built text[], building text[] default '{}', vitality integer default 50, residents integer default 3) returns void language sql as $$
  insert into gamecore.community_snapshots (community_id, calgary_day, built_at, state)
  values (pg_temp.c(code), date '2026-12-01', now(), jsonb_build_object(
    'community', jsonb_build_object('vitality', vitality, 'residents', residents),
    'buildings', coalesce((select jsonb_agg(jsonb_build_object('key', k, 'status', 'built', 'level', 1)) from unnest(built) k), '[]'::jsonb)
                 || coalesce((select jsonb_agg(jsonb_build_object('key', k, 'status', 'building', 'level', 2)) from unnest(building) k), '[]'::jsonb)))
$$;
create function pg_temp.level(code text) returns integer language sql as $$
  select (r ->> 'level')::integer from jsonb_array_elements(gamecore.world_map()) r where r ->> 'code' = code
$$;

select pg_temp.snap('AUB', '{fire-pit}');
select pg_temp.snap('MAH', '{welcome-sign}');
select pg_temp.snap('BLN', '{welcome-sign,skating-rink}');
select pg_temp.snap('ACA', '{welcome-sign,playground,community-hall}');
select pg_temp.snap('BEL', '{welcome-sign,community-hall,neighbourhood-park}', '{}', 80, 60);
select pg_temp.snap('DNC', '{}', '{welcome-sign}');

select is(pg_temp.level('AUB'), 0, 'no Welcome sign: unsettled');
select is(pg_temp.level('BOW'), 0, 'no snapshot yet: unsettled');
select is(pg_temp.level('MAH'), 1, 'Welcome sign: level 1');
select is(pg_temp.level('BLN'), 2, 'Skating rink: level 2');
select is(pg_temp.level('ACA'), 3, 'Community hall: level 3');
select is(pg_temp.level('BEL'), 4, 'Neighbourhood park: level 4');
select is(pg_temp.level('DNC'), 1, 'a Welcome sign being upgraded counts as built');
select is((select r from jsonb_array_elements(gamecore.world_map()) r where r ->> 'code' = 'BEL') - 'id',
  '{"code": "BEL", "level": 4, "vitality": 80, "residents": 60}'::jsonb, 'level, Vitality and residents');
create temp table n as select count(*)::int as c from gamecore.communities;
grant select on n to anon;
set local role anon;
select ok(jsonb_array_length(public.gamecore_world_map()) = (select c from n), 'visitors can read the map: every community is listed (with its id)');
reset role;

select * from finish();
rollback;
