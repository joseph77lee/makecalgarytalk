-- Module: gamecore — total active days of a player (requirement.md v1.49 §14).
--
--   * Active day = a Calgary day on which the player took at least one daily action. Answering
--     today's question alone does not count (it is not an action).
--   * Counted over the whole action log, so the total follows the player across moves (§6.4) and
--     is the same count the ranks use (§13.2: 14 = Neighbour). Computed on read; no counter.
--   * Uses the (user_id, calgary_day, energy_slot) unique index.

create function gamecore.active_days(p_uid uuid, p_day date)
returns integer
language sql stable set search_path = ''
as $$
  select count(distinct a.calgary_day)::integer
  from gamecore.actions a
  where a.user_id = p_uid and a.calgary_day <= p_day
$$;
comment on function gamecore.active_days(uuid, date) is
  'Calgary days up to and including p_day on which the player took at least one daily action (any community).';

revoke all on function gamecore.active_days(uuid, date) from public, anon, authenticated;
