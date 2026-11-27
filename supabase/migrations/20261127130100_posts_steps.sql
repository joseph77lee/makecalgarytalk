-- Module: posts — personal posting steps (requirement.md v1.49 §14).
--
--   Step 2: Verified Residents in their own community write 💬 Free talk, 🔎 Lost & found,
--           🚨 Safety (urgent news must not wait).
--   Step 3: with 14 active days (gamecore.active_days) also 🎉 Events and 🏷️ Local deals.
--   (Step 0, reading/thanks/reports, and step 1, today's question, live elsewhere.)
--
--   can_post_at now also says which kinds are open, the active days, and the next step with the
--   days to go, so the write box can show it. create_at refuses a kind that is not open yet
--   (problem `kind_locked`).

create function posts.step3_days() returns integer language sql immutable as $$ select 14 $$;
create function posts.step2_kinds() returns text[] language sql immutable as $$ select array['talk', 'lost_found', 'safety'] $$;
create function posts.step3_kinds() returns text[] language sql immutable as $$ select array['event', 'deal'] $$;

-- Whether this player may post today, and where.
-- {allowed, reason?, community_id?, kinds?, active_days?, next?: {kinds, days, to_go}}
create or replace function posts.can_post_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community uuid;
  v_days integer;
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
  v_days := gamecore.active_days(p_uid, v_day);
  return jsonb_build_object(
    'allowed', true,
    'community_id', v_community,
    'active_days', v_days,
    'kinds', to_jsonb(case when v_days >= posts.step3_days() then posts.step2_kinds() || posts.step3_kinds() else posts.step2_kinds() end),
    'next', case when v_days >= posts.step3_days() then null
                 else jsonb_build_object('kinds', to_jsonb(posts.step3_kinds()), 'days', posts.step3_days(), 'to_go', posts.step3_days() - v_days) end
  );
end;
$$;

-- {ok: true, post_id} or {ok: false, problem: not_verified|locked|daily_limit|kind|kind_locked|length|link|phone|address|blocked}
create or replace function posts.create_at(p_uid uuid, p_kind text, p_body text, p_now timestamptz)
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
  if p_kind is null or not (p_kind = any (posts.step2_kinds() || posts.step3_kinds())) then
    return jsonb_build_object('ok', false, 'problem', 'kind');
  end if;
  if not (v_can -> 'kinds') ? p_kind then
    return jsonb_build_object('ok', false, 'problem', 'kind_locked');
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

revoke all on all functions in schema posts from public, anon, authenticated;

comment on function public.posts_create(text, text) is
  'Post local news in my community (Verified Residents, once the Welcome sign is built, 1 per Calgary day). Kinds: talk, lost_found, safety; event and deal after 14 active days. {ok, post_id} or {ok: false, problem: not_verified|locked|daily_limit|kind|kind_locked|length|link|phone|address|blocked}.';
