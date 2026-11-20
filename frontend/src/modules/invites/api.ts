/** Typed wrappers for the invites RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';

export type Badge =
  | { key: 'founding_resident'; community: string }
  | { key: 'good_neighbour'; count: number }
  | { key: 'pioneer_sponsor'; count: number };

export interface ServerInvites {
  code: string;
  invited: number;
  joined: number;
  invited_by: string | null;
  badges: Badge[];
}

export interface InviteLanding {
  nickname: string | null;
  community: string | null;
}

export type AcceptResult = { ok: true } | { ok: false; problem: 'unknown' | 'self' | 'already' | 'too_late' };

const isCount = (v: unknown) => Number.isInteger(v) && (v as number) >= 0;

function isBadge(b: unknown): b is Badge {
  const o = b as Record<string, unknown> | null;
  if (!o) return false;
  if (o.key === 'founding_resident') return typeof o.community === 'string';
  if (o.key === 'good_neighbour' || o.key === 'pioneer_sponsor') return isCount(o.count) && (o.count as number) > 0;
  return false;
}

export function assertInvites(v: unknown): asserts v is ServerInvites {
  const o = v as Record<string, unknown> | null;
  const ok =
    !!o &&
    typeof o.code === 'string' &&
    /^[A-HJ-NP-Z2-9]{8}$/.test(o.code) &&
    isCount(o.invited) &&
    isCount(o.joined) &&
    (o.invited_by === null || typeof o.invited_by === 'string') &&
    Array.isArray(o.badges) &&
    o.badges.every(isBadge);
  if (!ok) throw new Error('Unexpected server response: invites');
}

async function call(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data;
}

export const invitesApi = {
  async getMine(c: SupabaseClient): Promise<ServerInvites> {
    const data = await call(c, 'invites_get_mine');
    assertInvites(data);
    return data;
  },
  async accept(c: SupabaseClient, code: string): Promise<AcceptResult> {
    const data = (await call(c, 'invites_accept', { p_code: code })) as AcceptResult;
    if (typeof data?.ok !== 'boolean') throw new Error('Unexpected server response: accept invite');
    return data;
  },
  async lookup(c: SupabaseClient, code: string): Promise<InviteLanding | null> {
    const data = (await call(c, 'invites_lookup', { p_code: code })) as InviteLanding | null;
    if (data !== null && (typeof data !== 'object' || !('nickname' in data))) throw new Error('Unexpected server response: invite lookup');
    return data;
  },
};
