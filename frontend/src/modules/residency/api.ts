/** Typed wrappers for the residency RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityRef {
  id: string;
  name: string;
}

export type ResidencyStatusName = 'new' | 'verifying' | 'verified' | 'moving';

export type CanMove =
  | { allowed: true; free_correction: boolean; correction_until?: string }
  | { allowed: false; reason: 'not_verified' | 'moving' | 'cooldown'; available_on?: string };

export interface ServerResidency {
  calgary_day: string;
  status: ResidencyStatusName;
  community: (CommunityRef & { verified_on: string }) | null;
  candidate: (CommunityRef & { days: number; needed: number; checked_today: boolean }) | null;
  play_community: CommunityRef | null;
  pending: boolean;
  move: { started_on: string; last_day: string; free_correction: boolean } | null;
  can_move: CanMove;
  checks_left: number;
}

export type CheckResult = 'counted' | 'verified' | 'not_needed' | 'limit' | 'inaccurate' | 'no_community' | 'current_community';

export type CheckResponse = ServerResidency & { result: CheckResult; checked_community: CommunityRef | null };
export type MoveResponse = ServerResidency & ({ ok: true } | { ok: false; problem: string });

const STATUSES: readonly string[] = ['new', 'verifying', 'verified', 'moving'];
const RESULTS: readonly string[] = ['counted', 'verified', 'not_needed', 'limit', 'inaccurate', 'no_community', 'current_community'];

const isRef = (v: unknown): v is CommunityRef =>
  typeof (v as CommunityRef | null)?.id === 'string' && typeof (v as CommunityRef | null)?.name === 'string';

export function assertResidency(v: unknown): asserts v is ServerResidency {
  const o = v as Record<string, unknown> | null;
  const cand = o?.candidate as Record<string, unknown> | null | undefined;
  const move = o?.move as Record<string, unknown> | null | undefined;
  const can = o?.can_move as Record<string, unknown> | null | undefined;
  const ok =
    !!o &&
    typeof o.calgary_day === 'string' &&
    STATUSES.includes(o.status as string) &&
    (o.community === null || (isRef(o.community) && typeof (o.community as { verified_on?: unknown }).verified_on === 'string')) &&
    (cand === null || (isRef(cand) && Number.isInteger(cand?.days) && Number.isInteger(cand?.needed) && typeof cand?.checked_today === 'boolean')) &&
    (o.play_community === null || isRef(o.play_community)) &&
    typeof o.pending === 'boolean' &&
    (move === null || (typeof move?.started_on === 'string' && typeof move?.last_day === 'string' && typeof move?.free_correction === 'boolean')) &&
    typeof can?.allowed === 'boolean' &&
    Number.isInteger(o.checks_left);
  if (!ok) throw new Error('Unexpected server response: residency');
}

async function call(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data;
}

export const residencyApi = {
  async getStatus(c: SupabaseClient): Promise<ServerResidency> {
    const data = await call(c, 'residency_get_status');
    assertResidency(data);
    return data;
  },
  async checkLocation(c: SupabaseClient, lat: number, lon: number, accuracy: number): Promise<CheckResponse> {
    const data = (await call(c, 'residency_check_location', { p_lat: lat, p_lon: lon, p_accuracy: accuracy })) as CheckResponse;
    assertResidency(data);
    if (!RESULTS.includes(data.result) || !(data.checked_community === null || isRef(data.checked_community))) {
      throw new Error('Unexpected server response: location check');
    }
    return data;
  },
  async startMove(c: SupabaseClient): Promise<MoveResponse> {
    const data = (await call(c, 'residency_start_move')) as MoveResponse;
    assertResidency(data);
    return data;
  },
  async cancelMove(c: SupabaseClient): Promise<MoveResponse> {
    const data = (await call(c, 'residency_cancel_move')) as MoveResponse;
    assertResidency(data);
    return data;
  },
};
