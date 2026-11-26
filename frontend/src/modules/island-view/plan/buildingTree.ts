/**
 * The build map (requirement.md v1.48 §7.6, §7.6b): supabase/data/build_map.json is the single
 * source, shared with the gamecore seed and the island plan generator. Main Street and spare lots
 * (not build map steps) still come from supabase/data/building_tree.json.
 *
 * The client never decides what opens (the server does); this is for drawing: names, tracks and
 * steps, footprints, and the land tiers.
 */
import rawLots from '../../../../../supabase/data/building_tree.json';
import rawMap from '../../../../../supabase/data/build_map.json';

export type Track = 'root' | 'community' | 'persona' | 'nature';

export interface LotSpec {
  size: [number, number];
  /** Land stage (0–5) from which the lot exists and is reserved. */
  landStage: number;
  kind: 'entrance' | 'building' | 'main-street' | 'spare';
}

export interface BuildingSpec {
  key: string;
  name: string;
  track: Track;
  /** Place in its track (root 0, then 1, 2, …). */
  step: number;
  /** Multiplier stage 0–6 (as on the server). */
  stage: number;
  /** Footprint in tiles; [0, 0] = no lot (drawn along the paths). */
  tiles: [number, number];
  site: string;
  /** Only for this persona / community; missing = every community. */
  persona?: string;
  community?: string;
  landmarkOrder?: number;
  /** Starting conditions (shown in the dev panel; the server decides). */
  residents: number;
  streakDays: number;
  requires: string[];
}

interface RawStep {
  key: string;
  label: string;
  track: Track;
  step: number;
  tiles: [number, number];
  site: string;
  persona?: string;
  community?: string;
  landmarkOrder?: number;
}

interface RawMap {
  stageMultipliers: Record<string, number>;
  conditions: { common: { step: number; residents?: number; streakDays?: number }[]; landmarks: { order: number; residents?: number; streakDays?: number }[] };
  landTiers: { minResidents: number; tiles: number | null }[];
  steps: RawStep[];
}

const MAP = rawMap as unknown as RawMap;
const TOP_STAGE = 6;

/** Stage and conditions of a step (the same rule as supabase/data/build_map_seed.py). */
function conditions(s: RawStep): { stage: number; residents: number; streakDays: number } {
  if (s.track === 'root') return { stage: 0, residents: 0, streakDays: 0 };
  if (s.track === 'persona' && s.step >= 4) {
    const c = MAP.conditions.landmarks.find((x) => x.order === s.step - 3);
    return { stage: TOP_STAGE, residents: c?.residents ?? 0, streakDays: c?.streakDays ?? 0 };
  }
  const c = MAP.conditions.common.find((x) => x.step === s.step);
  return c ? { stage: Math.min(s.step, TOP_STAGE), residents: c.residents ?? 0, streakDays: c.streakDays ?? 0 } : { stage: TOP_STAGE, residents: 0, streakDays: 0 };
}

export const BUILD_STEPS: BuildingSpec[] = MAP.steps.map((s) => ({
  key: s.key,
  name: s.label,
  track: s.track,
  step: s.step,
  tiles: s.tiles,
  site: s.site,
  persona: s.persona,
  community: s.community,
  landmarkOrder: s.landmarkOrder,
  ...conditions(s),
  requires: [],
}));

const LOT_DATA = (rawLots as unknown as { lots: Record<string, LotSpec> }).lots;
/** Main Street and spare lots (the build map's own lots are keyed by step key in each plan). */
export const LOT_SPECS: Record<string, LotSpec> = Object.fromEntries(Object.entries(LOT_DATA).filter(([, v]) => v.kind === 'main-street' || v.kind === 'spare'));

/** Kind of a plan lot by its key: the Welcome sign stands at the entrance. */
export function lotKind(key: string): LotSpec['kind'] {
  if (key === 'welcome-sign') return 'entrance';
  return LOT_SPECS[key]?.kind ?? 'building';
}

export const BUILDING_TREE = {
  stageMultipliers: MAP.stageMultipliers,
  landTiers: MAP.landTiers,
  lots: LOT_SPECS,
  buildings: BUILD_STEPS,
};
export const BUILDING_KEYS = BUILD_STEPS.map((b) => b.key);
export const LAND_STAGE_COUNT = MAP.landTiers.length;

/** Land stage for a number of cumulative Verified Residents (requirement.md §7.8). */
export function landStageForResidents(residents: number): number {
  let stage = 0;
  MAP.landTiers.forEach((t, i) => {
    if (residents >= t.minResidents) stage = i;
  });
  return stage;
}

export function buildingSpec(key: string): BuildingSpec | undefined {
  return BUILD_STEPS.find((b) => b.key === key);
}

/** One community's steps: per track and step the most specific applicable row (as on the server). */
export function communitySteps(code: string, persona: string | null): BuildingSpec[] {
  const best = new Map<string, { rank: number; spec: BuildingSpec }>();
  for (const s of BUILD_STEPS) {
    if ((s.persona && s.persona !== persona) || (s.community && s.community !== code)) continue;
    const rank = (s.community ? 2 : 0) + (s.persona ? 1 : 0);
    const k = `${s.track}:${s.step}`;
    const cur = best.get(k);
    if (!cur || rank > cur.rank) best.set(k, { rank, spec: s });
  }
  const order: Record<Track, number> = { root: 0, community: 1, persona: 2, nature: 3 };
  return [...best.values()].map((x) => x.spec).sort((a, b) => order[a.track] - order[b.track] || a.step - b.step);
}
