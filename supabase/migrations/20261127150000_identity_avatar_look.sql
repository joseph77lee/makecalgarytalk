-- Module: identity — the villager's look chosen by the player (requirement.md v1.52 §10.2).
--
--   * look = {age, skin, hair, hair_colour, skirt, beard, glasses}: indexes into the client's part
--     lists (age 0 adult / 1 child / 2 elder; skin 0–5; hair style 0–6; hair colour 0–9) and three
--     yes/no parts. No beard for children. Checked here, stored normalized.
--   * Saving without a look keeps the stored one, so changing the nickname never changes the look.
--     Profiles saved before this have no look (null): the client keeps their nickname-based look.

alter table identity.profiles add column look jsonb;

create function identity.look_ranges() returns jsonb language sql immutable as $$
  select '{"age": 2, "skin": 5, "hair": 6, "hair_colour": 9}'::jsonb
$$;

-- Why a look is not allowed, or null when it is fine.
create function identity.look_problem(p_look jsonb)
returns text
language sql immutable set search_path = ''
as $$
  select case
    when jsonb_typeof(p_look) is distinct from 'object' then 'look'
    when (select array_agg(k order by k) from jsonb_object_keys(p_look) k)
         is distinct from array['age', 'beard', 'glasses', 'hair', 'hair_colour', 'skin', 'skirt'] then 'look'
    when exists (
      select 1 from jsonb_each(identity.look_ranges()) r
      where case when jsonb_typeof(p_look -> r.key) <> 'number' then true
                 else (p_look ->> r.key)::numeric <> trunc((p_look ->> r.key)::numeric)
                   or (p_look ->> r.key)::numeric not between 0 and (r.value)::text::numeric end
    ) then 'look'
    when jsonb_typeof(p_look -> 'skirt') <> 'boolean' or jsonb_typeof(p_look -> 'beard') <> 'boolean'
      or jsonb_typeof(p_look -> 'glasses') <> 'boolean' then 'look'
    when (p_look ->> 'age')::integer = 1 and (p_look ->> 'beard')::boolean then 'look'
    else null
  end
$$;

create or replace function identity.profile_at(p_uid uuid, p_now timestamptz)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'calgary_day', common.calgary_day(p_now),
    'is_anonymous', coalesce((select u.is_anonymous from auth.users u where u.id = p_uid), true),
    'profile', (select jsonb_build_object('nickname', p.nickname, 'shirt', p.shirt, 'look', p.look) from identity.profiles p where p.user_id = p_uid),
    'changes_seen_today', coalesce((select p.changes_seen_on = common.calgary_day(p_now) from identity.profiles p where p.user_id = p_uid), false)
  )
$$;

-- Creates or updates my profile. A null look keeps the stored one.
-- Returns {ok: true, ...profile_at} or {ok: false, problem: length|characters|blocked|shirt|look}.
create function identity.save_profile_at(p_uid uuid, p_nickname text, p_shirt integer, p_look jsonb, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_nickname text := identity.clean_nickname(p_nickname);
  v_problem text;
  v_look jsonb;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_shirt is null or p_shirt < 0 or p_shirt > identity.max_shirt() then
    return jsonb_build_object('ok', false, 'problem', 'shirt');
  end if;
  if p_look is not null then
    if identity.look_problem(p_look) is not null then
      return jsonb_build_object('ok', false, 'problem', 'look');
    end if;
    v_look := jsonb_build_object(
      'age', (p_look ->> 'age')::integer, 'skin', (p_look ->> 'skin')::integer,
      'hair', (p_look ->> 'hair')::integer, 'hair_colour', (p_look ->> 'hair_colour')::integer,
      'skirt', (p_look ->> 'skirt')::boolean, 'beard', (p_look ->> 'beard')::boolean,
      'glasses', (p_look ->> 'glasses')::boolean);
  end if;
  v_problem := identity.nickname_problem(v_nickname);
  if v_problem is not null then
    return jsonb_build_object('ok', false, 'problem', v_problem);
  end if;
  insert into identity.profiles (user_id, nickname, shirt, look)
  values (p_uid, v_nickname, p_shirt, v_look)
  on conflict (user_id) do update set
    nickname = excluded.nickname,
    shirt = excluded.shirt,
    look = coalesce(excluded.look, identity.profiles.look),
    updated_at = p_now;
  return jsonb_build_object('ok', true) || identity.profile_at(p_uid, p_now);
end;
$$;

-- The old form (nickname and shirt only) keeps the stored look.
create or replace function identity.save_profile_at(p_uid uuid, p_nickname text, p_shirt integer, p_now timestamptz)
returns jsonb
language sql set search_path = ''
as $$
  select identity.save_profile_at(p_uid, p_nickname, p_shirt, null::jsonb, p_now)
$$;

revoke all on all functions in schema identity from public, anon, authenticated;

drop function public.identity_save_profile(text, integer);
create function public.identity_save_profile(p_nickname text, p_shirt integer, p_look jsonb default null)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select identity.save_profile_at(auth.uid(), p_nickname, p_shirt, p_look, now())
$$;
comment on function public.identity_save_profile(text, integer, jsonb) is
  'Create or update my nickname, shirt colour and villager look ({age 0-2, skin 0-5, hair 0-6, hair_colour 0-9, skirt, beard, glasses}; no beard for children; null keeps the stored look). {ok: false, problem: length|characters|blocked|shirt|look} when not allowed.';

revoke all on function public.identity_save_profile(text, integer, jsonb) from public;
grant execute on function public.identity_save_profile(text, integer, jsonb) to authenticated;
