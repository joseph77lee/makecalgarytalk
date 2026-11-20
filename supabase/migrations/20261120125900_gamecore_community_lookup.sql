-- Module: gamecore — community lookups for other modules (reference data stays in gamecore).

create function gamecore.community_id_by_code(p_city text, p_code text)
returns uuid
language sql stable set search_path = ''
as $$
  select c.id from gamecore.communities c where c.city = p_city and c.code = p_code
$$;

create function gamecore.community_name(p_community_id uuid)
returns text
language sql stable set search_path = ''
as $$
  select c.name from gamecore.communities c where c.id = p_community_id
$$;

revoke all on function gamecore.community_id_by_code(text, text) from public, anon, authenticated;
revoke all on function gamecore.community_name(uuid) from public, anon, authenticated;
