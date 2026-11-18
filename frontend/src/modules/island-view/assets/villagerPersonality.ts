/**
 * Each mini villager gets its own walking style so the crowd does not move in
 * lockstep. Deterministic per index (same villager, same style every visit).
 * Costs nothing extra at runtime: every villager is already simulated on its own.
 */
export interface VillagerPersonality {
  /** Multiplies the mood's base walking speed. */
  speedFactor: number;
  /** Multiplies how often and how long the villager rests. */
  restFactor: number;
  /** Only some villagers hop, and only when the community is Lively. */
  hops: boolean;
  /** Walking bob frequency (rad/s); slower walkers bob slower. */
  bobRate: number;
}

function hash01(n: number, salt: number): number {
  let h = Math.imul(n + 1, 2654435761) ^ Math.imul(salt, 1597334677);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export function villagerPersonality(index: number): VillagerPersonality {
  const speedFactor = 0.65 + hash01(index, 1) * 0.6; // 0.65–1.25
  return {
    speedFactor,
    restFactor: 0.6 + hash01(index, 2) * 1.0, // 0.6–1.6
    hops: hash01(index, 3) < 0.35,
    bobRate: 5 + speedFactor * 3,
  };
}
