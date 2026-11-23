/** Typed wrappers for the posts RPC (docs/api.md). The feed itself comes with the newspaper. */
import type { SupabaseClient } from '@supabase/supabase-js';

export const POST_KINDS = ['safety', 'deal', 'event', 'lost_found', 'talk'] as const;
export type PostKind = (typeof POST_KINDS)[number];

export interface Post {
  id: string;
  kind: PostKind;
  body: string;
  nickname: string;
  days_ago: number;
  thanks: number;
  mine: boolean;
  thanked: boolean;
  reported: boolean;
}

export type CanPost = { allowed: true } | { allowed: false; reason: 'not_signed_in' | 'not_verified' | 'locked' | 'daily_limit' | 'other_community' };

export type PostProblem = 'not_verified' | 'locked' | 'daily_limit' | 'kind' | 'length' | 'link' | 'phone' | 'address' | 'blocked';

export function isPost(v: unknown): v is Post {
  const o = v as Record<string, unknown> | null;
  return (
    !!o &&
    typeof o.id === 'string' &&
    (POST_KINDS as readonly unknown[]).includes(o.kind) &&
    typeof o.body === 'string' &&
    typeof o.nickname === 'string' &&
    Number.isInteger(o.days_ago) &&
    Number.isInteger(o.thanks) &&
    typeof o.mine === 'boolean' &&
    typeof o.thanked === 'boolean' &&
    typeof o.reported === 'boolean'
  );
}

export function isCanPost(v: unknown): v is CanPost {
  const o = v as Record<string, unknown> | null;
  return !!o && typeof o.allowed === 'boolean' && (o.allowed === true || typeof o.reason === 'string');
}

async function call(c: SupabaseClient, fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await c.rpc(fn, args);
  if (error) throw new Error(error.message);
  return (data ?? {}) as Record<string, unknown>;
}

export const postsApi = {
  async create(c: SupabaseClient, kind: PostKind, body: string): Promise<{ ok: true } | { ok: false; problem: PostProblem }> {
    const d = await call(c, 'posts_create', { p_kind: kind, p_body: body });
    return d.ok === true ? { ok: true } : { ok: false, problem: d.problem as PostProblem };
  },
  async remove(c: SupabaseClient, id: string): Promise<void> {
    await call(c, 'posts_delete', { p_post_id: id });
  },
  /** null when reported, else why not (`limit`: 3 reports a day). */
  async report(c: SupabaseClient, id: string): Promise<string | null> {
    const d = await call(c, 'posts_report', { p_post_id: id });
    return d.ok === true ? null : String(d.problem ?? 'error');
  },
  async unreport(c: SupabaseClient, id: string): Promise<void> {
    await call(c, 'posts_unreport', { p_post_id: id });
  },
  async thank(c: SupabaseClient, id: string): Promise<void> {
    await call(c, 'posts_thank', { p_post_id: id });
  },
};
