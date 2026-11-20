-- Module: gamecore — resident houses (fixed lots, 30-day archive, movers, full lots) and today's
-- actions for the replay (requirement.md v1.26 §7.2, §7.3). Day N = date '2026-12-01' + N.
begin;
select plan(30);

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
create function pg_temp.houses(code text, n integer) returns jsonb language sql as $$
  select gamecore.houses_at(pg_temp.c(code), pg_temp.d(n))
$$;
create function pg_temp.slot(who integer, code text) returns integer language sql as $$
  select l.slot::integer from gamecore.house_lots l where l.community_id = pg_temp.c(code) and l.user_id = pg_temp.u(who)
$$;
create function pg_temp.house(code text, n integer, slot integer) returns jsonb language sql as $$
  select h from jsonb_array_elements(pg_temp.houses(code, n) -> 'houses') h where (h ->> 'slot')::integer = slot
$$;

-- Lots and house data ------------------------------------------------------------------------
select pg_temp.verify(1, 'MAH', 0);
select pg_temp.verify(2, 'MAH', 1);
select is(jsonb_array_length(pg_temp.houses('MAH', 1) -> 'houses'), 2, 'one house per Verified Resident');
select is(pg_temp.slot(1, 'MAH'), 0, 'the first resident gets lot 0');
select is(pg_temp.slot(2, 'MAH'), 1, 'the next resident the next free lot');
select is(pg_temp.house('MAH', 1, 0), '{"slot": 0, "founding": true, "nickname": "Resident 1", "active_today": false}'::jsonb,
  'house data: slot, nickname, active today, Founding Resident (no user id)');
select is(pg_temp.house('MAH', 1, 1) ->> 'founding', 'false', 'later residents are not founders');
select residency.check_location_at(pg_temp.u(3), extensions.st_y(extensions.st_pointonsurface(b.area)), extensions.st_x(extensions.st_pointonsurface(b.area)), 10, pg_temp.noon(1))
from residency.boundaries b where b.community_id = pg_temp.c('MAH');
select is(jsonb_array_length(pg_temp.houses('MAH', 1) -> 'houses'), 2, 'a player still verifying has no house');

-- Lights: active today
select pg_temp.act(2, 'MAH', 2);
select is(pg_temp.house('MAH', 2, 1) ->> 'active_today', 'true', 'acted today: lights on');
select is(pg_temp.house('MAH', 3, 1) ->> 'active_today', 'false', 'next day: lights off');
select is(pg_temp.slot(2, 'MAH'), 1, 'lots never move');

-- Archived after 30 days, same lot when back
select is(pg_temp.house('MAH', 29, 0) ->> 'nickname', 'Resident 1', 'verified on day 0 without acting: still shown on day 29');
select is(pg_temp.house('MAH', 30, 0), null, 'day 30: archived (house removed)');
select is(pg_temp.slot(1, 'MAH'), 0, 'but the lot is kept for them');
select pg_temp.act(1, 'MAH', 40);
select pg_temp.act(2, 'MAH', 40);
select is(pg_temp.house('MAH', 40, 0) ->> 'nickname', 'Resident 1', 'back: the house reappears on the same lot');

-- Movers keep their house until the move completes
select residency.start_move_at(pg_temp.u(2), pg_temp.noon(41));
select is(pg_temp.house('MAH', 41, 1) ->> 'nickname', 'Resident 2', 'moving: the house stays in the old community');
select pg_temp.verify(2, 'AUB', 42);
select is(pg_temp.house('MAH', 42, 1), null, 'move completed: the old house is gone');
select is(pg_temp.slot(2, 'MAH'), null, 'and its lot is free again');
select is(pg_temp.house('AUB', 42, 0) ->> 'nickname', 'Resident 2', 'the house moved to the new community');
select pg_temp.verify(4, 'MAH', 43);
select pg_temp.houses('MAH', 43) is not null as assigned;
select is(pg_temp.slot(4, 'MAH'), 1, 'a new resident takes the freed lot');

-- Full lots: 150 residents in Bel-Aire
select pg_temp.verify(n, 'BEL', 0) from generate_series(10, 159) n;
select is(jsonb_array_length(pg_temp.houses('BEL', 0) -> 'houses'), 150, '150 houses fill every lot');
select pg_temp.verify(160, 'BEL', 0);
select is((pg_temp.houses('BEL', 0) ->> 'hidden')::integer, 1, 'one more active resident: not drawn ("+1 more")');
select is(pg_temp.slot(160, 'BEL'), null, 'and gets no lot');
-- Day 35: only residents 10..39 (lots 0..29) acted recently; the others are archived.
select pg_temp.act(n, 'BEL', 34) from generate_series(10, 39) n;
select pg_temp.act(160, 'BEL', 34);
select is(jsonb_array_length(pg_temp.houses('BEL', 35) -> 'houses'), 31, 'archived houses are removed (30 recent residents + the waiting one)');
select is(pg_temp.slot(160, 'BEL'), 30, 'full: the waiting resident takes the lowest lot of an archived resident');
select is(pg_temp.slot(40, 'BEL'), null, 'whose lot is gone');
select pg_temp.act(40, 'BEL', 36);
select pg_temp.houses('BEL', 36) is not null as assigned;
select is(pg_temp.slot(40, 'BEL'), 31, 'when they come back they take another archived lot');
select is((pg_temp.houses('BEL', 36) ->> 'hidden')::integer, 0, 'nobody is hidden while archived lots exist');

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
select is(gamecore.community_state_at(pg_temp.c('MAH'), pg_temp.noon(50), null) -> 'houses' -> 0 ? 'user_id', false, 'public houses carry no user id');

select * from finish();
rollback;
