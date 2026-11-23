import { describe, expect, it } from 'vitest';
import { fetchDashboard, isDashboard, pct, summary, type DashboardDay } from './api';

const day = (p: Partial<DashboardDay>): DashboardDay => ({
  day: '2027-03-01', visitors: 0, new_visitors: 0, first_action_pct: null, d1_pct: null, d7_pct: null, shares: 0, invite_visits: 0, ...p,
});
const good = { today: '2027-03-21', days: [day({})], communities_7d: [{ code: 'MAH', name: 'Mahogany', visitors: 3 }], spikes: [], email_updates: 2 };

describe('admin dashboard data', () => {
  it('validates the server response', () => {
    expect(isDashboard(good)).toBe(true);
    expect(isDashboard({ ...good, days: [{ ...day({}), d1_pct: '50' }] })).toBe(false);
    expect(isDashboard({ ...good, email_updates: undefined })).toBe(false);
  });

  it('operators only: a 42501 error means "not an operator"', async () => {
    const r = await fetchDashboard({ rpc: () => Promise.resolve({ data: null, error: { code: '42501', message: 'operators only' } }) });
    expect(r).toEqual({ ok: false, reason: 'not-operator', message: 'operators only' });
    const ok = await fetchDashboard({ rpc: () => Promise.resolve({ data: good, error: null }) });
    expect(ok.ok).toBe(true);
  });

  it('summary weights percentages by new visitors and skips unknown days', () => {
    const s = summary([
      day({ new_visitors: 10, first_action_pct: 50, d1_pct: 40, d7_pct: null, shares: 2 }),
      day({ new_visitors: 30, first_action_pct: 70, d1_pct: null, d7_pct: null, shares: 1, invite_visits: 4 }),
      day({ new_visitors: 0 }),
    ]);
    expect(s).toEqual({ newVisitors: 40, shares: 3, inviteVisits: 4, firstAction: 65, d1: 40, d7: null });
    expect(pct(null)).toBe('–');
    expect(pct(12)).toBe('12%');
  });
});
