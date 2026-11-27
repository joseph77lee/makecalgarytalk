-- Module: gamecore — houses are scenery, "My house" is a fixed slot (shared when full, never taken
-- back, freed by moving away), and today's actions for the replay (requirement.md v1.48 §7.2, §7.3).
-- Day N = date '2026-12-01' + N.
begin;
select plan(18);

delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from gamecore.community_days;
delete from gamecore.community_snapshots;
delete from gamecore.house_lots;
delete from gamecore.house_capacity;  -- seeded from the island plans; this test sets its own
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-000000003' || lpad(n::text, 3, '0'))::uuid, 'h' || n || '@test.local'
from generate_series(1, 160) n;
insert into identity.profiles (user_id, nickname, shirt)
select ('00000000-0000-4000-8000-000000003' || lpad(n::text, 3, '0'))::uuid, 'Resident ' || n, 1
from generate_series(1, 160) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-000000003' || lpad(n::text, 3, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2026-12-01' + n $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select (pg_temp.d(n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.verify(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(n))
$$;
create function pg_temp.act(who integer, code text, n integer, pending boolean default false) returns void language sql as $$
  select gamecore.ensure_tree(pg_temp.c(code), pg_temp.d(n));
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot, pending, created_at)
  select gen_random_uuid(), pg_temp.u(who), pg_temp.c(code),
         (select p.id from gamecore.projects p where p.community_id = pg_temp.c(code) order by p.started_on, p.building_key limit 1),
         pg_temp.d(n),
         coalesce((select max(a.energy_slot) from gamecore.actions a where a.user_id = pg_temp.u(who) and a.calgary_day = pg_temp.d(n)), 0) + 1,
         pending, clock_timestamp()
$$;
create function pg_temp.assign(code text, n integer) returns void language sql as $$
  select gamecore.assign_houses(pg_temp.c(code), pg_temp.d(n))
$$;
create function pg_temp.slot(who integer, code text) returns integer language sql as $$
  select l.slot::integer from gamecore.house_lots l where l.community_id = pg_temp.c(code) and l.user_id = pg_temp.u(who)
$$;
create function pg_temp.capacity(code text, slots integer[]) returns void language sql as $$
  insert into gamecore.house_capacity (community_id, land_stage, slots)
  select pg_temp.c(code), k - 1, slots[k] from generate_subscripts(slots, 1) k
$$;
-- Mahogany: 2 house lots on the first land, 4 from 3 residents; Bel-Aire: 2 lots on every stage.
select pg_temp.capacity('MAH', array[2, 4, 6, 8, 10, 12]);
select pg_temp.capacity('BEL', array[2, 2, 2, 2, 2, 2]);
select pg_temp.capacity('AUB', array[3, 3, 3, 3, 3, 3]);

-- My house: a fixed slot -----------------------------------------------------------------------
select is(gamecore.house_slots_on(pg_temp.c('MAH'), 1), 4, 'house lots per land stage come from the island plan');
select is(gamecore.house_slots_on(pg_temp.c('ACA'), 0), 0, 'no plan data: no house lots');
select pg_temp.verify(1, 'MAH', 0);
select pg_temp.verify(2, 'MAH', 1);
select pg_temp.assign('MAH', 1);
select is(pg_temp.slot(1, 'MAH'), 0, 'the first resident gets lot 0');
select is(pg_temp.slot(2, 'MAH'), 1, 'the next resident the next free lot');
select residency.check_location_at(pg_temp.u(3), extensions.st_y(extensions.st_pointonsurface(b.area)), extensions.st_x(extensions.st_pointonsurface(b.area)), 10, pg_temp.noon(1))
from residency.boundaries b where b.community_id = pg_temp.c('MAH');
select pg_temp.assign('MAH', 1);
select is(pg_temp.slot(3, 'MAH'), null, 'a player still verifying has no house yet');
select pg_temp.assign('MAH', 40);
select is(array[pg_temp.slot(1, 'MAH'), pg_temp.slot(2, 'MAH')], array[0, 1], 'lots never move and are never taken back, even after 40 quiet days');

-- Full lots are shared ---------------------------------------------------------------------------
select pg_temp.verify(n, 'BEL', 0) from generate_series(10, 14) n;
select pg_temp.assign('BEL', 0);
select is(array(select pg_temp.slot(n, 'BEL') from generate_series(10, 14) n), array[0, 1, 0, 1, 0],
  'when every lot has an owner, new residents share the least shared lot (lowest first)');
select is((select count(*)::int from gamecore.house_lots where community_id = pg_temp.c('BEL')), 5, 'every resident has a house: nobody is hidden');
select pg_temp.verify(15, 'MAH', 2);
select pg_temp.assign('MAH', 2);
select is(pg_temp.slot(15, 'MAH'), 2, 'with 3 residents the land grew: a free lot on the new land, not a shared one');

-- Movers -------------------------------------------------------------------------------------------
select residency.start_move_at(pg_temp.u(2), pg_temp.noon(41));
select pg_temp.assign('MAH', 41);
select is(pg_temp.slot(2, 'MAH'), 1, 'moving: the house stays in the old community until the move completes');
select pg_temp.verify(2, 'AUB', 42);
select pg_temp.assign('MAH', 42);
select pg_temp.assign('AUB', 42);
select is(pg_temp.slot(2, 'MAH'), null, 'move completed: the old lot is free again');
select is(pg_temp.slot(2, 'AUB'), 0, 'and they have a house in the new community');
select pg_temp.verify(4, 'MAH', 43);
select pg_temp.assign('MAH', 43);
select is(pg_temp.slot(4, 'MAH'), 1, 'a new resident takes the freed lot');

-- Today's actions for the replay -------------------------------------------------------------
select pg_temp.act(4, 'MAH', 50);
select pg_temp.act(1, 'MAH', 50);
select pg_temp.act(3, 'MAH', 50, true);
select is(jsonb_path_query_array(gamecore.today_actions(pg_temp.c('MAH'), pg_temp.d(50)), '$[*].nickname'), '["Resident 1", "Resident 4"]'::jsonb,
  'real actions of today, newest first, pending help left out');
select is((select array_agg(k order by k) from jsonb_object_keys(gamecore.today_actions(pg_temp.c('MAH'), pg_temp.d(50)) -> 0) k),
  array['building_key', 'nickname', 'title'], 'nickname and building only (no times, no ids)');

-- My house slot is personal ------------------------------------------------------------------
select is((gamecore.community_state_at(pg_temp.c('MAH'), pg_temp.noon(50), pg_temp.u(4)) -> 'me' ->> 'house_slot')::integer, 1, 'my house slot');
select is((gamecore.community_state_at(pg_temp.c('MAH'), pg_temp.noon(50), null) ?| array['houses', 'hidden_houses']), false, 'the public state lists no residents'' houses (houses are scenery)');
select is((gamecore.community_state_at(pg_temp.c('MAH'), pg_temp.noon(50), pg_temp.u(1)) -> 'me' ->> 'house_slot')::integer, 0, 'each resident sees only their own slot');

select * from finish();
rollback;
