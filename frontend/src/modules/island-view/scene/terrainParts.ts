import { box, type BoxPart } from '../assets/boxes';
import type { IslandTile, Tile } from '../layout';
import type { MoodPalette } from '../mood';

const TILE_H = 0.3;
const DIRT_H = 0.45;

const jag = (x: number, z: number) => {
  const h = Math.imul(x * 73856093, 1) ^ Math.imul(z * 19349663, 1);
  return ((h >>> 0) % 1000) / 1000;
};

/**
 * Top tiles (checkered grass, sand paths) and layered dirt under the edge of the land.
 * `landKeys` decides which tiles are on the edge (a neighbour is not land); pass null to
 * give every tile dirt (rising new land, whose neighbours are not settled yet).
 */
export function terrainParts(tiles: Pick<IslandTile, 'x' | 'z' | 'kind'>[], landKeys: Set<string> | null, palette: MoodPalette): BoxPart[] {
  const parts: BoxPart[] = [];
  const isLand = (x: number, z: number) => landKeys?.has(`${x},${z}`) ?? false;
  for (const t of tiles) {
    const odd = (t.x + t.z) & 1;
    if (t.kind === 'water' || t.kind === 'bridge') {
      // Water sits a little lower; a bridge is wooden planks over it.
      parts.push(box('solid', t.x + 0.5, -TILE_H, t.z + 0.5, 1, TILE_H - 0.12, 1, palette.water));
      if (t.kind === 'bridge') {
        parts.push(box('solid', t.x + 0.5, -0.06, t.z + 0.5, 1, 0.06, 0.8, '#b88a64'));
        parts.push(box('solid', t.x + 0.5, 0, t.z + 0.08, 1, 0.12, 0.05, '#8a6343'));
        parts.push(box('solid', t.x + 0.5, 0, t.z + 0.92, 1, 0.12, 0.05, '#8a6343'));
      }
    } else {
      const colour = t.kind === 'path' ? palette.path[odd] : palette.grass[odd];
      parts.push(box('solid', t.x + 0.5, -TILE_H, t.z + 0.5, 1, TILE_H, 1, colour));
    }
    const edge = landKeys === null || !isLand(t.x + 1, t.z) || !isLand(t.x - 1, t.z) || !isLand(t.x, t.z + 1) || !isLand(t.x, t.z - 1);
    if (edge) {
      const rock = 0.7 + jag(t.x, t.z) * 1.0;
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H, t.z + 0.5, 1, DIRT_H, 1, palette.dirtTop));
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H - rock, t.z + 0.5, 1, rock, 1, palette.dirtBottom));
    }
  }
  return parts;
}

/** The rest of the real outline as soft translucent "future land" (requirement.md §7.8). */
export function futureLandParts(tiles: Tile[]): BoxPart[] {
  return tiles.map((t) => box('mist', t.x + 0.5, -0.36, t.z + 0.5, 1, 0.06, 1, '#ffffff'));
}
