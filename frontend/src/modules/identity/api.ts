/** Typed wrappers for the identity RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAvatarLook, type AvatarLook } from '../common';
import type { NicknameProblem } from './nickname';

export interface Profile {
  nickname: string;
  shirt: number;
  /** The villager look (v1.52 §10.2); null for profiles saved before players chose one. */
  look: AvatarLook | null;
}

export interface ServerIdentity {
  calgary_day: string;
  is_anonymous: boolean;
  profile: Profile | null;
  changes_seen_today: boolean;
}

export type SaveResult = ({ ok: true } & ServerIdentity) | { ok: false; problem: NicknameProblem | 'shirt' | 'look' };

/** Older servers send no `look`: treat it as not chosen. */
function withLook<T extends ServerIdentity>(d: T): T {
  return d.profile ? { ...d, profile: { ...d.profile, look: d.profile.look ?? null } } : d;
}

function assertIdentity(v: unknown): asserts v is ServerIdentity {
  const o = v as Record<string, unknown> | null;
  const p = o?.profile as Record<string, unknown> | null | undefined;
  const ok =
    !!o &&
    typeof o.calgary_day === 'string' &&
    typeof o.is_anonymous === 'boolean' &&
    typeof o.changes_seen_today === 'boolean' &&
    (p === null || (typeof p?.nickname === 'string' && Number.isInteger(p?.shirt) && (p?.look == null || isAvatarLook(p.look))));
  if (!ok) throw new Error('Unexpected server response: identity');
}

async function call(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new Error(error.message);
  return data;
}

/** Optional email updates (requirement.md §18, CASL): explicit opt-in only. */
export interface EmailUpdates {
  on: boolean;
  email: string | null;
}

/** Wording next to the checkbox; must match identity.email_consent_version() on the server. */
export const EMAIL_CONSENT_TEXT =
  'Yes, email me occasional updates about MakeCalgaryTalk (new features, big community moments). I can unsubscribe anytime.';

export function isEmailUpdates(v: unknown): v is EmailUpdates {
  const o = v as Record<string, unknown> | null;
  return !!o && typeof o.on === 'boolean' && (o.email === null || typeof o.email === 'string');
}

/** Same rule as the server: something@something.tld, at most 254 characters. */
export const isEmail = (text: string): boolean => {
  const t = text.trim();
  return t.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t);
};

export const identityApi = {
  async getEmailUpdates(c: SupabaseClient): Promise<EmailUpdates> {
    const data = await call(c, 'identity_get_email_updates');
    if (!isEmailUpdates(data)) throw new Error('Unexpected server response: email updates');
    return data;
  },
  async setEmailUpdates(c: SupabaseClient, email: string | null, on: boolean): Promise<EmailUpdates> {
    const data = await call(c, 'identity_set_email_updates', { p_email: email, p_on: on });
    if (!isEmailUpdates(data)) throw new Error('Unexpected server response: email updates');
    return data;
  },
  async getProfile(c: SupabaseClient): Promise<ServerIdentity> {
    const data = await call(c, 'identity_get_profile');
    assertIdentity(data);
    return withLook(data);
  },
  async saveProfile(c: SupabaseClient, nickname: string, shirt: number, look: AvatarLook): Promise<SaveResult> {
    const data = (await call(c, 'identity_save_profile', { p_nickname: nickname, p_shirt: shirt, p_look: look })) as SaveResult;
    if (data?.ok === true) {
      assertIdentity(data);
      return { ...withLook(data), ok: true };
    }
    if (data?.ok !== false) throw new Error('Unexpected server response: save profile');
    return data;
  },
  async markChangesSeen(c: SupabaseClient): Promise<ServerIdentity> {
    const data = await call(c, 'identity_mark_changes_seen');
    assertIdentity(data);
    return data;
  },
};
