-- Module: residency — lookups for invites and badges (requirement.md v1.25 §7.1, §12.3).

-- A player's first verification ever (the one invite rewards look at), or no row.
create function residency.first_verification(p_uid uuid)
returns table (community_id uuid, verified_on date)
language sql stable set search_path = ''
as $$
  select v.community_id, v.verified_on from residency.verifications v
  where v.user_id = p_uid
  order by v.verified_on, v.id
  limit 1
$$;

-- The community a player is a Verified Resident of on a day, or null.
create function residency.community_on(p_uid uuid, p_day date)
returns uuid
language sql stable set search_path = ''
as $$
  select r.community_id from residency.resident_on(p_uid, p_day) r
$$;

-- Communities whose first Verified Resident is this player (Founding Resident, §7.1). Stays true
-- after they move away (personal records follow the person, §6.4).
create function residency.founded_communities(p_uid uuid)
returns setof uuid
language sql stable set search_path = ''
as $$
  select f.community_id
  from (
    select distinct on (v.community_id) v.community_id, v.user_id
    from residency.verifications v
    where v.community_id in (select x.community_id from residency.verifications x where x.user_id = p_uid)
    order by v.community_id, v.verified_on, v.id
  ) f
  where f.user_id = p_uid
$$;

revoke all on function residency.first_verification(uuid) from public, anon, authenticated;
revoke all on function residency.community_on(uuid, date) from public, anon, authenticated;
revoke all on function residency.founded_communities(uuid) from public, anon, authenticated;
