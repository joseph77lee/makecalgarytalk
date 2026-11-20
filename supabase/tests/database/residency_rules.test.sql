-- Module: residency — location checks, 3-of-7-day verification, candidate community, pending
-- contributions, moving, privacy and permissions (requirement.md v1.23 §6.2–§6.4).
--
-- Day N = date '2026-12-01' + N; its noon is 18:00Z (Alberta is UTC-6 year-round).
-- Points inside a community come from its boundary (ST_PointOnSurface).
begin;
select plan(81);

delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.building_openings;
delete from gamecore.community_days;
delete from gamecore.community_snapshots;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid, 'r' || n || '@test.local'
from generate_series(1, 20) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$
  select gamecore.community_id_by_code('calgary', code)
$$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2026-12-01' + n $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select (pg_temp.d(n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.pt(code text) returns extensions.geometry language sql as $$
  select extensions.st_pointonsurface(b.area) from residency.boundaries b where b.community_id = pg_temp.c(code)
$$;
create function pg_temp.check_at(who integer, code text, t timestamptz, acc double precision default 15) returns jsonb language sql as $$
  select residency.check_location_at(pg_temp.u(who), extensions.st_y(pg_temp.pt(code)), extensions.st_x(pg_temp.pt(code)), acc, t)
$$;
create function pg_temp.check(who integer, code text, n integer, acc double precision default 15) returns jsonb language sql as $$
  select pg_temp.check_at(who, code, pg_temp.noon(n), acc)
$$;
create function pg_temp.res(who integer, code text, n integer) returns text language sql as $$
  select pg_temp.check(who, code, n) ->> 'result'
$$;
create function pg_temp.status(who integer, n integer) returns jsonb language sql as $$
  select residency.status_at(pg_temp.u(who), pg_temp.noon(n))
$$;
create function pg_temp.counted(code text, n integer) returns uuid[] language sql as $$
  select coalesce(array_agg(r.user_id order by r.user_id), '{}') from residency.counted_residents_on(pg_temp.c(code), pg_temp.d(n)) r
$$;

-- Location check (§6.2) -----------------------------------------------------------------
select throws_ok($$ select residency.check_location_at(pg_temp.u(1), 91, -114, 10, pg_temp.noon(0)) $$, '22023', null, 'latitude out of range is rejected');
select throws_ok($$ select residency.check_location_at(pg_temp.u(1), 'NaN', -114, 10, pg_temp.noon(0)) $$, '22023', null, 'NaN is rejected');
select is(residency.check_location_at(pg_temp.u(1), 49.2827, -123.1207, 15, pg_temp.noon(0)) ->> 'result', 'no_community', 'outside Calgary: no community');
select is(pg_temp.check(1, 'MAH', 0, 1500) ->> 'result', 'inaccurate', 'accuracy worse than 1 km is not counted');
select is(residency.check_location_at(pg_temp.u(1), 50.9, -113.93, null, pg_temp.noon(0)) ->> 'result', 'inaccurate', 'a check without accuracy is not counted');
select is(pg_temp.status(1, 0) ->> 'status', 'new', 'no counted check-in yet: new');
select is((pg_temp.status(1, 0) ->> 'checks_left')::int, 17, 'every check today counts toward the limit (3 used)');

select is(pg_temp.res(1, 'MAH', 0), 'counted', 'a check-in from inside Mahogany is counted');
select is(pg_temp.status(1, 0) ->> 'status', 'verifying', 'verifying after the first check-in');
select is(pg_temp.status(1, 0) -> 'candidate' ->> 'name', 'Mahogany', 'candidate community');
select is(pg_temp.status(1, 0) -> 'candidate' ->> 'days', '1', 'one day so far');
select is((pg_temp.status(1, 0) ->> 'pending')::boolean, true, 'actions are pending while verifying');
select is(pg_temp.status(1, 0) -> 'play_community' ->> 'name', 'Mahogany', 'plays in the candidate community');
select is(pg_temp.res(1, 'MAH', 0), 'counted', 'checking again the same day is fine');
select is(pg_temp.status(1, 0) -> 'candidate' ->> 'days', '1', 'but it is still one day');

-- 3 different days within 7, day boundary at Calgary midnight (§6.3) ---------------------
select pg_temp.check_at(2, 'MAH', '2026-12-02T05:59:00Z'); -- Dec 1, 23:59 in Calgary (day 0)
select pg_temp.check_at(2, 'MAH', '2026-12-02T06:00:00Z'); -- Dec 2, 00:00 in Calgary (day 1)
select is(pg_temp.status(2, 1) -> 'candidate' ->> 'days', '2', 'one minute apart across Calgary midnight = two days');
select is(pg_temp.res(2, 'MAH', 6), 'verified', 'a third day on day 6 (window day 0–6) verifies');
select is(pg_temp.status(2, 6) ->> 'status', 'verified', 'Verified Resident');
select is(pg_temp.status(2, 6) -> 'community' ->> 'verified_on', pg_temp.d(6)::text, 'verified on day 6');
select is((pg_temp.status(2, 6) ->> 'pending')::boolean, false, 'no longer pending');

select pg_temp.check(3, 'MAH', 0);
select pg_temp.check(3, 'MAH', 1);
select is(pg_temp.res(3, 'MAH', 7), 'counted', 'days 0, 1 and 7: day 0 is outside the window ending on day 7');
select is(pg_temp.status(3, 7) ->> 'status', 'verifying', 'still verifying');

-- No location checks after verification
select is(pg_temp.res(2, 'AUB', 7), 'not_needed', 'a Verified Resident is not checked any more');
select is((pg_temp.status(2, 7) ->> 'checks_left')::int, 20, 'and that does not count toward the limit');
select is(pg_temp.status(2, 7) -> 'community' ->> 'name', 'Mahogany', 'checking from elsewhere changes nothing');

-- Another community (workplace) the same day (§6.3) ---------------------------------------
select pg_temp.check(4, 'MAH', 0);
select pg_temp.check(4, 'MAH', 1);
select is(pg_temp.res(4, 'DNC', 2), 'counted', 'a visit downtown (work) is counted for downtown');
select is(pg_temp.status(4, 2) -> 'candidate' ->> 'name', 'Mahogany', 'but Mahogany stays the candidate (2 days vs 1)');
select is(pg_temp.status(4, 2) ->> 'status', 'verifying', 'the work visit is not a Mahogany day');
select is(pg_temp.res(4, 'MAH', 2), 'verified', 'home later the same day counts');

-- Candidate tie → the most recent check-in
select pg_temp.check(5, 'DNC', 0);
select pg_temp.check(5, 'MAH', 0);
select is(pg_temp.status(5, 0) -> 'candidate' ->> 'name', 'Mahogany', 'tie: the most recent check-in wins');
select pg_temp.check(5, 'DNC', 0);
select is(pg_temp.status(5, 0) -> 'candidate' ->> 'name', 'Downtown Commercial Core', 'checking in downtown again makes it the most recent');

-- Rate limit: 20 checks per account per Calgary day
select pg_temp.check(6, 'MAH', 0) from generate_series(1, 20);
select is(pg_temp.res(6, 'MAH', 0), 'limit', 'the 21st check of the day is refused');
select is((pg_temp.status(6, 0) ->> 'checks_left')::int, 0, 'no checks left today');
select is(pg_temp.res(6, 'MAH', 1), 'counted', 'a new Calgary day resets the limit');

-- Pending contributions (§6.3) ------------------------------------------------------------
-- User 7 checks in from Auburn Bay (no residents yet) and helps build its Welcome sign.
select pg_temp.check(7, 'AUB', 10);
select gamecore.ensure_tree(pg_temp.c('AUB'), pg_temp.d(10));
create temp table t (k text primary key, v uuid);
insert into t values ('sign', (select id from gamecore.projects where community_id = pg_temp.c('AUB') and building_key = 'welcome-sign'));
select is(
  gamecore.submit_actions_at(pg_temp.u(7), jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'project_id', (select v from t where k = 'sign'))), pg_temp.noon(10)) ->> 'pending',
  'true', 'an action while verifying is accepted as pending');
select is((select bool_and(pending) from gamecore.actions where user_id = pg_temp.u(7)), true, 'stored as pending');
select is(gamecore.applied_progress((select v from t where k = 'sign'), pg_temp.d(11)), 0, 'pending actions do not count the next day');
select pg_temp.check(7, 'AUB', 11);
select is(pg_temp.res(7, 'AUB', 12), 'verified', 'verified in Auburn Bay on day 12');
select is(gamecore.applied_progress((select v from t where k = 'sign'), pg_temp.d(12)), 0, 'applied from the verification day: not yet shown on day 12');
select is(gamecore.applied_progress((select v from t where k = 'sign'), pg_temp.d(13)), 1, 'shown from day 13');
select is(
  gamecore.submit_actions_at(pg_temp.u(7), jsonb_build_array(jsonb_build_object('id', gen_random_uuid(), 'project_id', (select v from t where k = 'sign'))), pg_temp.noon(12)) ->> 'pending',
  'false', 'after verification actions are no longer pending');

-- Pending actions in a community the player is never verified in are never applied.
select pg_temp.check(8, 'BLN', 10);
select gamecore.ensure_tree(pg_temp.c('BLN'), pg_temp.d(10));
select gamecore.submit_actions_at(pg_temp.u(8), jsonb_build_array(jsonb_build_object('id', gen_random_uuid(),
  'project_id', (select id from gamecore.projects where community_id = pg_temp.c('BLN') and building_key = 'welcome-sign'))), pg_temp.noon(10));
select pg_temp.check(8, 'MAH', 11); select pg_temp.check(8, 'MAH', 12); select pg_temp.check(8, 'MAH', 13);
select is(gamecore.applied_progress((select id from gamecore.projects where community_id = pg_temp.c('BLN') and building_key = 'welcome-sign'), pg_temp.d(20)), 0,
  'verified elsewhere: pending actions in the first community are never applied');

-- Moving (§6.4) -----------------------------------------------------------------------------
-- User 9: verified in Mahogany on day 0.
select residency.add_verified_resident_at(pg_temp.u(9), pg_temp.c('MAH'), pg_temp.noon(0));
select is(residency.start_move_at(pg_temp.u(10), pg_temp.noon(0)) ->> 'problem', 'not_verified', 'only a Verified Resident can move');
select is(residency.can_move_at(pg_temp.u(9), pg_temp.d(20)) ->> 'reason', 'cooldown', 'after day 14 the first verification cooldown applies');
select is(residency.can_move_at(pg_temp.u(9), pg_temp.d(20)) ->> 'available_on', pg_temp.d(90)::text, '90 days from the first verification');
select is(residency.can_move_at(pg_temp.u(9), pg_temp.d(90)) ->> 'allowed', 'true', 'allowed on day 90');

-- Free correction: day 1 start, cancelled (does not use it), day 2 start again, completed.
select is(residency.start_move_at(pg_temp.u(9), pg_temp.noon(1)) -> 'move' ->> 'free_correction', 'true', 'within 14 days: a free correction');
select is(pg_temp.counted('MAH', 1), '{}'::uuid[], 'excluded from the old community''s denominators from the start day');
select is(pg_temp.res(9, 'MAH', 1), 'current_community', 'a check-in from the old community does not count');
select is(pg_temp.status(9, 1) -> 'play_community' ->> 'name', 'Mahogany', 'before any check-in elsewhere they still play in the old community');
select is(residency.cancel_move_at(pg_temp.u(9), pg_temp.noon(1)) ->> 'ok', 'true', 'the player can cancel');
select is(pg_temp.counted('MAH', 1), array[pg_temp.u(9)], 'cancelled: counted normally again that day');
select is(residency.cancel_move_at(pg_temp.u(9), pg_temp.noon(1)) ->> 'problem', 'not_moving', 'nothing to cancel');
select is(residency.start_move_at(pg_temp.u(9), pg_temp.noon(2)) -> 'move' ->> 'free_correction', 'true', 'a cancelled correction is not used up');
select pg_temp.check(9, 'AUB', 2);
select is(pg_temp.status(9, 2) -> 'play_community' ->> 'name', 'Auburn Bay', 'moving: plays in the new candidate community');
select is((pg_temp.status(9, 2) ->> 'pending')::boolean, true, 'and those actions are pending');
select pg_temp.check(9, 'AUB', 3);
select is(pg_temp.res(9, 'AUB', 5), 'verified', 'three days in the new community complete the move');
select is(pg_temp.status(9, 5) -> 'community' ->> 'name', 'Auburn Bay', 'now a Verified Resident of Auburn Bay');
select is(residency.cumulative_residents_on(pg_temp.c('MAH'), pg_temp.d(20)), 4, 'the old community keeps its cumulative count (users 2, 4, 8, 9)');
select is(residency.can_move_at(pg_temp.u(9), pg_temp.d(10)) ->> 'reason', 'cooldown', 'the correction is used: no second free move within 14 days');
select is(residency.can_move_at(pg_temp.u(9), pg_temp.d(10)) ->> 'available_on', pg_temp.d(95)::text, '90 days from the completed move');

-- Returning to a community does not count the person twice.
select residency.add_verified_resident_at(pg_temp.u(9), pg_temp.c('MAH'), pg_temp.noon(100));
select is(residency.cumulative_residents_on(pg_temp.c('MAH'), pg_temp.d(100)), 4, 'a returner is not counted again');

-- Automatic cancel after 7 days (user 11, verified day 0, moves on day 100).
select residency.add_verified_resident_at(pg_temp.u(11), pg_temp.c('BLN'), pg_temp.noon(0));
select residency.start_move_at(pg_temp.u(11), pg_temp.noon(100));
select pg_temp.check(11, 'MAH', 100);
select pg_temp.check(11, 'MAH', 101);
select is(pg_temp.status(11, 106) ->> 'status', 'moving', 'day 7 of the move (day 106): still moving');
select is(pg_temp.status(11, 107) ->> 'status', 'verified', 'day 107: cancelled automatically');
select is(pg_temp.counted('BLN', 107), array[pg_temp.u(11)], 'counted in the old community again');
select is(pg_temp.res(11, 'MAH', 107), 'not_needed', 'check-ins from the cancelled move are no longer used');
select is(residency.can_move_at(pg_temp.u(11), pg_temp.d(107)) ->> 'allowed', 'true', 'the cooldown was not used: can start again');
select is(residency.start_move_at(pg_temp.u(11), pg_temp.noon(107)) ->> 'ok', 'true', 'starting again closes the old move');
select is(pg_temp.res(11, 'MAH', 108), 'counted', 'check-ins before the new start do not count');
select is(pg_temp.status(11, 108) -> 'candidate' ->> 'days', '1', 'only one day since the new start');

-- Privacy: coordinates are never stored or returned (§6.2) ---------------------------------
select is(
  (select count(*)::int from information_schema.columns
   where table_schema in ('residency', 'gamecore', 'identity', 'common')
     and (data_type in ('double precision', 'real', 'point') or udt_name in ('geometry', 'geography'))
     and not (table_schema = 'residency' and table_name = 'boundaries')),
  0, 'no coordinate-like column exists outside the boundaries table');
create function pg_temp.rows_containing(needle text) returns integer language plpgsql as $$
declare r record; n integer := 0; c integer;
begin
  for r in select table_schema, table_name from information_schema.tables
           where table_schema in ('residency', 'gamecore', 'identity', 'common') and table_type = 'BASE TABLE'
             and not (table_schema = 'residency' and table_name = 'boundaries') loop
    execute format('select count(*) from %I.%I t where row_to_json(t)::text like %L', r.table_schema, r.table_name, '%' || needle || '%') into c;
    n := n + c;
  end loop;
  return n;
end;
$$;
select residency.check_location_at(pg_temp.u(12), 50.886713, -113.947271, 12, pg_temp.noon(0));
select is(pg_temp.rows_containing('50.8867'), 0, 'the latitude is not in any table');
select is(pg_temp.rows_containing('113.9472'), 0, 'the longitude is not in any table');
select ok(residency.check_location_at(pg_temp.u(12), 50.886713, -113.947271, 12, pg_temp.noon(0))::text !~ '50\.88|113\.94', 'the result does not echo the coordinates');
select ok((select p.prosrc !~* 'raise\s+(notice|log|info|debug|warning)' from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'residency' and p.proname = 'check_location_at'), 'the check never logs (no raise notice/log)');

-- Records and permissions ------------------------------------------------------------------
select throws_ok($$ update residency.verifications set verified_on = verified_on - 1 $$, '42501', null, 'verifications are append-only');
set local role anon;
select throws_ok($$ select public.residency_get_status() $$, '42501', null, 'visitors (anon) cannot call residency RPCs');
reset role;
set local role authenticated;
select throws_ok($$ select * from residency.check_ins $$, '42501', null, 'signed-in players cannot read residency tables');
select throws_ok($$ select residency.add_verified_resident_at(auth.uid(), gen_random_uuid(), now()) $$, '42501', null, 'nor call internal functions');
select throws_ok($$ select public.residency_check_location(51.04, -114.07, 10) $$, '28000', 'not authenticated', 'a role without a user id is rejected');
set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-000000000113", "role": "authenticated"}';
select is(public.residency_check_location(51.0447, -114.0719, 10) -> 'checked_community' ->> 'name', 'Downtown Commercial Core', 'checking in through the RPC');
reset role;

select * from finish();
rollback;
