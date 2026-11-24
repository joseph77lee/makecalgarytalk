import { box, type BoxPart } from '../assets/boxes';
import { shade } from '../assets/voxel/voxel';
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
      // Art Pass ground detail: slight colour variation per tile, grass tufts, stepping stones on paths.
      const base = t.kind === 'path' ? palette.path[odd] : palette.grass[odd];
      parts.push(box('solid', t.x + 0.5, -TILE_H, t.z + 0.5, 1, TILE_H, 1, shade(base, (jag(t.x, t.z) - 0.5) * 0.07)));
      const r = jag(t.z * 7 + 3, t.x * 5 + 1);
      if (t.kind === 'path') {
        if (r < 0.55) {
          const ox = (jag(t.x + 11, t.z) - 0.5) * 0.4;
          const oz = (jag(t.x, t.z + 13) - 0.5) * 0.4;
          parts.push(box('solid', t.x + 0.5 + ox, 0, t.z + 0.5 + oz, 0.3, 0.025, 0.24, shade(palette.path[0], -0.12)));
          if (r < 0.25) parts.push(box('solid', t.x + 0.5 - ox * 0.8, 0, t.z + 0.5 - oz * 0.8, 0.2, 0.02, 0.18, shade(palette.path[1], -0.08)));
        }
      } else if (r < 0.4) {
        const tufts = r < 0.15 ? 2 : 1;
        for (let i = 0; i < tufts; i++) {
          const ox = (jag(t.x + 17 + i * 5, t.z) - 0.5) * 0.8;
          const oz = (jag(t.x, t.z + 19 + i * 7) - 0.5) * 0.8;
          parts.push(box('solid', t.x + 0.5 + ox, 0, t.z + 0.5 + oz, 0.07, 0.07, 0.07, shade(palette.grass[1], -0.18)));
          parts.push(box('solid', t.x + 0.5 + ox + 0.05, 0, t.z + 0.5 + oz - 0.03, 0.05, 0.05, 0.05, shade(palette.grass[0], -0.1)));
        }
      }
    }
    const edge = landKeys === null || !isLand(t.x + 1, t.z) || !isLand(t.x - 1, t.z) || !isLand(t.x, t.z + 1) || !isLand(t.x, t.z - 1);
    if (edge) {
      const rock = 0.7 + jag(t.x, t.z) * 1.0;
      // a thin darker lip under the grass, the soil, a band, then rock (layered like the reference)
      parts.push(box('solid', t.x + 0.5, -TILE_H - 0.06, t.z + 0.5, 1, 0.06, 1, shade(palette.dirtTop, 0.08)));
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H, t.z + 0.5, 1, DIRT_H - 0.06, 1, palette.dirtTop));
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H - 0.12, t.z + 0.5, 1, 0.12, 1, shade(palette.dirtBottom, 0.1)));
      parts.push(box('solid', t.x + 0.5, -TILE_H - DIRT_H - 0.12 - rock, t.z + 0.5, 1, rock, 1, shade(palette.dirtBottom, (jag(t.z, t.x) - 0.5) * 0.08)));
    }
  }
  return parts;
}

/** The rest of the real outline as soft translucent "future land" (requirement.md §7.8). */
export function futureLandParts(tiles: Tile[]): BoxPart[] {
  return tiles.map((t) => box('mist', t.x + 0.5, -0.36, t.z + 0.5, 1, 0.06, 1, '#ffffff'));
}
