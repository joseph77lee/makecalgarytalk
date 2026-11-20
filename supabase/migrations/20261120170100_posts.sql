-- Module: posts — resident-written local news (requirement.md v1.28 §14).
--
--   * Verified Residents post in their own community once its Welcome sign is built: a kind and up
--     to 300 characters, 1 per Calgary day, no links, no phone numbers or street addresses, no
--     blocked words. Visible 3 Calgary days; the author can delete.
--   * Kinds: safety, deal (local store events/sales), event, lost_found, talk (free talk).
--   * Reports: once per player per post, at most 3 a day; Verified Residents count 2 points, others
--     1; 3 points hide the post. The operator can hide or restore a post (a restored post ignores
--     reports) and block an account from reporting (SQL).
--   * Thanks: once per player per post; 10 thanks received in total → Community Reporter badge.
--   * Day-level only: the feed says how many days ago, never a time.
--   * Reads other modules only through functions: residency.community_on, gamecore.built_level,
--     identity.nickname / has_blocked_words.

create schema posts;
revoke all on schema posts from public, anon, authenticated;

create table posts.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references gamecore.communities (id),
  author_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('safety', 'deal', 'event', 'lost_found', 'talk')),
  body text not null check (char_length(body) between 1 and 300),
  posted_on date not null,
  deleted boolean not null default false,
  -- Set by the operator: hidden, or restored (stays visible whatever the reports say).
  hidden boolean not null default false,
  restored boolean not null default false,
  created_at timestamptz not null default now()
);
alter table posts.posts enable row level security;
create index posts_feed_idx on posts.posts (community_id, posted_on);
create index posts_author_idx on posts.posts (author_id, posted_on);

create table posts.reports (
  post_id uuid not null references posts.posts (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  points smallint not null check (points in (1, 2)),
  reported_on date not null,
  primary key (post_id, reporter_id)
);
create index reports_reporter_idx on posts.reports (reporter_id, reported_on);
alter table posts.reports enable row level security;

create table posts.thanks (
  post_id uuid not null references posts.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (post_id, user_id)
);
alter table posts.thanks enable row level security;

-- Accounts the operator blocked from reporting (abuse).
create table posts.report_blocks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table posts.report_blocks enable row level security;

revoke all on all tables in schema posts from public, anon, authenticated;

-- Rules -------------------------------------------------------------------------------------

create function posts.max_chars() returns integer language sql immutable as $$ select 300 $$;
create function posts.visible_days() returns integer language sql immutable as $$ select 3 $$;
create function posts.hide_points() returns integer language sql immutable as $$ select 3 $$;
create function posts.reporter_thanks() returns integer language sql immutable as $$ select 10 $$;
create function posts.reports_per_day() returns integer language sql immutable as $$ select 3 $$;

-- Why a post body is refused, or null.
create function posts.body_problem(p_body text)
returns text
language sql stable set search_path = ''
as $$
  select case
    when char_length(p_body) not between 1 and posts.max_chars() then 'length'
    when p_body ~* '(https?://|www\.|[a-z0-9-]+\.(com|ca|net|org|io|co|info|biz|ly|me)(\M|/))' then 'link'
    when p_body ~ '(\+?1[\s.-]*)?\(?[0-9]{3}\)?[\s.-]*[0-9]{3}[\s.-]*[0-9]{4}' then 'phone'
    -- A street address: a house number followed by a street type, or by a Calgary quadrant.
    when p_body ~* '\m[0-9]{1,5}[a-z]?\s+(?!(am|pm)\M)([a-z0-9]+\s+){0,2}(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|crescent|cres|court|crt|ct|place|pl|lane|ln|trail|terrace|circle|cir|heights|hts|mews|manor|parade|square|sq|gardens|gdns)\M'
      or p_body ~ '\m[0-9]{1,5}[A-Za-z]?\s+([A-Za-z0-9]+\s+){1,3}(NW|NE|SW|SE)\M'
      then 'address'
    when identity.has_blocked_words(p_body) then 'blocked'
    else null
  end
$$;

-- Whether this player may post today, and where. {allowed, reason?, community_id?}
create function posts.can_post_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community uuid;
begin
  if p_uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_signed_in');
  end if;
  v_community := residency.community_on(p_uid, v_day);
  if v_community is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_verified');
  end if;
  if gamecore.built_level(v_community, 'welcome-sign', v_day) = 0 then
    return jsonb_build_object('allowed', false, 'reason', 'locked', 'community_id', v_community);
  end if;
  if exists (select 1 from posts.posts p where p.author_id = p_uid and p.posted_on = v_day) then
    return jsonb_build_object('allowed', false, 'reason', 'daily_limit', 'community_id', v_community);
  end if;
  return jsonb_build_object('allowed', true, 'community_id', v_community);
end;
$$;

create function posts.points(p_post_id uuid)
returns integer
language sql stable set search_path = ''
as $$
  select coalesce(sum(r.points), 0)::integer from posts.reports r where r.post_id = p_post_id
$$;

-- Visible posts of a community on the day of p_now, newest first, for this viewer.
create function posts.feed_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'kind', p.kind,
      'body', p.body,
      'nickname', coalesce(identity.nickname(p.author_id), 'A neighbour'),
      'days_ago', common.calgary_day(p_now) - p.posted_on,
      'thanks', (select count(*) from posts.thanks t where t.post_id = p.id),
      'mine', p.author_id = p_uid,
      'thanked', exists (select 1 from posts.thanks t where t.post_id = p.id and t.user_id = p_uid),
      'reported', exists (select 1 from posts.reports r where r.post_id = p.id and r.reporter_id = p_uid)
    ) order by p.posted_on desc, p.created_at desc), '[]'::jsonb)
  from posts.posts p
  where p.community_id = p_community_id
    and p.posted_on > common.calgary_day(p_now) - posts.visible_days()
    and p.posted_on <= common.calgary_day(p_now)
    and not p.deleted and not p.hidden
    and (p.restored or posts.points(p.id) < posts.hide_points())
$$;

-- A visible post (not deleted/hidden/expired/reported away), or null.
create function posts.visible_post(p_post_id uuid, p_now timestamptz)
returns posts.posts
language sql stable set search_path = ''
as $$
  select p.* from posts.posts p
  where p.id = p_post_id
    and p.posted_on > common.calgary_day(p_now) - posts.visible_days()
    and not p.deleted and not p.hidden
    and (p.restored or posts.points(p.id) < posts.hide_points())
$$;

create function posts.thanks_received(p_uid uuid)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from posts.thanks t join posts.posts p on p.id = t.post_id where p.author_id = p_uid
$$;

-- Actions -----------------------------------------------------------------------------------

-- {ok: true, post_id} or {ok: false, problem: not_verified|locked|daily_limit|kind|length|link|phone|address|blocked}
-- Kinds: safety | deal | event | lost_found | talk.
create function posts.create_at(p_uid uuid, p_kind text, p_body text, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_can jsonb;
  v_body text := btrim(regexp_replace(coalesce(p_body, ''), '[ \t]+', ' ', 'g'));
  v_problem text;
  v_id uuid;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('posts.author:' || p_uid::text, 0));
  v_can := posts.can_post_at(p_uid, p_now);
  if not (v_can ->> 'allowed')::boolean then
    return jsonb_build_object('ok', false, 'problem', v_can ->> 'reason');
  end if;
  if p_kind is null or p_kind not in ('safety', 'deal', 'event', 'lost_found', 'talk') then
    return jsonb_build_object('ok', false, 'problem', 'kind');
  end if;
  v_problem := posts.body_problem(v_body);
  if v_problem is not null then
    return jsonb_build_object('ok', false, 'problem', v_problem);
  end if;
  insert into posts.posts (community_id, author_id, kind, body, posted_on, created_at)
  values ((v_can ->> 'community_id')::uuid, p_uid, p_kind, v_body, common.calgary_day(p_now), p_now)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'post_id', v_id);
end;
$$;

create function posts.delete_at(p_uid uuid, p_post_id uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  update posts.posts set deleted = true where id = p_post_id and author_id = p_uid and not deleted;
  return jsonb_build_object('ok', found);
end;
$$;

-- {ok} or {ok: false, problem: not_found|own|blocked|limit}. Idempotent per player; at most 3 reports
-- per player per Calgary day.
create function posts.report_at(p_uid uuid, p_post_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_post posts.posts := posts.visible_post(p_post_id, p_now);
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_post.id is null then
    return jsonb_build_object('ok', false, 'problem', 'not_found');
  end if;
  if v_post.author_id = p_uid then
    return jsonb_build_object('ok', false, 'problem', 'own');
  end if;
  if exists (select 1 from posts.report_blocks b where b.user_id = p_uid) then
    return jsonb_build_object('ok', false, 'problem', 'blocked');
  end if;
  if exists (select 1 from posts.reports r where r.post_id = p_post_id and r.reporter_id = p_uid) then
    return jsonb_build_object('ok', true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('posts.reporter:' || p_uid::text, 0));
  if (select count(*) from posts.reports r where r.reporter_id = p_uid and r.reported_on = common.calgary_day(p_now)) >= posts.reports_per_day() then
    return jsonb_build_object('ok', false, 'problem', 'limit');
  end if;
  insert into posts.reports (post_id, reporter_id, points, reported_on)
  values (p_post_id, p_uid, case when residency.community_on(p_uid, common.calgary_day(p_now)) is not null then 2 else 1 end,
          common.calgary_day(p_now))
  on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

-- {ok, thanks} or {ok: false, problem: not_found|own}. Idempotent per player.
create function posts.thank_at(p_uid uuid, p_post_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_post posts.posts := posts.visible_post(p_post_id, p_now);
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_post.id is null then
    return jsonb_build_object('ok', false, 'problem', 'not_found');
  end if;
  if v_post.author_id = p_uid then
    return jsonb_build_object('ok', false, 'problem', 'own');
  end if;
  insert into posts.thanks (post_id, user_id) values (p_post_id, p_uid) on conflict do nothing;
  return jsonb_build_object('ok', true, 'thanks', (select count(*) from posts.thanks t where t.post_id = p_post_id));
end;
$$;

revoke all on all functions in schema posts from public, anon, authenticated;

-- Public RPC --------------------------------------------------------------------------------

create function public.posts_create(p_kind text, p_body text)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select posts.create_at(auth.uid(), p_kind, p_body, now()) $$;
comment on function public.posts_create(text, text) is
  'Post local news in my community (kind: safety|deal|event|lost_found|talk, up to 300 characters). {ok: false, problem: not_verified|locked|daily_limit|kind|length|link|phone|address|blocked}.';

create function public.posts_delete(p_post_id uuid)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select posts.delete_at(auth.uid(), p_post_id) $$;
comment on function public.posts_delete(uuid) is 'Delete my post.';

create function public.posts_report(p_post_id uuid)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select posts.report_at(auth.uid(), p_post_id, now()) $$;
comment on function public.posts_report(uuid) is 'Report a post (once; at most 3 reports a day). Verified Residents count 2 points, others 1; 3 points hide it. {ok: false, problem: not_found|own|blocked|limit}.';

create function public.posts_thank(p_post_id uuid)
returns jsonb language sql volatile security definer set search_path = ''
as $$ select posts.thank_at(auth.uid(), p_post_id, now()) $$;
comment on function public.posts_thank(uuid) is 'Thank a post (once).';

revoke all on function public.posts_create(text, text) from public;
revoke all on function public.posts_delete(uuid) from public;
revoke all on function public.posts_report(uuid) from public;
revoke all on function public.posts_thank(uuid) from public;
grant execute on function public.posts_create(text, text) to authenticated;
grant execute on function public.posts_delete(uuid) to authenticated;
grant execute on function public.posts_report(uuid) to authenticated;
grant execute on function public.posts_thank(uuid) to authenticated;
