-- Module: posts — who can post, limits, filters (links, phone, address, blocked words), feed and
-- 3-day visibility, reports and hiding, thanks and the badge, newspaper wiring, permissions
-- (requirement.md v1.28 §14). Day N = 2026-12-01 + N.
begin;
select plan(64);

delete from posts.thanks;
delete from posts.reports;
delete from posts.report_blocks;
delete from posts.posts;
delete from news.editions;
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
select ('00000000-0000-4000-8000-0000000005' || lpad(n::text, 2, '0'))::uuid, 'p' || n || '@test.local'
from generate_series(1, 20) n;
insert into identity.profiles (user_id, nickname, shirt)
select ('00000000-0000-4000-8000-0000000005' || lpad(n::text, 2, '0'))::uuid, 'Poster ' || n, 1
from generate_series(1, 20) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000005' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
create function pg_temp.noon(n integer) returns timestamptz language sql as $$
  select ((date '2026-12-01' + n)::timestamp + interval '18 hours') at time zone 'UTC'
$$;
create function pg_temp.verify(who integer, code text, n integer) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(n))
$$;
create function pg_temp.post(who integer, body text, n integer, kind text default 'event') returns text language sql as $$
  select coalesce(posts.create_at(pg_temp.u(who), kind, body, pg_temp.noon(n)) ->> 'problem', 'ok')
$$;
create function pg_temp.problem(body text) returns text language sql as $$
  select coalesce(posts.body_problem(body), 'ok')
$$;
create function pg_temp.feed(code text, n integer, viewer integer default null) returns jsonb language sql as $$
  select posts.feed_at(pg_temp.c(code), pg_temp.noon(n), case when viewer is null then null else pg_temp.u(viewer) end)
$$;
create function pg_temp.post_id(body text) returns uuid language sql as $$ select id from posts.posts where posts.body = post_id.body $$;

-- Who can post ------------------------------------------------------------------------------
select is(posts.create_at(pg_temp.u(1), 'event', 'Skating on Saturday!', pg_temp.noon(0)) ->> 'problem', 'not_verified', 'only Verified Residents can post');
select pg_temp.verify(1, 'MAH', 0);
select is(pg_temp.post(1, 'Skating on Saturday!', 0), 'locked', 'not before the Welcome sign is built');
-- Build the Welcome sign (goal lowered to one action for the test); it shows the next day.
select gamecore.ensure_tree(pg_temp.c('MAH'), date '2026-12-01');
update gamecore.projects set required_actions = 1 where community_id = pg_temp.c('MAH') and building_key = 'welcome-sign';
insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
select gen_random_uuid(), pg_temp.u(1), pg_temp.c('MAH'), p.id, date '2026-12-01', 1
from gamecore.projects p where p.community_id = pg_temp.c('MAH') and p.building_key = 'welcome-sign';
select is(pg_temp.post(1, 'Skating on Saturday!', 1), 'ok', 'Welcome sign built: a Verified Resident can post');
select is(pg_temp.post(1, 'Another one', 1), 'daily_limit', 'one post per Calgary day');
select is(pg_temp.post(1, 'Hot chocolate at the rink', 2, 'deal'), 'ok', 'a new day allows a new post');
select posts.delete_at(pg_temp.u(1), pg_temp.post_id('Hot chocolate at the rink'));
select is(pg_temp.post(1, 'Reposting after delete', 2), 'daily_limit', 'deleting does not give the day''s post back');
select is(pg_temp.post(1, 'Bad kind', 3, 'ad'), 'kind', 'unknown kinds are refused');
select pg_temp.verify(2, 'AUB', 0);
select is(pg_temp.post(2, 'Hello Auburn Bay', 1), 'locked', 'each community needs its own Welcome sign');

-- Body rules --------------------------------------------------------------------------------
select is(pg_temp.problem(repeat('a', 300)), 'ok', '300 characters');
select is(pg_temp.problem(repeat('a', 301)), 'length', '301 characters are too many');
select is(pg_temp.problem(''), 'length', 'empty');
select is(posts.create_at(pg_temp.u(1), 'talk', '   ', pg_temp.noon(3)) ->> 'problem', 'length', 'only spaces');
select is(pg_temp.problem('See https://example.org for more'), 'link', 'no links (http)');
select is(pg_temp.problem('Visit www.example.com'), 'link', 'no links (www)');
select is(pg_temp.problem('Check mahoganydeals.ca today'), 'link', 'no links (bare domain)');
select is(pg_temp.problem('Call 403-555-1234 if found'), 'phone', 'no phone numbers (dashes)');
select is(pg_temp.problem('Text (587) 555 0199'), 'phone', 'no phone numbers (brackets)');
select is(pg_temp.problem('+1 403.555.1234'), 'phone', 'no phone numbers (+1, dots)');
select is(pg_temp.problem('Lost cat near 123 Main St'), 'address', 'no street addresses');
select is(pg_temp.problem('Garage sale at 45 Mahogany Bay SE'), 'address', 'no Calgary addresses with a quadrant');
select is(pg_temp.problem('Pickup at 7 Sunset Crescent'), 'address', 'street types spelled out');
select is(pg_temp.problem('Meet at 10 am at the rink, bring 2 sleds'), 'ok', 'times and counts are fine');
select is(pg_temp.problem('3 kids found a cat by the lake'), 'ok', 'numbers in sentences are fine');
select is(pg_temp.problem('The new therapist opens on Monday'), 'ok', 'ordinary words containing blocked ones are fine');
select is(pg_temp.problem('Official opening of the rink'), 'ok', 'reserved nickname words are fine in posts');
select is(pg_temp.problem('this is bullshit'), 'blocked', 'blocked words');
select is(pg_temp.problem('f.u.c.k this'), 'blocked', 'blocked words with symbols inside');
select is(pg_temp.post(1, '  Lost: blue   mitten  ', 3, 'lost_found'), 'ok', 'spaces are tidied');
select is((select body from posts.posts where author_id = pg_temp.u(1) and posted_on = date '2026-12-04'), 'Lost: blue mitten', 'stored tidied');

-- Feed and visibility -------------------------------------------------------------------------
select is(jsonb_path_query_array(pg_temp.feed('MAH', 3), '$[*].body'), '["Lost: blue mitten", "Skating on Saturday!"]'::jsonb,
  'newest first; deleted posts are not shown');
select is(pg_temp.feed('MAH', 3) -> 1 ->> 'days_ago', '2', 'day-level age');
select is((select array_agg(k order by k) from jsonb_object_keys(pg_temp.feed('MAH', 3) -> 0) k),
  array['body', 'days_ago', 'id', 'kind', 'mine', 'nickname', 'reported', 'thanked', 'thanks'], 'no times or user ids in the feed');
select is(pg_temp.feed('MAH', 3, 1) -> 0 ->> 'mine', 'true', 'my own post is marked');
select is(jsonb_path_query_array(pg_temp.feed('MAH', 4), '$[*].body'), '["Lost: blue mitten"]'::jsonb, 'visible for 3 Calgary days (day 1 post gone on day 4)');
select is(pg_temp.feed('MAH', 6), '[]'::jsonb, 'and the day 3 post is gone on day 6');

-- Reports -------------------------------------------------------------------------------------
select pg_temp.verify(3, 'MAH', 0);
select is(posts.report_at(pg_temp.u(1), pg_temp.post_id('Lost: blue mitten'), pg_temp.noon(3)) ->> 'problem', 'own', 'nobody reports their own post');
select is(posts.report_at(pg_temp.u(3), pg_temp.post_id('Lost: blue mitten'), pg_temp.noon(3)) ->> 'ok', 'true', 'a Verified Resident reports (2 points)');
select is(posts.report_at(pg_temp.u(3), pg_temp.post_id('Lost: blue mitten'), pg_temp.noon(3)) ->> 'ok', 'true', 'reporting again changes nothing');
select is(posts.points(pg_temp.post_id('Lost: blue mitten')), 2, 'still 2 points');
select is(pg_temp.feed('MAH', 3, 3) -> 0 ->> 'reported', 'true', 'the reporter sees it marked');
insert into posts.report_blocks (user_id) values (pg_temp.u(4));
select is(posts.report_at(pg_temp.u(4), pg_temp.post_id('Lost: blue mitten'), pg_temp.noon(3)) ->> 'problem', 'blocked', 'blocked reporters cannot report');
select posts.report_at(pg_temp.u(5), pg_temp.post_id('Lost: blue mitten'), pg_temp.noon(3));
select is(jsonb_path_query_array(pg_temp.feed('MAH', 3), '$[*].body'), '["Skating on Saturday!"]'::jsonb, '3 points (2 + 1 from a player not verified) hide the post');
update posts.posts set restored = true where body = 'Lost: blue mitten';
select is(jsonb_path_query_array(pg_temp.feed('MAH', 3), '$[*].body'), '["Lost: blue mitten", "Skating on Saturday!"]'::jsonb,
  'a post the operator restored stays visible whatever the reports say');
-- At most 3 reports per player per Calgary day
select pg_temp.verify(n, 'MAH', 0) from generate_series(9, 12) n;
select 'post: ' || pg_temp.post(n, 'Safety: lock your cars tonight ' || n, 3, 'safety') from generate_series(9, 12) n;
select posts.report_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight ' || n), pg_temp.noon(3)) from generate_series(9, 11) n;
select is(posts.report_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight 12'), pg_temp.noon(3)) ->> 'problem', 'limit', 'the 4th report of the day is refused');
select is(posts.report_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight 9'), pg_temp.noon(3)) ->> 'ok', 'true', 'repeating an earlier report is not counted again');
select posts.unreport_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight 11'));
select is(posts.report_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight 12'), pg_temp.noon(3)) ->> 'ok', 'true', 'taking a report back frees that day''s slot');
select is(posts.points(pg_temp.post_id('Safety: lock your cars tonight 11')), 0, 'and removes its points');
select is(posts.unreport_at(pg_temp.u(8), pg_temp.post_id('Safety: lock your cars tonight 11')) ->> 'ok', 'false', 'nothing to take back twice');
-- Thanks and reports exclude each other
select posts.thank_at(pg_temp.u(13), pg_temp.post_id('Safety: lock your cars tonight 10'), pg_temp.noon(4));
select posts.report_at(pg_temp.u(13), pg_temp.post_id('Safety: lock your cars tonight 10'), pg_temp.noon(4));
select is((select count(*)::int from posts.thanks where user_id = pg_temp.u(13)), 0, 'reporting takes back my thanks');
select is(posts.thank_at(pg_temp.u(13), pg_temp.post_id('Safety: lock your cars tonight 10'), pg_temp.noon(4)) ->> 'problem', 'reported', 'no thanks while I have reported it');
select posts.unreport_at(pg_temp.u(13), pg_temp.post_id('Safety: lock your cars tonight 10'));
select is(posts.thank_at(pg_temp.u(13), pg_temp.post_id('Safety: lock your cars tonight 10'), pg_temp.noon(4)) ->> 'ok', 'true', 'after Undo I can thank again');
update posts.posts set hidden = true where body = 'Skating on Saturday!' or body like 'Safety:%' or body = 'Lost: blue mitten';
select is(pg_temp.feed('MAH', 3), '[]'::jsonb, 'the operator can hide any post');

-- Thanks and the badge --------------------------------------------------------------------------
select pg_temp.verify(6, 'MAH', 0);
select is(pg_temp.post(6, 'Choir practice tonight', 5), 'ok', 'another resident posts');
select is(posts.thank_at(pg_temp.u(6), pg_temp.post_id('Choir practice tonight'), pg_temp.noon(5)) ->> 'problem', 'own', 'no thanks for my own post');
select posts.thank_at(pg_temp.u(n), pg_temp.post_id('Choir practice tonight'), pg_temp.noon(5)) from generate_series(7, 15) n;
select posts.thank_at(pg_temp.u(7), pg_temp.post_id('Choir practice tonight'), pg_temp.noon(5));
select is(pg_temp.feed('MAH', 5) -> 0 ->> 'thanks', '9', 'thanks count once per player');
select is((select count(*)::int from jsonb_array_elements(invites.badges_at(pg_temp.u(6))) b where b ->> 'key' = 'community_reporter'), 0, '9 thanks: no badge yet');
select posts.thank_at(pg_temp.u(16), pg_temp.post_id('Choir practice tonight'), pg_temp.noon(5));
select is((select count(*)::int from jsonb_array_elements(invites.badges_at(pg_temp.u(6))) b where b ->> 'key' = 'community_reporter'), 1, '10 thanks: Community Reporter');

-- Newspaper ---------------------------------------------------------------------------------------
select is(jsonb_array_length(news.newspaper_at(pg_temp.c('MAH'), pg_temp.noon(5), null) -> 'posts'), 1, 'the newspaper carries the posts');
select is(news.newspaper_at(pg_temp.c('MAH'), pg_temp.noon(5), pg_temp.u(6)) -> 'can_post', '{"allowed": false, "reason": "daily_limit"}'::jsonb, 'whether I can post (already did today)');
select is(news.newspaper_at(pg_temp.c('MAH'), pg_temp.noon(6), pg_temp.u(2)) -> 'can_post' ->> 'reason', 'other_community', 'residents of other communities cannot post here');
select is(news.newspaper_at(pg_temp.c('MAH'), pg_temp.noon(6), pg_temp.u(20)) -> 'can_post' ->> 'reason', 'not_verified', 'players still verifying are told why');

-- Permissions ---------------------------------------------------------------------------------------
set local role anon;
select throws_ok($$ select public.posts_create('event', 'x') $$, '42501', null, 'visitors cannot post');
reset role;
set local role authenticated;
select throws_ok($$ select * from posts.posts $$, '42501', null, 'signed-in players cannot read the tables');
select throws_ok($$ select public.posts_create('event', 'x') $$, '28000', 'not authenticated', 'a role without a user id is rejected');
reset role;

select * from finish();
rollback;
