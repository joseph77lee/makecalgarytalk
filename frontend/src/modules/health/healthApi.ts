/** Client for the `public.common_health()` RPC (server: supabase/migrations/*_common_foundation.sql). */

export interface HealthInfo {
  calgaryDay: string;
  nextDayStart: Date;
  dbTime: Date;
  postgis: string;
}

export type HealthResult = { ok: true; info: HealthInfo } | { ok: false; reason: string };

/** Minimal RPC shape so the API can be tested without a real Supabase client. */
export type RpcCaller = (fn: string) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseInstant(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseHealth(data: unknown): HealthResult {
  if (typeof data !== 'object' || data === null) {
    return { ok: false, reason: 'Unexpected response from server' };
  }
  const raw = data as Record<string, unknown>;
  if (raw.status !== 'ok') {
    return { ok: false, reason: `Server status: ${String(raw.status)}` };
  }
  const dbTime = parseInstant(raw.db_time);
  const nextDayStart = parseInstant(raw.next_day_start);
  const calgaryDay = raw.calgary_day;
  if (!dbTime || !nextDayStart || typeof calgaryDay !== 'string' || !DAY_PATTERN.test(calgaryDay)) {
    return { ok: false, reason: 'Unexpected response from server' };
  }
  return {
    ok: true,
    info: { calgaryDay, nextDayStart, dbTime, postgis: String(raw.postgis ?? 'unknown') },
  };
}

export async function fetchHealth(rpc: RpcCaller): Promise<HealthResult> {
  try {
    const { data, error } = await rpc('common_health');
    if (error) {
      return { ok: false, reason: error.message };
    }
    return parseHealth(data);
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Network error' };
  }
}
