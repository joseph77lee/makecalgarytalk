/**
 * Community development level 0–4 (requirement.md v1.41 §7.4, §9): what players see instead of
 * Vitality. Same rule as the World Map's `gamecore.world_map()` (keep them in step):
 * 0 no Welcome sign · 1 Welcome sign · 2 + Playground or Skating rink · 3 + Community hall ·
 * 4 + Neighbourhood park. A building counts once built (or upgrading past level 1).
 */
import type { BuildingView } from './types';

export function developmentLevel(buildings: Pick<BuildingView, 'key' | 'status' | 'level'>[]): number {
  const built = (key: string) => buildings.some((b) => b.key === key && (b.status === 'built' || b.level > 1));
  if (!built('welcome-sign')) return 0;
  if (built('neighbourhood-park')) return 4;
  if (built('community-hall')) return 3;
  if (built('playground') || built('skating-rink')) return 2;
  return 1;
}
