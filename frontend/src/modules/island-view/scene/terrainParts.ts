import { box, type BoxPart } from '../assets/boxes';
import type { IslandTile } from '../layout';
import type { MoodPalette } from '../mood';

const TILE_H = 0.3;
const DIRT_H = 0.45;

const jag = (x: number, z: number) => {
  const h = Math.imul(x * 73856093, 1) ^ Math.imul(z * 19349663, 1);
  return ((h >>> 0) % 1000) / 1000;
};

/**
 * Top tiles (checkered grass, sand path) and the layered dirt under the island.
 * Dirt is drawn only for tiles whose ring is >= dirtFromRing: the camera never
 * sees the underside of inner tiles, so this keeps instance counts low.
 */
export function terrainParts(tiles: IslandTile[], palette: MoodPalette, dirtFromRing: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (const t of tiles) {
    const odd = (t.x + t.z) & 1;
    const colour = t.kind === 'path' ? palette.path[odd] : palette.grass[odd];
    parts.push(box('solid', t.x + 0.5, -TILE_H, t.z + 0.5, 1, TILE_H, 1, colour));
    if (t.ring >= dirtFromRing) {
      const rock = 0.7 + jag(t.x, t.z) * 1.0;
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H, t.z + 0.5, 1, DIRT_H, 1, palette.dirtTop));
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H - rock, t.z + 0.5, 1, rock, 1, palette.dirtBottom));
    }
  }
  return parts;
}
