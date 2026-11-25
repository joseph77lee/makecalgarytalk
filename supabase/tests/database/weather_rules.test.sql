-- Module: weather — Calgary weather readings and the island weather (requirement.md v1.40 §10.4).
begin;
select plan(34);

delete from weather.readings;
delete from weather.requests;

-- Condition text → state (ECCC wording), icon code only as a fallback.
select is(weather.state_for('Sunny', 0), 'clear', 'Sunny → clear');
select is(weather.state_for('Clear', 30), 'clear', 'Clear (night) → clear');
select is(weather.state_for('Mainly Sunny', 1), 'partly_cloudy', 'Mainly Sunny → partly cloudy');
select is(weather.state_for('Partly Cloudy', 2), 'partly_cloudy', 'Partly Cloudy → partly cloudy');
select is(weather.state_for('Mostly Cloudy', 33), 'overcast', 'Mostly Cloudy → overcast');
select is(weather.state_for('Cloudy', 10), 'overcast', 'Cloudy → overcast');
select is(weather.state_for('Light Rain', 12), 'rain', 'Light Rain → rain');
select is(weather.state_for('Drizzle', 28), 'rain', 'Drizzle → rain');
select is(weather.state_for('Light Snow', 16), 'snow', 'Light Snow → snow');
select is(weather.state_for('Blowing Snow', 40), 'snow', 'Blowing Snow → snow');
select is(weather.state_for('Ice Crystals', 26), 'snow', 'Ice Crystals → snow');
select is(weather.state_for('Light Rain and Snow', 15), 'mix', 'Rain and Snow → mix');
select is(weather.state_for('Freezing Drizzle', 14), 'mix', 'Freezing Drizzle → mix');
select is(weather.state_for('Fog', 24), 'fog', 'Fog → fog');
select is(weather.state_for('Smoke', 44), 'fog', 'Smoke → fog');
select is(weather.state_for('Thunderstorm with light rainshowers', 19), 'thunderstorm', 'Thunderstorm wins over rain');
select is(weather.state_for(null, 17), 'snow', 'no text → icon code');
select is(weather.state_for('Not observed', null), 'clear', 'unknown text, no icon → clear');

-- Wind levels.
select is(weather.wind_level(5, null), 'calm', '5 km/h → calm');
select is(weather.wind_level(18, 25), 'breezy', '18 km/h → breezy');
select is(weather.wind_level(12, 55), 'windy', 'gusts of 55 → windy');

-- Storing an ECCC answer (trimmed real shape, 2026-11-25); the same observation twice is kept once.
create temp table eccc as select '{
  "id": "ab-52",
  "properties": {"currentConditions": {
    "iconCode": {"format": "gif", "value": 33},
    "timestamp": {"en": "2026-11-25T03:00:00Z"},
    "condition": {"en": "Mostly Cloudy"},
    "temperature": {"value": {"en": 0.4}},
    "wind": {"speed": {"value": {"en": 8}}, "gust": {"value": {"en": 34}}, "bearing": {"value": {"en": 234.0}}}
  }}}'::jsonb as item;

select ok(weather.store((select item from eccc), '2026-11-25T03:10:00Z'), 'an answer is stored');
select ok(not weather.store((select item from eccc), '2026-11-25T03:25:00Z'), 'the same observation is not stored twice');
select results_eq(
  $$ select state, temperature_c, wind_kmh, gust_kmh, wind_bearing, icon_code from weather.readings $$,
  $$ values ('overcast'::text, 0.4::numeric, 8::numeric, 34::numeric, 234.0::numeric, 33) $$,
  'the reading keeps state, temperature and wind'
);
select ok(not weather.store('{"properties": {}}'::jsonb, now()), 'an answer without conditions is ignored');

-- Collecting pg_net answers: stored on 200, dropped on errors, dropped after an hour without answer.
delete from weather.readings;
insert into net._http_response (id, status_code, content, created)
values (900001, 200, (select item::text from eccc), '2026-11-25T03:10:00Z'),
       (900002, 503, 'busy', '2026-11-25T03:10:00Z');
insert into weather.requests (request_id, sent_at) values
  (900001, '2026-11-25T03:00:00Z'), (900002, '2026-11-25T03:00:00Z'),
  (900003, '2026-11-25T03:05:00Z'), (900004, '2026-11-25T01:00:00Z');
select is(weather.collect('2026-11-25T03:15:00Z'), 1, 'one answer stored');
select results_eq(
  $$ select request_id from weather.requests order by 1 $$,
  $$ values (900003::bigint) $$,
  'answered and stale requests are gone; a recent unanswered one waits'
);

-- Island weather on read.
delete from weather.readings;
insert into weather.readings (observed_at, state, temperature_c, wind_kmh, gust_kmh) values
  ('2026-12-01T10:00:00Z', 'snow', -8, 20, null),
  ('2026-12-01T11:00:00Z', 'clear', -6, 4, null);
select is(
  weather.current_at('2026-12-01T16:00:00Z') ->> 'state', 'clear',
  'no reading in the last 3 hours → clear'
);
select ok(
  not (weather.current_at('2026-12-01T16:00:00Z') ->> 'snow_cover')::boolean,
  'no recent reading → no snow cover'
);
select ok(
  (weather.current_at('2026-12-01T11:30:00Z') ->> 'snow_cover')::boolean
  and weather.current_at('2026-12-01T11:30:00Z') ->> 'state' = 'clear'
  and weather.current_at('2026-12-01T11:30:00Z') ->> 'wind' = 'calm',
  'snow stays on the ground after it stops'
);

-- A chinook: 5 warm hours keep the snow, the 6th melts it.
insert into weather.readings (observed_at, state, temperature_c, wind_kmh)
select '2026-12-01T12:00:00Z'::timestamptz + make_interval(hours => h), 'clear', 9, 40
from generate_series(0, 5) h;
select ok(
  (weather.current_at('2026-12-01T16:30:00Z') ->> 'snow_cover')::boolean,
  '5 hours above +5 °C: snow still there'
);
select ok(
  not (weather.current_at('2026-12-01T17:30:00Z') ->> 'snow_cover')::boolean
  and weather.current_at('2026-12-01T17:30:00Z') ->> 'wind' = 'windy',
  '6 hours above +5 °C: snow melted (and it is windy)'
);

-- Rain melts snow.
delete from weather.readings;
insert into weather.readings (observed_at, state, temperature_c, wind_kmh) values
  ('2026-12-03T10:00:00Z', 'snow', -1, 0),
  ('2026-12-03T11:00:00Z', 'rain', 2, 0),
  ('2026-12-03T12:00:00Z', 'overcast', 1, 0);
select ok(not (weather.current_at('2026-12-03T12:10:00Z') ->> 'snow_cover')::boolean, 'rain after snow melts it');

-- Public RPC: anon may call it; it reports the server instant.
set local role anon;
select ok((public.weather_current() ->> 'now')::timestamptz is not null, 'anon can call weather_current() and gets the server instant');
reset role;

select * from finish();
rollback;
