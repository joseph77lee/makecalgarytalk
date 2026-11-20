-- Module: identity — nickname lookup for other modules (nicknames are public: house name tags).

create function identity.nickname(p_uid uuid)
returns text
language sql stable set search_path = ''
as $$
  select p.nickname from identity.profiles p where p.user_id = p_uid
$$;

revoke all on function identity.nickname(uuid) from public, anon, authenticated;
