-- Module: common — Calgary day boundary.
--
-- Alberta's Official Time Act (2026): no "fall back" on 2026-11-01; America/Edmonton stays
-- at UTC-6 year-round from then on (IANA tzdata 2026c+). Earlier dates keep historic rules
-- (MST UTC-7 in winter, MDT UTC-6 in summer). Expected values below follow that data.
-- If the post-2026-11-01 cases fail, the database's tzdata is older than 2026c.
begin;
select plan(33);

-- dayOf: (instant, expected Calgary day)
with cases(instant, day, note) as (values
  ('2026-01-15T06:59:59Z'::timestamptz, '2026-01-14'::date, 'historic MST: 23:59:59'),
  ('2026-01-15T07:00:00Z'::timestamptz, '2026-01-15'::date, 'historic MST: midnight'),
  ('2026-07-15T05:59:59Z'::timestamptz, '2026-07-14'::date, 'MDT: 23:59:59'),
  ('2026-07-15T06:00:00Z'::timestamptz, '2026-07-15'::date, 'MDT: midnight'),
  ('2026-07-15T02:00:00Z'::timestamptz, '2026-07-14'::date, 'already the 15th in UTC, still the 14th in Calgary'),
  ('2026-03-08T06:59:59Z'::timestamptz, '2026-03-07'::date, 'last historic DST start: before midnight'),
  ('2026-03-08T07:00:00Z'::timestamptz, '2026-03-08'::date, 'last historic DST start: midnight (MST)'),
  ('2026-03-08T08:59:59Z'::timestamptz, '2026-03-08'::date, '01:59:59 MST, just before clocks jumped'),
  ('2026-03-08T09:00:00Z'::timestamptz, '2026-03-08'::date, '03:00 MDT, right after clocks jumped'),
  ('2026-03-09T05:59:59Z'::timestamptz, '2026-03-08'::date, 'end of the 23-hour day'),
  ('2026-03-09T06:00:00Z'::timestamptz, '2026-03-09'::date, 'next midnight is UTC-6'),
  ('2026-11-01T05:59:59Z'::timestamptz, '2026-10-31'::date, 'Official Time Act: last second of Oct 31'),
  ('2026-11-01T06:00:00Z'::timestamptz, '2026-11-01'::date, 'Official Time Act: midnight Nov 1 (UTC-6)'),
  ('2026-11-01T07:30:00Z'::timestamptz, '2026-11-01'::date, '01:30, no repeated hour any more'),
  ('2026-11-01T08:30:00Z'::timestamptz, '2026-11-01'::date, '02:30, clocks did not fall back'),
  ('2026-11-02T05:59:59Z'::timestamptz, '2026-11-01'::date, 'Nov 1 is a normal 24-hour day'),
  ('2026-11-02T06:00:00Z'::timestamptz, '2026-11-02'::date, 'next midnight still UTC-6'),
  ('2027-01-01T05:59:59Z'::timestamptz, '2026-12-31'::date, 'year boundary: still New Year''s Eve (winter is UTC-6 now)'),
  ('2027-01-01T06:00:00Z'::timestamptz, '2027-01-01'::date, 'year boundary: New Year''s Day'),
  ('2027-03-14T08:30:00Z'::timestamptz, '2027-03-14'::date, '02:30 exists: no spring-forward in 2027'),
  ('2028-02-29T06:00:00Z'::timestamptz, '2028-02-29'::date, 'leap day starts'),
  ('2028-03-01T05:59:59Z'::timestamptz, '2028-02-29'::date, 'leap day ends')
)
select is(common.calgary_day(instant), day, format('calgary_day(%s) = %s (%s)', instant, day, note))
from cases;

-- dayStart: (day, expected start instant, day length in hours)
with cases(day, start, hours) as (values
  ('2026-01-15'::date, '2026-01-15T07:00:00Z'::timestamptz, 24),
  ('2026-07-15'::date, '2026-07-15T06:00:00Z'::timestamptz, 24),
  ('2026-03-08'::date, '2026-03-08T07:00:00Z'::timestamptz, 23),
  ('2026-11-01'::date, '2026-11-01T06:00:00Z'::timestamptz, 24),
  ('2026-12-31'::date, '2026-12-31T06:00:00Z'::timestamptz, 24),
  ('2027-03-14'::date, '2027-03-14T06:00:00Z'::timestamptz, 24),
  ('2028-02-29'::date, '2028-02-29T06:00:00Z'::timestamptz, 24)
)
select is(
  array[
    extract(epoch from common.calgary_day_start(day)),
    extract(epoch from common.calgary_day_start(day + 1) - common.calgary_day_start(day)) / 3600
  ],
  array[extract(epoch from start), hours::numeric],
  format('calgary_day_start(%s) = %s, %s h long', day, start, hours)
)
from cases;

-- calgary_day_start is the inverse of calgary_day at the boundary.
select is(
  common.calgary_day(common.calgary_day_start('2026-11-01'::date)),
  '2026-11-01'::date,
  'calgary_day(calgary_day_start(d)) = d'
);

-- Independent of the session time zone (server default is UTC; must not matter).
set local timezone = 'Asia/Seoul';
select is(
  common.calgary_day('2026-01-15T06:59:59Z'::timestamptz),
  '2026-01-14'::date,
  'calgary_day ignores the session time zone'
);
select is(
  common.calgary_day_start('2026-03-08'::date),
  '2026-03-08T07:00:00Z'::timestamptz,
  'calgary_day_start ignores the session time zone'
);
reset timezone;

-- Immutable so later modules can use them in indexes/constraints.
select volatility_is('common', 'calgary_day', array['timestamp with time zone'], 'immutable',
  'calgary_day is immutable');

select * from finish();
rollback;
