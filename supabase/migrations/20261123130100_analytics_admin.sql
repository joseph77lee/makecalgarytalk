-- Modules: analytics (own, in Supabase) and admin (operator screen) — requirement.md v1.35 §17, §21.
--
-- analytics: one visit row per player per Calgary day, one view row per community seen that day,
-- and append-only share / invite-visit events (capped per player per day). Day-level only, no
-- times exposed, no location, no device data. Rows are deleted with the player's account.
-- admin: operators (added by hand in the SQL editor) can read the dashboard: daily visitors, new
-- visitors, % reaching the first action, D1/D7 retention, shares, invite visits, visits by
-- community, verification spike flags (§17: a community's daily new verifications above 3x its
-- usual level) and the number of email-update opt-ins.

create schema analytics;
revoke all on schema analytics from public, anon, authenticated;
create schema admin;
revoke all on schema admin from public, anon, authenticated;

create table analytics.visits (
  user_id uuid not null references auth.users (id) on delete cascade,
  calgary_day date not null,
  primary key (user_id, calgary_day)
);
alter table analytics.visits enable row level security;

create table analytics.community_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  calgary_day date not null,
  community_id uuid not null references gamecore.communities (id),
  primary key (user_id, calgary_day, community_id)
);
alter table analytics.community_views enable row level security;

create table analytics.events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  calgary_day date not null,
  kind text not null check (kind in ('share', 'invite_visit')),
  -- e.g. the share card kind ('weekly', 'built', 'revival', 'invite'); short, no free text
  detail text check (detail ~ '^[a-z0-9_-]{1,24}$'),
  community_id uuid references gamecore.communities (id),
  created_at timestamptz not null default now()
);
alter table analytics.events enable row level security;
create index on analytics.events (calgary_day, kind);
create index on analytics.events (user_id, calgary_day);

create function analytics.events_append_only()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'analytics.events is append-only' using errcode = '42501';
end;
$$;
create trigger events_append_only before update on analytics.events
  for each row execute function analytics.events_append_only();

create function analytics.max_events_per_day()
returns integer
language sql immutable set search_path = ''
as $$ select 50 $$;

-- A visit (and the community on screen, if any). Repeats on the same day change nothing.
create function analytics.visit_at(p_uid uuid, p_community_code text, p_now timestamptz)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community uuid;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into analytics.visits (user_id, calgary_day) values (p_uid, v_day) on conflict do nothing;
  if p_community_code is not null then
    v_community := gamecore.community_id_by_code('calgary', p_community_code);
    if v_community is not null then
      insert into analytics.community_views (user_id, calgary_day, community_id)
      values (p_uid, v_day, v_community) on conflict do nothing;
    end if;
  end if;
end;
$$;

-- A share or an invite-link visit. Above the daily cap the event is ignored (not an error).
create function analytics.event_at(p_uid uuid, p_kind text, p_detail text, p_community_code text, p_now timestamptz)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_kind not in ('share', 'invite_visit') then
    raise exception 'unknown event kind' using errcode = '22023';
  end if;
  if p_detail is not null and p_detail !~ '^[a-z0-9_-]{1,24}$' then
    raise exception 'bad event detail' using errcode = '22023';
  end if;
  if (select count(*) from analytics.events e where e.user_id = p_uid and e.calgary_day = v_day) >= analytics.max_events_per_day() then
    return;
  end if;
  insert into analytics.events (user_id, calgary_day, kind, detail, community_id)
  values (p_uid, v_day, p_kind, p_detail,
          case when p_community_code is null then null else gamecore.community_id_by_code('calgary', p_community_code) end);
end;
$$;

-- Daily figures between two Calgary days, as known on p_today. A player's first visit day is the
-- day they are "new". D1 / D7 = share of that day's new players who visited again 1 / 7 days later
-- (null until that day has fully passed). First action = new players who acted on their first day.
create function analytics.daily(p_from date, p_to date, p_today date)
returns jsonb
language sql stable set search_path = ''
as $$
  with firsts as (
    select v.user_id, min(v.calgary_day) as first_day from analytics.visits v group by v.user_id
  ), days as (
    select g::date as day from generate_series(p_from, least(p_to, p_today), interval '1 day') g
  ), rows as (
    select d.day,
      (select count(*) from analytics.visits v where v.calgary_day = d.day) as visitors,
      (select count(*) from firsts f where f.first_day = d.day) as new_visitors,
      (select count(*) from firsts f where f.first_day = d.day and gamecore.acted_between(f.user_id, d.day, d.day)) as first_action,
      case when d.day + 1 < p_today then
        (select count(*) from firsts f join analytics.visits v on v.user_id = f.user_id and v.calgary_day = d.day + 1 where f.first_day = d.day)
      end as d1,
      case when d.day + 7 < p_today then
        (select count(*) from firsts f join analytics.visits v on v.user_id = f.user_id and v.calgary_day = d.day + 7 where f.first_day = d.day)
      end as d7,
      (select count(*) from analytics.events e where e.calgary_day = d.day and e.kind = 'share') as shares,
      (select count(*) from analytics.events e where e.calgary_day = d.day and e.kind = 'invite_visit') as invite_visits
    from days d
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'day', r.day, 'visitors', r.visitors, 'new_visitors', r.new_visitors,
      'first_action_pct', case when r.new_visitors > 0 then round(100.0 * r.first_action / r.new_visitors) end,
      'd1_pct', case when r.new_visitors > 0 and r.d1 is not null then round(100.0 * r.d1 / r.new_visitors) end,
      'd7_pct', case when r.new_visitors > 0 and r.d7 is not null then round(100.0 * r.d7 / r.new_visitors) end,
      'shares', r.shares, 'invite_visits', r.invite_visits
    ) order by r.day desc), '[]'::jsonb)
  from rows r
$$;

-- Distinct visitors per community between two days, most visited first (at most p_limit).
create function analytics.community_visits(p_from date, p_to date, p_limit integer)
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('code', x.code, 'name', x.name, 'visitors', x.n) order by x.n desc, x.name), '[]'::jsonb)
  from (
    select c.code, c.name, count(distinct cv.user_id) as n
    from analytics.community_views cv
    join gamecore.communities c on c.id = cv.community_id
    where cv.calgary_day between p_from and p_to
    group by c.code, c.name
    order by n desc, c.name
    limit p_limit
  ) x
$$;

revoke all on function analytics.events_append_only() from public, anon, authenticated;
revoke all on function analytics.max_events_per_day() from public, anon, authenticated;
revoke all on function analytics.visit_at(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function analytics.event_at(uuid, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function analytics.daily(date, date, date) from public, anon, authenticated;
revoke all on function analytics.community_visits(date, date, integer) from public, anon, authenticated;

create function public.analytics_visit(p_community_code text default null)
returns void
language sql volatile security definer set search_path = ''
as $$ select analytics.visit_at(auth.uid(), p_community_code, now()) $$;
comment on function public.analytics_visit(text) is 'Records today''s visit (once per day) and the community on screen.';

create function public.analytics_event(p_kind text, p_detail text default null, p_community_code text default null)
returns void
language sql volatile security definer set search_path = ''
as $$ select analytics.event_at(auth.uid(), p_kind, p_detail, p_community_code, now()) $$;
comment on function public.analytics_event(text, text, text) is 'Records a share (detail = card kind) or an invite-link visit; capped per player per day.';

revoke all on function public.analytics_visit(text) from public;
revoke all on function public.analytics_event(text, text, text) from public;
grant execute on function public.analytics_visit(text) to authenticated;
grant execute on function public.analytics_event(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------------- admin

-- Operators are added by hand (SQL editor): insert into admin.operators (user_id, note) values (...).
create table admin.operators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  added_at timestamptz not null default now()
);
alter table admin.operators enable row level security;

create function admin.is_operator(p_uid uuid)
returns boolean
language sql stable set search_path = ''
as $$ select p_uid is not null and exists (select 1 from admin.operators o where o.user_id = p_uid) $$;

-- Verification spikes (§17): community-days in the window with at least 3 new verifications and
-- more than 3x the community's usual level (its daily average over the 28 days before that day).
create function admin.verification_spikes(p_from date, p_to date)
returns jsonb
language sql stable set search_path = ''
as $$
  with v as (select * from residency.daily_verifications(p_from - 28, p_to))
  select coalesce(jsonb_agg(jsonb_build_object('code', c.code, 'name', c.name, 'day', s.day,
                                               'verifications', s.verifications, 'usual', round(s.usual, 2))
                            order by s.day desc, s.verifications desc), '[]'::jsonb)
  from (
    select x.community_id, x.day, x.verifications,
           coalesce((select sum(y.verifications) from v y
                     where y.community_id = x.community_id and y.day between x.day - 28 and x.day - 1), 0) / 28.0 as usual
    from v x
    where x.day between p_from and p_to
  ) s
  join gamecore.communities c on c.id = s.community_id
  where s.verifications >= 3 and s.verifications > 3 * s.usual
$$;

create function admin.dashboard_at(p_uid uuid, p_days integer, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_today date := common.calgary_day(p_now);
  v_days integer := least(greatest(coalesce(p_days, 28), 1), 120);
  v_from date := v_today - (v_days - 1);
begin
  if not admin.is_operator(p_uid) then
    raise exception 'operators only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'today', v_today,
    'days', analytics.daily(v_from, v_today, v_today),
    'communities_7d', analytics.community_visits(v_today - 6, v_today, 20),
    'spikes', admin.verification_spikes(v_today - 13, v_today),
    'email_updates', identity.email_updates_count()
  );
end;
$$;

revoke all on function admin.is_operator(uuid) from public, anon, authenticated;
revoke all on function admin.verification_spikes(date, date) from public, anon, authenticated;
revoke all on function admin.dashboard_at(uuid, integer, timestamptz) from public, anon, authenticated;

create function public.admin_dashboard(p_days integer default 28)
returns jsonb
language sql volatile security definer set search_path = ''
as $$ select admin.dashboard_at(auth.uid(), p_days, now()) $$;
comment on function public.admin_dashboard(integer) is
  'Operators only: {today, days: [{day, visitors, new_visitors, first_action_pct, d1_pct, d7_pct, shares, invite_visits}], '
  'communities_7d: [{code, name, visitors}], spikes: [{code, name, day, verifications, usual}], email_updates}.';

revoke all on function public.admin_dashboard(integer) from public;
grant execute on function public.admin_dashboard(integer) to authenticated;
