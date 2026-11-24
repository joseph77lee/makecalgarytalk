import { sectorOf } from '../assets/voxel/houses';
import type { FeatureKey } from '../plan/features';

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

export function lifePlan(code: string, features: FeatureKey[], hasWater: boolean, rand: () => number): LifePlan {
  const wild = features.some((f) => f === 'big-park' || f === 'hill' || f === 'creek');
  return {
    balloon: rand() < 0.35,
    rabbits: rand() < 0.6 ? 1 + Math.floor(rand() * 2) : 0,
    deer: (wild || hasWater) && rand() < 0.4 ? 2 : 0,
    cougar: wild && rand() < 0.08,
    geeseOnGround: hasWater && rand() < 0.5 ? 2 : 0,
    planeEvery: sectorOf(code) === 'Northeast' ? 22 : 75,
  };
}
