-- Module: gamecore — inputs for the weekly ranking (requirement.md v1.31 §12.1).
-- Read by the ranking module only (no grants to API roles).

-- Activity of every community with residents between two Calgary days (inclusive), as known on
-- p_today: finished days come from the stored community days (recorded here when missing), today
-- from the live day stats. Days after p_today count as 0.
--   acted_days       = sum over the days of Verified Residents who acted that day (once per day)
--   acting_residents = distinct Verified Residents who acted on at least one of the days
create function gamecore.week_activity(p_from date, p_to date, p_today date)
returns table (community_id uuid, code text, name text, population integer, acted_days integer, acting_residents integer)
language plpgsql set search_path = ''
as $$
declare
  v_last date := least(p_to, p_today);
  v_id uuid;
begin
  for v_id in select r from residency.communities_with_residents() r loop
    perform gamecore.ensure_days(v_id, p_today);
  end loop;
  return query
  select c.id, c.code, c.name, c.population,
         (coalesce((select sum(d.acted) from gamecore.community_days d
                    where d.community_id = c.id and d.day between p_from and least(v_last, p_today - 1)), 0)
          + case when p_today between p_from and v_last
                 then coalesce((select s.acted from gamecore.day_stats(c.id, p_today) s), 0) else 0 end)::integer,
         (select count(distinct m.user_id)
          from generate_series(p_from, v_last, interval '1 day') g(day)
          cross join lateral gamecore.members_on(c.id, g.day::date) m
          where exists (select 1 from gamecore.actions a
                        where a.user_id = m.user_id and a.community_id = c.id and a.calgary_day = g.day::date))::integer
  from gamecore.communities c
  where c.id in (select r from residency.communities_with_residents() r);
end;
$$;

-- The community a player plays in on a day (home, as in gamecore.me_at), or nothing.
create function gamecore.home_community(p_uid uuid, p_day date)
returns table (id uuid, code text, name text)
language sql stable set search_path = ''
as $$
  select c.id, c.code, c.name from residency.play_on(p_uid, p_day) p join gamecore.communities c on c.id = p.community_id
$$;

revoke all on function gamecore.week_activity(date, date, date) from public, anon, authenticated;
revoke all on function gamecore.home_community(uuid, date) from public, anon, authenticated;
