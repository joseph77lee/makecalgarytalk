-- Module: residency — rules (requirement.md v1.23 §6.2–§6.4).
--
--   * Location check: the server finds the residential community containing the point, then
--     forgets the coordinates. Checks with accuracy worse than 1 km are not counted; at most 20
--     checks per account per Calgary day.
--   * Verification: check-ins from the same community on 3 different Calgary days within 7
--     (today and the 6 days before) → Verified Resident. No location checks afterwards.
--   * Candidate community while verifying: most check-in days in the window, tie → most recent.
--     The player plays there; their actions are pending until they are verified there.
--   * Moving: started by the player; check-ins from the move's start in other communities count
--     toward re-verification; cancelled automatically after 7 days or by the player. While moving
--     the player is not counted in the old community's streak/Vitality denominators.
--     Cooldown 90 days from the last completed move, or from the first verification before any
--     move; one free correction within 14 days of the first verification.

-- Rule values ------------------------------------------------------------------------------

create function residency.max_checks_per_day() returns integer language sql immutable as $$ select 20 $$;
create function residency.max_accuracy_m() returns integer language sql immutable as $$ select 1000 $$;
create function residency.days_to_verify() returns integer language sql immutable as $$ select 3 $$;
create function residency.window_days() returns integer language sql immutable as $$ select 7 $$;
create function residency.move_days() returns integer language sql immutable as $$ select 7 $$;
create function residency.cooldown_days() returns integer language sql immutable as $$ select 90 $$;
create function residency.correction_days() returns integer language sql immutable as $$ select 14 $$;

-- Lookups -----------------------------------------------------------------------------------

-- Residential community containing a point (the smallest one if boundaries overlap); null outside.
create function residency.community_at_point(p_lat double precision, p_lon double precision)
returns uuid
language sql stable set search_path = ''
as $$
  select b.community_id
  from residency.boundaries b
  where extensions.st_covers(b.area, extensions.st_setsrid(extensions.st_makepoint(p_lon, p_lat), 4326))
  order by extensions.st_area(b.area)
  limit 1
$$;

-- The community a player is a Verified Resident of on a day (latest verification), or no row.
create function residency.resident_on(p_uid uuid, p_day date)
returns table (community_id uuid, verified_on date)
language sql stable set search_path = ''
as $$
  select v.community_id, v.verified_on
  from residency.verifications v
  where v.user_id = p_uid and v.verified_on <= p_day
  order by v.verified_on desc, v.id desc
  limit 1
$$;

-- Whether a move is in progress on a day.
create function residency.move_active(p_move residency.moves, p_day date)
returns boolean
language sql immutable set search_path = ''
as $$
  select p_move.started_on <= p_day
     and p_day < coalesce(p_move.ended_on, p_move.started_on + residency.move_days())
$$;

-- The move in progress on a day, or no row.
create function residency.move_on(p_uid uuid, p_day date)
returns setof residency.moves
language sql stable set search_path = ''
as $$
  select m.* from residency.moves m
  where m.user_id = p_uid and residency.move_active(m, p_day)
  order by m.started_on desc, m.id desc
  limit 1
$$;

-- Days with a check-in from a community in the window ending on p_day (from p_from on).
create function residency.check_in_days(p_uid uuid, p_community_id uuid, p_day date, p_from date)
returns integer
language sql stable set search_path = ''
as $$
  select count(*)::integer from residency.check_ins c
  where c.user_id = p_uid and c.community_id = p_community_id
    and c.calgary_day between greatest(p_day - residency.window_days() + 1, coalesce(p_from, p_day - residency.window_days() + 1)) and p_day
$$;

-- Candidate community while verifying or moving: most check-in days in the window (during a move:
-- from its start, not the current community), tie → the most recent check-in. No row otherwise.
create function residency.candidate_on(p_uid uuid, p_day date)
returns table (community_id uuid, days integer, checked_today boolean)
language plpgsql stable set search_path = ''
as $$
declare
  v_resident record;
  v_move residency.moves;
begin
  select * into v_resident from residency.resident_on(p_uid, p_day);
  if v_resident.community_id is not null then
    select * into v_move from residency.move_on(p_uid, p_day);
    if v_move.id is null then
      return; -- verified and not moving: no candidate
    end if;
  end if;
  return query
    select c.community_id, count(*)::integer, bool_or(c.calgary_day = p_day)
    from residency.check_ins c
    where c.user_id = p_uid
      and c.calgary_day between p_day - residency.window_days() + 1 and p_day
      and (v_move.id is null or (c.calgary_day >= v_move.started_on and c.community_id <> v_resident.community_id))
    group by c.community_id
    order by count(*) desc, max(c.latest) desc
    limit 1;
end;
$$;

-- Interface for gamecore ------------------------------------------------------------------

-- Verified Residents counted for a community on a day (streak, Vitality, project size): their
-- latest verification on or before the day is into this community and no move is in progress.
create function residency.counted_residents_on(p_community_id uuid, p_day date)
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
    and not exists (select 1 from residency.moves m where m.user_id = r.user_id and residency.move_active(m, p_day))
$$;

-- Distinct people ever verified in a community up to a day (never shrinks, §7.8).
create function residency.cumulative_residents_on(p_community_id uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(distinct v.user_id)::integer from residency.verifications v
  where v.community_id = p_community_id and v.verified_on <= p_day
$$;

create function residency.first_day(p_community_id uuid)
returns date
language sql stable set search_path = ''
as $$
  select min(v.verified_on) from residency.verifications v where v.community_id = p_community_id
$$;

create function residency.communities_with_residents()
returns setof uuid
language sql stable set search_path = ''
as $$
  select distinct v.community_id from residency.verifications v
$$;

-- Last time something changed a community's residents (verification into it, move from it).
create function residency.changed_at(p_community_id uuid)
returns timestamptz
language sql stable set search_path = ''
as $$
  select greatest(
    (select max(v.created_at) from residency.verifications v where v.community_id = p_community_id),
    (select max(m.changed_at) from residency.moves m where m.from_community_id = p_community_id)
  )
$$;

-- The community a player plays in on a day and whether their actions there are pending:
-- verified → their community; verifying → the candidate (pending); moving → the candidate
-- (pending), or still the old community before any check-in elsewhere. No row = no community.
create function residency.play_on(p_uid uuid, p_day date)
returns table (community_id uuid, pending boolean)
language plpgsql stable set search_path = ''
as $$
declare
  v_resident record;
  v_candidate record;
begin
  select * into v_resident from residency.resident_on(p_uid, p_day);
  select * into v_candidate from residency.candidate_on(p_uid, p_day);
  if v_candidate.community_id is not null then
    return query select v_candidate.community_id, true;
  elsif v_resident.community_id is not null then
    return query select v_resident.community_id, false;
  end if;
end;
$$;

-- Day a pending action starts to count: the first day on or after it that the player is verified
-- in that community; null if never (contributions in other communities are not applied).
create function residency.applied_on(p_uid uuid, p_community_id uuid, p_day date)
returns date
language sql stable set search_path = ''
as $$
  select min(v.verified_on) from residency.verifications v
  where v.user_id = p_uid and v.community_id = p_community_id and v.verified_on >= p_day
$$;

-- Records a verification (first or completed move).
create function residency.record_verification(p_uid uuid, p_community_id uuid, p_day date, p_at timestamptz)
returns void
language sql volatile set search_path = ''
as $$
  insert into residency.verifications (user_id, community_id, verified_on, kind, created_at)
  select p_uid, p_community_id, p_day,
         case when exists (select 1 from residency.verifications v where v.user_id = p_uid) then 'move' else 'first' end,
         p_at
$$;

-- Seed and tests only: makes a player a Verified Resident of a community right away.
create function residency.add_verified_resident_at(p_uid uuid, p_community_id uuid, p_now timestamptz)
returns void
language plpgsql set search_path = ''
as $$
declare
  v_current uuid;
begin
  select r.community_id into v_current from residency.resident_on(p_uid, common.calgary_day(p_now)) r;
  if v_current is distinct from p_community_id then
    perform residency.record_verification(p_uid, p_community_id, common.calgary_day(p_now), p_now);
  end if;
end;
$$;

-- Status -----------------------------------------------------------------------------------

create function residency.community_json(p_community_id uuid)
returns jsonb
language sql stable set search_path = ''
as $$
  select case when p_community_id is null then null
              else jsonb_build_object('id', p_community_id, 'name', gamecore.community_name(p_community_id)) end
$$;

-- Whether a move may start today and why not.
create function residency.can_move_at(p_uid uuid, p_day date)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_first date;
  v_last_move date;
  v_cooldown_until date;
  v_correction_left boolean;
begin
  select min(v.verified_on) into v_first from residency.verifications v where v.user_id = p_uid and v.verified_on <= p_day;
  if v_first is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_verified');
  end if;
  if exists (select 1 from residency.move_on(p_uid, p_day)) then
    return jsonb_build_object('allowed', false, 'reason', 'moving');
  end if;
  select max(m.ended_on) into v_last_move from residency.moves m where m.user_id = p_uid and m.outcome = 'completed';
  v_cooldown_until := coalesce(v_last_move, v_first) + residency.cooldown_days();
  if p_day >= v_cooldown_until then
    return jsonb_build_object('allowed', true, 'free_correction', false);
  end if;
  v_correction_left := not exists (select 1 from residency.moves m
                                   where m.user_id = p_uid and m.outcome = 'completed' and m.free_correction);
  if v_correction_left and p_day < v_first + residency.correction_days() then
    return jsonb_build_object('allowed', true, 'free_correction', true,
                              'correction_until', v_first + residency.correction_days() - 1);
  end if;
  return jsonb_build_object('allowed', false, 'reason', 'cooldown', 'available_on', v_cooldown_until);
end;
$$;

create function residency.status_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_resident record;
  v_move residency.moves;
  v_candidate record;
  v_play record;
  v_checks integer;
begin
  select * into v_resident from residency.resident_on(p_uid, v_day);
  select * into v_move from residency.move_on(p_uid, v_day);
  select * into v_candidate from residency.candidate_on(p_uid, v_day);
  select * into v_play from residency.play_on(p_uid, v_day);
  select d.checks into v_checks from residency.check_days d where d.user_id = p_uid and d.calgary_day = v_day;

  return jsonb_build_object(
    'calgary_day', v_day,
    'status', case when v_resident.community_id is null then
                     case when v_candidate.community_id is null then 'new' else 'verifying' end
                   when v_move.id is not null then 'moving'
                   else 'verified' end,
    'community', case when v_resident.community_id is null then null
                      else residency.community_json(v_resident.community_id) || jsonb_build_object('verified_on', v_resident.verified_on) end,
    'candidate', case when v_candidate.community_id is null then null
                      else residency.community_json(v_candidate.community_id) || jsonb_build_object(
                        'days', v_candidate.days,
                        'needed', residency.days_to_verify(),
                        'checked_today', v_candidate.checked_today) end,
    'play_community', residency.community_json(v_play.community_id),
    'pending', coalesce(v_play.pending, false),
    'move', case when v_move.id is null then null
                 else jsonb_build_object('started_on', v_move.started_on,
                                         'last_day', v_move.started_on + residency.move_days() - 1,
                                         'free_correction', v_move.free_correction) end,
    'can_move', residency.can_move_at(p_uid, v_day),
    'checks_left', greatest(0, residency.max_checks_per_day() - coalesce(v_checks, 0))
  );
end;
$$;

-- Actions ----------------------------------------------------------------------------------

-- Location check. p_lat/p_lon are used only to find the community and are then forgotten:
-- they are never written to a table, a log or the result.
-- result: counted | verified | not_needed | limit | inaccurate | no_community | current_community
create function residency.check_location_at(p_uid uuid, p_lat double precision, p_lon double precision,
                                            p_accuracy double precision, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_resident record;
  v_move residency.moves;
  v_checks integer;
  v_community uuid;
  v_days integer;
  v_result text;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_lat is null or p_lon is null or not (p_lat between -90 and 90) or not (p_lon between -180 and 180)
     or (p_accuracy is not null and not (p_accuracy between 0 and 1e7)) then
    raise exception 'invalid location' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('residency.user:' || p_uid::text, 0));
  select * into v_resident from residency.resident_on(p_uid, v_day);
  select * into v_move from residency.move_on(p_uid, v_day);

  if v_resident.community_id is not null and v_move.id is null then
    v_result := 'not_needed';
  else
    insert into residency.check_days (user_id, calgary_day, checks) values (p_uid, v_day, 1)
    on conflict (user_id, calgary_day) do update set checks = residency.check_days.checks + 1
    returning checks into v_checks;

    if v_checks > residency.max_checks_per_day() then
      v_result := 'limit';
    elsif p_accuracy is null or p_accuracy > residency.max_accuracy_m() then
      v_result := 'inaccurate';
    else
      v_community := residency.community_at_point(p_lat, p_lon);
      -- The coordinates are not used after this line.
      if v_community is null then
        v_result := 'no_community';
      elsif v_move.id is not null and v_community = v_resident.community_id then
        v_result := 'current_community';
      else
        insert into residency.check_ins (user_id, community_id, calgary_day) values (p_uid, v_community, v_day)
        on conflict (user_id, community_id, calgary_day) do update set latest = nextval('residency.check_in_order');
        v_days := residency.check_in_days(p_uid, v_community, v_day, v_move.started_on);
        if v_days >= residency.days_to_verify() then
          perform residency.record_verification(p_uid, v_community, v_day, p_now);
          if v_move.id is not null then
            update residency.moves set outcome = 'completed', ended_on = v_day, changed_at = p_now where id = v_move.id;
          end if;
          v_result := 'verified';
        else
          v_result := 'counted';
        end if;
      end if;
    end if;
  end if;

  return jsonb_build_object('result', v_result, 'checked_community', residency.community_json(v_community))
         || residency.status_at(p_uid, p_now);
end;
$$;

-- "I moved". Returns {ok: true, ...status} or {ok: false, problem: not_verified|moving|cooldown, ...status}.
create function residency.start_move_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_can jsonb;
  v_resident record;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('residency.user:' || p_uid::text, 0));
  v_can := residency.can_move_at(p_uid, v_day);
  if not (v_can ->> 'allowed')::boolean then
    return jsonb_build_object('ok', false, 'problem', v_can ->> 'reason') || residency.status_at(p_uid, p_now);
  end if;
  -- Close a move that was cancelled automatically (left open for 7 days).
  update residency.moves m set outcome = 'cancelled', ended_on = m.started_on + residency.move_days(), changed_at = p_now
  where m.user_id = p_uid and m.outcome is null and m.started_on + residency.move_days() <= v_day;

  select * into v_resident from residency.resident_on(p_uid, v_day);
  insert into residency.moves (user_id, from_community_id, started_on, free_correction, changed_at)
  values (p_uid, v_resident.community_id, v_day, (v_can ->> 'free_correction')::boolean, p_now);
  return jsonb_build_object('ok', true) || residency.status_at(p_uid, p_now);
end;
$$;

-- Cancels my move in progress (same result as the automatic cancel: nothing lost, no cooldown).
create function residency.cancel_move_at(p_uid uuid, p_now timestamptz)
returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_day date := common.calgary_day(p_now);
  v_move residency.moves;
begin
  if p_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('residency.user:' || p_uid::text, 0));
  select * into v_move from residency.move_on(p_uid, v_day);
  if v_move.id is null then
    return jsonb_build_object('ok', false, 'problem', 'not_moving') || residency.status_at(p_uid, p_now);
  end if;
  update residency.moves set outcome = 'cancelled', ended_on = v_day, changed_at = p_now where id = v_move.id;
  return jsonb_build_object('ok', true) || residency.status_at(p_uid, p_now);
end;
$$;

revoke all on all functions in schema residency from public, anon, authenticated;

-- Public RPC --------------------------------------------------------------------------------

create function public.residency_get_status()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  return residency.status_at(auth.uid(), now());
end;
$$;
comment on function public.residency_get_status() is
  'My residency: status (new|verifying|verified|moving), my community, candidate community with check-in days, whether my actions are pending, move in progress, whether I can move, checks left today.';

create function public.residency_check_location(p_lat double precision, p_lon double precision, p_accuracy double precision)
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select residency.check_location_at(auth.uid(), p_lat, p_lon, p_accuracy, now())
$$;
comment on function public.residency_check_location(double precision, double precision, double precision) is
  'Location check (accuracy in metres). The server finds the community and forgets the coordinates. result: counted|verified|not_needed|limit|inaccurate|no_community|current_community, plus my status.';

create function public.residency_start_move()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select residency.start_move_at(auth.uid(), now())
$$;
comment on function public.residency_start_move() is
  '"I moved": start re-verification in a new community. {ok: false, problem: not_verified|moving|cooldown} when not allowed.';

create function public.residency_cancel_move()
returns jsonb
language sql volatile security definer set search_path = ''
as $$
  select residency.cancel_move_at(auth.uid(), now())
$$;
comment on function public.residency_cancel_move() is
  'Cancel my move in progress (nothing is lost, the cooldown is not used).';

revoke all on function public.residency_get_status() from public;
revoke all on function public.residency_check_location(double precision, double precision, double precision) from public;
revoke all on function public.residency_start_move() from public;
revoke all on function public.residency_cancel_move() from public;
grant execute on function public.residency_get_status() to authenticated;
grant execute on function public.residency_check_location(double precision, double precision, double precision) to authenticated;
grant execute on function public.residency_start_move() to authenticated;
grant execute on function public.residency_cancel_move() to authenticated;
