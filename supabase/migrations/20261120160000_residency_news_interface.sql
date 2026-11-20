-- Module: residency — lookups for the newspaper (requirement.md v1.27 §11, §6.4).

-- People verified into a community on a day (new neighbours: first verification or moved in).
create function residency.arrivals_on(p_community_id uuid, p_day date)
returns setof uuid
language sql stable set search_path = ''
as $$
  select v.user_id from residency.verifications v
  where v.community_id = p_community_id and v.verified_on = p_day
    -- not a re-verification into the community they already lived in
    and residency.community_on(v.user_id, p_day - 1) is distinct from p_community_id
  order by v.id
$$;

-- People who moved away from a community on a day, with where they moved to (farewell line).
create function residency.departures_on(p_community_id uuid, p_day date)
returns table (user_id uuid, to_community_id uuid)
language sql stable set search_path = ''
as $$
  select v.user_id, v.community_id from residency.verifications v
  where v.verified_on = p_day and v.community_id <> p_community_id
    and residency.community_on(v.user_id, p_day - 1) = p_community_id
  order by v.id
$$;

revoke all on function residency.arrivals_on(uuid, date) from public, anon, authenticated;
revoke all on function residency.departures_on(uuid, date) from public, anon, authenticated;
