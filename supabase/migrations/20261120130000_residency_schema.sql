-- Module: residency — location checks, Verified Residents and moving (requirement.md v1.23 §6.2–§6.4).
--
-- Privacy (§6.2, §18): coordinates are only used inside residency.check_location_at to find the
-- community and are never stored or logged. What is kept is day-level only: which community a
-- player checked in from on which Calgary day (no clock time), verifications and moves.
--
-- Other modules read residents only through the residency.* functions in
-- 20261120130200_residency_rules.sql (gamecore: members per day, cumulative residents, the
-- community a player plays in, when pending contributions apply).

create extension if not exists postgis with schema extensions;

create schema residency;
revoke all on schema residency from public, anon, authenticated;

-- Residential community boundaries (generated from supabase/data/calgary_boundaries.json).
create table residency.boundaries (
  community_id uuid primary key references gamecore.communities (id),
  area extensions.geometry(MultiPolygon, 4326) not null
);
alter table residency.boundaries enable row level security;
create index boundaries_area_idx on residency.boundaries using gist (area);

-- Location checks per account per Calgary day (rate limit, §6.2).
create table residency.check_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  calgary_day date not null,
  checks integer not null default 0 check (checks >= 0),
  primary key (user_id, calgary_day)
);
alter table residency.check_days enable row level security;

-- A counted check-in: this player was inside this community on this Calgary day.
create sequence residency.check_in_order;
create table residency.check_ins (
  user_id uuid not null references auth.users (id) on delete cascade,
  community_id uuid not null references gamecore.communities (id),
  calgary_day date not null,
  -- Order of the latest check-in, to break ties for the candidate community. Not a clock time.
  latest bigint not null default nextval('residency.check_in_order'),
  primary key (user_id, community_id, calgary_day)
);
alter table residency.check_ins enable row level security;

-- Verified Resident records (append-only). The latest one on or before a day is the community
-- the player belongs to; the first one is the first verification, later ones are completed moves.
create table residency.verifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  community_id uuid not null references gamecore.communities (id),
  verified_on date not null,
  kind text not null check (kind in ('first', 'move')),
  created_at timestamptz not null default now()
);
alter table residency.verifications enable row level security;
create index verifications_community_idx on residency.verifications (community_id, verified_on);
create index verifications_user_idx on residency.verifications (user_id, verified_on, id);

create function residency.verifications_append_only()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'residency.verifications is append-only' using errcode = '42501';
end;
$$;
create trigger verifications_no_update
before update on residency.verifications
for each row execute function residency.verifications_append_only();

-- Moves (§6.4). Open while `outcome` is null; a move left open for 7 days counts as cancelled
-- (computed on read) and is closed the next time the player starts a move.
create table residency.moves (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_community_id uuid not null references gamecore.communities (id),
  started_on date not null,
  -- Started within 14 days of the first verification while the cooldown was running.
  free_correction boolean not null,
  ended_on date,
  outcome text check (outcome in ('completed', 'cancelled')),
  changed_at timestamptz not null default now(),
  check ((ended_on is null) = (outcome is null))
);
alter table residency.moves enable row level security;
create unique index moves_one_open_idx on residency.moves (user_id) where outcome is null;
create index moves_from_idx on residency.moves (from_community_id, started_on);

revoke all on all tables in schema residency from public, anon, authenticated;
revoke all on all sequences in schema residency from public, anon, authenticated;
