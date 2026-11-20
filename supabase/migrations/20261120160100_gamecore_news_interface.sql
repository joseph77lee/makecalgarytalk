-- Module: gamecore — lookups for the newspaper (requirement.md v1.27 §11).

-- Residents who helped a community on a day (applied help only; pending help is not news yet).
create function gamecore.helpers_on(p_community_id uuid, p_day date)
returns setof uuid
language sql stable set search_path = ''
as $$
  select a.user_id from gamecore.actions a
  where a.community_id = p_community_id and a.calgary_day = p_day and not a.pending
  group by a.user_id
  order by min(a.created_at)
$$;

revoke all on function gamecore.helpers_on(uuid, date) from public, anon, authenticated;
