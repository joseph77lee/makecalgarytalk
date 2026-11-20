-- Module: identity — player profiles (requirement.md v1.22 §6.1, §10.2).
--
-- Accounts are Supabase Auth users (anonymous on the first visit, Google linking optional).
-- This module stores what the player chooses on the first visit: nickname and avatar shirt
-- colour, plus the day they last saw "What changed since yesterday" (one panel per account per
-- Calgary day). Nicknames are validated here, never trusted from the client.

create schema identity;
revoke all on schema identity from public, anon, authenticated;

create table identity.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 16),
  -- Index into the client's shirt palette.
  shirt smallint not null check (shirt between 0 and 7),
  changes_seen_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table identity.profiles enable row level security;

-- Basic blocked words (lowercase). A word blocks a nickname when it equals one of the
-- nickname's words, or the whole nickname with spaces and symbols removed contains it
-- (only for words of 5+ letters, to avoid blocking innocent names like "Glasshouse").
create table identity.blocked_words (
  word text primary key check (word = lower(word) and word ~ '^[a-z]+$')
);
alter table identity.blocked_words enable row level security;

insert into identity.blocked_words (word) values
  ('admin'), ('administrator'), ('moderator'), ('official'), ('makecalgarytalk'),
  ('ass'), ('asshole'), ('bastard'), ('bitch'), ('bollocks'), ('bullshit'), ('cock'), ('crap'),
  ('cunt'), ('damn'), ('dick'), ('dickhead'), ('dyke'), ('fag'), ('faggot'), ('fuck'), ('fucker'),
  ('fucking'), ('motherfucker'), ('nazi'), ('nigga'), ('nigger'), ('penis'), ('piss'), ('porn'),
  ('pussy'), ('rape'), ('rapist'), ('retard'), ('sex'), ('shit'), ('slut'), ('tits'), ('twat'),
  ('vagina'), ('wank'), ('wanker'), ('whore');

revoke all on all tables in schema identity from public, anon, authenticated;

-- Rules --------------------------------------------------------------------------------

create function identity.max_shirt() returns integer language sql immutable as $$ select 7 $$;

-- Trims and collapses whitespace.
create function identity.clean_nickname(p_nickname text)
returns text
language sql immutable set search_path = ''
as $$
  select regexp_replace(btrim(coalesce(p_nickname, '')), '\s+', ' ', 'g')
$$;

-- Why a (cleaned) nickname is not allowed, or null when it is fine.
create function identity.nickname_problem(p_nickname text)
returns text
language sql stable set search_path = ''
as $$
  select case
    when char_length(p_nickname) not between 2 and 16 then 'length'
    when p_nickname !~ '^[[:alpha:][:digit:] _.''-]+$' or p_nickname !~ '[[:alpha:][:digit:]]' then 'characters'
    when exists (
      select 1 from identity.blocked_words w
      where w.word = any (regexp_split_to_array(lower(p_nickname), '[^[:alpha:][:digit:]]+'))
         or (char_length(w.word) >= 5 and position(w.word in regexp_replace(lower(p_nickname), '[^[:alpha:]]', '', 'g')) > 0)
    ) then 'blocked'
    else null
  end
$$;

create function identity.profile_at(p_uid uuid, p_now timestamptz)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'calgary_day', common.calgary_day(p_now),
    'is_anonymous', coalesce((select u.is_anonymous from auth.users u where u.id = p_uid), true),
    'profile', (select jsonb_build_object('nickname', p.nickname, 'shirt', p.shirt) from identity.profiles p where p.user_id = p_uid),
    'changes_seen_today', coalesce((select p.changes_seen_on = common.calgary_day(p_now) from identity.profiles p where p.user_id = p_uid), false)
  )
$$;

-- Creates or updates my profile. Returns {ok: true, ...profile_at} or {ok: false, problem}.
create function identity.save_profile_at(p_uid uuid, p_nickname text, p_shirt integer, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_nickname text := identity.clean_nickname(p_nickname);
  v_problem text;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_shirt is null or p_shirt < 0 or p_shirt > identity.max_shirt() then
    return jsonb_build_object('ok', false, 'problem', 'shirt');
  end if;
  v_problem := identity.nickname_problem(v_nickname);
  if v_problem is not null then
    return jsonb_build_object('ok', false, 'problem', v_problem);
  end if;
  insert into identity.profiles (user_id, nickname, shirt)
  values (p_uid, v_nickname, p_shirt)
  on conflict (user_id) do update set nickname = excluded.nickname, shirt = excluded.shirt, updated_at = p_now;
  return jsonb_build_object('ok', true) || identity.profile_at(p_uid, p_now);
end;
$$;

-- "What changed since yesterday" seen today (once per account per Calgary day).
create function identity.mark_changes_seen_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  update identity.profiles set changes_seen_on = common.calgary_day(p_now) where user_id = p_uid;
  return identity.profile_at(p_uid, p_now);
end;
$$;

revoke all on all functions in schema identity from public, anon, authenticated;

-- Public RPC ------------------------------------------------------------------------------

create function public.identity_get_profile()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  return identity.profile_at(auth.uid(), now());
end;
$$;
comment on function public.identity_get_profile() is
  'My profile (nickname, shirt) or null before the first-visit setup; whether I am anonymous; whether I saw today''s changes.';

create function public.identity_save_profile(p_nickname text, p_shirt integer)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select identity.save_profile_at(auth.uid(), p_nickname, p_shirt, now())
$$;
comment on function public.identity_save_profile(text, integer) is
  'Create or update my nickname and shirt colour. {ok: false, problem: length|characters|blocked|shirt} when not allowed.';

create function public.identity_mark_changes_seen()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select identity.mark_changes_seen_at(auth.uid(), now())
$$;
comment on function public.identity_mark_changes_seen() is
  'Record that I saw today''s "What changed since yesterday" panel.';

revoke all on function public.identity_get_profile() from public;
revoke all on function public.identity_save_profile(text, integer) from public;
revoke all on function public.identity_mark_changes_seen() from public;
grant execute on function public.identity_get_profile() to authenticated;
grant execute on function public.identity_save_profile(text, integer) to authenticated;
grant execute on function public.identity_mark_changes_seen() to authenticated;
