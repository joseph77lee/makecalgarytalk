/** Typed wrappers for the identity RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NicknameProblem } from './nickname';

export interface Profile {
  nickname: string;
  shirt: number;
}

export interface ServerIdentity {
  calgary_day: string;
  is_anonymous: boolean;
  profile: Profile | null;
  changes_seen_today: boolean;
}

export type SaveResult = ({ ok: true } & ServerIdentity) | { ok: false; problem: NicknameProblem | 'shirt' };

function assertIdentity(v: unknown): asserts v is ServerIdentity {
  const o = v as Record<string, unknown> | null;
  const p = o?.profile as Record<string, unknown> | null | undefined;
  const ok =
    !!o &&
    typeof o.calgary_day === 'string' &&
    typeof o.is_anonymous === 'boolean' &&
    typeof o.changes_seen_today === 'boolean' &&
    (p === null || (typeof p?.nickname === 'string' && Number.isInteger(p?.shirt)));
  if (!ok) throw new Error('Unexpected server response: identity');
}

async function call(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data;
}

export const identityApi = {
  async getProfile(c: SupabaseClient): Promise<ServerIdentity> {
    const data = await call(c, 'identity_get_profile');
    assertIdentity(data);
    return data;
  },
  async saveProfile(c: SupabaseClient, nickname: string, shirt: number): Promise<SaveResult> {
    const data = (await call(c, 'identity_save_profile', { p_nickname: nickname, p_shirt: shirt })) as SaveResult;
    if (data?.ok === true) assertIdentity(data);
    else if (data?.ok !== false) throw new Error('Unexpected server response: save profile');
    return data;
  },
  async markChangesSeen(c: SupabaseClient): Promise<ServerIdentity> {
    const data = await call(c, 'identity_mark_changes_seen');
    assertIdentity(data);
    return data;
  },
};
