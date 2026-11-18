-- Module: common
-- Foundation for every module: PostGIS, the shared `common` schema,
-- the Calgary day-boundary functions, and the health check RPC.
--
-- Conventions (see CLAUDE.md §2 Modular code):
--   * Each module keeps its tables in its own schema (not exposed by the API).
--   * Only `public.<module>_<name>()` functions are callable from the frontend.

create extension if not exists postgis with schema extensions;

create schema if not exists common;

-- Calgary day boundary (requirement.md §7.5: America/Edmonton midnight).
-- This is the ONLY place the day boundary is computed. The client never does time zone math:
-- browsers may ship outdated tzdata (Alberta stays at UTC-6 year-round from 2026-11-01,
-- IANA tzdata 2026c+). The client receives `calgary_day` / `next_day_start` from the server.

create or replace function common.calgary_day(ts timestamptz)
returns date
language sql
immutable
parallel safe
set search_path = ''
as $$
  select (ts at time zone 'America/Edmonton')::date
$$;

comment on function common.calgary_day(timestamptz) is
  'Calgary calendar day (America/Edmonton) of an instant.';

create or replace function common.calgary_day_start(day date)
returns timestamptz
language sql
immutable
parallel safe
set search_path = ''
as $$
  select (day::timestamp at time zone 'America/Edmonton')
$$;

comment on function common.calgary_day_start(date) is
  'Instant of Calgary midnight that starts the given day. Days are 23h/25h on DST changes.';

-- `common` functions are internal helpers used by other modules' functions.
-- The schema is not exposed by the API (config.toml [api] schemas).
revoke all on schema common from public;
grant usage on schema common to anon, authenticated, service_role;
revoke all on all functions in schema common from public;
grant execute on all functions in schema common to anon, authenticated, service_role;

-- Health check RPC: proves the frontend can reach the database.

create or replace function public.common_health()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'status', 'ok',
    'db_time', now(),
    'calgary_day', common.calgary_day(now()),
    'next_day_start', common.calgary_day_start(common.calgary_day(now()) + 1),
    'postgis', extensions.postgis_lib_version()
  )
$$;

comment on function public.common_health() is
  'Health check: status, database time, current Calgary day, next Calgary midnight, PostGIS version.';

revoke all on function public.common_health() from public;
grant execute on function public.common_health() to anon, authenticated, service_role;
