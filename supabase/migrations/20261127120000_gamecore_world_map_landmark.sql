-- World Map landmark icon (requirement.md v1.49 §9): at development level 4 the map draws the
-- community's signature landmark, so the status list also names it (the persona track's step 4,
-- taken from the snapshot like the level). Null below level 4.
create or replace function gamecore.world_map()
returns jsonb
language sql stable set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'code', c.code,
      'id', c.id,
      'level', coalesce((s.state -> 'community' ->> 'level')::integer, 0),
      'vitality', s.state -> 'community' -> 'vitality',
      'residents', coalesce((s.state -> 'community' ->> 'residents')::integer, 0),
      'landmark', case when coalesce((s.state -> 'community' ->> 'level')::integer, 0) >= 4 then
        (select b ->> 'key' from jsonb_array_elements(s.state -> 'buildings') b
          where b ->> 'track' = 'persona' and (b ->> 'step')::integer = 4 limit 1)
        end
    ) order by c.code), '[]'::jsonb)
  from gamecore.communities c
  left join gamecore.community_snapshots s on s.community_id = c.id
$$;

revoke all on function gamecore.world_map() from public, anon, authenticated;
