/**
 * The building tree (requirement.md §7.6), shared with the gamecore seed (M3) and the
 * island plan generator: supabase/data/building_tree.json is the single source.
 */
import raw from '../../../../../supabase/data/building_tree.json';

export interface LotSpec {
  size: [number, number];
  /** Land stage (0–5) from which the lot exists and is reserved. */
  landStage: number;
  kind: 'entrance' | 'building' | 'main-street' | 'spare';
}

export interface BuildingSpec {
  key: string;
  name: string;
  stage: number;
  /** Lot key, or null for buildings without a lot (e.g. pathway lights). */
  lot: string | null;
  /** The building this one replaces on the same lot (growth chain). */
  growsFrom: string | null;
  requires: string[];
  residents: number;
  streakDays: number;
}

export interface BuildingTree {
  stageMultipliers: Record<string, number>;
  landTiers: { minResidents: number; tiles: number | null }[];
  lots: Record<string, LotSpec>;
  buildings: BuildingSpec[];
}

export const BUILDING_TREE = raw as unknown as BuildingTree;
export const BUILDING_KEYS = BUILDING_TREE.buildings.map((b) => b.key);
export const LAND_STAGE_COUNT = BUILDING_TREE.landTiers.length;

/** Land stage for a number of cumulative Verified Residents (requirement.md §7.8). */
export function landStageForResidents(residents: number): number {
  let stage = 0;
  BUILDING_TREE.landTiers.forEach((t, i) => {
    if (residents >= t.minResidents) stage = i;
  });
  return stage;
}

export function buildingSpec(key: string): BuildingSpec | undefined {
  return BUILDING_TREE.buildings.find((b) => b.key === key);
}

/** All buildings that use a lot, in growth order (first = seed). */
export function chainOnLot(lot: string): BuildingSpec[] {
  return BUILDING_TREE.buildings.filter((b) => b.lot === lot).sort((a, b) => a.stage - b.stage);
}
