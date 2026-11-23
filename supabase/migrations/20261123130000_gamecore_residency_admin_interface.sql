-- Modules: gamecore, residency — read-only inputs for analytics and the admin screen
-- (requirement.md v1.35 §17, §21). Read by those modules only (no grants to API roles).

-- True when the player took at least one action between two Calgary days (inclusive).
create function gamecore.acted_between(p_uid uuid, p_from date, p_to date)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (select 1 from gamecore.actions a where a.user_id = p_uid and a.calgary_day between p_from and p_to)
$$;

-- New verifications (first or move) per community and Calgary day, between two days (inclusive).
create function residency.daily_verifications(p_from date, p_to date)
returns table (community_id uuid, day date, verifications integer)
language sql stable set search_path = ''
as $$
  select v.community_id, v.verified_on, count(*)::integer
  from residency.verifications v
  where v.verified_on between p_from and p_to
  group by v.community_id, v.verified_on
$$;

revoke all on function gamecore.acted_between(uuid, date, date) from public, anon, authenticated;
revoke all on function residency.daily_verifications(date, date) from public, anon, authenticated;
