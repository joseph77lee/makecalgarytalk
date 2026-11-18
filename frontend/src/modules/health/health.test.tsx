// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fetchHealth, parseHealth, type RpcCaller } from './healthApi';
import { HealthStatus } from './HealthStatus';

const good = {
  status: 'ok',
  db_time: '2026-11-18T18:00:00+00:00',
  calgary_day: '2026-11-18',
  next_day_start: '2026-11-19T06:00:00+00:00',
  postgis: '3.3.7',
};

const rpcReturning =
  (result: { data: unknown; error: { message: string } | null }): RpcCaller =>
  async () =>
    result;

describe('parseHealth', () => {
  it('parses a valid response', () => {
    const result = parseHealth(good);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.info.calgaryDay).toBe('2026-11-18');
      expect(result.info.nextDayStart.toISOString()).toBe('2026-11-19T06:00:00.000Z');
    }
  });

  it.each([
    ['null', null],
    ['a string', 'ok'],
    ['status not ok', { ...good, status: 'degraded' }],
    ['missing calgary_day', { ...good, calgary_day: undefined }],
    ['malformed calgary_day', { ...good, calgary_day: '18/11/2026' }],
    ['invalid next_day_start', { ...good, next_day_start: 'soon' }],
    ['missing db_time', { ...good, db_time: undefined }],
  ])('rejects %s', (_label, data) => {
    expect(parseHealth(data).ok).toBe(false);
  });
});

describe('fetchHealth', () => {
  it('returns the parsed info on success', async () => {
    expect((await fetchHealth(rpcReturning({ data: good, error: null }))).ok).toBe(true);
  });

  it('returns the server error message', async () => {
    expect(await fetchHealth(rpcReturning({ data: null, error: { message: 'permission denied' } }))).toEqual({
      ok: false,
      reason: 'permission denied',
    });
  });

  it('turns a thrown network error into a disconnected result', async () => {
    const failing: RpcCaller = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await fetchHealth(failing)).toEqual({ ok: false, reason: 'Failed to fetch' });
  });
});

describe('HealthStatus', () => {
  afterEach(cleanup);

  it('shows checking while waiting', () => {
    render(<HealthStatus state={{ status: 'checking' }} now={new Date()} />);
    expect(screen.getByRole('status').textContent).toContain('Checking server');
  });

  it('shows connected with the server Calgary day and countdown', () => {
    const result = parseHealth(good);
    if (!result.ok) throw new Error('fixture invalid');
    render(
      <HealthStatus state={{ status: 'done', ...result }} now={new Date('2026-11-18T18:00:00Z')} />,
    );
    const text = screen.getByRole('status').textContent ?? '';
    expect(text).toContain('Connected');
    expect(text).toContain('2026-11-18');
    expect(text).toContain('12h 00m');
  });

  it('shows disconnected with the reason', () => {
    render(<HealthStatus state={{ status: 'done', ok: false, reason: 'Failed to fetch' }} now={new Date()} />);
    const text = screen.getByRole('status').textContent ?? '';
    expect(text).toContain('Disconnected');
    expect(text).toContain('Failed to fetch');
  });
});
