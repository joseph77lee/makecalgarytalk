-- Module: common — health check RPC and project-wide database guardrails.
begin;
select plan(9);

-- Health check
select has_function('public', 'common_health', 'public.common_health() exists');

set local role anon;
select is(public.common_health() ->> 'status', 'ok', 'anon can call common_health()');
select is(
  (public.common_health() ->> 'calgary_day')::date,
  common.calgary_day(now()),
  'common_health() reports the current Calgary day'
);
select ok(
  (public.common_health() ->> 'next_day_start')::timestamptz > now()
  and common.calgary_day((public.common_health() ->> 'next_day_start')::timestamptz)
      = common.calgary_day(now()) + 1,
  'common_health() reports the next Calgary midnight'
);
select ok(public.common_health() ->> 'postgis' is not null, 'PostGIS is installed');
reset role;

-- The common schema is internal: not exposed through the API.
select ok(
  not exists (
    select 1 from unnest(string_to_array(current_setting('pgrst.db_schemas', true), ',')) s
    where trim(s) = 'common'
  ),
  'common schema is not exposed by the API'
);

-- Guardrail (CLAUDE.md): Row Level Security on every table we own.
-- Checks every table outside Postgres/Supabase/extension system schemas.
select is_empty(
  $$
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and not c.relrowsecurity
      and n.nspname not in (
        'pg_catalog', 'information_schema', 'pg_toast',
        'auth', 'storage', 'realtime', '_realtime', 'extensions', 'graphql', 'graphql_public',
        'vault', 'pgsodium', 'pgsodium_masks', 'net', 'supabase_functions',
        'supabase_migrations', 'cron', 'pgbouncer', '_analytics', 'topology', 'tiger', 'tiger_data'
      )
      and n.nspname not like 'pg_temp%'
      and n.nspname not like 'pg_toast_temp%'
      -- PostGIS reference table, read-only metadata
      and not (n.nspname = 'public' and c.relname = 'spatial_ref_sys')
  $$,
  'every application table has Row Level Security enabled'
);

-- Guardrail: no tables in the API-exposed public schema. Tables live in module
-- schemas (not exposed), so the frontend can only reach data through RPC functions.
select is_empty(
  $$
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_depend d on d.objid = c.oid and d.deptype = 'e'
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and d.objid is null
  $$,
  'public schema has no tables or views (data is reached through RPC only)'
);

-- Exposed functions follow the <module>_<name> convention.
-- Module prefixes: update this list when a new backend module is added.
select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    where n.nspname = 'public'
      and d.objid is null
      and p.proname !~ '^(common|gamecore|communitystate|identity|residency|residents|news|worldmap|ranking|invites|features|posts)_'
  $$,
  'every public function is prefixed with its module name'
);

select * from finish();
rollback;
