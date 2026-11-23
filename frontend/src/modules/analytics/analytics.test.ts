import { describe, expect, it, vi } from 'vitest';
import { createTracker } from './track';

describe('analytics tracker', () => {
  it('sends each community visit once per page session, shares and invite visits every time', () => {
    const rpc = vi.fn(() => Promise.resolve({ error: null }));
    const t = createTracker(() => ({ rpc }));
    t.visit('MAH');
    t.visit('MAH');
    t.visit('BRD');
    t.share('weekly');
    t.share('weekly');
    t.inviteVisit();
    expect(rpc.mock.calls).toEqual([
      ['analytics_visit', { p_community_code: 'MAH' }],
      ['analytics_visit', { p_community_code: 'BRD' }],
      ['analytics_event', { p_kind: 'share', p_detail: 'weekly' }],
      ['analytics_event', { p_kind: 'share', p_detail: 'weekly' }],
      ['analytics_event', { p_kind: 'invite_visit' }],
    ]);
  });

  it('never throws: no client, a failing call, or a throwing client', async () => {
    expect(() => createTracker(() => null).visit('MAH')).not.toThrow();
    const failing = createTracker(() => ({ rpc: () => Promise.reject(new Error('offline')) }));
    expect(() => failing.share('built')).not.toThrow();
    const throwing = createTracker(() => ({
      rpc: () => {
        throw new Error('boom');
      },
    }));
    expect(() => throwing.inviteVisit()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0)); // no unhandled rejection
  });
});
