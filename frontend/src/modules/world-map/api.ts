/** World Map data: the static shapes file and the one-request status list. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isShapes, type MapShapes } from './geometry';

export interface CommunityStatus {
  code: string;
  id: string;
  /** 0 unsettled … 4 (requirement.md v1.29 §9). */
  level: number;
  vitality: number | null;
  residents: number;
}

export async function loadShapes(fetchFn: typeof fetch = fetch): Promise<MapShapes> {
  const res = await fetchFn('/worldmap/calgary.json');
  if (!res.ok) throw new Error(`World map shapes: HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (!isShapes(data)) throw new Error('World map shapes are malformed');
  return data;
}

export function isStatusList(v: unknown): v is CommunityStatus[] {
  return (
    Array.isArray(v) &&
    v.every(
      (s) =>
        typeof s?.code === 'string' &&
        typeof s?.id === 'string' &&
        Number.isInteger(s?.level) &&
        s.level >= 0 &&
        s.level <= 4 &&
        (s?.vitality === null || typeof s?.vitality === 'number') &&
        Number.isInteger(s?.residents),
    )
  );
}

export async function fetchStatuses(c: SupabaseClient): Promise<CommunityStatus[]> {
  const { data, error } = await c.rpc('gamecore_world_map');
  if (error) throw new Error(error.message);
  if (!isStatusList(data)) throw new Error('Unexpected server response: world map');
  return data;
}
