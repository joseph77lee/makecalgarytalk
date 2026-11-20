-- Module: residency — lookups for houses (requirement.md v1.26 §7.2).

-- Verified Residents of a community on a day, INCLUDING those with a move in progress (they keep
-- their house in the old community until the move completes, §6.4).
create function residency.residents_on(p_community_id uuid, p_day date)
returns table (user_id uuid, verified_on date)
language sql stable set search_path = ''
as $$
  select r.user_id, r.verified_on
  from (
    select distinct on (v.user_id) v.user_id, v.community_id, v.verified_on
    from residency.verifications v
    where v.verified_on <= p_day
      and v.user_id in (select x.user_id from residency.verifications x where x.community_id = p_community_id)
    order by v.user_id, v.verified_on desc, v.id desc
  ) r
  where r.community_id = p_community_id
$$;

-- The community's first Verified Resident (Founding Resident, §7.1), or null.
create function residency.founder_of(p_community_id uuid)
returns uuid
language sql stable set search_path = ''
as $$
  select v.user_id from residency.verifications v
  where v.community_id = p_community_id
  order by v.verified_on, v.id
  limit 1
$$;

revoke all on function residency.residents_on(uuid, date) from public, anon, authenticated;
revoke all on function residency.founder_of(uuid) from public, anon, authenticated;
