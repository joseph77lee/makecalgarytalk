-- Module: news — one newspaper (requirement.md v1.49 §11).
--
--   * The community board (events, roadmap) is part of the newspaper from the Welcome sign on;
--     the Warming hut lock is gone.

create or replace function news.newspaper_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_state jsonb := gamecore.community_state_at(p_community_id, p_now, null);
  v_sign boolean;
  v_lines jsonb;
  v_can jsonb := posts.can_post_at(p_uid, p_now);
begin
  select coalesce(bool_or(b ->> 'key' = 'welcome-sign' and (b ->> 'status' = 'built' or (b ->> 'level')::integer > 1)), false)
  into v_sign
  from jsonb_array_elements(v_state -> 'buildings') b;

  if v_sign then
    select e.lines into v_lines from news.editions e where e.community_id = p_community_id and e.calgary_day = v_day;
    if v_lines is null then
      v_lines := news.lines_at(p_community_id, p_now);
      insert into news.editions (community_id, calgary_day, lines) values (p_community_id, v_day, v_lines)
      on conflict do nothing;
      select e.lines into v_lines from news.editions e where e.community_id = p_community_id and e.calgary_day = v_day;
    end if;
  end if;

  return jsonb_build_object(
    'calgary_day', v_day,
    'community', v_state -> 'community' ->> 'name',
    'locked', case when v_sign then null else 'welcome_sign' end,
    'announcements', coalesce((
      select jsonb_agg(jsonb_build_object('title', a.title, 'body', a.body) order by a.starts_on desc, a.id desc)
      from (select * from news.announcements a
            where a.starts_on <= v_day and (a.ends_on is null or a.ends_on >= v_day)
            order by a.starts_on desc, a.id desc limit 5) a), '[]'::jsonb),
    'lines', coalesce(v_lines, '[]'::jsonb),
    -- Local news written by residents (live, not stored with the edition).
    'posts', case when v_sign then posts.feed_at(p_community_id, p_now, p_uid) else '[]'::jsonb end,
    'can_post', case when (v_can ->> 'community_id') is distinct from p_community_id::text
                     and (v_can ->> 'reason') is distinct from 'not_signed_in'
                     and (v_can ->> 'reason') is distinct from 'not_verified'
                     then jsonb_build_object('allowed', false, 'reason', 'other_community')
                     else v_can - 'community_id' end,
    'board', jsonb_build_object(
      'open', v_sign,
      'roadmap', case when v_sign then coalesce((
        select jsonb_agg(jsonb_build_object('title', r.title, 'detail', r.detail) order by r.position)
        from news.roadmap r where not r.done), '[]'::jsonb) else '[]'::jsonb end
    )
  );
end;
$$;

revoke all on all functions in schema news from public, anon, authenticated;

comment on function public.news_get_newspaper(uuid) is
  'Today''s community newspaper: announcements, yesterday''s new neighbours and farewells (locked: welcome_sign until the Welcome sign is built), residents'' local news posts, whether I can post here (with the kinds open to me and the next step), and the community board (opens with the newspaper).';
