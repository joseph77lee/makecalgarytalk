-- Modules: analytics, admin, identity email updates (requirement.md v1.35 §17, §18, §21).
-- Days are in 2027 so the local demo data never mixes in. Day N = Monday 2027-03-01 + N.
begin;
select plan(35);

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000014' || lpad(n::text, 2, '0'))::uuid, 'a' || n || '@test.local'
from generate_series(1, 30) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000014' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.d(n integer) returns date language sql as $$ select date '2027-03-01' + n $$;
create function pg_temp.at(n integer, t text default '12:00') returns timestamptz language sql as $$
  select (pg_temp.d(n)::text || ' ' || t)::timestamp at time zone 'America/Edmonton'
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.act(who integer, code text, n integer) returns void language sql as $$
  select gamecore.ensure_tree(pg_temp.c(code), pg_temp.d(n));
  insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot, created_at)
  select gen_random_uuid(), pg_temp.u(who), pg_temp.c(code),
         (select p.id from gamecore.projects p where p.community_id = pg_temp.c(code) and p.building_key = 'welcome-sign' order by p.level desc limit 1),
         pg_temp.d(n), 1, clock_timestamp()
$$;
create function pg_temp.day(n integer) returns jsonb language sql as $$
  select e from jsonb_array_elements(analytics.daily(pg_temp.d(0), pg_temp.d(20), pg_temp.d(20))) e where (e ->> 'day')::date = pg_temp.d(n)
$$;

-- Visits ----------------------------------------------------------------------------------------
select analytics.visit_at(pg_temp.u(1), 'MAH', pg_temp.at(0));
select analytics.visit_at(pg_temp.u(1), 'MAH', pg_temp.at(0, '18:00'));
select analytics.visit_at(pg_temp.u(1), 'BRD', pg_temp.at(0, '19:00'));
select analytics.visit_at(pg_temp.u(1), 'NOPE', pg_temp.at(0, '20:00'));
select is((select count(*)::int from analytics.visits where user_id = pg_temp.u(1)), 1, 'one visit per player per day');
select is((select count(*)::int from analytics.community_views where user_id = pg_temp.u(1)), 2, 'one view per community per day; unknown codes ignored');
-- 23:30 Calgary on day 0 is still day 0; 00:10 is day 1 (server day boundary)
select analytics.visit_at(pg_temp.u(2), null, pg_temp.at(0, '23:30'));
select analytics.visit_at(pg_temp.u(2), null, pg_temp.at(1, '00:10'));
select is((select array_agg(calgary_day order by calgary_day) from analytics.visits where user_id = pg_temp.u(2)),
          array[pg_temp.d(0), pg_temp.d(1)], 'visits split at Calgary midnight');
select throws_ok($$ select analytics.visit_at(null, null, now()) $$, '28000', 'not authenticated', 'visits need a player');

-- Events ----------------------------------------------------------------------------------------
select analytics.event_at(pg_temp.u(1), 'share', 'weekly', 'MAH', pg_temp.at(0));
select analytics.event_at(pg_temp.u(1), 'invite_visit', null, null, pg_temp.at(0));
select is((select count(*)::int from analytics.events where user_id = pg_temp.u(1)), 2, 'shares and invite visits are recorded');
select throws_ok($$ select analytics.event_at(pg_temp.u(1), 'click', null, null, now()) $$, '22023', 'unknown event kind', 'only known kinds');
select throws_ok($$ select analytics.event_at(pg_temp.u(1), 'share', 'Free Text!', null, now()) $$, '22023', 'bad event detail', 'detail is a short key, no free text');
select analytics.event_at(pg_temp.u(3), 'share', 'built', null, pg_temp.at(2)) from generate_series(1, 60);
select is((select count(*)::int from analytics.events where user_id = pg_temp.u(3)), 50, 'events above 50 per player per day are ignored');
select throws_ok($$ update analytics.events set kind = 'share' $$, '42501', 'analytics.events is append-only', 'events are append-only');

-- Daily figures ---------------------------------------------------------------------------------
-- Day 3 cohort: players 10..13 are new. 10 and 11 act that day; 10, 12 come back on day 4; 10 on day 10.
select analytics.visit_at(pg_temp.u(n), null, pg_temp.at(3)) from generate_series(10, 13) n;
select pg_temp.act(10, 'MAH', 3);
select pg_temp.act(11, 'MAH', 3);
select pg_temp.act(12, 'MAH', 5); -- acting later does not count as a first-day action
select analytics.visit_at(pg_temp.u(10), null, pg_temp.at(4));
select analytics.visit_at(pg_temp.u(12), null, pg_temp.at(4));
select analytics.visit_at(pg_temp.u(10), null, pg_temp.at(10));
select analytics.visit_at(pg_temp.u(1), null, pg_temp.at(3)); -- an old player: a visitor, not new

select is((pg_temp.day(3) ->> 'visitors')::int, 5, 'visitors = distinct players that day');
select is((pg_temp.day(3) ->> 'new_visitors')::int, 4, 'new = first visit that day');
select is((pg_temp.day(3) ->> 'first_action_pct')::int, 50, 'first action = new players who acted on their first day');
select is((pg_temp.day(3) ->> 'd1_pct')::int, 50, 'D1 = new players back the next day');
select is((pg_temp.day(3) ->> 'd7_pct')::int, 25, 'D7 = new players back 7 days later');
select is((pg_temp.day(0) ->> 'shares')::int, 1, 'shares counted per day');
select is((pg_temp.day(0) ->> 'invite_visits')::int, 1, 'invite visits counted per day');
-- Retention is unknown until the day has passed
select is((select e ->> 'd1_pct' from jsonb_array_elements(analytics.daily(pg_temp.d(3), pg_temp.d(3), pg_temp.d(4))) e), null,
          'D1 is null while the next day is still running');
select is((select e ->> 'd7_pct' from jsonb_array_elements(analytics.daily(pg_temp.d(3), pg_temp.d(3), pg_temp.d(9))) e), null,
          'D7 is null until the 7th day has passed');
select is((select e ->> 'first_action_pct' from jsonb_array_elements(analytics.daily(pg_temp.d(7), pg_temp.d(7), pg_temp.d(20))) e), null,
          'no new players: no percentage (no division by zero)');
select is((analytics.community_visits(pg_temp.d(0), pg_temp.d(0), 20) -> 0 ->> 'visitors')::int, 1, 'visits by community');

-- Verification spikes (§17) ---------------------------------------------------------------------
-- ACA: 3 new verifications on day 14 with none before (a spike), 2 on day 15 (never a spike);
-- later 3 on day 30 after 1 a day for 28 days (usual level 1, so 3 is not above 3x).
select residency.add_verified_resident_at(pg_temp.u(20), pg_temp.c('ACA'), pg_temp.at(14));
select residency.add_verified_resident_at(pg_temp.u(21), pg_temp.c('ACA'), pg_temp.at(14));
select residency.add_verified_resident_at(pg_temp.u(22), pg_temp.c('ACA'), pg_temp.at(14));
select residency.add_verified_resident_at(pg_temp.u(23), pg_temp.c('ACA'), pg_temp.at(15));
select residency.add_verified_resident_at(pg_temp.u(24), pg_temp.c('ACA'), pg_temp.at(15));
select is(jsonb_array_length(admin.verification_spikes(pg_temp.d(14), pg_temp.d(14))), 1, '3 new verifications with no usual level is a spike');
select is(admin.verification_spikes(pg_temp.d(14), pg_temp.d(14)) -> 0 ->> 'code', 'ACA', 'the spike names the community');
select is(jsonb_array_length(admin.verification_spikes(pg_temp.d(15), pg_temp.d(15))), 0, 'fewer than 3 is never a spike');
insert into residency.verifications (user_id, community_id, verified_on, kind)
select pg_temp.u(25), pg_temp.c('ACA'), pg_temp.d(30) - n, 'first' from generate_series(1, 28) n;
insert into residency.verifications (user_id, community_id, verified_on, kind)
select pg_temp.u(26), pg_temp.c('ACA'), pg_temp.d(30), 'first' from generate_series(1, 3);
select is(jsonb_array_length(admin.verification_spikes(pg_temp.d(30), pg_temp.d(30))), 0, 'not a spike when it is under 3x the usual level');

-- Admin dashboard -------------------------------------------------------------------------------
select throws_ok($$ select admin.dashboard_at(pg_temp.u(1), 28, now()) $$, '42501', 'operators only', 'only operators see the dashboard');
insert into admin.operators (user_id, note) values (pg_temp.u(1), 'test');
select ok(admin.dashboard_at(pg_temp.u(1), 28, pg_temp.at(20)) ?& array['today', 'days', 'communities_7d', 'spikes', 'email_updates'],
          'operators get the dashboard');
select is(jsonb_array_length(admin.dashboard_at(pg_temp.u(1), 500, pg_temp.at(20)) -> 'days'), 120, 'at most 120 days');

-- Email updates (CASL) --------------------------------------------------------------------------
select is(identity.email_updates_of(pg_temp.u(5)), '{"on": false, "email": null}'::jsonb, 'off by default (never pre-checked)');
select throws_ok($$ select identity.set_email_updates_at(pg_temp.u(5), 'not-an-email', true, now()) $$, '22023', 'invalid email', 'needs a valid address');
select is(identity.set_email_updates_at(pg_temp.u(5), '  Me@Example.COM ', true, pg_temp.at(1)), '{"on": true, "email": "me@example.com"}'::jsonb,
          'opt in stores the address');
select is((select consent_version from identity.email_updates where user_id = pg_temp.u(5)), identity.email_consent_version(), 'records the wording version');
select is(identity.set_email_updates_at(pg_temp.u(5), null, false, pg_temp.at(2)), '{"on": false, "email": null}'::jsonb, 'withdraw turns it off');
select is((select (email, withdrawn_at) from identity.email_updates where user_id = pg_temp.u(5)), (null::text, pg_temp.at(2)),
          'withdrawal clears the address and keeps the time');

-- API surface -----------------------------------------------------------------------------------
select ok(not has_function_privilege('anon', 'public.analytics_visit(text)', 'execute'), 'signed-out visitors cannot write analytics');
select ok(not has_function_privilege('anon', 'public.admin_dashboard(integer)', 'execute'), 'anon cannot call the dashboard');

select * from finish();
rollback;
