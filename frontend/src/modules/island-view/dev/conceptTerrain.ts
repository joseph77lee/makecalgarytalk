/**
 * Terrain concepts for the community-identity redesign (2026-11-25, handoff §4.1): three small
 * gallery islands with land on several levels: a terraced hill with a lookout, an escarpment with
 * upper and lower terraces, and a ravine with a creek, bridges and a small waterfall.
 * Gallery only; the real islands do not use it.
 *
 * Rules shown: at most 4 levels (−1 ravine floor, 0 ground, +1, +2), a level is LEVEL_H tall,
 * cliff sides use the layered dirt/rock of the island edge, every level is reached by at least
 * two stairs (paths turn into stairs where they climb one level), buildings stand flat on one level.
 */
import { box, translate, type BoxPart } from '../assets/boxes';
import { VOXEL_DESIGNS as N } from '../assets/voxel/designFit';
import { houseParts, houseTypeFor } from '../assets/voxel/houses';
import { lampPost } from '../assets/voxel/samples';
import { rnd, shade } from '../assets/voxel/voxel';
import { MOOD_PALETTES } from '../mood';

/** Height of one terrain level, in tiles. */
export const LEVEL_H = 0.55;
const TILE_H = 0.3;
const PALETTE = MOOD_PALETTES.lively;
const ROCK = '#9c9488';

export interface TerrainLabel {
  text: string;
  at: [number, number, number];
  landmark?: boolean;
}

export interface TerrainScene {
  parts: BoxPart[];
  labels: TerrainLabel[];
  /** Villagers: x, z, ground height (absolute). */
  people: [number, number, number][];
}

interface Spec {
  w: number;
  d: number;
  /** −1 … 2. */
  level: (x: number, z: number) => number;
  onIsland: (x: number, z: number) => boolean;
  water: (x: number, z: number) => boolean;
  path: (x: number, z: number) => boolean;
  /** Path tiles drawn as a wooden bridge at level 0 (over a ravine). */
  bridge?: (x: number, z: number) => boolean;
}

const roundCorners = (w: number, d: number, r = 2) => (x: number, z: number) =>
  x >= 0 && z >= 0 && x < w && z < d && Math.min(x, w - 1 - x) + Math.min(z, d - 1 - z) >= r;

/** Every window of a scenery house is lit at night (operator, 2026-11-25), so tag them all as village windows. */
const sceneryHouse = (seed: number, facing: number) =>
  houseParts(houseTypeFor('suburb', seed), seed, facing);

/** Ground, cliffs, stairs, water, waterfalls and bridges for one spec, at origin (x0, z0). */
function terrain(spec: Spec, x0: number, z0: number): { parts: BoxPart[]; used: Set<string> } {
  const parts: BoxPart[] = [];
  const used = new Set<string>();
  const { w, d, level, onIsland, water, path } = spec;
  const bridge = spec.bridge ?? (() => false);
  const top = (x: number, z: number) => level(x, z) * LEVEL_H;
  // where a path climbs one level, the lower tile becomes stairs facing the higher one
  const walkLevel = (x: number, z: number) => (bridge(x, z) ? 0 : level(x, z));
  const stairDir = (x: number, z: number): [number, number] | null => {
    if (!path(x, z) || bridge(x, z) || water(x, z)) return null;
    for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
      const nx = x + dx, nz = z + dz;
      if (onIsland(nx, nz) && path(nx, nz) && !water(nx, nz) && walkLevel(nx, nz) === level(x, z) + 1) return [dx, dz];
    }
    return null;
  };
  let minLevel = 0;
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) if (onIsland(x, z)) minLevel = Math.min(minLevel, level(x, z));

  for (let x = 0; x < w; x++)
    for (let z = 0; z < d; z++) {
      if (!onIsland(x, z)) continue;
      const L = level(x, z);
      const y = top(x, z);
      const cx = x0 + x + 0.5;
      const cz = z0 + z + 0.5;
      const odd = (x + z) & 1;
      if (water(x, z) && !bridge(x, z)) {
        parts.push(box('solid', cx, y - TILE_H, cz, 1, TILE_H - 0.12, 1, PALETTE.water));
        used.add(`${x},${z}`);
        // a waterfall where the water flows on to lower water
        for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
          const nx = x + dx, nz = z + dz;
          if (!onIsland(nx, nz) || !water(nx, nz) || level(nx, nz) >= L) continue;
          const lowY = top(nx, nz) - 0.12;
          const h = y - 0.12 - lowY;
          const fx = cx + dx * 0.5, fz = cz + dz * 0.5;
          const [sw, sd] = dx ? [0.14, 1] : [1, 0.14];
          parts.push(box('solid', fx + dx * 0.06, lowY, fz + dz * 0.06, sw, h, sd, '#cfeefc'));
          for (let i = 0; i < 4; i++) {
            const o = (i - 1.5) * 0.24;
            parts.push(box('solid', fx + dx * 0.14 + (dz ? o : 0), lowY + h * (0.15 + rnd(x, z, i) * 0.6), fz + dz * 0.14 + (dx ? o : 0), dx ? 0.05 : 0.08, h * 0.25, dz ? 0.05 : 0.08, '#ffffff'));
          }
          // foam at the foot
          parts.push(box('solid', fx + dx * 0.45, lowY, fz + dz * 0.45, dx ? 0.5 : 1.1, 0.05, dz ? 0.5 : 1.1, '#f2fbff'));
        }
      } else if (bridge(x, z)) {
        // the ravine floor under the bridge, then planks and rails at level 0
        parts.push(water(x, z) ? box('solid', cx, y - TILE_H, cz, 1, TILE_H - 0.12, 1, PALETTE.water) : box('solid', cx, y - TILE_H, cz, 1, TILE_H, 1, PALETTE.grass[odd]));
        const along = path(x, z - 1) || path(x, z + 1);
        parts.push(box('solid', cx, -0.08, cz, along ? 0.8 : 1, 0.08, along ? 1 : 0.8, '#b88a64'));
        for (const s of [-1, 1]) parts.push(box('solid', cx + (along ? s * 0.42 : 0), 0, cz + (along ? 0 : s * 0.42), along ? 0.06 : 1, 0.28, along ? 1 : 0.06, '#8a6343'));
        if (level(x, z) < 0) for (const s of [-1, 1]) parts.push(box('solid', cx + (along ? s * 0.38 : 0), y, cz + (along ? 0 : s * 0.38), 0.12, -y - 0.08, 0.12, '#7a5638'));
        used.add(`${x},${z}`);
      } else {
        const base = path(x, z) ? PALETTE.path[odd] : PALETTE.grass[odd];
        parts.push(box('solid', cx, y - TILE_H, cz, 1, TILE_H, 1, base));
        if (path(x, z)) used.add(`${x},${z}`);
        const dir = stairDir(x, z);
        if (dir) {
          // four steps rising towards the higher tile
          const [dx, dz] = dir;
          for (let i = 0; i < 4; i++) {
            const off = -0.375 + i * 0.25;
            const sx = dx ? 0.25 : 0.8, sz = dz ? 0.25 : 0.8;
            parts.push(box('solid', cx + dx * off, y, cz + dz * off, sx, ((i + 1) * LEVEL_H) / 4, sz, shade('#c9c2b4', i % 2 ? -0.04 : 0.03)));
          }
          used.add(`${x},${z}`);
        }
      }
      // cliff sides: down to the lowest neighbour, or to the island's rock bottom at its edge
      let low = L;
      let edge = false;
      for (const [dx, dz] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
        const nx = x + dx, nz = z + dz;
        if (!onIsland(nx, nz)) edge = true;
        else low = Math.min(low, level(nx, nz));
      }
      const sideTop = y - TILE_H;
      if (edge) {
        const bottom = minLevel * LEVEL_H - TILE_H - 0.45 - 0.12 - (0.7 + rnd(x, z, 31));
        parts.push(box('solid', cx, sideTop - 0.06, cz, 1, 0.06, 1, shade(PALETTE.dirtTop, 0.08)));
        parts.push(box('solid', cx, bottom, cz, 1, sideTop - 0.06 - bottom, 1, shade(PALETTE.dirtBottom, (rnd(z, x, 32) - 0.5) * 0.08)));
        parts.push(box('solid', cx, sideTop - 0.5, cz, 1.002, 0.44, 1.002, PALETTE.dirtTop));
      } else if (low < L) {
        // layered like the island edge: a lip, soil, then a rock band per level
        const lowTop = low * LEVEL_H - TILE_H;
        parts.push(box('solid', cx, sideTop - 0.06, cz, 1, 0.06, 1, shade(PALETTE.dirtTop, 0.08)));
        for (let l = L - 1; l >= low; l--) {
          const b0 = l * LEVEL_H - TILE_H;
          const isTop = l === L - 1;
          parts.push(box('solid', cx, Math.max(b0, lowTop), cz, 1, (isTop ? sideTop - 0.06 : b0 + LEVEL_H) - Math.max(b0, lowTop), 1, isTop ? PALETTE.dirtTop : shade(ROCK, (rnd(x, z, l + 40) - 0.5) * 0.1)));
        }
      }
    }
  return { parts, used };
}

/** A wooden lookout on four legs with a railing and a small roof (about 1.4 tiles). */
function lookout(): BoxPart[] {
  const wood = '#a87a52';
  const dark = '#7a5638';
  const p: BoxPart[] = [];
  for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) p.push(box('solid', x, 0, z, 0.12, 1.5, 0.12, dark));
  p.push(box('solid', 0, 0.55, 0, 1.15, 0.06, 0.06, dark), box('solid', 0, 0.55, 0, 0.06, 0.06, 1.15, dark));
  p.push(box('solid', 0, 1.0, 0, 1.4, 0.1, 1.4, wood));
  for (const s of [-1, 1]) {
    p.push(box('solid', s * 0.66, 1.1, 0, 0.06, 0.32, 1.4, dark), box('solid', 0, 1.1, s * 0.66, 1.4, 0.32, 0.06, dark));
  }
  for (const [x, z] of [[-0.66, -0.66], [0.66, -0.66], [-0.66, 0.66], [0.66, 0.66]]) p.push(box('solid', x, 1.1, z, 0.08, 0.75, 0.08, dark));
  p.push({ ...box('solid', 0, 1.85, 0, 1.6, 0.12, 1.6, '#c9483c'), tag: 'roof' }, { ...box('solid', 0, 1.97, 0, 1.0, 0.12, 1.0, '#c9483c'), tag: 'roof' }, box('solid', 0, 2.09, 0, 0.4, 0.1, 0.4, '#a83a30'));
  // a ladder up one side
  for (let i = 0; i < 5; i++) p.push(box('solid', 0, 0.12 + i * 0.2, 0.62, 0.36, 0.04, 0.04, wood));
  return p;
}

/** A railing along one tile edge (dx/dz is the side the drop is on). */
const railing = (dx: number, dz: number): BoxPart[] => {
  const along = dx === 0;
  const ox = dx * 0.44, oz = dz * 0.44;
  const p: BoxPart[] = [box('solid', ox, 0.3, oz, along ? 1 : 0.05, 0.05, along ? 0.05 : 1, '#6e5a48')];
  for (const s of [-0.4, 0, 0.4]) p.push(box('solid', ox + (along ? s : 0), 0, oz + (along ? 0 : s), 0.06, 0.33, 0.06, '#6e5a48'));
  return p;
};

/** Big white stones laid out as numbers on a slope (a generic nod to hillside stone numbers). */
const DIGITS: Record<string, string[]> = {
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '5': ['###', '#..', '##.', '..#', '##.'],
};
function stoneNumber(text: string): BoxPart[] {
  const p: BoxPart[] = [];
  [...text].forEach((ch, i) => {
    DIGITS[ch].forEach((row, r) => [...row].forEach((c, k) => {
      if (c === '#') p.push(box('solid', i * 0.8 + k * 0.22, 0, r * 0.22, 0.18, 0.08, 0.18, shade('#f4f1ea', (rnd(i, r, k) - 0.5) * 0.06)));
    }));
  });
  return p;
}

/** Shared placement helpers for one diorama. */
function scene(spec: Spec, x0: number, z0: number) {
  const { parts, used } = terrain(spec, x0, z0);
  const labels: TerrainLabel[] = [];
  const people: [number, number, number][] = [];
  const h = (x: number, z: number) => spec.level(Math.floor(x), Math.floor(z)) * LEVEL_H;
  const at = (p: BoxPart[], x: number, z: number, y = h(x, z)) =>
    parts.push(...translate(p, x0 + x, z0 + z).map((b) => (y ? { ...b, p: [b.p[0], b.p[1] + y, b.p[2]] as [number, number, number] } : b)));
  const take = (x: number, z: number, wTiles = 1, dTiles = 1) => {
    for (let i = 0; i < wTiles; i++) for (let k = 0; k < dTiles; k++) used.add(`${Math.floor(x) + i},${Math.floor(z) + k}`);
  };
  const label = (text: string, x: number, z: number, above: number, landmark = false) => labels.push({ text, at: [x0 + x, h(x, z) + above, z0 + z], landmark });
  const house = (x: number, z: number, facing: number, seed: number) => {
    at(sceneryHouse(seed, facing), x + 0.5, z + 0.5);
    take(x, z);
  };
  const person = (x: number, z: number) => people.push([x0 + x, z0 + z, h(x, z)]);
  /** Trees on free grass: denser on slopes and at the island's edge. */
  const trees = (density: (x: number, z: number) => number) => {
    const leafy = [N.shadeTree, N.ornamentalTree, N.lollipopTree, N.oliveTree];
    const evergreen = [N.tallPine, N.firTree, N.coneTree, N.youngPine];
    for (let x = 0; x < spec.w; x++)
      for (let z = 0; z < spec.d; z++) {
        if (!spec.onIsland(x, z) || used.has(`${x},${z}`) || spec.water(x, z) || spec.path(x, z)) continue;
        if (rnd(x, z, 7) >= density(x, z)) continue;
        const pool = rnd(x, z, 8) < 0.5 ? evergreen : leafy;
        at(pool[Math.floor(rnd(x, z, 9) * pool.length)].build(x * 31 + z), x + 0.5, z + 0.5);
      }
  };
  /** True when a neighbour is lower (the tile is on a slope's upper edge). */
  const nearDrop = (x: number, z: number) =>
    [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dz]) => spec.onIsland(x + dx, z + dz) && spec.level(x + dx, z + dz) < spec.level(x, z));
  return { parts, used, labels, people, at, take, label, house, person, trees, nearDrop, h };
}

// ——— 1. Terraced hill with a lookout ———
export const HILL_ORIGIN: [number, number] = [140, 0];
function hillIsland(): TerrainScene {
  const W = 20, D = 18;
  const ring = (x: number, z: number, rx: number, rz: number) => ((x + 0.5 - 10) / rx) ** 2 + ((z + 0.5 - 7) / rz) ** 2 < 1;
  const spec: Spec = {
    w: W, d: D,
    onIsland: roundCorners(W, D),
    level: (x, z) => (ring(x, z, 3.2, 2.6) ? 2 : ring(x, z, 6.4, 5.2) ? 1 : 0),
    water: () => false,
    path: (x, z) =>
      (x === 10 && z >= 7) // from the entrance straight up the hill
      || (z === 7 && x >= 10) // the east route up
      || (z === 13 && x >= 2 && x <= 17) // the lower ring road
      || (x === 3 && z >= 2 && z <= 13), // west lane to the houses
  };
  const s = scene(spec, ...HILL_ORIGIN);
  s.at(lookout(), 9.5, 6.5);
  s.take(9, 6, 1, 1);
  s.label('⭐ Hilltop lookout (level +2)', 9.5, 6.5, 2.6, true);
  for (const [x, z, f] of [[11.6, 6.2, 0], [8.2, 7.6, 2]] as const) s.at(N.parkBench.build(f), x, z);
  // stone numbers on the south-west slope (level +1)
  s.at(stoneNumber('151'), 5.2, 8.4);
  s.take(5, 8, 3, 2);
  s.label('Stone numbers on the slope', 6.3, 9, 0.6);
  s.label('Stairs', 10.5, 11.5, 0.8);
  s.label('Stairs (2nd route)', 15.5, 7.5, 0.8);
  // houses on the ground level, in two groups with yards between them
  let seed = 2000;
  for (const [x, z, f] of [[1, 14, 0], [1, 16, 0], [4, 15, 0], [6, 15, 0], [13, 15, 0], [15, 15, 0], [17, 14, 3], [12, 16, 0], [1, 4, 1], [1, 7, 1], [1, 10, 1], [4, 11, 1]] as const) s.house(x, z, f, (seed += 37));
  s.label('Homes on the ground', 4.5, 15.5, 1.5);
  for (let z = 14; z <= 16; z += 2) s.at(lampPost(), 9.6, z + 0.5);
  s.trees((x, z) => (spec.level(x, z) >= 1 ? (s.nearDrop(x, z) ? 0.35 : 0.15) : Math.min(x, z, W - 1 - x, D - 1 - z) <= 1 ? 0.45 : 0.08));
  for (const [x, z] of [[9.8, 6.0], [10.3, 12.4], [12.4, 7.4], [6.8, 13.4], [15, 13.5]] as const) s.person(x, z);
  return s;
}

// ——— 2. Escarpment: upper and lower terraces, long stairs, a viewpoint, the river below ———
export const BLUFF_ORIGIN: [number, number] = [165, 0];
function bluffIsland(): TerrainScene {
  const W = 20, D = 18;
  const edgeZ = (x: number) => 7 + (x % 7 === 3 ? 1 : 0) - (x > 13 ? 1 : 0);
  const spec: Spec = {
    w: W, d: D,
    onIsland: roundCorners(W, D),
    // the upper terrace is two levels up; the stairs have a landing (+1) where they meet the cliff
    level: (x, z) => (z < edgeZ(x) ? 2 : z === edgeZ(x) && (x === 6 || x === 15) ? 1 : 0),
    water: (x, z) => z >= 15 && z <= 16 && x >= 1 && x <= 18,
    path: (x, z) =>
      (x === 6 && z >= 3 && z <= 14) // long stairs down the escarpment
      || (x === 15 && z >= 3 && z <= 14) // second stairs
      || (z === 4 && x >= 1 && x <= 18) // the upper street along the edge
      || (z === 13 && x >= 1 && x <= 18), // the river path
  };
  const s = scene(spec, ...BLUFF_ORIGIN);
  // viewpoint: railing along the edge of the upper terrace, benches, a little pavilion
  for (let x = 1; x <= 18; x++) {
    const z = edgeZ(x) - 1;
    if (spec.path(x, z) || !spec.onIsland(x, z)) continue;
    s.at(railing(0, 1), x + 0.5, z + 0.5);
  }
  s.at(N.picnicShelter.build(0), 9.5, 5.5);
  s.take(9, 5, 1, 1);
  s.label('⭐ Viewpoint on the escarpment (level +2)', 9.5, 5.5, 1.8, true);
  for (const x of [11.5, 13.2]) s.at(N.parkBench.build(0), x, edgeZ(Math.floor(x)) - 0.65);
  s.label('Long stairs', 6.5, 8.5, 0.6);
  s.label('Stairs', 15.5, 7.5, 0.6);
  s.at(lookout(), 17.5, 5.5);
  s.take(17, 5, 1, 1);
  s.label('Lookout at the edge', 17.5, 5.5, 2.6);
  // view homes on the upper terrace, facing the edge; lower homes by the river path
  let seed = 3000;
  for (const [x, z] of [[1, 2], [3, 2], [5, 2], [8, 2], [10, 2], [2, 5], [4, 5]] as const) s.house(x, z, 0, (seed += 41));
  for (const [x, z] of [[2, 10], [4, 10], [8, 10], [10, 11], [13, 10], [17, 11], [1, 12], [9, 12]] as const) s.house(x, z, 0, (seed += 41));
  s.label('Upper terrace homes', 4.5, 2.5, 1.5);
  s.label('River path', 3.5, 13.5, 0.5);
  for (let x = 2; x <= 18; x += 4) s.at(lampPost(), x + 0.5, 13.9);
  s.trees((x, z) => (s.nearDrop(x, z) ? 0.3 : z >= 14 ? 0.5 : 0.08));
  for (const [x, z] of [[9.2, 6.2], [10.6, 6.0], [6.4, 4.6], [12, 13.4], [15.4, 11.5]] as const) s.person(x, z);
  return s;
}

// ——— 3. Ravine with a creek, bridges and a small waterfall ———
export const RAVINE_ORIGIN: [number, number] = [190, 0];
function ravineIsland(): TerrainScene {
  const W = 20, D = 18;
  const creekZ = (x: number) => 8 + Math.round(2 * Math.sin((x + 0.5) / 3));
  // side-connected: where the creek shifts a row, it also fills the step, so water always touches water
  const inCreek = (x: number, z: number) => z >= Math.min(creekZ(x), creekZ(x - 1)) && z <= Math.max(creekZ(x), creekZ(x - 1));
  const inRavine = (x: number, z: number) => Math.abs(z - creekZ(x)) <= 1 || inCreek(x, z);
  // the hill is on the west, so its cliff and the waterfall face the camera (the view sees the +x and +z sides)
  const hill = (x: number) => x <= 3;
  const spec: Spec = {
    w: W, d: D,
    onIsland: roundCorners(W, D),
    level: (x, z) => (hill(x) ? 1 : inRavine(x, z) ? -1 : 0),
    water: (x, z) => inCreek(x, z),
    path: (x, z) =>
      x === 5 || x === 11 // two crossings
      || (z === 15 && x >= 1 && x <= 18) // the front street
      || (z === 2 && x >= 1 && x <= 18) // the back street
      || (x === 8 && Math.abs(z - creekZ(8)) >= 1 && Math.abs(z - creekZ(8)) <= 2) // stairs down to the creek, both sides
      || (Math.abs(z - creekZ(x)) === 1 && x >= 7 && x <= 10 && z > creekZ(x)), // creek-side trail
    bridge: (x, z) => (x === 5 || x === 11) && inRavine(x, z),
  };
  const s = scene(spec, ...RAVINE_ORIGIN);
  s.label('⭐ Waterfall (level +1 → −1)', 4, creekZ(4) + 0.5, 1.2, true);
  s.label('Bridge', 5.5, creekZ(5) + 0.5, 1.3 + LEVEL_H);
  s.label('Bridge', 11.5, creekZ(11) + 0.5, 1.3 + LEVEL_H);
  s.label('Creek trail (level −1)', 8.5, creekZ(8) + 1.5, 0.8);
  s.at(N.parkBench.build(2), 9.5, creekZ(9) + 1.6);
  s.at(N.firePit2.build(3), 7.6, creekZ(7) - 1.4);
  s.take(7, creekZ(7) - 2);
  let seed = 4000;
  for (const [x, z] of [[1, 0.9], [3, 0.9], [7, 0.9], [9, 0.9], [13, 0.9], [14, 3]] as const) s.house(x, Math.floor(z), 0, (seed += 43));
  for (const [x, z] of [[1, 13], [3, 13], [7, 13], [9, 13], [13, 13], [15, 13], [1, 16], [3, 16], [8, 16], [14, 16]] as const) s.house(x, z, 0, (seed += 43));
  for (let x = 2; x <= 16; x += 4) s.at(lampPost(), x + 0.5, 15.9);
  // keep the waterfall in view: no trees right around it
  s.trees((x, z) => (x >= 1 && x <= 6 && Math.abs(z - creekZ(x)) <= 2 ? 0 : hill(x) ? 0.45 : inRavine(x, z) ? 0.12 : s.nearDrop(x, z) ? 0.45 : 0.06));
  for (const [x, z] of [[5.5, creekZ(5) + 0.2], [8.4, creekZ(8) + 1.2], [9.8, creekZ(9) + 1.3], [11.5, 15.4], [4, 2.4]] as const) s.person(x, z);
  // the bridges carry people at level 0
  s.people[0][2] = 0;
  return s;
}

export function buildTerrainConcepts(): TerrainScene[] {
  return [hillIsland(), bluffIsland(), ravineIsland()];
}
