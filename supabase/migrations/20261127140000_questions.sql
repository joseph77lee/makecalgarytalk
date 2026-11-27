-- Module: questions — today's question for the whole city (requirement.md v1.49 §14.1, §14 step 1).
--
--   * Questions are data (supabase/data/daily_questions.csv, seeded by daily_questions_seed.py).
--   * One question per Calgary day for the whole city. It is picked the first time anyone reads it
--     that day and stored (questions.days), so every community gets the same question and the pick
--     never changes. The pick depends only on the day and the earlier picks: from the season's
--     questions (winter Nov–Mar, spring Apr–May, summer Jun–Aug, fall Sep–Oct) plus year-round
--     ones, weekday/weekend questions only on those days (other situations are stored but not
--     used yet), leaving out questions shown in the last 60 days and yesterday's category; then
--     the first by a hash of the day. A short pool relaxes the 60-day rule first (least recently
--     shown), never yesterday's category unless nothing else is left.
--   * Residents of the community they play in (verified or verifying, residency.play_on) answer
--     once per Calgary day; final; idempotent. Answers are append-only rows; counts are computed
--     on read. No one can see who chose what (no user ids leave the module).
--   * Answering is not a daily action, so it never adds an active day (gamecore.active_days).
--   * Reads other modules only through functions: common.calgary_day, residency.play_on,
--     gamecore.community_state_at (community name).

create schema questions;
revoke all on schema questions from public, anon, authenticated;

create table questions.questions (
  id text primary key check (id ~ '^Q[0-9]{3,}$'),
  category text not null check (category in ('weather', 'neighbourhood', 'food', 'pride', 'sports', 'daily', 'events')),
  season text not null check (season in ('winter', 'spring', 'summer', 'fall', 'year-round')),
  -- weekday | weekend are used; other situations (game days, Stampede week) are stored for later.
  situation text check (situation is null or situation ~ '^[a-z_-]+$'),
  question text not null check (char_length(question) between 5 and 160),
  -- [{emoji, text}], 2–4 choices
  choices jsonb not null check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) between 2 and 4)
);
alter table questions.questions enable row level security;

-- The question of each Calgary day, written once (the first read of the day).
create table questions.days (
  calgary_day date primary key,
  question_id text not null references questions.questions (id)
);
alter table questions.days enable row level security;

-- Append-only answers: one per player per Calgary day.
create table questions.answers (
  user_id uuid not null references auth.users (id) on delete cascade,
  calgary_day date not null,
  community_id uuid not null references gamecore.communities (id),
  choice smallint not null check (choice between 1 and 4),
  created_at timestamptz not null default now(),
  primary key (user_id, calgary_day)
);
alter table questions.answers enable row level security;
create index answers_community_day_idx on questions.answers (community_id, calgary_day);

create function questions.answers_append_only()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'questions.answers is append-only' using errcode = '42501';
end;
$$;
create trigger answers_append_only before update on questions.answers
for each row execute function questions.answers_append_only();

revoke all on all tables in schema questions from public, anon, authenticated;

-- Rules -------------------------------------------------------------------------------------

create function questions.no_repeat_days() returns integer language sql immutable as $$ select 60 $$;

create function questions.season_of(p_day date)
returns text
language sql immutable set search_path = ''
as $$
  select case
    when extract(month from p_day) in (11, 12, 1, 2, 3) then 'winter'
    when extract(month from p_day) in (4, 5) then 'spring'
    when extract(month from p_day) in (6, 7, 8) then 'summer'
    else 'fall'
  end
$$;

create function questions.situation_of(p_day date)
returns text
language sql immutable set search_path = ''
as $$
  select case when extract(isodow from p_day) in (6, 7) then 'weekend' else 'weekday' end
$$;

-- The question for a day, given the picks stored before it (does not write).
create function questions.pick(p_day date)
returns text
language sql stable set search_path = ''
as $$
  with fits as (
    select q.id, q.category,
           (select max(d.calgary_day) from questions.days d
             where d.question_id = q.id and d.calgary_day < p_day) as last_shown
    from questions.questions q
    where q.season in (questions.season_of(p_day), 'year-round')
      and (q.situation is null or q.situation = questions.situation_of(p_day))
  ),
  yesterday as (
    select q.category from questions.days d join questions.questions q on q.id = d.question_id
    where d.calgary_day = p_day - 1
  )
  select f.id from fits f
  order by
    -- never yesterday's category, unless nothing else is left
    (f.category = (select category from yesterday)) is true,
    -- not shown in the last 60 days; in a short pool, the least recently shown first
    (f.last_shown is not null and f.last_shown > p_day - questions.no_repeat_days()),
    case when f.last_shown > p_day - questions.no_repeat_days() then f.last_shown end nulls first,
    md5(p_day::text || ':' || f.id)
  limit 1
$$;

-- The day's question row, picking and storing it on the first read of the day.
create function questions.question_on(p_day date)
returns questions.questions
language plpgsql set search_path = ''
as $$
declare
  v_id text;
  v_row questions.questions;
begin
  select d.question_id into v_id from questions.days d where d.calgary_day = p_day;
  if v_id is null then
    v_id := questions.pick(p_day);
    if v_id is null then
      return null;  -- no questions seeded
    end if;
    insert into questions.days (calgary_day, question_id) values (p_day, v_id) on conflict do nothing;
    select d.question_id into v_id from questions.days d where d.calgary_day = p_day;
  end if;
  select * into v_row from questions.questions q where q.id = v_id;
  return v_row;
end;
$$;

-- A stored day's question (never picks), or null.
create function questions.stored_on(p_day date)
returns questions.questions
language sql stable set search_path = ''
as $$
  select q.* from questions.days d join questions.questions q on q.id = d.question_id where d.calgary_day = p_day
$$;

-- Answer counts of a community on a day: {total, choices: [n per choice]}.
create function questions.counts(p_community_id uuid, p_day date, p_choices integer)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from questions.answers a where a.community_id = p_community_id and a.calgary_day = p_day),
    'choices', (select jsonb_agg((select count(*) from questions.answers a
                                   where a.community_id = p_community_id and a.calgary_day = p_day and a.choice = n) order by n)
                from generate_series(1, p_choices) n))
$$;

create function questions.question_json(p_q questions.questions)
returns jsonb
language sql immutable set search_path = ''
as $$
  select jsonb_build_object('id', p_q.id, 'category', p_q.category, 'text', p_q.question, 'choices', p_q.choices)
$$;

-- Today's question as a viewer of a community sees it.
-- {calgary_day, question, can_answer, reason?, answered, counts?}
--   reason: not_signed_in | not_resident | other_community | answered
--   counts: shown after answering, and to those who cannot answer (visitors); not before answering.
create function questions.today_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_q questions.questions := questions.question_on(v_day);
  v_play uuid;
  v_answer smallint;
  v_reason text;
begin
  if v_q.id is null then
    return null;
  end if;
  if p_uid is not null then
    select p.community_id into v_play from residency.play_on(p_uid, v_day) p;
    select a.choice into v_answer from questions.answers a where a.user_id = p_uid and a.calgary_day = v_day;
  end if;
  v_reason := case
    when p_uid is null then 'not_signed_in'
    when v_answer is not null then 'answered'
    when v_play is null then 'not_resident'
    when v_play <> p_community_id then 'other_community'
  end;
  return jsonb_build_object(
    'calgary_day', v_day,
    'question', questions.question_json(v_q),
    'can_answer', v_reason is null,
    'reason', v_reason,
    'answered', v_answer,
    'counts', case when v_reason is null then null
                   else questions.counts(p_community_id, v_day, jsonb_array_length(v_q.choices)) end
  );
end;
$$;

-- Yesterday's result of a community for the newspaper (§11), or null when nobody answered.
-- {question, choices, counts: {total, choices}}
create function questions.yesterday_at(p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now) - 1;
  v_q questions.questions := questions.stored_on(v_day);
  v_counts jsonb;
begin
  if v_q.id is null then
    return null;
  end if;
  v_counts := questions.counts(p_community_id, v_day, jsonb_array_length(v_q.choices));
  if (v_counts ->> 'total')::integer = 0 then
    return null;
  end if;
  return jsonb_build_object('question', questions.question_json(v_q), 'counts', v_counts);
end;
$$;

-- Actions -----------------------------------------------------------------------------------

-- {ok: true, choice} or {ok: false, problem: not_resident | choice | answered, choice?}
-- The same answer again is ok (idempotent); a different one is refused (answers are final).
create function questions.answer_at(p_uid uuid, p_choice integer, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_q questions.questions := questions.question_on(v_day);
  v_play uuid;
  v_existing smallint;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select a.choice into v_existing from questions.answers a where a.user_id = p_uid and a.calgary_day = v_day;
  if v_existing is not null then
    return case when v_existing = p_choice then jsonb_build_object('ok', true, 'choice', v_existing)
                else jsonb_build_object('ok', false, 'problem', 'answered', 'choice', v_existing) end;
  end if;
  select p.community_id into v_play from residency.play_on(p_uid, v_day) p;
  if v_play is null then
    return jsonb_build_object('ok', false, 'problem', 'not_resident');
  end if;
  if v_q.id is null or p_choice is null or p_choice < 1 or p_choice > jsonb_array_length(v_q.choices) then
    return jsonb_build_object('ok', false, 'problem', 'choice');
  end if;
  insert into questions.answers (user_id, calgary_day, community_id, choice, created_at)
  values (p_uid, v_day, v_play, p_choice, p_now)
  on conflict (user_id, calgary_day) do nothing;
  select a.choice into v_existing from questions.answers a where a.user_id = p_uid and a.calgary_day = v_day;
  return case when v_existing = p_choice then jsonb_build_object('ok', true, 'choice', v_existing)
              else jsonb_build_object('ok', false, 'problem', 'answered', 'choice', v_existing) end;
end;
$$;

revoke all on all functions in schema questions from public, anon, authenticated;

-- API ---------------------------------------------------------------------------------------

create function public.questions_today(p_community_id uuid)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select questions.today_at(p_community_id, now(), auth.uid())
$$;
comment on function public.questions_today(uuid) is
  'Today''s question for the whole city as a viewer of this community sees it: {calgary_day, question: {id, category, text, choices: [{emoji, text}]}, can_answer, reason: not_signed_in|not_resident|other_community|answered|null, answered: my choice (1-based) or null, counts: {total, choices} once answered or for those who cannot answer}. Counts only, never who chose what.';

create function public.questions_answer(p_choice integer)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select questions.answer_at(auth.uid(), p_choice, now())
$$;
comment on function public.questions_answer(integer) is
  'Answer today''s question (1-based choice) in the community I play in (verified or verifying); once per Calgary day, final; the same answer again is ok. {ok, choice} or {ok: false, problem: not_resident|choice|answered, choice?}.';

revoke all on function public.questions_today(uuid) from public;
revoke all on function public.questions_answer(integer) from public;
grant execute on function public.questions_today(uuid) to anon, authenticated;
grant execute on function public.questions_answer(integer) to authenticated;
