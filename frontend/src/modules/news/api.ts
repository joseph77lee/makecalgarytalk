/** Typed wrapper for the news RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Newspaper {
  calgary_day: string;
  community: string;
  /** `welcome_sign`: the community has no Welcome sign yet (newspaper locked). */
  locked: 'welcome_sign' | null;
  announcements: { title: string; body: string }[];
  lines: { icon: string; text: string }[];
  board: { open: boolean; roadmap: { title: string; detail: string }[] };
}

const isText = (v: unknown) => typeof v === 'string';

export function assertNewspaper(v: unknown): asserts v is Newspaper {
  const o = v as Record<string, unknown> | null;
  const b = o?.board as Record<string, unknown> | undefined;
  const ok =
    !!o &&
    isText(o.calgary_day) &&
    isText(o.community) &&
    (o.locked === null || o.locked === 'welcome_sign') &&
    Array.isArray(o.announcements) &&
    o.announcements.every((a) => isText(a?.title) && isText(a?.body)) &&
    Array.isArray(o.lines) &&
    o.lines.every((l) => isText(l?.icon) && isText(l?.text)) &&
    typeof b?.open === 'boolean' &&
    Array.isArray(b?.roadmap) &&
    (b.roadmap as unknown[]).every((r) => isText((r as Record<string, unknown>)?.title));
  if (!ok) throw new Error('Unexpected server response: newspaper');
}

export async function fetchNewspaper(c: SupabaseClient, communityId: string): Promise<Newspaper> {
  const { data, error } = await c.rpc('news_get_newspaper', { p_community_id: communityId });
  if (error) throw new Error(error.message);
  assertNewspaper(data);
  return data;
}
