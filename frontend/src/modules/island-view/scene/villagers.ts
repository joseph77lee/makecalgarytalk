/**
 * How many mini villagers walk an island (requirement.md v1.41 §7.3): natural and random,
 * scaled by the walkable land, not by players or activity. Fewer at night and in rain or snow.
 */
import { MAX_MINI_VILLAGERS, type IslandEnvironment } from '../types';

/** Walkable tiles per villager on average (≈ 0–1 on the smallest islands, ≈ 14 on the largest). */
const TILES_PER_VILLAGER = 60;

/**
 * Villagers for this visit: land size × a random 0.7–1.3, and at least `minimum` (one per real story
 * to tell: today's action replay, today's posts), so a tiny island still shows them.
 */
export function villagerCount(walkableTiles: number, rand: () => number, minimum = 0): number {
  const n = Math.round((walkableTiles / TILES_PER_VILLAGER) * (0.7 + 0.6 * rand()));
  return Math.min(MAX_MINI_VILLAGERS, Math.max(minimum, n));
}

/** How many of them are outside now: about 40 % at night, about half in rain or snow. */
export function villagersOutside(count: number, env: Pick<IslandEnvironment, 'weather'> & { nightness: number }, minimum = 0): number {
  const wet = env.weather === 'rain' || env.weather === 'snow' || env.weather === 'mix' || env.weather === 'thunderstorm';
  const share = (1 - 0.6 * env.nightness) * (wet ? 0.5 : 1);
  return Math.min(count, Math.max(minimum, Math.round(count * share)));
}

/** A small seeded random source (one seed per visit keeps the count steady while the island is open). */
export function seededRandom(seed: number): () => number {
  let s = Math.max(1, Math.floor(seed * 2147483646) || 1);
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Which posts ride on which free villagers at turn `tick` (§7.3): at most `max` at once, taking
 * turns so every post comes round, and the villagers carrying them change too.
 */
export function pickPostBubbles<T>(posts: T[], villagers: number, busy: Set<number>, tick: number, max: number): { villager: number; post: T }[] {
  if (posts.length === 0 || villagers === 0) return [];
  const free = Array.from({ length: villagers }, (_, i) => (i + tick) % villagers).filter((i) => !busy.has(i));
  const showing = Math.min(max, posts.length, free.length);
  return Array.from({ length: showing }, (_, k) => ({ villager: free[k], post: posts[(tick * showing + k) % posts.length] }));
}
