-- Module: invites — codes, accepting, Good Neighbour / Pioneer Sponsor / Founding Resident badges,
-- farming guards and permissions (requirement.md v1.25 §7.1, §12.3).
-- Day N = date '2026-12-01' + N; its noon is 18:00Z.
begin;
select plan(40);

delete from invites.acceptances;
delete from invites.codes;
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000002' || lpad(n::text, 2, '0'))::uuid, 'i' || n || '@test.local'
from generate_series(1, 12) n;
insert into identity.profiles (user_id, nickname, shirt)
select ('00000000-0000-4000-8000-0000000002' || lpad(n::text, 2, '0'))::uuid, 'Neighbour ' || n, 1
from generate_series(1, 12) n;
update identity.profiles set nickname = 'Snowy Moose' where user_id = '00000000-0000-4000-8000-000000000201';

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000002' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select ((date '2026-12-01' + n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.verify(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(n))
$$;
create function pg_temp.code(who integer) returns text language sql as $$ select invites.code_for(pg_temp.u(who)) $$;
create function pg_temp.accept(who integer, code text, n integer) returns text language sql as $$
  select coalesce(invites.accept_at(pg_temp.u(who), code, pg_temp.noon(n)) ->> 'problem', 'ok')
$$;
create function pg_temp.mine(who integer) returns jsonb language sql as $$ select invites.mine_at(pg_temp.u(who), pg_temp.noon(50)) $$;
create function pg_temp.badge(who integer, key text) returns jsonb language sql as $$
  select b from jsonb_array_elements(pg_temp.mine(who) -> 'badges') b where b ->> 'key' = key
$$;

-- Codes ------------------------------------------------------------------------------------
select matches(pg_temp.code(1), '^[A-HJ-NP-Z2-9]{8}$', 'an 8-character code without look-alike characters');
select is(pg_temp.code(1), pg_temp.code(1), 'one code per account');
select isnt(pg_temp.code(1), pg_temp.code(2), 'different accounts get different codes');
select is(invites.owner_of(lower(substr(pg_temp.code(1), 1, 4)) || '-' || lower(substr(pg_temp.code(1), 5))), pg_temp.u(1),
  'codes are found regardless of case and separators');

-- Invite link landing: nickname and community only
select pg_temp.verify(1, 'MAH', 0);
select is(invites.lookup_at(pg_temp.code(1), pg_temp.noon(1)), '{"nickname": "Snowy Moose", "community": "Mahogany"}'::jsonb,
  'the link shows the inviter''s nickname and community');
select is(invites.lookup_at(pg_temp.code(3), pg_temp.noon(1)) ->> 'community', null, 'an inviter without a community yet: nickname only');
select is(invites.lookup_at('ZZZZZZZZ', pg_temp.noon(1)), null, 'unknown code');

-- Accepting ----------------------------------------------------------------------------------
select is(pg_temp.accept(2, 'NOPE2345', 1), 'unknown', 'unknown code is refused');
select is(pg_temp.accept(1, pg_temp.code(1), 1), 'self', 'nobody can invite themselves');
select is(pg_temp.accept(2, pg_temp.code(1), 1), 'ok', 'accepted');
select is(pg_temp.accept(2, pg_temp.code(1), 2), 'ok', 'accepting the same invite again is fine');
select is(pg_temp.accept(2, pg_temp.code(3), 2), 'already', 'but nobody else can claim them later');
select is((select count(*)::int from invites.acceptances where invitee_id = pg_temp.u(2)), 1, 'one acceptance per account');
select pg_temp.verify(4, 'MAH', 1);
select is(pg_temp.accept(4, pg_temp.code(1), 2), 'too_late', 'an existing resident cannot accept an invite afterwards');
select throws_ok($$ update invites.acceptances set inviter_id = invitee_id $$, '42501', null, 'acceptances are append-only');

-- Good Neighbour: first verification in the inviter's community ----------------------------
select is(invites.rewarded(pg_temp.u(2)), false, 'no reward before the invitee is verified');
select pg_temp.verify(2, 'MAH', 3);
select is(invites.rewarded(pg_temp.u(2)), true, 'invitee verified in the inviter''s community: rewarded');
select is(pg_temp.badge(1, 'good_neighbour') ->> 'count', '1', 'the inviter gets Good Neighbour');
select is(pg_temp.badge(2, 'good_neighbour') ->> 'count', '1', 'and so does the invitee');
select is((pg_temp.mine(1) ->> 'invited')::int, 1, 'invited count');
select is((pg_temp.mine(1) ->> 'joined')::int, 1, 'became neighbours count');
select is(pg_temp.mine(2) ->> 'invited_by', 'Snowy Moose', 'who invited me');

select 'accept: ' || pg_temp.accept(5, pg_temp.code(1), 1);
select pg_temp.verify(5, 'BLN', 3);
select is(invites.rewarded(pg_temp.u(5)), false, 'invitee verified in another community: no reward');
select 'accept: ' || pg_temp.accept(8, pg_temp.code(1), 1);
select pg_temp.verify(8, 'MAH', 4);
select is(pg_temp.badge(1, 'good_neighbour') ->> 'count', '2', 'Good Neighbour counts ×N');
select is((pg_temp.mine(1) ->> 'invited')::int, 3, 'three accepted');
select is((pg_temp.mine(1) ->> 'joined')::int, 2, 'two became neighbours');

-- Moves never remove or create rewards
select pg_temp.verify(2, 'BLN', 120);
select is(invites.rewarded(pg_temp.u(2)), true, 'the invitee moving away keeps the reward');
select pg_temp.verify(5, 'MAH', 120);
select is(invites.rewarded(pg_temp.u(5)), false, 'moving into the inviter''s community later creates no reward');
select pg_temp.verify(1, 'BLN', 130);
select is(invites.rewarded(pg_temp.u(8)), true, 'the inviter moving away keeps it too');

-- The inviter must be a resident there on that day
select 'accept: ' || pg_temp.accept(6, pg_temp.code(3), 1);
select pg_temp.verify(6, 'MAH', 5);
select is(invites.rewarded(pg_temp.u(6)), false, 'an inviter with no community gets no Good Neighbour');

-- Pioneer Sponsor and Founding Resident ------------------------------------------------------
select 'accept: ' || pg_temp.accept(7, pg_temp.code(3), 1);
select pg_temp.verify(7, 'ACA', 6);
select is(pg_temp.badge(3, 'pioneer_sponsor') ->> 'count', '1', 'inviting the first resident of an empty community: Pioneer Sponsor');
select is(pg_temp.badge(7, 'founding_resident') ->> 'community', 'Acadia', 'the first resident is the Founding Resident');
select is(pg_temp.badge(6, 'pioneer_sponsor'), null, 'joining a settled community is not pioneering');
select is(pg_temp.badge(1, 'founding_resident') ->> 'community', 'Mahogany', 'Founding Resident of Mahogany (first verified there)');
select is((select count(*)::int from jsonb_array_elements(pg_temp.mine(1) -> 'badges') b where b ->> 'key' = 'founding_resident'), 1,
  'founding is kept after moving, and moving into an already settled community founds nothing');
select is(pg_temp.badge(2, 'founding_resident'), null, 'later residents are not founders');
-- Same day: the earlier verification wins
select pg_temp.verify(9, 'DNC', 10);
select pg_temp.verify(10, 'DNC', 10);
select ok(pg_temp.badge(9, 'founding_resident') is not null and pg_temp.badge(10, 'founding_resident') is null,
  'same day: the one verified first founds the community');

-- Permissions --------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select public.invites_get_mine() $$, '42501', null, 'visitors cannot read invite data');
select is(public.invites_lookup('ZZZZZZZZ'), null, 'visitors can look up an invite link (before signing in)');
reset role;
set local role authenticated;
select throws_ok($$ select * from invites.acceptances $$, '42501', null, 'signed-in players cannot read invite tables');
reset role;

select * from finish();
rollback;
