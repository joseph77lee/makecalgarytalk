-- Module: gamecore — game rules and RPC (requirement.md §7.7, §8, §20.3, §20.3b).
--
-- Rules (all enforced here, never trusted from the client):
--   * 3 energy per player per Calgary day (America/Edmonton midnight, common.calgary_day()).
--   * An action targets an ACTIVE project of the player's own community.
--   * Project progress counts actions from BEFORE today (progress shows the next day).
--   * Actions are append-only with client-generated ids; a repeated id is a no-op.
--   * 3 projects are active at a time; when one completes, the next starts on the day
--     its completion becomes visible (rows are written only when a project starts).
--
-- Internal functions take the time and user as arguments so tests can move through days.
-- Public RPCs (`public.gamecore_*`) pass now() and auth.uid().

-- Starting values (requirement.md §22.8, tune after launch).
create function gamecore.energy_per_day() returns integer
language sql immutable set search_path = '' as $$ select 3 $$;

create function gamecore.active_project_count() returns integer
language sql immutable set search_path = '' as $$ select 3 $$;

create function gamecore.max_actions_per_call() returns integer
language sql immutable set search_path = '' as $$ select 10 $$;

-- Required actions: 5 per active resident at project start (min 10), ×1.25 per catalog cycle.
create function gamecore.required_actions(p_members integer, p_level integer)
returns integer
language sql immutable set search_path = ''
as $$
  select ceil(greatest(10, 5 * greatest(p_members, 0)) * power(1.25, greatest(p_level, 1) - 1))::integer
$$;

-- Residents who count for project size on a day: players of the community whose last
-- active day (later of joining and last action, §7.2) is within the last 30 Calgary days.
-- Until Residency (M7), joining the community stands in for the verification day.
create function gamecore.member_count(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer
  from gamecore.players pl
  where pl.community_id = p_community_id
    and pl.joined_on <= p_day
    and greatest(
          pl.joined_on,
          coalesce((select max(a.calgary_day) from gamecore.actions a
                    where a.user_id = pl.user_id and a.calgary_day <= p_day), pl.joined_on)
        ) > p_day - 30
$$;

-- Progress shown on a day = actions from earlier days.
create function gamecore.applied_progress(p_project_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from gamecore.actions a
  where a.project_id = p_project_id and a.calgary_day < p_day
$$;

-- Day a project's completion became visible (day after the action that reached the goal), or null.
create function gamecore.completed_on(p_project_id uuid)
returns date
language sql stable set search_path = ''
as $$
  select min(d.calgary_day) + 1
  from (
    select per_day.calgary_day,
           sum(per_day.n) over (order by per_day.calgary_day) as total
    from (select a.calgary_day, count(*) as n from gamecore.actions a
          where a.project_id = p_project_id group by a.calgary_day) per_day
  ) d
  join gamecore.projects p on p.id = p_project_id
  where d.total >= p.required_actions
$$;

-- Makes sure the community has its active projects on this day (starts the next ones).
create function gamecore.ensure_projects(p_community_id uuid, p_day date)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_active integer;
  v_next integer;
  v_cycle integer;
  v_pos integer;
  v_kind text;
  v_title text;
  v_level integer;
  v_members integer;
begin
  select count(*) into v_active from gamecore.projects p
  where p.community_id = p_community_id and p.started_on <= p_day
    and gamecore.applied_progress(p.id, p_day) < p.required_actions;
  if v_active >= gamecore.active_project_count() then
    return;
  end if;

  -- Serialize project creation per community (reads that find enough projects never lock).
  perform pg_advisory_xact_lock(hashtextextended('gamecore.projects:' || p_community_id::text, 0));
  select count(*) into v_active from gamecore.projects p
  where p.community_id = p_community_id and p.started_on <= p_day
    and gamecore.applied_progress(p.id, p_day) < p.required_actions;

  select count(*) into v_cycle from gamecore.project_catalog;
  v_members := gamecore.member_count(p_community_id, p_day);

  while v_active < gamecore.active_project_count() loop
    select coalesce(max(p.seq), 0) + 1 into v_next from gamecore.projects p where p.community_id = p_community_id;
    v_pos := ((v_next - 1) % v_cycle) + 1;
    v_level := ((v_next - 1) / v_cycle) + 1;
    select c.kind, c.title into v_kind, v_title from gamecore.project_catalog c where c.position = v_pos;
    insert into gamecore.projects (community_id, seq, kind, title, level, required_actions, started_on)
    values (p_community_id, v_next, v_kind, v_title, v_level, gamecore.required_actions(v_members, v_level), p_day);
    v_active := v_active + 1;
  end loop;
end;
$$;

create function gamecore.energy_used(p_uid uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from gamecore.actions a where a.user_id = p_uid and a.calgary_day = p_day
$$;

create function gamecore.day_info(p_day date)
returns jsonb
language sql stable set search_path = ''
as $$
  select jsonb_build_object('calgary_day', p_day, 'next_day_start', common.calgary_day_start(p_day + 1))
$$;

-- Community state as seen on the Calgary day of p_now. p_uid may be null (visitor).
create function gamecore.community_state_at(p_community_id uuid, p_now timestamptz, p_uid uuid)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_community jsonb;
  v_active jsonb;
  v_completed jsonb;
  v_me jsonb := null;
  v_player_community uuid;
begin
  select jsonb_build_object('id', c.id, 'code', c.code, 'name', c.name, 'sector', c.sector, 'population', c.population)
  into v_community from gamecore.communities c where c.id = p_community_id;
  if v_community is null then
    raise exception 'community not found' using errcode = 'P0002';
  end if;

  perform gamecore.ensure_projects(p_community_id, v_day);

  with prog as (
    select p.*, least(gamecore.applied_progress(p.id, v_day), p.required_actions) as progress
    from gamecore.projects p
    where p.community_id = p_community_id and p.started_on <= v_day
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'seq', seq, 'kind', kind, 'title', title, 'level', level,
      'required', required_actions, 'progress', progress,
      'stage', case when progress * 2 < required_actions then 'scaffolding' else 'frame' end
    ) order by seq) filter (where progress < required_actions), '[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'seq', seq, 'kind', kind, 'title', title, 'level', level,
      'completed_on', gamecore.completed_on(id)
    ) order by seq) filter (where progress >= required_actions), '[]'::jsonb)
  into v_active, v_completed
  from prog;

  if p_uid is not null then
    select pl.community_id into v_player_community from gamecore.players pl where pl.user_id = p_uid;
    v_me := jsonb_build_object(
      'member', v_player_community is not distinct from p_community_id,
      'energy_max', gamecore.energy_per_day(),
      'energy_left', gamecore.energy_per_day() - gamecore.energy_used(p_uid, v_day)
    );
  end if;

  return gamecore.day_info(v_day) || jsonb_build_object(
    'community', v_community,
    'projects', v_active,
    'completed_projects', v_completed,
    'me', v_me
  );
end;
$$;

-- Submit a batch of actions: [{ "id": uuid, "project_id": uuid }, ...].
-- Each entry gets a status: accepted | duplicate | rejected (with a reason).
create function gamecore.submit_actions_at(p_uid uuid, p_actions jsonb, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_max integer := gamecore.energy_per_day();
  v_community uuid;
  v_used integer;
  v_results jsonb := '[]'::jsonb;
  v_entry jsonb;
  v_id uuid;
  v_project_id uuid;
  v_project gamecore.projects;
  v_existing gamecore.actions;
  v_inserted uuid;
  v_status text;
  v_reason text;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_actions is null or jsonb_typeof(p_actions) <> 'array' then
    raise exception 'actions must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_actions) > gamecore.max_actions_per_call() then
    raise exception 'at most % actions per call', gamecore.max_actions_per_call() using errcode = '22023';
  end if;

  -- One submission per player at a time, so the energy count cannot race.
  perform pg_advisory_xact_lock(hashtextextended('gamecore.energy:' || p_uid::text, 0));

  select pl.community_id into v_community from gamecore.players pl where pl.user_id = p_uid;
  v_used := gamecore.energy_used(p_uid, v_day);
  if v_community is not null then
    perform gamecore.ensure_projects(v_community, v_day);
  end if;

  for v_entry in select e from jsonb_array_elements(p_actions) e loop
    v_status := 'rejected';
    v_reason := null;
    v_id := null;
    v_project_id := null;
    begin
      v_id := (v_entry ->> 'id')::uuid;
      v_project_id := (v_entry ->> 'project_id')::uuid;
    exception when invalid_text_representation then
      null;
    end;

    if v_id is null or v_project_id is null then
      v_reason := 'invalid';
    else
      select a.* into v_existing from gamecore.actions a where a.id = v_id;
      if found then
        if v_existing.user_id = p_uid then
          v_status := 'duplicate'; -- already recorded (retry): no extra energy spent
        else
          v_reason := 'id_conflict';
        end if;
      elsif v_community is null then
        v_reason := 'not_member';
      else
        select p.* into v_project from gamecore.projects p where p.id = v_project_id;
        if not found then
          v_reason := 'project_not_found';
        elsif v_project.community_id <> v_community then
          v_reason := 'other_community';
        elsif v_project.started_on > v_day
           or gamecore.applied_progress(v_project.id, v_day) >= v_project.required_actions then
          v_reason := 'project_not_active';
        elsif v_used >= v_max then
          v_reason := 'no_energy';
        else
          insert into gamecore.actions (id, user_id, community_id, project_id, calgary_day, energy_slot)
          values (v_id, p_uid, v_community, v_project.id, v_day, v_used + 1)
          on conflict (id) do nothing
          returning id into v_inserted;
          if v_inserted is null then
            v_reason := 'id_conflict'; -- another player used this id at the same moment
          else
            v_used := v_used + 1;
            v_status := 'accepted';
          end if;
          v_inserted := null;
        end if;
      end if;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_strip_nulls(jsonb_build_object('id', v_entry -> 'id', 'status', v_status, 'reason', v_reason))
    );
  end loop;

  return gamecore.day_info(v_day) || jsonb_build_object(
    'energy_max', v_max,
    'energy_left', v_max - v_used,
    'results', v_results
  );
end;
$$;

-- TEMPORARY until Residency (M7): join a community by choosing it from the list.
create function gamecore.choose_community_at(p_uid uuid, p_community_id uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from gamecore.communities c where c.id = p_community_id) then
    raise exception 'community not found' using errcode = 'P0002';
  end if;
  insert into gamecore.players (user_id, community_id, joined_on)
  values (p_uid, p_community_id, v_day)
  on conflict (user_id) do update
    set community_id = excluded.community_id,
        joined_on = case when gamecore.players.community_id = excluded.community_id
                         then gamecore.players.joined_on else excluded.joined_on end;
  return gamecore.me_at(p_uid, p_now);
end;
$$;

create function gamecore.me_at(p_uid uuid, p_now timestamptz)
returns jsonb
language sql stable set search_path = ''
as $$
  select gamecore.day_info(common.calgary_day(p_now)) || jsonb_build_object(
    'community_id', (select pl.community_id from gamecore.players pl where pl.user_id = p_uid),
    'energy_max', gamecore.energy_per_day(),
    'energy_left', gamecore.energy_per_day() - gamecore.energy_used(p_uid, common.calgary_day(p_now))
  )
$$;

-- ---------------------------------------------------------------------------
-- Public RPC (the only callable surface). Security definer: they run the rules
-- above with access to the gamecore schema; callers never touch tables directly.
-- ---------------------------------------------------------------------------

create function public.gamecore_list_communities()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'code', c.code, 'name', c.name, 'sector', c.sector, 'population', c.population
  ) order by c.name), '[]'::jsonb)
  from gamecore.communities c
$$;
comment on function public.gamecore_list_communities() is
  'All game communities: id, code, name, sector, population.';

create function public.gamecore_get_community_state(p_community_id uuid)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select gamecore.community_state_at(p_community_id, now(), auth.uid())
$$;
comment on function public.gamecore_get_community_state(uuid) is
  'Community state on the current Calgary day: active and completed projects (progress up to yesterday), plus my energy when signed in.';

create function public.gamecore_submit_actions(p_actions jsonb)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select gamecore.submit_actions_at(auth.uid(), p_actions, now())
$$;
comment on function public.gamecore_submit_actions(jsonb) is
  'Submit actions [{id, project_id}] (idempotent by id). Returns per-action status and energy left.';

create function public.gamecore_get_me()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  return gamecore.me_at(auth.uid(), now());
end;
$$;
comment on function public.gamecore_get_me() is
  'My community and energy for the current Calgary day.';

create function public.gamecore_choose_community(p_community_id uuid)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select gamecore.choose_community_at(auth.uid(), p_community_id, now())
$$;
comment on function public.gamecore_choose_community(uuid) is
  'TEMPORARY until Residency (M7): join a community chosen from the list.';

revoke all on all functions in schema gamecore from public, anon, authenticated;
revoke all on function public.gamecore_list_communities() from public;
revoke all on function public.gamecore_get_community_state(uuid) from public;
revoke all on function public.gamecore_submit_actions(jsonb) from public;
revoke all on function public.gamecore_get_me() from public;
revoke all on function public.gamecore_choose_community(uuid) from public;

grant execute on function public.gamecore_list_communities() to anon, authenticated;
grant execute on function public.gamecore_get_community_state(uuid) to anon, authenticated;
grant execute on function public.gamecore_submit_actions(jsonb) to authenticated;
grant execute on function public.gamecore_get_me() to authenticated;
grant execute on function public.gamecore_choose_community(uuid) to authenticated;
