-- Module: news — community newspaper, global operator announcements, roadmap
-- (requirement.md v1.27 §11).
--
--   * Edition: written once per community per Calgary day, the first time someone opens it, from
--     yesterday's real records, then served as stored. Day-level only: no clock times anywhere.
--   * Locked until the community's Welcome sign is built; the board section (events, roadmap)
--     opens with the Warming hut; announcements are always at the top.
--   * Lines are about real people: new neighbours (with names) and farewells. Game events
--     (buildings, island growth, helpers, streak) are shown in the "Since yesterday" panel.
--   * Reads other modules only through functions: gamecore.community_state_at /
--     community_name, residency.arrivals_on / departures_on, identity.nickname.

create schema news;
revoke all on schema news from public, anon, authenticated;

create table news.editions (
  community_id uuid not null references gamecore.communities (id),
  calgary_day date not null,
  lines jsonb not null,
  primary key (community_id, calgary_day)
);
alter table news.editions enable row level security;

-- Global operator announcements (MVP: inserted with SQL in the Supabase dashboard).
create table news.announcements (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 80),
  body text not null default '' check (char_length(body) <= 500),
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);
alter table news.announcements enable row level security;

-- Upcoming updates shown as "Coming soon".
create table news.roadmap (
  id bigint generated always as identity primary key,
  position integer not null,
  title text not null check (char_length(title) between 1 and 80),
  detail text not null default '' check (char_length(detail) <= 200),
  done boolean not null default false
);
alter table news.roadmap enable row level security;

insert into news.roadmap (position, title, detail) values
  (1, 'Calgary World Map', 'See every community and how far it has grown.'),
  (2, 'Weekly community ranking', 'Which community is the most active this week?'),
  (3, 'Share cards', 'Share your community''s big moments.'),
  (4, 'Resident board', 'Post to your neighbours on the community board.');

revoke all on all tables in schema news from public, anon, authenticated;

-- Edition -----------------------------------------------------------------------------------

create function news.names(p_users uuid[], p_max integer)
returns text
language sql stable set search_path = ''
as $$
  with n as (
    select coalesce(identity.nickname(u), 'A neighbour') as name, ord
    from unnest(p_users) with ordinality as t(u, ord)
  )
  select case
    when cardinality(p_users) = 0 then ''
    when cardinality(p_users) <= p_max then
      case when cardinality(p_users) = 1 then (select name from n)
           else (select string_agg(name, ', ' order by ord) from n where ord < cardinality(p_users))
                || ' and ' || (select name from n where ord = cardinality(p_users)) end
    else (select string_agg(name, ', ' order by ord) from n where ord <= p_max)
         || ' and ' || (cardinality(p_users) - p_max) || ' more'
  end
$$;

-- Lines for the edition of p_day (about yesterday): real people news only — new neighbours and
-- farewells (game events stay in the "Since yesterday" panel). [{icon, text}]
create function news.lines_at(p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_lines jsonb := '[]'::jsonb;
  v_arrivals uuid[];
  v_dep record;
begin
  if not exists (select 1 from gamecore.communities c where c.id = p_community_id) then
    raise exception 'community not found' using errcode = 'P0002';
  end if;
  v_arrivals := array(select residency.arrivals_on(p_community_id, v_day - 1));
  if cardinality(v_arrivals) > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('icon', '👋', 'text',
      case when cardinality(v_arrivals) = 1 then '1 new neighbour joined yesterday: ' || news.names(v_arrivals, 6) || '. Welcome!'
           else cardinality(v_arrivals) || ' new neighbours joined yesterday: ' || news.names(v_arrivals, 6) || '. Welcome!' end));
  end if;
  for v_dep in select * from residency.departures_on(p_community_id, v_day - 1) loop
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('icon', '💐', 'text',
      coalesce(identity.nickname(v_dep.user_id), 'A neighbour') || ' moved to ' || coalesce(gamecore.community_name(v_dep.to_community_id), 'another community')
      || ' — thanks for everything, neighbour!'));
  end loop;
  return v_lines;
end;
$$;

-- The newspaper for today (edition written once, then stored).
create function news.newspaper_at(p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_state jsonb := gamecore.community_state_at(p_community_id, p_now, null);
  v_sign boolean;
  v_hut boolean;
  v_lines jsonb;
begin
  select coalesce(bool_or(b ->> 'key' = 'welcome-sign' and (b ->> 'status' = 'built' or (b ->> 'level')::integer > 1)), false),
         coalesce(bool_or(b ->> 'key' = 'warming-hut' and (b ->> 'status' = 'built' or (b ->> 'level')::integer > 1)), false)
  into v_sign, v_hut
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
    'board', jsonb_build_object(
      'open', v_hut,
      'roadmap', case when v_hut then coalesce((
        select jsonb_agg(jsonb_build_object('title', r.title, 'detail', r.detail) order by r.position)
        from news.roadmap r where not r.done), '[]'::jsonb) else '[]'::jsonb end
    )
  );
end;
$$;

revoke all on all functions in schema news from public, anon, authenticated;

create function public.news_get_newspaper(p_community_id uuid)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select news.newspaper_at(p_community_id, now())
$$;
comment on function public.news_get_newspaper(uuid) is
  'Today''s community newspaper: operator announcements, yesterday''s news lines (locked: welcome_sign until the Welcome sign is built), and the community board (roadmap) once the Warming hut is built.';

revoke all on function public.news_get_newspaper(uuid) from public;
grant execute on function public.news_get_newspaper(uuid) to anon, authenticated;
