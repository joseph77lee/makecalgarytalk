-- Module: invites — badges list adds Community Reporter (posts, requirement.md v1.28 §14).

create or replace function invites.badges_at(p_uid uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  with founded as (
    select jsonb_build_object('key', 'founding_resident', 'community', gamecore.community_name(f)) as b
    from residency.founded_communities(p_uid) f
  ), counts as (
    select
      (select count(*) from invites.acceptances a where a.inviter_id = p_uid and invites.rewarded(a.invitee_id))
        + case when invites.rewarded(p_uid) then 1 else 0 end as good,
      (select count(*) from invites.acceptances a where a.inviter_id = p_uid and invites.pioneered(a.invitee_id)) as pioneer
  )
  select coalesce((select jsonb_agg(b order by b ->> 'community') from founded), '[]'::jsonb)
         || case when c.good > 0 then jsonb_build_array(jsonb_build_object('key', 'good_neighbour', 'count', c.good)) else '[]'::jsonb end
         || case when c.pioneer > 0 then jsonb_build_array(jsonb_build_object('key', 'pioneer_sponsor', 'count', c.pioneer)) else '[]'::jsonb end
         || case when posts.thanks_received(p_uid) >= posts.reporter_thanks() then jsonb_build_array(jsonb_build_object('key', 'community_reporter')) else '[]'::jsonb end
  from counts c
$$;

revoke all on function invites.badges_at(uuid) from public, anon, authenticated;
