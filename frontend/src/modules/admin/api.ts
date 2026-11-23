/** Operator dashboard data (requirement.md v1.35 §17, §21), from public.admin_dashboard. */
export interface DashboardDay {
  day: string;
  visitors: number;
  new_visitors: number;
  first_action_pct: number | null;
  d1_pct: number | null;
  d7_pct: number | null;
  shares: number;
  invite_visits: number;
}

export interface Dashboard {
  today: string;
  days: DashboardDay[];
  communities_7d: { code: string; name: string; visitors: number }[];
  spikes: { code: string; name: string; day: string; verifications: number; usual: number }[];
  email_updates: number;
}

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const numOrNull = (v: unknown) => v === null || num(v);

export function isDashboard(v: unknown): v is Dashboard {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o.today !== 'string' || !num(o.email_updates)) return false;
  if (!Array.isArray(o.days) || !Array.isArray(o.communities_7d) || !Array.isArray(o.spikes)) return false;
  return (
    o.days.every(
      (d) =>
        typeof d?.day === 'string' &&
        num(d.visitors) &&
        num(d.new_visitors) &&
        numOrNull(d.first_action_pct) &&
        numOrNull(d.d1_pct) &&
        numOrNull(d.d7_pct) &&
        num(d.shares) &&
        num(d.invite_visits),
    ) &&
    o.communities_7d.every((c) => typeof c?.code === 'string' && typeof c?.name === 'string' && num(c.visitors)) &&
    o.spikes.every((s) => typeof s?.code === 'string' && typeof s?.name === 'string' && typeof s?.day === 'string' && num(s.verifications) && num(s.usual))
  );
}

export type DashboardResult = { ok: true; data: Dashboard } | { ok: false; reason: 'not-operator' | 'error'; message: string };

export interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>;
}

export async function fetchDashboard(client: RpcClient, days = 28): Promise<DashboardResult> {
  const { data, error } = await client.rpc('admin_dashboard', { p_days: days });
  if (error) return { ok: false, reason: error.code === '42501' ? 'not-operator' : 'error', message: error.message };
  if (!isDashboard(data)) return { ok: false, reason: 'error', message: 'Unexpected server response: dashboard' };
  return { ok: true, data };
}

/** "42%" or "–" (not known yet / no new visitors). */
export const pct = (v: number | null): string => (v === null ? '–' : `${v}%`);

/** Totals over the shown days (null percentages are left out of averages). */
export function summary(days: DashboardDay[]) {
  const sum = (k: 'visitors' | 'new_visitors' | 'shares' | 'invite_visits') => days.reduce((a, d) => a + d[k], 0);
  // weighted by new visitors, over days where the figure is known
  const avg = (k: 'first_action_pct' | 'd1_pct' | 'd7_pct') => {
    const known = days.filter((d) => d[k] !== null && d.new_visitors > 0);
    const n = known.reduce((a, d) => a + d.new_visitors, 0);
    return n === 0 ? null : Math.round(known.reduce((a, d) => a + (d[k] as number) * d.new_visitors, 0) / n);
  };
  return {
    newVisitors: sum('new_visitors'),
    shares: sum('shares'),
    inviteVisits: sum('invite_visits'),
    firstAction: avg('first_action_pct'),
    d1: avg('d1_pct'),
    d7: avg('d7_pct'),
  };
}
