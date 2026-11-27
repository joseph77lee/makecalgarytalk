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

/** The next personal posting step (requirement.md v1.49 §14): its kinds and the active days to go. */
export interface NextStep {
  kinds: PostKind[];
  days: number;
  to_go: number;
}

export type CanPost =
  | { allowed: true; kinds: PostKind[]; active_days: number; next: NextStep | null }
  | { allowed: false; reason: 'not_signed_in' | 'not_verified' | 'locked' | 'daily_limit' | 'other_community' };

/** Kinds open at step 2 (an older server sends no `kinds`). */
export const STEP2_KINDS: PostKind[] = ['talk', 'lost_found', 'safety'];

export type PostProblem = 'not_verified' | 'locked' | 'daily_limit' | 'kind' | 'kind_locked' | 'length' | 'link' | 'phone' | 'address' | 'blocked';

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

const isKinds = (v: unknown): v is PostKind[] => Array.isArray(v) && v.every((k) => (POST_KINDS as readonly unknown[]).includes(k));

/** A checked `can_post` with the step fields filled in (older servers send only `allowed`). */
export function normalizeCanPost(v: CanPost): CanPost {
  if (!v.allowed) return v;
  const o = v as unknown as Record<string, unknown>;
  const n = o.next as Record<string, unknown> | null | undefined;
  const next: NextStep | null =
    n && isKinds(n.kinds) && Number.isInteger(n.days) && Number.isInteger(n.to_go) ? { kinds: n.kinds, days: n.days as number, to_go: n.to_go as number } : null;
  return {
    allowed: true,
    kinds: isKinds(o.kinds) && o.kinds.length > 0 ? o.kinds : STEP2_KINDS,
    active_days: Number.isInteger(o.active_days) ? (o.active_days as number) : 0,
    next,
  };
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
