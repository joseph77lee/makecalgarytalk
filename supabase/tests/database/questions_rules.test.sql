-- Module: questions — data rules, picking (season, weekday/weekend, 60 days, yesterday's category,
-- short pools), who answers, one final answer per Calgary day, counts without names, newspaper
-- result, active days, permissions (requirement.md v1.49 §14, §14.1).
begin;
select plan(48);

delete from questions.answers;
delete from questions.days;
delete from gamecore.actions;
delete from gamecore.projects;
delete from gamecore.community_snapshots;
delete from residency.verifications;
delete from residency.moves;
delete from residency.check_ins;
delete from residency.check_days;

insert into auth.users (id, email)
select ('00000000-0000-4000-8000-0000000007' || lpad(n::text, 2, '0'))::uuid, 'q' || n || '@test.local'
from generate_series(1, 12) n;

create function pg_temp.u(n integer) returns uuid language sql as $$
  select ('00000000-0000-4000-8000-0000000007' || lpad(n::text, 2, '0'))::uuid
$$;
create function pg_temp.c(code text) returns uuid language sql as $$ select gamecore.community_id_by_code('calgary', code) $$;
-- A Calgary day's noon, and the last minute before / first minute after its midnight.
create function pg_temp.noon(d date) returns timestamptz language sql as $$ select common.calgary_day_start(d) + interval '12 hours' $$;
create function pg_temp.verify(who integer, code text, d date) returns void language sql as $$
  select residency.add_verified_resident_at(pg_temp.u(who), pg_temp.c(code), pg_temp.noon(d))
$$;
create function pg_temp.answer(who integer, choice integer, at timestamptz) returns text language sql as $$
  select coalesce(questions.answer_at(pg_temp.u(who), choice, at) ->> 'problem', 'ok')
$$;
create function pg_temp.today(code text, at timestamptz, who integer default null) returns jsonb language sql as $$
  select questions.today_at(pg_temp.c(code), at, case when who is null then null else pg_temp.u(who) end)
$$;

-- Data (writing rules) ------------------------------------------------------------------------
select ok((select count(*) from questions.questions) >= 150, 'the question file is seeded');
select is_empty($$ select id from questions.questions where jsonb_array_length(choices) not between 2 and 4 $$, '2–4 choices');
select is_empty($$
  select q.id from questions.questions q, jsonb_array_elements(q.choices) c
  where coalesce(c ->> 'emoji', '') = '' or coalesce(c ->> 'text', '') = '' or char_length(c ->> 'text') > 32
$$, 'every choice has an emoji and a text of at most 32 characters');
select is_empty($$
  select q.id from questions.questions q
  where (select count(distinct c ->> 'emoji') from jsonb_array_elements(q.choices) c) <> jsonb_array_length(q.choices)
$$, 'every emoji differs within a question');
select is_empty($$
  select q.id from questions.questions q, jsonb_array_elements(q.choices) c where c ->> 'emoji' ~ '[\U0001F1E6-\U0001F1FF]'
$$, 'no flag emoji');
select is_empty($$ select id from questions.questions where situation is not null and situation not in ('weekday', 'weekend') $$,
  'only known situations in the file');
select is((select array_agg(distinct season order by season) from questions.questions),
  array['fall', 'spring', 'summer', 'winter', 'year-round'], 'every season has questions');

-- Seasons and days ------------------------------------------------------------------------------
select is(array[questions.season_of('2027-03-31'), questions.season_of('2027-04-01')], array['winter', 'spring'], 'Mar 31 winter, Apr 1 spring');
select is(array[questions.season_of('2027-05-31'), questions.season_of('2027-06-01')], array['spring', 'summer'], 'May 31 spring, Jun 1 summer');
select is(array[questions.season_of('2027-08-31'), questions.season_of('2027-09-01')], array['summer', 'fall'], 'Aug 31 summer, Sep 1 fall');
select is(array[questions.season_of('2026-10-31'), questions.season_of('2026-11-01')], array['fall', 'winter'], 'Oct 31 fall, Nov 1 winter');
select is(array[questions.situation_of('2026-12-04'), questions.situation_of('2026-12-05'), questions.situation_of('2026-12-06'), questions.situation_of('2026-12-07')],
  array['weekday', 'weekend', 'weekend', 'weekday'], 'Friday weekday, Saturday and Sunday weekend, Monday weekday');

-- A year of picks (the first read of each day stores it)
select questions.question_on(d::date) from generate_series(date '2026-12-01', date '2027-11-30', interval '1 day') d;
create temp table picked as
  select d.calgary_day, q.* from questions.days d join questions.questions q on q.id = d.question_id;
select is((select count(*)::int from picked), 365, 'one question for every day');
select is_empty($$ select calgary_day from picked where season not in (questions.season_of(calgary_day), 'year-round') $$,
  'every pick fits its season (including the edge days)');
select is_empty($$ select calgary_day from picked where situation is not null and situation <> questions.situation_of(calgary_day) $$,
  'weekday questions only on weekdays, weekend questions only on weekends');
select is_empty($$ select a.calgary_day from picked a join picked b on b.id = a.id and b.calgary_day < a.calgary_day and b.calgary_day > a.calgary_day - 60 $$,
  'no question again within 60 days');
select is_empty($$ select a.calgary_day from picked a join picked b on b.calgary_day = a.calgary_day - 1 and b.category = a.category $$,
  'never yesterday''s category');
select is((questions.question_on('2027-01-15')).id, (select id from picked where calgary_day = '2027-01-15'), 'a stored pick never changes');

-- Short pools: the 60-day rule gives way first, yesterday's category last
create temp table kept as select * from questions.questions;
delete from questions.days;
delete from questions.questions where id not in ('Q004', 'Q005', 'Q006');
update questions.questions set season = 'year-round', situation = null, category = case id when 'Q006' then 'weather' else 'food' end;
select questions.question_on(d::date) from generate_series(date '2026-12-01', date '2026-12-10', interval '1 day') d;
select ok((select bool_and(q.category <> y.category)
           from questions.days d join questions.questions q on q.id = d.question_id
           join questions.days dy on dy.calgary_day = d.calgary_day - 1 join questions.questions y on y.id = dy.question_id),
  'a short pool never repeats yesterday''s category while another is left');
select is((select count(*)::int from questions.days), 10, 'a short pool still has a question every day');
delete from questions.days;
delete from questions.questions where id = 'Q006';
select questions.question_on(d::date) from generate_series(date '2026-12-01', date '2026-12-04', interval '1 day') d;
select is((select array_agg(question_id order by calgary_day) from questions.days) is not null
          and (select count(distinct question_id)::int from questions.days) = 2
          and (select bool_and(d.question_id <> y.question_id) from questions.days d join questions.days y on y.calgary_day = d.calgary_day - 1),
  true, 'one category left: it is used anyway, the least recently shown question first');
-- put the real questions back
delete from questions.days;
delete from questions.questions;
insert into questions.questions select * from kept;

-- Who answers ------------------------------------------------------------------------------------
-- 1, 2: Mahogany residents; 3: Auburn Bay resident; 4: verifying in Mahogany; 5: no community.
select pg_temp.verify(1, 'MAH', '2026-11-20');
select pg_temp.verify(2, 'MAH', '2026-11-20');
select pg_temp.verify(3, 'AUB', '2026-11-20');
insert into residency.check_ins (user_id, community_id, calgary_day) values (pg_temp.u(4), pg_temp.c('MAH'), '2026-12-02');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02')) -> 'question' ->> 'id', pg_temp.today('AUB', pg_temp.noon('2026-12-02')) -> 'question' ->> 'id',
  'the same question in every community');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 1) - 'question' - 'calgary_day',
  '{"can_answer": true, "reason": null, "answered": null, "counts": null}'::jsonb, 'a resident can answer; no counts before answering');
select is(pg_temp.answer(1, 2, pg_temp.noon('2026-12-02')), 'ok', 'a Verified Resident answers');
select is(pg_temp.answer(4, 2, pg_temp.noon('2026-12-02')), 'ok', 'a player still verifying answers too');
select is(pg_temp.answer(5, 1, pg_temp.noon('2026-12-02')), 'not_resident', 'a player with no community cannot answer');
select is(pg_temp.answer(2, 9, pg_temp.noon('2026-12-02')), 'choice', 'only one of the choices');
select is(pg_temp.answer(1, 2, pg_temp.noon('2026-12-02')), 'ok', 'the same answer again is fine (idempotent)');
select is(pg_temp.answer(1, 1, pg_temp.noon('2026-12-02')), 'answered', 'answers are final');
select is((select count(*)::int from questions.answers where user_id = pg_temp.u(1)), 1, 'one answer row per player per day');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 3) - 'question' - 'calgary_day' - 'counts',
  '{"can_answer": false, "reason": "other_community", "answered": null}'::jsonb, 'residents of another community cannot answer here');
select is(questions.answer_at(pg_temp.u(3), 1, pg_temp.noon('2026-12-02')) ->> 'ok', 'true', 'their answer goes to their own community');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 1) -> 'counts' -> 'total', '2'::jsonb,
  'counts are per community (the Auburn Bay answer is not in Mahogany''s)');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 3) ->> 'reason', 'answered', 'an Auburn Bay resident who answered sees Mahogany''s counts read-only');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 5) ->> 'reason', 'not_resident', 'players without a community read only');
select is(pg_temp.today('MAH', pg_temp.noon('2026-12-02')) ->> 'reason', 'not_signed_in', 'visitors read the question and today''s counts');
select ok(pg_temp.today('MAH', pg_temp.noon('2026-12-02')) :: text !~ '[0-9a-f]{8}-[0-9a-f]{4}-' and
          (select array_agg(k order by k) from jsonb_object_keys(pg_temp.today('MAH', pg_temp.noon('2026-12-02'), 1) -> 'counts') k) = array['choices', 'total'],
  'counts only: no user ids, nobody''s choice');

-- Calgary day boundary: 23:59 belongs to the day, 00:00 starts the next question and answer.
select is(pg_temp.answer(2, 1, common.calgary_day_start('2026-12-03') - interval '1 minute'), 'ok', 'answering at 23:59 counts for that day');
select is(pg_temp.answer(2, 1, common.calgary_day_start('2026-12-03')), 'ok', 'at Calgary midnight a new day''s answer is open');
select isnt(pg_temp.today('MAH', common.calgary_day_start('2026-12-03')) -> 'question' ->> 'id',
  pg_temp.today('MAH', common.calgary_day_start('2026-12-03') - interval '1 minute') -> 'question' ->> 'id', 'and a new question');

-- Yesterday's result for the newspaper; answering is not an active day
select is(questions.yesterday_at(pg_temp.c('MAH'), pg_temp.noon('2026-12-03')) -> 'counts' -> 'total', '3'::jsonb, 'yesterday''s result: how many neighbours answered');
select is(jsonb_path_query_array(questions.yesterday_at(pg_temp.c('MAH'), pg_temp.noon('2026-12-03')), '$.counts.choices[0 to 1]'), '[1, 2]'::jsonb, 'and how many chose each');
select is(questions.yesterday_at(pg_temp.c('ACA'), pg_temp.noon('2026-12-03')), null, 'no result where nobody answered');
select is(gamecore.active_days(pg_temp.u(1), '2026-12-03'), 0, 'a question-only day is not an active day');

-- Permissions ------------------------------------------------------------------------------------
select throws_ok($$ update questions.answers set choice = 1 $$, '42501', null, 'answers are append-only');
create temp table mah as select pg_temp.c('MAH') as id;
grant select on mah to anon;
set local role anon;
select ok(public.questions_today((select id from mah)) ? 'question', 'visitors can read today''s question');
select throws_ok($$ select public.questions_answer(1) $$, '42501', null, 'visitors cannot answer');
select throws_ok($$ select * from questions.answers $$, '42501', null, 'nobody reads the answers table');
reset role;

select * from finish();
rollback;
