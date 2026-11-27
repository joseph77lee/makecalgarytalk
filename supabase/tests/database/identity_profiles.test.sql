-- Module: identity — profiles: nickname rules, shirt range, changes-seen day, permissions.
begin;
select plan(45);

delete from identity.profiles;

insert into auth.users (id, email, is_anonymous) values
  ('00000000-0000-4000-8000-0000000000a1', null, true),
  ('00000000-0000-4000-8000-0000000000a2', 'g@test.local', false);

create function pg_temp.save(nick text, shirt integer default 1) returns jsonb language sql as $$
  select identity.save_profile_at('00000000-0000-4000-8000-0000000000a1', nick, shirt, '2026-12-01T18:00:00Z')
$$;
create function pg_temp.problem(nick text) returns text language sql as $$
  select coalesce(pg_temp.save(nick) ->> 'problem', 'ok')
$$;

-- Before the first-visit setup
select is(identity.profile_at('00000000-0000-4000-8000-0000000000a1', '2026-12-01T18:00:00Z') -> 'profile', 'null'::jsonb, 'no profile before setup');
select is((identity.profile_at('00000000-0000-4000-8000-0000000000a1', '2026-12-01T18:00:00Z') ->> 'is_anonymous')::boolean, true, 'anonymous account');
select is((identity.profile_at('00000000-0000-4000-8000-0000000000a2', '2026-12-01T18:00:00Z') ->> 'is_anonymous')::boolean, false, 'linked account');

-- Nickname rules
select is(pg_temp.problem('Snowy Moose 42'), 'ok', 'a suggested nickname is fine');
select is(pg_temp.save('  Snowy    Moose  ') -> 'profile' ->> 'nickname', 'Snowy Moose', 'spaces are trimmed and collapsed');
select is(pg_temp.problem('A'), 'length', 'too short (1)');
select is(pg_temp.problem('Jo'), 'ok', '2 characters');
select is(pg_temp.problem('Abcdefghijklmnop'), 'ok', '16 characters');
select is(pg_temp.problem('Abcdefghijklmnopq'), 'length', 'too long (17)');
select is(pg_temp.problem('   '), 'length', 'only spaces');
select is(pg_temp.problem('눈사람'), 'ok', 'letters in any language');
select is(pg_temp.problem('Ann_Lee.2'), 'ok', 'underscore, dot and digits');
select is(pg_temp.problem('Zoë O''Neil-B'), 'ok', 'accents, apostrophe and hyphen');
select is(pg_temp.problem('<script>'), 'characters', 'no markup characters');
select is(pg_temp.problem('...'), 'characters', 'at least one letter or digit');
select is(pg_temp.problem('Admin'), 'blocked', 'reserved words are blocked');
select is(pg_temp.problem('big SHIT'), 'blocked', 'blocked words in any case');
select is(pg_temp.problem('f.u.c.k.e.r'), 'blocked', 'longer blocked words even with symbols between letters');
select is(pg_temp.problem('Glasshouse'), 'ok', 'innocent names containing short blocked words are fine');

-- Shirt colour
select is(pg_temp.save('Snowy Moose', 8) ->> 'problem', 'shirt', 'shirt out of range');
select is(pg_temp.save('Snowy Moose', 7) -> 'profile' ->> 'shirt', '7', 'shirt saved and changeable');

-- Villager look (v1.52 §10.2)
create function pg_temp.look(l jsonb, nick text default 'Snowy Moose') returns jsonb language sql as $$
  select identity.save_profile_at('00000000-0000-4000-8000-0000000000a1', nick, 7, l, '2026-12-01T18:00:00Z')
$$;
create function pg_temp.lp(l jsonb) returns text language sql as $$ select coalesce(identity.look_problem(l), 'ok') $$;
select is(pg_temp.save('Snowy Moose') -> 'profile' -> 'look', 'null'::jsonb, 'profiles saved without a look have none (the client keeps the nickname look)');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'ok', 'the smallest values');
select is(pg_temp.lp('{"age": 2, "skin": 5, "hair": 6, "hair_colour": 9, "skirt": true, "beard": true, "glasses": true}'), 'ok', 'the largest values (an elder with a beard)');
select is(pg_temp.lp('{"age": 3, "skin": 0, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'age out of range');
select is(pg_temp.lp('{"age": 0, "skin": 6, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'skin out of range');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 7, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'hair style out of range');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 0, "hair_colour": 10, "skirt": false, "beard": false, "glasses": false}'), 'look', 'hair colour out of range');
select is(pg_temp.lp('{"age": 0, "skin": -1, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'no negative values');
select is(pg_temp.lp('{"age": 0, "skin": 1.5, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'whole numbers only');
select is(pg_temp.lp('{"age": "0", "skin": 0, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false}'), 'look', 'numbers, not text');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 0, "hair_colour": 0, "skirt": 1, "beard": false, "glasses": false}'), 'look', 'yes/no parts are booleans');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false}'), 'look', 'every part is needed');
select is(pg_temp.lp('{"age": 0, "skin": 0, "hair": 0, "hair_colour": 0, "skirt": false, "beard": false, "glasses": false, "hat": 1}'), 'look', 'no unknown parts');
select is(pg_temp.lp('[]'), 'look', 'an object');
select is(pg_temp.lp('{"age": 1, "skin": 2, "hair": 3, "hair_colour": 1, "skirt": false, "beard": true, "glasses": false}'), 'look', 'no beard for children');
select is(pg_temp.look('{"age": 1, "skin": 2, "hair": 3, "hair_colour": 1, "skirt": true, "beard": false, "glasses": true}') -> 'profile' -> 'look',
  '{"age": 1, "skin": 2, "hair": 3, "hair_colour": 1, "skirt": true, "beard": false, "glasses": true}'::jsonb, 'a look is saved');
select is(pg_temp.look('{"age": 9}') ->> 'problem', 'look', 'a bad look is refused');
select is(pg_temp.save('Maple Fox') -> 'profile' -> 'look' ->> 'age', '1', 'changing the nickname keeps the look');
select is(pg_temp.look(null, 'Maple Fox') -> 'profile' -> 'look' ->> 'skin', '2', 'saving without a look keeps it too');

-- Changes panel: once per account per Calgary day
select is((identity.mark_changes_seen_at('00000000-0000-4000-8000-0000000000a1', '2026-12-01T18:00:00Z') ->> 'changes_seen_today')::boolean, true, 'seen today');
select is((identity.profile_at('00000000-0000-4000-8000-0000000000a1', '2026-12-02T06:00:00Z') ->> 'changes_seen_today')::boolean, false, 'a new Calgary day shows it again');

-- Permissions
set local role anon;
select throws_ok($$select public.identity_get_profile()$$, '42501', null, 'visitors (anon) cannot call profile RPCs');
reset role;
set local role authenticated;
select throws_ok($$select * from identity.profiles$$, '42501', null, 'signed-in players cannot read the profiles table directly');
select throws_ok($$select identity.save_profile_at('00000000-0000-4000-8000-0000000000a2', 'Sneaky', 1, now())$$, '42501', null, 'nor call internal functions for someone else');
reset role;

select * from finish();
rollback;
