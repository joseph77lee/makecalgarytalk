import { sectorOf } from '../assets/voxel/houses';
import type { FeatureKey } from '../plan/features';
import WILDNESS from '../plan/wildness.json';

/** Which visitors this session gets (decided once when the island opens). */
export interface LifePlan {
  balloon: boolean;
  rabbits: number;
  deer: number;
  cougar: boolean;
  geeseOnGround: number;
  /** Seconds between planes. */
  planeEvery: number;
}

/** 0 = city centre … 1 = city edge (scripts/wildness.py); unknown codes count as halfway. */
export function wildnessOf(code: string): number {
  return (WILDNESS as Record<string, number>)[code] ?? 0.4;
}

/** 0 = the smallest islands … 1 = big ones, from the number of risen land tiles. */
export function islandSize(landTiles: number): number {
  return Math.min(1, Math.max(0, (landTiles - 40) / 260));
}

/**
 * Wildlife by where the community is and how big its island is (requirement.md v1.41 §7.3):
 * downtown and inner city rarely see animals, communities near the city edge often do; small
 * islands get fewer. Deer and cougars need a park, hill, creek (deer: or water); geese need water.
 */
export function lifePlan(code: string, features: FeatureKey[], hasWater: boolean, landTiles: number, rand: () => number): LifePlan {
  const wildFeature = features.some((f) => f === 'big-park' || f === 'hill' || f === 'creek');
  const w = wildnessOf(code);
  const size = islandSize(landTiles);
  const roomy = 0.4 + 0.6 * size;
  return {
    balloon: rand() < 0.35,
    rabbits: rand() < (0.1 + 0.45 * w) * roomy ? 1 + (size > 0.5 && rand() < 0.5 ? 1 : 0) : 0,
    deer: (wildFeature || hasWater) && rand() < 0.5 * w * roomy ? (size > 0.4 ? 2 : 1) : 0,
    cougar: wildFeature && w >= 0.6 && rand() < 0.06,
    geeseOnGround: hasWater && rand() < (0.03 + 0.37 * w) * roomy ? (size > 0.5 ? 2 : 1) : 0,
    planeEvery: sectorOf(code) === 'Northeast' ? 22 : 75,
  };
}
