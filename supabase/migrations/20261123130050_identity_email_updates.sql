-- Module: identity — optional email updates with explicit opt-in (requirement.md §18, CASL).
--
-- Never pre-checked: a row exists only after the player ticks the box. The consent record keeps
-- when and under which wording version consent was given; withdrawing clears the address and
-- keeps the withdrawal time (proof that we stopped). No emails are sent by the MVP itself.

create table identity.email_updates (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text check (email is null or (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  consent_version text not null,
  consented_at timestamptz not null,
  withdrawn_at timestamptz,
  check ((email is null) = (withdrawn_at is not null))
);
alter table identity.email_updates enable row level security;

-- Wording shown next to the checkbox; bump when the text changes (frontend shows the same version).
create function identity.email_consent_version()
returns text
language sql immutable set search_path = ''
as $$ select '2026-11-23' $$;

create function identity.email_updates_of(p_uid uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object('on', e.email is not null, 'email', e.email)
  from identity.email_updates e where e.user_id = p_uid
  union all select jsonb_build_object('on', false, 'email', null)
  limit 1
$$;

create function identity.set_email_updates_at(p_uid uuid, p_email text, p_on boolean, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_on then
    if char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'invalid email' using errcode = '22023';
    end if;
    insert into identity.email_updates (user_id, email, consent_version, consented_at, withdrawn_at)
    values (p_uid, v_email, identity.email_consent_version(), p_now, null)
    on conflict (user_id) do update
      set email = excluded.email, consent_version = excluded.consent_version,
          consented_at = excluded.consented_at, withdrawn_at = null;
  else
    update identity.email_updates set email = null, withdrawn_at = p_now
    where user_id = p_uid and email is not null;
  end if;
  return identity.email_updates_of(p_uid);
end;
$$;

-- Number of players currently opted in (admin screen).
create function identity.email_updates_count()
returns integer
language sql stable set search_path = ''
as $$ select count(*)::integer from identity.email_updates e where e.email is not null $$;

revoke all on function identity.email_consent_version() from public, anon, authenticated;
revoke all on function identity.email_updates_of(uuid) from public, anon, authenticated;
revoke all on function identity.set_email_updates_at(uuid, text, boolean, timestamptz) from public, anon, authenticated;
revoke all on function identity.email_updates_count() from public, anon, authenticated;

create function public.identity_get_email_updates()
returns jsonb
language sql stable security definer set search_path = ''
as $$ select identity.email_updates_of(auth.uid()) $$;
comment on function public.identity_get_email_updates() is 'My email-update setting: {on, email}.';

create function public.identity_set_email_updates(p_email text, p_on boolean)
returns jsonb
language sql volatile security definer set search_path = ''
as $$ select identity.set_email_updates_at(auth.uid(), p_email, p_on, now()) $$;
comment on function public.identity_set_email_updates(text, boolean) is
  'Opt in (p_on = true, valid email; records consent time and wording version) or withdraw (clears the address).';

revoke all on function public.identity_get_email_updates() from public;
revoke all on function public.identity_set_email_updates(text, boolean) from public;
grant execute on function public.identity_get_email_updates() to authenticated;
grant execute on function public.identity_set_email_updates(text, boolean) to authenticated;
