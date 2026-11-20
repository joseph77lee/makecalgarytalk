-- Module: invites — personal invite links, invite rewards and badges (requirement.md v1.25 §7.1, §12.3).
--
--   * One personal code per account (created on first use). Link: <app>/?invite=CODE.
--   * An invite is accepted once per account, only from someone else, and only before the
--     invitee's first verification (so an existing resident cannot claim a reward afterwards).
--   * Rewards are computed on read from immutable history (acceptances + residency
--     verifications), so they are never lost when either person moves and a move never creates
--     a new one:
--       - Good Neighbour (both): the invitee's FIRST verification is in the community the
--         inviter is a Verified Resident of on that day.
--       - Pioneer Sponsor (inviter): the invitee's first verification made them the first
--         Verified Resident of that community.
--       - Founding Resident: first Verified Resident of a community (residency).
--   * Reads other modules only through their functions: residency.first_verification /
--     community_on / founded_communities, identity.nickname, gamecore.community_name.

create schema invites;
revoke all on schema invites from public, anon, authenticated;

create table invites.codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);
alter table invites.codes enable row level security;

create table invites.acceptances (
  invitee_id uuid primary key references auth.users (id) on delete cascade,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  check (invitee_id <> inviter_id)
);
alter table invites.acceptances enable row level security;
create index acceptances_inviter_idx on invites.acceptances (inviter_id);

create function invites.acceptances_append_only()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'invites.acceptances is append-only' using errcode = '42501';
end;
$$;
create trigger acceptances_no_update
before update on invites.acceptances
for each row execute function invites.acceptances_append_only();

revoke all on all tables in schema invites from public, anon, authenticated;

-- Codes ------------------------------------------------------------------------------------

-- 8 characters without look-alikes (no I, O, 0, 1). Codes are public identifiers, not secrets.
create function invites.random_code()
returns text
language sql volatile set search_path = ''
as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1), '')
  from generate_series(1, 8)
$$;

create function invites.normalize_code(p_code text)
returns text
language sql immutable set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

create function invites.code_for(p_uid uuid)
returns text
language plpgsql set search_path = ''
as $$
declare
  v_code text;
begin
  select c.code into v_code from invites.codes c where c.user_id = p_uid;
  while v_code is null loop
    insert into invites.codes (user_id, code) values (p_uid, invites.random_code())
    on conflict do nothing
    returning code into v_code;
    if v_code is null then
      select c.code into v_code from invites.codes c where c.user_id = p_uid; -- created concurrently
    end if;
  end loop;
  return v_code;
end;
$$;

create function invites.owner_of(p_code text)
returns uuid
language sql stable set search_path = ''
as $$
  select c.user_id from invites.codes c where c.code = invites.normalize_code(p_code)
$$;

-- Rewards ----------------------------------------------------------------------------------

-- Good Neighbour for this invitee (and their inviter).
create function invites.rewarded(p_invitee uuid)
returns boolean
language sql stable set search_path = ''
as $$
  select coalesce((
    select residency.community_on(a.inviter_id, f.verified_on) = f.community_id
    from invites.acceptances a
    cross join residency.first_verification(p_invitee) f
    where a.invitee_id = p_invitee
  ), false)
$$;

-- Pioneer Sponsor for this invitee's inviter.
create function invites.pioneered(p_invitee uuid)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (
    select 1
    from invites.acceptances a
    cross join residency.first_verification(p_invitee) f
    where a.invitee_id = p_invitee
      and f.community_id in (select residency.founded_communities(p_invitee))
  )
$$;

-- Public info for an invite link: the inviter's nickname and community (nothing else).
create function invites.lookup_at(p_code text, p_now timestamptz)
returns jsonb
language sql stable set search_path = ''
as $$
  select case when o.uid is null then null else jsonb_build_object(
    'nickname', identity.nickname(o.uid),
    'community', gamecore.community_name(residency.community_on(o.uid, common.calgary_day(p_now)))
  ) end
  from (select invites.owner_of(p_code) as uid) o
$$;

create function invites.badges_at(p_uid uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  with founded as (
    select jsonb_build_object('key', 'founding_resident', 'community', gamecore.community_name(f)) as b
    from residency.founded_communities(p_uid) f
  ), counts as (
    select
      (select count(*) from invites.acceptances a where a.inviter_id = p_uid and invites.rewarded(a.invitee_id))
        + case when invites.rewarded(p_uid) then 1 else 0 end as good,
      (select count(*) from invites.acceptances a where a.inviter_id = p_uid and invites.pioneered(a.invitee_id)) as pioneer
  )
  select coalesce((select jsonb_agg(b order by b ->> 'community') from founded), '[]'::jsonb)
         || case when c.good > 0 then jsonb_build_array(jsonb_build_object('key', 'good_neighbour', 'count', c.good)) else '[]'::jsonb end
         || case when c.pioneer > 0 then jsonb_build_array(jsonb_build_object('key', 'pioneer_sponsor', 'count', c.pioneer)) else '[]'::jsonb end
  from counts c
$$;

create function invites.mine_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_inviter uuid;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select a.inviter_id into v_inviter from invites.acceptances a where a.invitee_id = p_uid;
  return jsonb_build_object(
    'code', invites.code_for(p_uid),
    'invited', (select count(*) from invites.acceptances a where a.inviter_id = p_uid),
    'joined', (select count(*) from invites.acceptances a where a.inviter_id = p_uid and invites.rewarded(a.invitee_id)),
    'invited_by', case when v_inviter is null then null else identity.nickname(v_inviter) end,
    'badges', invites.badges_at(p_uid)
  );
end;
$$;

-- Accepts an invite. {ok: true} or {ok: false, problem: unknown|self|already|too_late}.
create function invites.accept_at(p_uid uuid, p_code text, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_inviter uuid;
  v_existing uuid;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  v_inviter := invites.owner_of(p_code);
  if v_inviter is null then
    return jsonb_build_object('ok', false, 'problem', 'unknown');
  end if;
  if v_inviter = p_uid then
    return jsonb_build_object('ok', false, 'problem', 'self');
  end if;
  select a.inviter_id into v_existing from invites.acceptances a where a.invitee_id = p_uid;
  if v_existing is not null then
    return case when v_existing = v_inviter then jsonb_build_object('ok', true)
                else jsonb_build_object('ok', false, 'problem', 'already') end;
  end if;
  if exists (select 1 from residency.first_verification(p_uid)) then
    return jsonb_build_object('ok', false, 'problem', 'too_late');
  end if;
  insert into invites.acceptances (invitee_id, inviter_id, accepted_at) values (p_uid, v_inviter, p_now)
  on conflict (invitee_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on all functions in schema invites from public, anon, authenticated;

-- Public RPC -------------------------------------------------------------------------------

create function public.invites_get_mine()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select invites.mine_at(auth.uid(), now())
$$;
comment on function public.invites_get_mine() is
  'My invite code, how many accepted my invite and how many became neighbours, who invited me, and my badges.';

create function public.invites_accept(p_code text)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select invites.accept_at(auth.uid(), p_code, now())
$$;
comment on function public.invites_accept(text) is
  'Accept an invite code (once, from someone else, before my first verification). {ok: false, problem: unknown|self|already|too_late}.';

create function public.invites_lookup(p_code text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select invites.lookup_at(p_code, now())
$$;
comment on function public.invites_lookup(text) is
  'Who sent an invite link: {nickname, community} (community null if the inviter has none yet), or null for an unknown code.';

revoke all on function public.invites_get_mine() from public;
revoke all on function public.invites_accept(text) from public;
revoke all on function public.invites_lookup(text) from public;
grant execute on function public.invites_get_mine() to authenticated;
grant execute on function public.invites_accept(text) to authenticated;
grant execute on function public.invites_lookup(text) to anon, authenticated;
