import { describe, expect, it } from 'vitest';
import { readSupabaseConfig } from './env';
import { formatCountdown, msUntil } from './time';

describe('readSupabaseConfig', () => {
  const url = 'http://127.0.0.1:55421';
  const key = 'sb_publishable_abc';

  it('returns the config when both values are set', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key }),
    ).toEqual({ ok: true, config: { url, publishableKey: key } });
  });

  it('trims whitespace', () => {
    const result = readSupabaseConfig({ VITE_SUPABASE_URL: ` ${url} `, VITE_SUPABASE_PUBLISHABLE_KEY: ` ${key}\n` });
    expect(result).toEqual({ ok: true, config: { url, publishableKey: key } });
  });

  it('lists every missing or blank value', () => {
    expect(readSupabaseConfig({})).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    });
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: '   ' })).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_PUBLISHABLE_KEY'],
    });
  });

  it.each(['sb_secret_123', 'eyJ.role-service_role.sig'])('refuses a secret key (%s)', (secret) => {
    expect(() => readSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: secret })).toThrow(
      /secret Supabase key/,
    );
  });
});

describe('msUntil', () => {
  it('measures the distance to a future instant', () => {
    expect(msUntil(new Date('2026-11-19T06:00:00Z'), new Date('2026-11-18T18:00:00Z'))).toBe(12 * 3_600_000);
  });

  it('is 0 once the instant has passed (e.g. the day already rolled over)', () => {
    expect(msUntil(new Date('2026-11-19T06:00:00Z'), new Date('2026-11-19T06:00:01Z'))).toBe(0);
  });
});

describe('formatCountdown', () => {
  it.each([
    [0, 'under 1m'],
    [59_999, 'under 1m'],
    [60_000, '1m'],
    [59 * 60_000 + 59_999, '59m'],
    [60 * 60_000, '1h 00m'],
    [3 * 3_600_000 + 5 * 60_000, '3h 05m'],
    [24 * 3_600_000, '24h 00m'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (bad) => {
    expect(() => formatCountdown(bad)).toThrow(RangeError);
  });
});
