-- Module: weather — real Calgary weather for the islands (requirement.md v1.40 §10.4).
--
--   * One city-wide reading of Calgary's current conditions from Environment and Climate Change
--     Canada (api.weather.gc.ca, citypageweather item ab-52; free, commercial use allowed with the
--     attribution "Data source: Environment and Climate Change Canada").
--   * pg_cron runs weather.fetch() every 15 minutes: it stores the answer to the previous run's
--     request (pg_net is asynchronous) and sends a new one. Never per player (§20.3).
--   * Readings are append-only, one row per observation time (ECCC observes hourly).
--   * public.weather_current() computes the island weather on read: state, wind level,
--     temperature, snow cover, and the server instant (the client never does time-zone math, §7.5).
--   * No reading from the last 3 hours → clear, calm, no snow cover.

create schema weather;
revoke all on schema weather from public, anon, authenticated;

create extension if not exists pg_net with schema extensions;

create table weather.readings (
  observed_at timestamptz primary key,
  fetched_at timestamptz not null default now(),
  state text not null check (state in ('clear', 'partly_cloudy', 'overcast', 'rain', 'snow', 'mix', 'fog', 'thunderstorm')),
  condition text,
  icon_code integer,
  temperature_c numeric,
  wind_kmh numeric not null default 0 check (wind_kmh >= 0),
  gust_kmh numeric check (gust_kmh >= 0),
  wind_bearing numeric check (wind_bearing >= 0 and wind_bearing <= 360)
);
alter table weather.readings enable row level security;

-- Requests sent through pg_net whose answers have not been stored yet.
create table weather.requests (
  request_id bigint primary key,
  sent_at timestamptz not null default now()
);
alter table weather.requests enable row level security;

create function weather.source_url()
returns text
language sql immutable set search_path = ''
as $$ select 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/ab-52?f=json' $$;

-- ECCC condition text (e.g. "Light Snow", "Mostly Cloudy") first, icon code as fallback.
create function weather.state_for(p_condition text, p_icon integer)
returns text
language plpgsql immutable set search_path = ''
as $$
declare
  t text := lower(coalesce(p_condition, ''));
  wet boolean := t ~ '(rain|drizzle|shower)';
  frozen boolean := t ~ '(snow|flurr|ice pellet|ice crystal)';
begin
  if t ~ 'thunder' then return 'thunderstorm'; end if;
  if t ~ 'freezing' or t ~ 'ice pellet' or (wet and frozen) then return 'mix'; end if;
  if frozen then return 'snow'; end if;
  if wet then return 'rain'; end if;
  if t ~ '(fog|mist|haze|smoke)' then return 'fog'; end if;
  if t ~ '(partly|mainly|a few clouds)' then return 'partly_cloudy'; end if;
  if t ~ '(cloudy|overcast)' then return 'overcast'; end if;
  if t ~ '(sunny|clear)' then return 'clear'; end if;
  return case
    when p_icon in (0, 30) then 'clear'
    when p_icon in (1, 2, 4, 5, 31, 32, 34, 35) then 'partly_cloudy'
    when p_icon in (3, 10, 33) then 'overcast'
    when p_icon in (6, 11, 12, 13, 28, 36) then 'rain'
    when p_icon in (7, 14, 15, 27, 37) then 'mix'
    when p_icon in (8, 16, 17, 18, 25, 26, 38, 40) then 'snow'
    when p_icon in (9, 19, 39, 46, 47) then 'thunderstorm'
    when p_icon in (23, 24, 44, 45) then 'fog'
    else 'clear'
  end;
end;
$$;

-- Wind level from speed and gusts (km/h).
create function weather.wind_level(p_kmh numeric, p_gust numeric)
returns text
language sql immutable set search_path = ''
as $$
  select case
    when coalesce(p_kmh, 0) >= 30 or coalesce(p_gust, 0) >= 50 then 'windy'
    when coalesce(p_kmh, 0) >= 10 then 'breezy'
    else 'calm'
  end
$$;

-- A number from an ECCC value ({"en": 8} or {"en": "calm"}); null when not a number.
create function weather.num(p jsonb)
returns numeric
language sql immutable set search_path = ''
as $$
  select case when (p ->> 'en') ~ '^-?[0-9]+(\.[0-9]+)?$' then (p ->> 'en')::numeric end
$$;

-- Stores one ECCC citypageweather item (the whole JSON answer). Same observation twice → kept once.
create function weather.store(p_item jsonb, p_fetched_at timestamptz)
returns boolean
language plpgsql set search_path = ''
as $$
declare
  c jsonb := p_item -> 'properties' -> 'currentConditions';
  v_observed timestamptz;
  v_condition text;
  v_icon integer;
  v_rows integer;
begin
  if c is null or jsonb_typeof(c) <> 'object' then
    return false;
  end if;
  v_observed := coalesce((c -> 'timestamp' ->> 'en')::timestamptz, p_fetched_at);
  v_condition := c -> 'condition' ->> 'en';
  v_icon := weather.num(jsonb_build_object('en', c -> 'iconCode' ->> 'value'))::integer;
  insert into weather.readings (observed_at, fetched_at, state, condition, icon_code, temperature_c, wind_kmh, gust_kmh, wind_bearing)
  values (
    v_observed, p_fetched_at, weather.state_for(v_condition, v_icon), v_condition, v_icon,
    weather.num(c -> 'temperature' -> 'value'),
    coalesce(weather.num(c -> 'wind' -> 'speed' -> 'value'), 0),
    weather.num(c -> 'wind' -> 'gust' -> 'value'),
    weather.num(c -> 'wind' -> 'bearing' -> 'value')
  )
  on conflict (observed_at) do nothing;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- Stores answers to earlier requests; drops failed ones and requests with no answer after an hour.
create function weather.collect(p_now timestamptz default now())
returns integer
language plpgsql set search_path = ''
as $$
declare
  r record;
  v_stored integer := 0;
begin
  for r in
    select q.request_id, q.sent_at, h.status_code, h.content, h.created
    from weather.requests q
    left join net._http_response h on h.id = q.request_id
  loop
    if r.status_code is not null then
      if r.status_code = 200 then
        begin
          if weather.store(r.content::jsonb, coalesce(r.created, p_now)) then
            v_stored := v_stored + 1;
          end if;
        exception when others then
          raise warning 'weather: could not read answer %: %', r.request_id, sqlerrm;
        end;
      else
        raise warning 'weather: request % answered %', r.request_id, r.status_code;
      end if;
      delete from weather.requests where request_id = r.request_id;
    elsif r.sent_at < p_now - interval '1 hour' then
      delete from weather.requests where request_id = r.request_id;
    end if;
  end loop;
  return v_stored;
end;
$$;

-- pg_cron job: store the last answer, ask again.
create function weather.fetch()
returns void
language plpgsql set search_path = ''
as $$
begin
  perform weather.collect(now());
  insert into weather.requests (request_id)
  values (net.http_get(url := weather.source_url(), timeout_milliseconds := 15000));
end;
$$;

-- The island weather at p_now, computed from the readings (compute-on-read, §20.3).
--   Snow cover: snowing now, or it snowed in the last 14 days and has not melted since:
--   rain after the last snow melts it, and so do 6 hours (hour buckets) above +5 °C.
create function weather.current_at(p_now timestamptz)
returns jsonb
language plpgsql stable set search_path = ''
as $$
declare
  v_last weather.readings;
  v_last_snow timestamptz;
  v_rained boolean;
  v_warm_hours integer;
  v_cover boolean := false;
begin
  select * into v_last from weather.readings r
  where r.observed_at <= p_now and r.observed_at > p_now - interval '3 hours'
  order by r.observed_at desc limit 1;

  if v_last.observed_at is null then
    return jsonb_build_object('now', p_now, 'state', 'clear', 'wind', 'calm', 'wind_kmh', 0,
      'wind_bearing', null, 'temperature_c', null, 'condition', null, 'snow_cover', false, 'observed_at', null);
  end if;

  select max(r.observed_at) into v_last_snow from weather.readings r
  where r.state in ('snow', 'mix') and r.observed_at <= p_now and r.observed_at > p_now - interval '14 days';

  if v_last_snow is not null then
    select exists (
      select 1 from weather.readings r
      where r.observed_at > v_last_snow and r.observed_at <= p_now and r.state in ('rain', 'thunderstorm')
    ) into v_rained;
    select count(distinct date_trunc('hour', r.observed_at)) into v_warm_hours from weather.readings r
    where r.observed_at > v_last_snow and r.observed_at <= p_now and r.temperature_c > 5;
    v_cover := not v_rained and v_warm_hours < 6;
  end if;

  return jsonb_build_object(
    'now', p_now,
    'state', v_last.state,
    'wind', weather.wind_level(v_last.wind_kmh, v_last.gust_kmh),
    'wind_kmh', v_last.wind_kmh,
    'wind_bearing', v_last.wind_bearing,
    'temperature_c', v_last.temperature_c,
    'condition', v_last.condition,
    'snow_cover', v_cover,
    'observed_at', v_last.observed_at
  );
end;
$$;

revoke all on all functions in schema weather from public, anon, authenticated;

create function public.weather_current()
returns jsonb
language sql stable security definer set search_path = ''
as $$ select weather.current_at(now()) $$;

comment on function public.weather_current() is
  'Calgary''s current weather for the islands (state, wind level, temperature, snow cover) and the server instant. Data source: Environment and Climate Change Canada.';

revoke all on function public.weather_current() from public;
grant execute on function public.weather_current() to anon, authenticated;

select cron.schedule('weather-fetch', '*/15 * * * *', 'select weather.fetch()');
