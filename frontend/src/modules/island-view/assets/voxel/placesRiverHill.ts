/**
 * Place library: river and hill-view tracks (community-identity build map, 2026-11-26).
 * Generic places, no brands or sign text. Voxels (12 per tile), front towards +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, flowerBed, IRON, lamp, PAVING, reeds, smallTree, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { hipRoof, pick, rnd, shade, vb } from './voxel';

// --- River: riverside pathway → canoe launch → arched footbridge → riverside teahouse ---------

/** Riverside pathway (2 × 1 tiles): a curving paved path with a bench, a lamp, a bike rack and wildflowers. */
export function riversidePathway(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = -12; x < 12; x += 2) {
    const z = Math.round(Math.sin((x + 12) / 7) * 2);
    parts.push(vb(x, 0, z - 2, x + 2, 0.35, z + 2, '#cfc9bd'), vb(x, 0.35, z - 0.1, x + 1, 0.4, z + 0.1, '#f2c14e'));
  }
  parts.push(...bench(-6, -4.5), ...lamp(4, -4.5), ...flowerBed(-11.5, 3.5, 5, 2.4, seed));
  // a bike rack: three hoops
  for (let i = 0; i < 3; i++) parts.push(vb(7 + i * 1.6, 0, 3.6, 7.3 + i * 1.6, 2, 3.9, IRON), vb(7 + i * 1.6, 2, 3.6, 8.3 + i * 1.6, 2.3, 3.9, IRON), vb(8 + i * 1.6, 0, 3.6, 8.3 + i * 1.6, 2, 3.9, IRON));
  return parts;
}

/** Canoe launch (2 × 2 tiles): a dock reaching out (−z), canoes on a rack and on the dock, a life-jacket stand. */
export function canoeLaunch(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-4, 0, -12, 4, 0.8, 4, WOOD)];
  for (let z = -12; z < 4; z += 1.2) parts.push(vb(-4, 0.75, z, 4, 0.85, z + 0.12, WOOD_DARK));
  for (let z = -11; z < 4; z += 5) parts.push(vb(-4.6, -3, z, -4, 1.6, z + 0.6, WOOD_DARK), vb(4, -3, z, 4.6, 1.6, z + 0.6, WOOD_DARK));
  const hulls = ['#e46a5c', '#f2c14e', '#6fbf8a', '#5b8fd6'];
  const canoe = (x: number, y: number, z: number, c: string) => [vb(x - 1, y, z - 4.5, x + 1, y + 1, z + 4.5, c), vb(x - 0.6, y, z - 5.4, x + 0.6, y + 0.8, z + 5.4, c), vb(x - 0.7, y + 0.9, z - 3.8, x + 0.7, y + 1, z + 3.8, shade(c, -0.25))];
  parts.push(...canoe(2, 0.85, -5, pick(hulls, rnd(seed, 1))), ...canoe(-6.6, -0.1, -8, pick(hulls, rnd(seed, 2))));
  // a rack on the shore with two canoes, upside down
  parts.push(vb(7, 0, 0, 7.4, 5, 0.4, WOOD_DARK), vb(7, 0, 9, 7.4, 5, 9.4, WOOD_DARK), vb(11, 0, 0, 11.4, 5, 0.4, WOOD_DARK), vb(11, 0, 9, 11.4, 5, 9.4, WOOD_DARK));
  parts.push(vb(6.8, 2, 0, 11.6, 2.3, 9.4, WOOD), vb(6.8, 4.4, 0, 11.6, 4.7, 9.4, WOOD));
  parts.push(...canoe(9.2, 2.3, 4.7, pick(hulls, rnd(seed, 3))), ...canoe(9.2, 4.7, 4.7, pick(hulls, rnd(seed, 4))));
  parts.push(vb(-9, 0, 6, -8.6, 5, 6.4, WOOD_DARK), vb(-10.4, 3, 6.4, -8.8, 5, 7, '#f08b2c'), vb(-8.8, 3, 6.4, -7.2, 5, 7, '#f2c14e'));
  return parts;
}

/** Arched footbridge (3 × 1 tiles, spanning along x): a stepped deck rising to the middle, railings, lamps at both ends. */
export function archFootbridge(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let i = 0; i < 18; i++) {
    const x = -18 + i * 2;
    const t = (x + 1) / 18;
    const y = Math.round((1 - t * t) * 4 * 2) / 2;
    parts.push(vb(x, y, -3, x + 2, y + 1, 3, i % 2 ? '#c9a27a' : '#bf9670'));
    parts.push(vb(x, y + 1, -3, x + 2, y + 3.2, -2.6, '#fbf8f2'), vb(x, y + 1, 2.6, x + 2, y + 3.2, 3, '#fbf8f2'));
    if (i % 3 === 0) parts.push(vb(x, -3, -3, x + 0.6, y, -2.4, '#cfc6b8'), vb(x, -3, 2.4, x + 0.6, y, 3, '#cfc6b8'));
  }
  parts.push(...lamp(-17, -4.5, 8), ...lamp(17, 4.5, 8));
  return parts;
}

/**
 * Riverside teahouse (2 × 2 tiles), the river track's landmark: a pavilion under a wide shingled
 * hip roof, a deck on posts over the water with umbrellas, lanterns along the rail.
 */
export function riversideTeahouse(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 2, PAVING)];
  parts.push(vb(-9, 0, -10, 9, 8, -1, '#d9c3a0'), ...hipRoof(-11, 11, -11, 1, 9, '#8a6a52', 1, 5));
  for (let x = -8; x < 8; x += 4) parts.push(vb(x, 1, -1, x + 2.8, 7, -0.6, ART.glass));
  parts.push(vb(-1.4, 0, -1, 1.4, 6, -0.5, ART.door));
  // the deck towards the water (+z)
  parts.push(vb(-12, 1, 1, 12, 1.8, 12, WOOD));
  for (let x = -12; x < 12; x += 1.4) parts.push(vb(x, 1.75, 1, x + 0.1, 1.85, 12, WOOD_DARK));
  for (const x of [-11, -3, 5, 11]) parts.push(vb(x, -3, 11, x + 0.8, 1, 11.8, WOOD_DARK));
  parts.push(vb(-12, 1.8, 11.6, 12, 3.6, 12, '#fbf8f2'));
  for (let x = -10; x <= 10; x += 5) parts.push(vb(x - 0.3, 3.6, 11.6, x + 0.3, 6, 12, IRON), vb(x - 0.6, 6, 11.5, x + 0.6, 7, 12.1, '#ffe7a3', 'glow'));
  const umbrella = (x: number, z: number, c: string) => [vb(x - 0.2, 1.8, z - 0.2, x + 0.2, 7, z + 0.2, '#f6f2ea'), ...asSway([vb(x - 2.6, 7, z - 2.6, x + 2.6, 7.6, z + 2.6, c), vb(x - 1.4, 7.6, z - 1.4, x + 1.4, 8.1, z + 1.4, '#fbf8f2')]), vb(x - 1.4, 1.8, z - 1.4, x + 1.4, 3.4, z + 1.4, ART.wood)];
  parts.push(...umbrella(-6, 6.5, pick(['#e46a5c', '#6fbf8a'], rnd(seed, 1))), ...umbrella(6, 6.5, pick(['#f2c14e', '#5b8fd6'], rnd(seed, 2))));
  parts.push(...reeds(-10.5, 4, seed), ...smallTree(9, -9, seed));
  return parts;
}

// --- Hill view: trailhead → telescope deck → kite hill → lookout tower --------------------------

/** Trailhead (1 × 1 tile): a roofed map board, a trail post with coloured markers, a bench and a bin. */
export function trailhead(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-6, 0, -6, 6, 0.3, 6, '#c9b48e')];
  parts.push(vb(-4.6, 0, -2, -4, 7, -1.4, WOOD_DARK), vb(1.4, 0, -2, 2, 7, -1.4, WOOD_DARK), vb(-4.4, 2.6, -1.9, 1.8, 6.6, -1.5, '#f2ead8'));
  const map = ['#8cc867', '#93b8db', '#e9c46a', '#8cc867'];
  for (let i = 0; i < 4; i++) parts.push(vb(-3.8 + i * 1.4, 3.2, -1.5, -2.6 + i * 1.4, 6, -1.4, map[i]));
  parts.push(vb(-5.4, 7, -2.8, 2.8, 7.6, -0.6, '#8a6a52'));
  parts.push(vb(4, 0, 1, 4.6, 6, 1.6, WOOD), vb(4.6, 4.6, 1, 5, 5.2, 1.6, '#e46a5c'), vb(4.6, 3.6, 1, 5, 4.2, 1.6, '#5b8fd6'), vb(4.6, 2.6, 1, 5, 3.2, 1.6, '#f2c14e'));
  parts.push(...bench(-2, 4), vb(3.4, 0, 3.6, 5, 2.4, 5.2, '#5f7a5a'));
  return parts;
}

/** Telescope deck (2 × 2 tiles): a raised wooden deck with a railing on the view side, two coin telescopes and benches. */
export function telescopeDeck(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 1.2, 10, WOOD)];
  for (let x = -12; x < 12; x += 1.4) parts.push(vb(x, 1.15, -12, x + 0.1, 1.25, 10, WOOD_DARK));
  parts.push(vb(-3, 0, 10, 3, 0.6, 12, WOOD));
  // railing on the far (view) side and the sides
  parts.push(vb(-12, 1.2, -12, 12, 4.4, -11.6, WOOD_DARK), vb(-12, 1.2, -12, -11.6, 4.4, 10, WOOD_DARK), vb(11.6, 1.2, -12, 12, 4.4, 10, WOOD_DARK));
  for (let x = -11; x < 12; x += 2) parts.push(vb(x, 1.2, -11.9, x + 0.3, 4, -11.7, '#a87a52'));
  const scope = (x: number) => [vb(x - 0.4, 1.2, -8.4, x + 0.4, 5, -7.6, IRON), vb(x - 1, 5, -9.6, x + 1, 6.4, -7, '#5b8fd6'), vb(x - 0.6, 5.4, -10.6, x + 0.6, 6, -9.6, IRON)];
  parts.push(...scope(-5), ...scope(5));
  parts.push(...bench(-6, 4).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 0.1, b.p[2]] as [number, number, number] })), ...bench(6, 4).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 0.1, b.p[2]] as [number, number, number] })));
  return parts;
}

/** Kite hill (2 × 2 tiles): picnic blankets and a table on the grass, kites flying high on long strings. */
export function kiteHill(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  const colours = ['#e46a5c', '#f2c14e', '#5b8fd6', '#a77bd1', '#6fbf8a'];
  parts.push(vb(-9, 0, 2, -3, 0.2, 7, pick(colours, rnd(seed, 1))), vb(2, 0, -6, 8, 0.2, -1, pick(colours, rnd(seed, 2))));
  parts.push(vb(-2, 2.4, -1, 4, 2.8, 2, ART.wood), vb(-1.6, 0, -0.6, -1, 2.4, 1.6, ART.wood), vb(3, 0, -0.6, 3.6, 2.4, 1.6, ART.wood), vb(-2, 1.2, -2.4, 4, 1.6, -1.4, ART.wood), vb(-2, 1.2, 2.4, 4, 1.6, 3.4, ART.wood));
  parts.push(vb(-7, 0.2, 3, -5.6, 1.4, 4.2, '#c9a27a'), vb(4, 0.2, -4, 5.4, 1, -3, '#e9c46a'));
  // kites: a diamond, its string, a tail of bows
  for (const [k, [ax, az, kx, ky, kz]] of ([[0, [-6, 5, -10, 22, -6]], [1, [5, -3, 9, 26, -9]]] as const)) {
    const c = pick(colours, rnd(seed, k + 5));
    parts.push(...asSway([vb(kx - 2, ky - 1, kz, kx + 2, ky + 1, kz + 0.3, c), vb(kx - 1, ky - 2, kz, kx + 1, ky + 2, kz + 0.3, c), vb(kx - 0.3, ky - 2.4, kz, kx + 0.3, ky + 2.4, kz + 0.35, '#fbf8f2')]));
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      parts.push(vb(ax + (kx - ax) * t - 0.08, ky * t * t, az + (kz - az) * t - 0.08, ax + (kx - ax) * t + 0.08, ky * t * t + 0.9, az + (kz - az) * t + 0.08, '#f2ead8'));
    }
    for (let i = 0; i < 3; i++) parts.push(...asSway([vb(kx - 0.5, ky - 3.6 - i * 1.4, kz, kx + 0.5, ky - 3.1 - i * 1.4, kz + 0.3, pick(colours, rnd(seed, k, i)))]));
  }
  parts.push(...smallTree(9, 8, seed, 10), ...smallTree(-10, -8, seed + 2, 9));
  return parts;
}

/**
 * Lookout tower (2 × 2 tiles), the hill-view track's landmark: a timber tower on four braced legs,
 * a railed platform under a red roof, a stair up one side and a lantern that lights at night.
 */
export function lookoutTower(_seed: number): BoxPart[] {
  const wood = '#a87a52';
  const dark = '#7a5638';
  const parts: BoxPart[] = [vb(-10, 0, -10, 10, 0.4, 10, '#c9b48e')];
  for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) parts.push(vb(x - 0.8, 0, z - 0.8, x + 0.8, 22, z + 0.8, dark));
  for (const y of [6, 13]) parts.push(vb(-6, y, -6.3, 6, y + 0.8, -5.7, dark), vb(-6, y, 5.7, 6, y + 0.8, 6.3, dark), vb(-6.3, y, -6, -5.7, y + 0.8, 6, dark), vb(5.7, y, -6, 6.3, y + 0.8, 6, dark));
  parts.push(vb(-8.4, 18, -8.4, 8.4, 19.2, 8.4, wood));
  for (const s of [-1, 1]) parts.push(vb(-8.4, 19.2, s * 8.1 - 0.3, 8.4, 22, s * 8.1 + 0.3, dark), vb(s * 8.1 - 0.3, 19.2, -8.4, s * 8.1 + 0.3, 22, 8.4, dark));
  for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) parts.push(vb(x - 0.5, 19.2, z - 0.5, x + 0.5, 27, z + 0.5, dark));
  parts.push(...hipRoof(-9, 9, -9, 9, 28, '#c9483c', 1, 5), vb(-0.4, 33, -0.4, 0.4, 35, 0.4, IRON));
  parts.push(vb(-1, 24, -1, 1, 26, 1, '#ffe7a3', 'glow'));
  // a zig-zag stair up the front
  for (let i = 0; i < 18; i++) {
    const up = i < 9;
    const x = up ? -5 + i * 1.2 : 5 - (i - 9) * 1.2;
    const z = up ? 8 : 9.6;
    parts.push(vb(x - 0.6, i + 0.6, z - 0.8, x + 0.6, i + 1.2, z + 0.8, wood));
  }
  parts.push(vb(-6, 0, 8.8, 6, 18, 9, shade(dark, 0.1)));
  return parts;
}
