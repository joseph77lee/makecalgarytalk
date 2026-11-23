-- Module: gamecore — World Map summary (requirement.md v1.29 §9).
-- One row per community that has a snapshot (communities with residents are rebuilt every
-- 5 minutes): level from built buildings, Vitality and cumulative residents. Communities missing
-- from the list are unsettled. Read straight from the stored snapshots (no rebuild here).

create function gamecore.built_in(p_state jsonb, p_key text)
returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(bool_or(b ->> 'key' = p_key and (b ->> 'status' = 'built' or (b ->> 'level')::integer > 1)), false)
  from jsonb_array_elements(p_state -> 'buildings') b
$$;

create function gamecore.world_map()
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'code', c.code,
      'id', c.id,
      'level', case
        when not gamecore.built_in(s.state, 'welcome-sign') then 0
        when gamecore.built_in(s.state, 'neighbourhood-park') then 4
        when gamecore.built_in(s.state, 'community-hall') then 3
        when gamecore.built_in(s.state, 'playground') or gamecore.built_in(s.state, 'skating-rink') then 2
        else 1 end,
      'vitality', s.state -> 'community' -> 'vitality',
      'residents', coalesce((s.state -> 'community' ->> 'residents')::integer, 0)
    ) order by c.code), '[]'::jsonb)
  from gamecore.community_snapshots s
  join gamecore.communities c on c.id = s.community_id
$$;

revoke all on function gamecore.built_in(jsonb, text) from public, anon, authenticated;
revoke all on function gamecore.world_map() from public, anon, authenticated;

create function public.gamecore_world_map()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select gamecore.world_map()
$$;
comment on function public.gamecore_world_map() is
  'World Map: [{code, id, level 0-4, vitality, residents}] for communities with a snapshot; any other community is unsettled.';

revoke all on function public.gamecore_world_map() from public;
grant execute on function public.gamecore_world_map() to anon, authenticated;
