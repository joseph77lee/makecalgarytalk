/**
 * Unique landmarks of the priority communities, third batch (community-identity build map,
 * 2026-11-26): hills, entrance monuments, heritage buildings, downtown. Voxel reinterpretations of
 * the operator's reference photos, no logos, sign text or business names. Voxels (12 per tile),
 * front +z, centred by the registry.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, fence, flowerBed, IRON, LAMP, lamp, PAVING, smallTree, STONE, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, vmove, vturn, windowX, windowZ } from './voxel';

const G = ART.glass;
const GRASS = '#9fc874';

/** A spruce at (x, z) standing on height y. */
function spruce(x: number, z: number, h = 10, y = 0): BoxPart[] {
  const r = h * 0.22;
  return vmove([
    vb(x - 0.4, 0, z - 0.4, x + 0.4, h * 0.3, z + 0.4, ART.trunk),
    ...asSway([
      vb(x - r, h * 0.22, z - r, x + r, h * 0.5, z + r, ART.spruce[0]),
      vb(x - r * 0.7, h * 0.5, z - r * 0.7, x + r * 0.7, h * 0.76, z + r * 0.7, ART.spruce[1]),
      vb(x - r * 0.4, h * 0.76, z - r * 0.4, x + r * 0.4, h, z + r * 0.4, ART.spruce[0]),
    ]),
  ], 0, y, 0);
}

/** A round plan (three crossed boxes) centred at (cx, cz). */
const round = (cx: number, cz: number, y0: number, y1: number, r: number, c: string): BoxPart[] => [
  vb(cx - r, y0, cz - r * 0.42, cx + r, y1, cz + r * 0.42, c),
  vb(cx - r * 0.42, y0, cz - r, cx + r * 0.42, y1, cz + r, c),
  vb(cx - r * 0.72, y0, cz - r * 0.72, cx + r * 0.72, y1, cz + r * 0.72, c),
];

/** A round disc standing in the x-y plane (a wheel or an emblem) at depth z0..z1. */
const disc = (cx: number, cy: number, z0: number, z1: number, r: number, c: string): BoxPart[] => [
  vb(cx - r, cy - r * 0.42, z0, cx + r, cy + r * 0.42, z1, c),
  vb(cx - r * 0.42, cy - r, z0, cx + r * 0.42, cy + r, z1, c),
  vb(cx - r * 0.72, cy - r * 0.72, z0, cx + r * 0.72, cy + r * 0.72, z1, c),
];

/** A ground spotlight that lights a monument at night. */
const uplight = (x: number, z: number): BoxPart[] => [vb(x - 0.6, 0, z - 0.6, x + 0.6, 0.6, z + 0.6, IRON), vb(x - 0.4, 0.6, z - 0.4, x + 0.4, 1, z + 0.4, LAMP, 'glow')];

/** A rough boulder of two stacked blocks. */
const boulder = (x: number, z: number, w: number, d: number, h: number, c: string): BoxPart[] => [
  vb(x - w / 2, 0, z - d / 2, x + w / 2, h * 0.65, z + d / 2, c),
  vb(x - w / 2 + 0.6, h * 0.65, z - d / 2 + 0.5, x + w / 2 - 0.8, h, z + d / 2 - 0.6, shade(c, 0.06)),
];

// --- Hills and lookouts ---------------------------------------------------------------------------

/**
 * RAM — Scotsman's Hill lookout (4 × 3 tiles): an escarpment rising to the back, wooden stairs with
 * railings climbing its face, a lookout deck with benches, a telescope and lamps on top, and
 * small heritage houses along the street at its foot.
 */
export function hilltopLookout(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  const h = (z: number) => (z < -8 ? 10 : z > 6 ? 0 : (10 * (6 - z)) / 14);
  for (let z = -18; z < 18; z += 2) parts.push(vb(-24, 0, z, 24, h(z + 1) + 0.3, z + 2, ((z + 18) / 2) % 2 ? '#a6cf7c' : GRASS));
  // wildflowers on the slope
  for (let i = 0; i < 26; i++) {
    const x = -22 + rnd(seed, i, 1) * 44;
    const z = -7 + rnd(seed, i, 2) * 12;
    if (x > 2 && x < 10) continue;
    parts.push(vb(x, h(z) + 0.3, z, x + 0.6, h(z) + 0.8, z + 0.6, pick(['#f2c14e', '#fbf8f2', '#b9a6e2'], rnd(seed, i, 3))));
  }
  // stairs with railings up the face
  for (let z = -8; z < 7; z += 1) parts.push(vb(4, 0, z, 8, h(z + 0.5) + 0.7, z + 1, z % 2 ? WOOD : shade(WOOD, -0.06)));
  for (let z = -8; z <= 6; z += 2) for (const x of [3.6, 8.4]) parts.push(vb(x - 0.25, 0, z - 0.25, x + 0.25, h(z) + 3.4, z + 0.25, WOOD_DARK));
  for (let z = -8; z < 6; z += 1) for (const x of [3.6, 8.4]) parts.push(vb(x - 0.3, h(z + 0.5) + 2.8, z, x + 0.3, h(z + 0.5) + 3.3, z + 1, WOOD_DARK));
  // the lookout deck
  const top = 10.3;
  parts.push(vb(-21, top, -17, -2, top + 0.5, -8.6, WOOD));
  parts.push(...vmove([...fence(-21, -8.8, -2, -8.8, WOOD_DARK, 3), ...fence(-21, -17, -21, -8.8, WOOD_DARK, 3)], 0, top + 0.5, 0));
  parts.push(...vmove([...bench(-16, -12), ...bench(-8, -12), ...lamp(-19.5, -10.4, 8), ...lamp(-3.5, -10.4, 8)], 0, top + 0.5, 0));
  parts.push(vb(-12.3, top + 0.5, -10.6, -11.7, top + 4.4, -10, IRON), vb(-13, top + 4.4, -11, -11, top + 5.4, -9.4, '#3a6f9e'));
  parts.push(...vmove([...smallTree(14, -14, seed, 10), ...smallTree(20, -10.6, seed + 1, 9), ...spruce(-21.4, -14.5, 11)], 0, top, 0));
  // heritage houses along the street below
  parts.push(vb(-24, 0.3, 7.4, 24, 0.4, 9.4, PAVING));
  const house = (x0: number, wall: string, roof: string, i: number) => {
    const x1 = x0 + 8;
    parts.push(vb(x0, 0.3, 10.5, x1, 6.5, 17, wall), ...gableRoof(x0, x1, 10.5, 17, 6.5, roof, wall, 0.4));
    parts.push(vb(x0 + 1, 0.3, 17, x0 + 3, 4.5, 17.3, ART.door), ...windowZ(x0 + 4.4, x0 + 6.8, 2.2, 4.8, 17, G));
    parts.push(vb(x0 - 0.4, 0.3, 17, x1 + 0.4, 0.9, 17.6, shade(wall, -0.2)), ...flowerBed(x1 + 0.5, 15, 2.4, 2.4, seed + i));
  };
  house(-22, '#e9d8a6', '#7a4f3a', 1);
  house(-11, '#b9cfe0', '#5a5f6a', 2);
  house(12, '#e3a1a6', '#5a5f6a', 3);
  return parts;
}

/**
 * UMR — castle-style house (3 × 3 tiles): a white stucco house with a round crenellated tower,
 * arched windows trimmed in mint green, a low side wing, crenellated garden walls with round
 * gate turrets and a brick path to the door.
 */
export function castleHouse(seed: number): BoxPart[] {
  const WALL = '#f2efe6';
  const MINT = '#6cbf9a';
  const ROOF = '#5a5f6a';
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, GRASS)];
  // brick path to the door
  for (let z = 4; z < 18; z += 1.5) parts.push(vb(-3, 0.3, z, 3, 0.4, Math.min(z + 1.5, 18), (z * 2) % 3 < 1.5 ? '#b5694f' : '#c47a5c'));
  // main block, side wing
  parts.push(vb(-10, 0.3, -12, 10, 15, 0, WALL), ...gableRoof(-10, 10, -12, 0, 15, ROOF, WALL, 0.6));
  parts.push(vb(-17, 0.3, -10, -10, 9, -2, WALL), ...gableRoof(-17, -10, -10, -2, 9, ROOF, WALL, 0.5), vb(-15, 12, -9, -13.4, 15, -7.4, WALL));
  for (const x of [-8.6, -6]) for (const y of [3, 9]) parts.push(...windowZ(x, x + 1.6, y, y + 3, 0, G, MINT));
  for (const x of [5.4, 8]) for (const y of [3, 9]) parts.push(...windowZ(x - 1.6, x, y, y + 3, 0, G, MINT));
  parts.push(...windowZ(-16, -14, 3, 6, -2, G, MINT), vb(-13, 0.3, -2, -11, 6, -1.7, ART.door), vb(-13.4, 6, -2, -10.6, 6.8, -1.6, MINT));
  parts.push(...windowX(-9, -6, 4, 7, 10, G, MINT), ...windowX(-4, -1, 4, 7, 10, G, MINT), ...windowX(-9, -6, 10, 13, 10, G, MINT));
  // the round tower with crenellations
  parts.push(...round(0, 0, 0.3, 23, 5.5, WALL), ...round(0, 0, 23, 24, 5.8, MINT));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const mx = Math.sin(a) * 4.9;
    const mz = Math.cos(a) * 4.9;
    parts.push(vb(mx - 0.8, 24, mz - 0.8, mx + 0.8, 25.6, mz + 0.8, i % 2 ? WALL : MINT));
  }
  // door and arched windows on the tower's front and side
  parts.push(vb(-1.4, 0.3, 5.5, 1.4, 6, 5.8, ART.door), vb(-2, 6, 5.5, 2, 6.6, 5.9, MINT), vb(-1.2, 6.6, 5.5, 1.2, 7.2, 5.9, MINT));
  for (const y of [9, 15]) parts.push(...windowZ(-1, 1, y, y + 3.2, 5.5, G, MINT), vb(-0.6, y + 3.7, 5.3, 0.6, y + 4.3, 5.8, MINT));
  for (const y of [9, 15]) parts.push(...windowX(-1, 1, y, y + 3.2, 5.5, G, MINT));
  parts.push(vb(-2.6, 0.3, 5.6, 2.6, 0.9, 7.4, STONE), vb(-2.2, 4.4, 5.8, -1.7, 5.2, 6.3, LAMP, 'glow'), vb(1.7, 4.4, 5.8, 2.2, 5.2, 6.3, LAMP, 'glow'));
  // crenellated garden walls with round turrets either side of the gate
  for (const [x0, x1] of [[-17, -4.6], [4.6, 17]] as const) {
    parts.push(vb(x0, 0.3, 12.6, x1, 4, 14, WALL), vb(x0, 4, 12.5, x1, 4.4, 14.1, MINT));
    for (let x = x0; x < x1 - 0.5; x += 2) parts.push(vb(x, 4.4, 12.5, x + 1, 5.4, 14.1, MINT));
  }
  for (const x of [-17, 16.6]) parts.push(vb(x - 0.4, 0.3, 4, x + 0.8, 4, 12.6, WALL), vb(x - 0.5, 4, 4, x + 0.9, 4.4, 12.6, MINT));
  for (const x of [-4.4, 4.4]) parts.push(...round(x, 13.3, 0.3, 5, 1.7, WALL), ...round(x, 13.3, 5, 6.2, 1.9, MINT), vb(x - 0.5, 6.2, 12.8, x + 0.5, 7, 13.8, LAMP, 'glow'));
  parts.push(...flowerBed(-15, 6, 6, 4, seed), ...flowerBed(9, 6, 6, 4, seed + 1));
  for (const [x, z] of [[-14, -15], [13, -15], [15, -7]]) parts.push(...spruce(x, z, 13));
  parts.push(...smallTree(-15, 15.4, seed + 2, 9), ...smallTree(15, 15.4, seed + 3, 9));
  return parts;
}

/**
 * CGR — cougar on the rock (3 × 2 tiles): a tall grey triangular stone with a round emblem (no
 * letters), a weathered orange granite boulder beside it and a bronze cougar leaping down across
 * them, spruces, flower beds and spotlights.
 */
export function cougarRock(seed: number): BoxPart[] {
  const SLAB = '#8e9399';
  const GRANITE = '#dcb48c';
  const BRONZE = '#6e5130';
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, GRASS), vb(-18, 0.3, 7, 18, 0.4, 11, PAVING), vb(-12, 0.3, 2.6, 16, 0.6, 6.4, '#8a5a3c')];
  // the triangular stone, peak to the right
  for (let y = 0.3, i = 0; y < 22; y += 2, i++) {
    const t = y / 22;
    parts.push(vb(-2 + t * 12, y, -6, 16 - t * 4.6, y + 2, -1, i % 2 ? SLAB : shade(SLAB, 0.05)));
  }
  for (let i = 0; i < 10; i++) {
    const x = rnd(seed, i, 4) * 12;
    const y = 1 + rnd(seed, i, 5) * 10;
    parts.push(vb(x, y, -1.2, x + 1.4, y + 1.2, -0.9, pick(['#7f858c', '#a0a59a', '#9b9a8a'], rnd(seed, i, 6))));
  }
  // emblem: a ring and a plain medallion
  parts.push(...disc(9.5, 11, -1.1, -0.7, 4.4, '#3a2f25'), ...disc(9.5, 11, -0.8, -0.5, 3.6, '#d8c9a6'), ...disc(9.5, 11, -0.6, -0.3, 2, '#3a2f25'));
  // granite boulder
  parts.push(vb(-16, 0.3, -8, -4, 10, 0, GRANITE), vb(-15, 10, -7, -7, 15, -1, shade(GRANITE, 0.06)), vb(-4, 0.3, -6, 1, 6, 1, shade(GRANITE, -0.05)), vb(-17, 0.3, -2, -10, 4, 2, shade(GRANITE, -0.1)));
  for (let i = 0; i < 8; i++) {
    const x = -15 + rnd(seed, i, 7) * 10;
    const y = 1 + rnd(seed, i, 8) * 12;
    parts.push(vb(x, y, -0.2, x + 1.2, y + 1, 0.2, pick(['#d9663a', '#b07a52', '#e2b58a'], rnd(seed, i, 9))));
  }
  // the bronze cougar leaping down to the right
  for (let t = 0; t <= 4; t++) {
    const x = -6 + 2 * t;
    const y = 13 - t;
    parts.push(vb(x - 1.4, y - 1.5, 1.2, x + 1.4, y + 1.3, 3.4, t % 2 ? BRONZE : shade(BRONZE, 0.06)));
  }
  parts.push(vb(2.4, 7.4, 1.4, 5.4, 10.4, 3.4, BRONZE), vb(4.6, 7.6, 1.6, 6.2, 9.2, 3.2, shade(BRONZE, 0.05)), vb(2.8, 10.4, 1.8, 3.4, 11.2, 2.4, BRONZE), vb(4.4, 10.4, 1.8, 5, 11.2, 2.4, BRONZE));
  parts.push(vb(1, 3, 1.6, 2, 8.4, 2.6, BRONZE), vb(2.4, 2.2, 2.4, 3.4, 8, 3.4, BRONZE), vb(2.2, 2, 2.2, 4, 2.8, 3.6, shade(BRONZE, -0.1)));
  parts.push(vb(-7.6, 9.6, 1.6, -6.2, 13, 2.6, BRONZE), vb(-9.4, 10.4, 1.6, -7.4, 11.6, 2.6, BRONZE), vb(-9, 13.4, 2, -7, 14.2, 2.6, BRONZE), vb(-11, 14.2, 2, -9, 16, 2.6, BRONZE), vb(-11.6, 16, 2, -10.6, 19, 2.6, BRONZE));
  // planting, spruces, spotlights
  for (let i = 0; i < 9; i++) parts.push(vb(-11 + i * 3, 0.6, 3.4, -9.6 + i * 3, 1.8, 4.8, pick(['#ef9b7f', '#6fae4f', '#e9c46a'], rnd(seed, i, 10))));
  parts.push(...spruce(14.8, -8.8, 14), ...spruce(-15.4, -9.6, 11), ...spruce(-15.6, 9.6, 8));
  parts.push(...uplight(-6, 5.6), ...uplight(9, 5.6), ...lamp(14, 9, 8));
  return parts;
}

/**
 * COA — stagecoach stone (3 × 2 tiles): a red brick base with a big sandstone boulder carrying a
 * dark bronze stagecoach silhouette, on a dandelion lawn before a row of white-barked aspens.
 */
export function stagecoachStone(seed: number): BoxPart[] {
  const BRICK = '#c4553f';
  const SANDSTONE = '#d6b77a';
  const IRONWORK = '#3b2a1f';
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, GRASS)];
  // a curving path in front
  for (let x = -18; x < 18; x += 2) {
    const z = 7 + Math.sin((x + 18) / 11) * 1.6;
    parts.push(vb(x, 0.3, z, x + 2, 0.4, z + 3, '#8a8d93'));
  }
  // aspens behind
  for (let x = -16, i = 0; x <= 16; x += 4, i++) {
    const z = -9.6 + rnd(seed, i, 1) * 1.6;
    const crown = pick(['#a6cf7c', '#8cc867', '#c3d97a'], rnd(seed, i, 2));
    parts.push(vb(x - 0.4, 0.3, z - 0.4, x + 0.4, 10, z + 0.4, '#ece8de'), vb(x - 0.45, 4, z - 0.45, x + 0.45, 4.5, z + 0.45, '#4a4a4a'));
    parts.push(...asSway([vb(x - 1.8, 8, z - 1.6, x + 1.8, 13, z + 1.6, crown), vb(x - 1.1, 13, z - 1, x + 1.1, 15, z + 1, shade(crown, 0.06))]));
  }
  // brick base
  parts.push(vb(-10, 0.3, -4, 10, 6.4, 2, BRICK), vb(-10.4, 6.4, -4.4, 10.4, 7, 2.4, shade(BRICK, -0.2)));
  for (let y = 1.3; y < 6.4; y += 1.1) parts.push(vb(-10.05, y, 2, 10.05, y + 0.15, 2.05, '#e2cdb8'));
  // sandstone boulder on the base
  parts.push(vb(-8, 7, -4, 3, 13, 1.4, SANDSTONE), vb(-7, 13, -3.4, 1.6, 16, 0.8, shade(SANDSTONE, 0.05)), vb(-5, 16, -2.6, 0, 17, 0, shade(SANDSTONE, 0.1)), vb(3, 7, -3, 5, 10, 0.6, shade(SANDSTONE, -0.06)));
  // the stagecoach: body, driver's box, two wheels, shafts
  parts.push(vb(-5, 11, 1.4, -1, 14, 1.8, IRONWORK), vb(-1, 12.4, 1.4, 1, 13.4, 1.8, IRONWORK), vb(-5.4, 14, 1.4, -0.6, 14.4, 1.8, IRONWORK), vb(1, 10.8, 1.4, 3, 11.2, 1.8, IRONWORK));
  for (const wx of [-4.2, 0.2]) parts.push(vb(wx - 1.4, 9.2, 1.5, wx + 1.4, 9.6, 1.9, IRONWORK), vb(wx - 1.4, 11.6, 1.5, wx + 1.4, 12, 1.9, IRONWORK), vb(wx - 1.4, 9.2, 1.5, wx - 1, 12, 1.9, IRONWORK), vb(wx + 1, 9.2, 1.5, wx + 1.4, 12, 1.9, IRONWORK));
  // dandelions, spotlights, a bench by the path
  for (let i = 0; i < 24; i++) {
    const x = -17 + rnd(seed, i, 3) * 34;
    const z = 2.6 + rnd(seed, i, 4) * 3.6;
    parts.push(vb(x, 0.3, z, x + 0.5, 0.8, z + 0.5, '#f2d14e'));
  }
  parts.push(...uplight(-6, 4.4), ...uplight(6, 4.4), ...bench(13, 10.6), ...lamp(-15, 10.6, 8));
  return parts;
}

// --- Heritage buildings ---------------------------------------------------------------------------

/**
 * CUR — the old barracks stables (4 × 3 tiles): long white stucco buildings with brown shingle
 * roofs, dark green trim and gable dormers in an L, a brick chimney, two tall spruces, lilac
 * hedges, a curving drive, a black railed ramp and a flagpole.
 */
export function barracksStables(seed: number): BoxPart[] {
  const WALL = '#f1ede4';
  const TRIM = '#2f5e45';
  const ROOF = '#8a6a50';
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, GRASS), vb(-24, 0.3, 14, 24, 0.4, 18, '#d8d4cc')];
  // curving drive
  for (let x = -24; x < 24; x += 2) {
    const z = 4 + Math.max(0, (x - 4) / 8) * 1.4;
    parts.push(vb(x, 0.3, z, x + 2, 0.36, z + 5, '#5d6168'));
  }
  // long wing along x and the side wing along z
  parts.push(vb(-22, 0.3, -16, 10, 10, -6, WALL), vb(-22.1, 0.3, -6, 10.1, 1.4, -5.8, '#7b7e84'), ...gableRoof(-22, 10, -16, -6, 10, ROOF, WALL, 0.6));
  parts.push(vb(10, 0.3, -16, 21, 10, 2, WALL), vb(10, 0.3, 2, 21.1, 1.4, 2.2, '#7b7e84'), ...vturn(gableRoof(-2, 16, 10, 21, 10, ROOF, WALL, 0.6), 1));
  parts.push(vb(-22.6, 9.2, -6.6, 10, 9.6, -5.4, TRIM), vb(9.4, 9.2, 2, 21.6, 9.6, 2.6, TRIM));
  // gable dormers on the long wing
  for (const x of [-17, -8, 1]) {
    parts.push(vb(x - 2.4, 9, -7, x + 2.4, 14, -5.6, WALL), ...windowZ(x - 1, x + 1, 10, 12.6, -5.6, G, TRIM));
    for (let i = 0; i < 3; i++) parts.push({ ...vb(x - 3 + i, 14 + i, -8, x + 3 - i, 15 + i, -5.2, i % 2 ? shade(ROOF, -0.08) : ROOF), tag: 'roof' });
    parts.push(vb(x - 3, 13.6, -5.4, x + 3, 14, -5.1, TRIM));
  }
  for (const x of [-20, -13, -4, 5]) parts.push(...windowZ(x, x + 2, 3, 6.4, -6, G, TRIM));
  parts.push(...windowZ(12, 14, 3, 6.4, 2, G, TRIM), ...windowZ(17, 19, 3, 6.4, 2, G, TRIM), ...windowZ(14.4, 16.6, 10, 12.6, 2, G, TRIM));
  parts.push(...windowX(-12, -9.6, 3, 6.4, 21, G, TRIM), ...windowX(-4, -1.6, 3, 6.4, 21, G, TRIM));
  parts.push(vb(-16, 13, -14, -13.6, 19, -11.6, '#a9533f'), vb(-16.3, 19, -14.3, -13.3, 19.6, -11.3, '#d8d4cc'));
  // entrance with a black railed ramp, a lamp by the door
  parts.push(vb(5.6, 0.3, -5.8, 8.4, 5.6, -5.6, TRIM), vb(4, 0.3, -5.6, 10, 1.2, -1.6, '#c9c6bf'));
  for (let x = 4; x <= 10; x += 1.5) parts.push(vb(x - 0.15, 1.2, -1.85, x + 0.15, 3.6, -1.55, '#1f2228'));
  parts.push(vb(4, 3.4, -1.9, 10, 3.7, -1.5, '#1f2228'), vb(4.6, 4.6, -5.6, 5.2, 5.4, -5, LAMP, 'glow'));
  // tall spruces and lilac hedges
  parts.push(...spruce(0, 0.6, 22), ...spruce(13.6, 5.6, 19));
  for (let x = -22, i = 0; x < -4; x += 3, i++) {
    const c = pick(['#6fae4f', '#79b85a', '#a88ad1', '#6aa94f'], rnd(seed, i, 1));
    parts.push(...asSway([vb(x, 0.3, -5.6, x + 3.4, 5 + rnd(seed, i, 2) * 2, -1.4, c)]));
  }
  // flagpole and a street lamp
  parts.push(vb(20.6, 0.3, 11.6, 21.2, 22, 12.2, '#f4f1ea'), ...asSway([vb(21.2, 18.4, 11.8, 25.2 - 1.4, 21, 12, '#d0332f')]));
  parts.push(...lamp(-20, 12.2, 9), ...lamp(-2, 12.2, 9));
  return parts;
}

/**
 * SNA — the 1912 sandstone school (4 × 3 tiles): a three-storey brown sandstone school with a low
 * hip roof, end pavilions, a central entrance bay with an arched doorway and a pediment above,
 * tall window groups, a flagpole and a lawn rising to the doors.
 */
export function sandstoneSchoolhouse(seed: number): BoxPart[] {
  const STONE_BROWN = '#8e7a5e';
  const CORNICE = '#c8c2b6';
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, GRASS)];
  for (let z = 8; z < 18; z += 2) parts.push(vb(-24, 0.3, z, 24, 0.3 + (18 - z) * 0.05, z + 2, z % 4 ? GRASS : '#a6cf7c'));
  // body, end pavilions, central bay
  parts.push(vb(-20, 0.3, -12, 20, 20, 2, STONE_BROWN));
  for (const x of [-23, 12]) parts.push(vb(x, 0.3, -12, x + 11, 20.6, 3.6, shade(STONE_BROWN, -0.03)));
  parts.push(vb(-5, 0.3, -12, 5, 20.6, 5, shade(STONE_BROWN, 0.03)));
  // stone courses and window groups
  for (let y = 2; y < 20; y += 1.6) parts.push(vb(-23.05, y, 3.55, 23.05, y + 0.12, 3.7, shade(STONE_BROWN, -0.15)));
  for (const [x0, n, z] of [[-21.6, 4, 3.6], [-11, 2, 2], [6.6, 2, 2], [13.4, 4, 3.6]] as const) {
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 2.2;
      parts.push(...windowZ(x, x + 1.6, 2, 5.6, z, '#e9ecef', CORNICE));
      parts.push(...windowZ(x, x + 1.6, 8, 12, z, G, CORNICE), ...windowZ(x, x + 1.6, 14, 18, z, G, CORNICE));
    }
  }
  parts.push(...windowX(-8, -5, 8, 12, 23, G, CORNICE), ...windowX(-3, 0, 8, 12, 23, G, CORNICE), ...windowX(-8, -5, 14, 18, 23, G, CORNICE), ...windowX(-3, 0, 14, 18, 23, G, CORNICE));
  // the entrance: arched doorway, canopy, pediment
  parts.push(vb(-2.6, 0.3, 5, 2.6, 7.6, 5.3, '#fbf8f2'), vb(-1.6, 7.6, 5, 1.6, 8.6, 5.3, '#fbf8f2'), vb(-0.8, 8.6, 5, 0.8, 9.2, 5.3, '#fbf8f2'));
  parts.push(vb(-2, 5, 5.2, 2, 8.2, 5.5, G), vb(-1.6, 0.3, 5.3, 1.6, 5, 5.5, '#e6e2da'), vb(-6, 12.4, 4.6, 6, 13.2, 7, CORNICE), vb(-1.6, 14, 5, 1.6, 17.6, 5.3, G));
  for (let i = 0; i < 3; i++) parts.push(vb(-5 - i * 0.5, 0.3, 5 + i * 1.2, 5 + i * 0.5, 2.4 - i * 0.7, 6.2 + i * 1.2, shade(STONE_BROWN, 0.12)));
  parts.push(vb(-2.8, 6.8, 5.3, -2.2, 7.6, 5.9, LAMP, 'glow'), vb(2.2, 6.8, 5.3, 2.8, 7.6, 5.9, LAMP, 'glow'));
  // cornice, low hip roof, pediment over the bay
  parts.push(vb(-23.6, 20.6, -12.6, 23.6, 21.4, 4.2, CORNICE), ...hipRoof(-23, 23, -12, 3.6, 22.4, '#8f949c', 0.4, 3));
  parts.push(vb(-7, 21.4, 2, 7, 22.4, 5.6, CORNICE));
  for (let i = 0; i < 5; i++) parts.push({ ...vb(-7.4 + i * 1.5, 22.4 + i, 1.6, 7.4 - i * 1.5, 23.4 + i, 5.8, i % 2 ? '#868b93' : '#8f949c'), tag: 'roof' }, vb(-6.6 + i * 1.5, 22.4 + i, 5.6, 6.6 - i * 1.5, 23.4 + i, 5.7, shade(STONE_BROWN, 0.06)));
  // flagpole, lamps, trees
  parts.push(vb(8.4, 0.3, 7, 9, 26, 7.6, '#f4f1ea'), ...asSway([vb(9, 22.4, 7.2, 12.6, 25, 7.4, '#d0332f')]));
  parts.push(...lamp(-10, 14, 9), ...lamp(10, 14, 9), ...smallTree(-19, 13, seed, 10), ...smallTree(19, 13.4, seed + 1, 10));
  return parts;
}

/**
 * GAG — Peacekeeper memorial park (3 × 3 tiles): a brick paver plaza entered between two concrete
 * obelisks, a bronze peacekeeper in a blue helmet on a plinth, curved granite memorial walls,
 * two flags, an iron fence and planters of red foliage.
 */
export function peacekeeperPark(seed: number): BoxPart[] {
  const CONCRETE = '#cfcac0';
  const GRANITE = '#b9b4ac';
  const BRONZE = '#5d5244';
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, GRASS)];
  // paver plaza
  for (let x = -14; x < 14; x += 2) for (let z = -14; z < 16; z += 2) {
    const d = Math.hypot(x + 1, (z + 1 - 4) * 0.9);
    if (d < 15.5) parts.push(vb(x, 0.3, z, x + 2, 0.42, z + 2, (x + z) % 4 ? '#b07a62' : '#a46f58'));
  }
  // curved granite memorial walls
  for (let i = -5; i <= 5; i++) {
    const a = (i / 5) * 1.05;
    const x = Math.sin(a) * 13;
    const z = 4 - Math.cos(a) * 15.5;
    parts.push(vb(x - 1.6, 0.3, z - 1, x + 1.6, 4, z + 1, GRANITE), vb(x - 1.5, 1.2, z + 1, x + 1.5, 3.4, z + 1.15, '#8e8a84'), vb(x - 1.7, 4, z - 1.1, x + 1.7, 4.4, z + 1.1, shade(GRANITE, 0.08)));
  }
  // the peacekeeper on a plinth
  parts.push(vb(-2, 0.4, -5.5, 2, 4, -1.5, '#9a958d'), vb(-2.4, 4, -5.9, 2.4, 4.5, -1.1, '#8a857d'));
  parts.push(vb(-1.2, 4.5, -4, -0.2, 8.4, -3, BRONZE), vb(0.2, 4.5, -4, 1.2, 8.4, -3, BRONZE), vb(-1.4, 8.4, -4.2, 1.4, 12.4, -2.8, BRONZE));
  parts.push(vb(-2.2, 8.8, -3.9, -1.4, 12, -3.1, BRONZE), vb(1.4, 9.6, -3.9, 2.2, 12, -3.1, BRONZE), vb(-0.8, 12.4, -4, 0.8, 14, -2.8, '#8a6f58'), vb(-1, 13.6, -4.2, 1, 14.6, -2.6, '#6aa6d8'));
  parts.push(vb(1.6, 8.6, -3.7, 2, 14, -3.3, '#3a3530'));
  // obelisk gateposts, a bollard, planters
  for (const x of [-7, 7]) for (let i = 0; i < 5; i++) parts.push(vb(x - 1.6 + i * 0.25, 0.3 + i * 2, 12.4 + i * 0.25, x + 1.6 - i * 0.25, 2.3 + i * 2, 15.6 - i * 0.25, i % 2 ? CONCRETE : shade(CONCRETE, 0.04)));
  for (const x of [-7, 7]) parts.push(vb(x - 0.3, 10.3, 13.7, x + 0.3, 11, 14.3, CONCRETE));
  parts.push(vb(-0.5, 0.4, 9.5, 0.5, 3.4, 10.5, '#2b2e35'), vb(-0.7, 3.4, 9.3, 0.7, 4, 10.7, '#2b2e35'));
  for (const x of [-12, 12]) {
    parts.push(vb(x - 1.8, 0.3, 13, x + 1.8, 4, 16.6, '#2b2e35'));
    for (let i = 0; i < 5; i++) parts.push(...asSway([vb(x - 1.8 + rnd(seed, x, i) * 2.2, 4, 13.2 + rnd(seed, i, x) * 2, x - 0.4 + rnd(seed, x, i) * 2.2, 5.6, 14.6 + rnd(seed, i, x) * 2, i % 2 ? '#c0392b' : '#8cc867')]));
  }
  // iron fence around the sides and back, flags, lamps, trees
  parts.push(...fence(17, -17, 17, 12, '#2b2e35', 3.4), ...fence(-17, -17, -17, 12, '#2b2e35', 3.4), ...fence(-17, -17, 17, -17, '#2b2e35', 3.4));
  for (const [x, z, flag] of [[9, -10, 'ca'], [12, -8, 'blue']] as const) {
    parts.push(vb(x - 0.3, 0.3, z - 0.3, x + 0.3, 22, z + 0.3, '#f4f1ea'));
    parts.push(...asSway(flag === 'ca' ? [vb(x + 0.3, 18.4, z - 0.1, x + 1.3, 21, z + 0.1, '#d0332f'), vb(x + 1.3, 18.4, z - 0.1, x + 3.3, 21, z + 0.1, '#fbf8f2'), vb(x + 1.9, 19.2, z - 0.15, x + 2.7, 20.2, z + 0.15, '#d0332f'), vb(x + 3.3, 18.4, z - 0.1, x + 4.3, 21, z + 0.1, '#d0332f')] : [vb(x + 0.3, 18.4, z - 0.1, x + 4.3, 21, z + 0.1, '#4f8fd0')]));
  }
  parts.push(...lamp(-13, -8, 9), ...lamp(13, 4, 9), ...uplight(0, -0.4));
  parts.push(...smallTree(-14.6, -14.6, seed, 11), ...smallTree(14.6, -14.4, seed + 1, 11), ...smallTree(-15, 15.4, seed + 2, 9), ...smallTree(15, 15.4, seed + 3, 9));
  return parts;
}

// --- Entrances and farms --------------------------------------------------------------------------

/**
 * KCA — stone tower entrance (4 × 2 tiles): a wavy-topped fieldstone wall (no letters), a square
 * stone pillar, a slender bell tower with a pyramid cap and a lantern in its belfry, big boulders
 * in front and spruces behind.
 */
export function stoneTowerEntrance(seed: number): BoxPart[] {
  const STONES = ['#8f9196', '#a3a5a8', '#7b7e84', '#9a9488'];
  const parts: BoxPart[] = [vb(-24, 0, -12, 24, 0.3, 12, GRASS), vb(-24, 0.3, -12, 24, 0.5, 3, '#8a5a3c')];
  // the wavy fieldstone wall
  for (let x = -8, i = 0; x < 21; x += 2, i++) {
    const top = 8 + 2 * Math.sin((x + 8) / 4.6);
    const z = -5 + Math.cos((x - 6) / 9) * 1.2;
    for (let y = 0.5, j = 0; y < top; y += 1.6, j++) parts.push(vb(x, y, z - 2, x + 2, Math.min(y + 1.6, top), z + 2, pick(STONES, rnd(seed, i, j))));
    parts.push(vb(x - 0.1, top, z - 2.1, x + 2.1, top + 0.4, z + 2.1, '#c9c6bf'));
  }
  // square stone pillar
  for (let y = 0.5, j = 0; y < 17; y += 1.7, j++) for (const [x0, x1] of [[-14, -10.5], [-10.5, -7]]) parts.push(vb(x0, y, -7, x1, y + 1.7, -1, pick(STONES, rnd(seed, x0, j))));
  parts.push(vb(-14.4, 17.2, -7.4, -6.6, 18, -0.6, '#c9c6bf'));
  // slender bell tower
  const DARK = '#6d6f74';
  parts.push(vb(-22, 0.5, -10, -17.6, 22, -5.6, DARK));
  for (const y of [7, 14, 21]) parts.push(vb(-22.2, y, -10.2, -17.4, y + 0.5, -5.4, '#d8d4cc'));
  for (const y of [9.4, 16.2]) parts.push(vb(-20.4, y, -5.6, -19.2, y + 2.4, -5.4, '#2b2f3a'), vb(-17.6, y, -8.4, -17.4, y + 2.4, -7.2, '#2b2f3a'));
  parts.push(vb(-20.6, 18, -8.4, -19, 20, -7.2, LAMP, 'glow'));
  parts.push(...hipRoof(-22, -17.6, -10, -5.6, 23, '#5a5f6a', 0.5), vb(-19.95, 26, -7.95, -19.65, 28, -7.65, IRON));
  // boulders, shrubs, spruces, spotlights
  for (const [x, z, w, d, hh] of [[-20, 6, 7, 5, 5], [-11, 3.4, 6, 4, 4], [-3, 8, 8, 5, 4.4], [8, 6, 6, 4, 3], [16, 8.6, 5, 4, 3.4]] as const) parts.push(...boulder(x, z, w, d, hh, pick(['#6d6f74', '#7f8186', '#8a8c90'], rnd(seed, x, z))));
  for (let i = 0; i < 6; i++) parts.push(vb(-6 + i * 4.2, 0.5, -1.4, -4.4 + i * 4.2, 2.4, 0.4, pick(['#c9b25a', '#8f6f4a', '#6f9a4f'], rnd(seed, i, 3))));
  for (const [x, z, hh] of [[20.4, -8.4, 16], [16, -9.2, 13], [-3, -9.6, 11]] as const) parts.push(...spruce(x, z, hh));
  parts.push(...uplight(-10, 1.6), ...uplight(4, 1.6), ...uplight(14, 1.6));
  return parts;
}

/**
 * RVW — red tractor and greenhouse (4 × 3 tiles): a vintage red tractor on a blank plank sign
 * board, a glass greenhouse lit from inside at night, raised garden beds and a pergola hung with
 * string lights.
 */
export function tractorGreenhouse(seed: number): BoxPart[] {
  const RED = '#d8402f';
  const TIRE = '#2b2b2e';
  const RIM = '#e9b23a';
  const FRAME = '#3a3f48';
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, GRASS), vb(-1, 0.3, -1, 23, 0.4, 2, '#c9c2b4')];
  // the greenhouse: glass walls and a gabled glass roof
  parts.push(vb(-1, 0.3, -16, 23, 1.4, -2, '#c9c6bf'), vb(-0.6, 1.4, -15.6, 22.6, 8, -2.4, G));
  for (let x = -0.6; x <= 22.6; x += 3.2) parts.push(vb(x - 0.2, 1.4, -2.6, x + 0.2, 8, -2.2, FRAME));
  for (let z = -15.6; z <= -2.4; z += 3.3) parts.push(vb(22.4, 1.4, z - 0.2, 22.8, 8, z + 0.2, FRAME));
  parts.push(vb(-1, 8, -16, 23, 8.4, -2, FRAME));
  for (let i = 0; i < 6; i++) parts.push({ ...vb(-0.6, 8.4 + i, -15.6 + i * 1.1, 22.6, 9.4 + i, -2.4 - i * 1.1, i % 2 ? ART.glassDark : G), tag: 'roof' }, vb(22.4, 8.4 + i, -15.6 + i * 1.1, 22.8, 9.4 + i, -2.4 - i * 1.1, FRAME));
  parts.push(vb(-1, 14.4, -9.4, 23, 14.8, -8.6, FRAME), vb(9, 0.3, -2.6, 13, 6, -2.2, FRAME), vb(9.6, 0.3, -2.4, 12.4, 5.4, -2, G));
  // the tractor (facing -x): big rear wheels, small front wheels, hood and grille
  for (const z of [3, 9.6]) parts.push(...disc(-6, 4.6, z - 0.8, z + 0.8, 4.4, TIRE), ...disc(-6, 4.6, z - 0.9, z + 0.9, 2.2, RIM));
  for (const z of [4.2, 8.4]) parts.push(...disc(-16, 2, z - 0.5, z + 0.5, 1.9, TIRE), ...disc(-16, 2, z - 0.6, z + 0.6, 0.9, RIM));
  parts.push(vb(-17, 3.6, 4.8, -8, 7.8, 7.8, RED), vb(-18.4, 2.6, 4.6, -17, 8.2, 8, RED));
  for (let y = 3.2; y < 8; y += 0.9) parts.push(vb(-18.6, y, 5, -18.3, y + 0.4, 7.6, '#7a1f17'));
  parts.push(vb(-15, 2, 5.2, -8, 3.6, 7.4, '#4a4f5a'), vb(-8, 3, 4.4, -3, 7, 8.2, shade(RED, -0.08)), vb(-14.4, 7.8, 5.8, -13.6, 11.4, 6.6, RED));
  for (const z of [1.8, 8.6]) parts.push(vb(-10.4, 8.6, z, -2, 9.4, z + 1.6, RED), vb(-10.4, 5, z, -9.6, 8.6, z + 1.6, RED));
  parts.push(vb(-6, 7, 5.4, -3.6, 7.8, 7.4, RED), vb(-4, 7.8, 5.6, -3.4, 10, 7.2, RED), vb(-8.4, 7.8, 6.1, -7.8, 10.8, 6.7, '#1f2228'), vb(-9.2, 10.8, 5.2, -7, 11.2, 7.6, '#1f2228'));
  // blank plank sign board in front, river rocks
  for (let y = 0.3, i = 0; y < 6; y += 1.4, i++) parts.push(vb(-20, y, 11.6, -2, y + 1.3, 12.6, i % 2 ? '#d9b98c' : '#e4c79b'));
  parts.push(vb(-20.4, 0.3, 11.4, -19.6, 6.4, 12.8, '#b8956a'), vb(-2.4, 0.3, 11.4, -1.6, 6.4, 12.8, '#b8956a'));
  for (let i = 0; i < 8; i++) parts.push(vb(-22 + (i % 4) * 1.2 + (i > 3 ? 19.6 : 0), 0.3, 13 + (i % 2), -21 + (i % 4) * 1.2 + (i > 3 ? 19.6 : 0), 1, 14 + (i % 2), '#e6e2da'));
  parts.push(vb(-22, 0.3, 9.4, 0, 0.8, 16, '#5a3e2b'), ...flowerBed(-23.6, 13.4, 3, 3, seed));
  // raised garden beds
  for (const [x, z] of [[4, 5], [14, 5], [4, 11], [14, 11]]) {
    parts.push(vb(x, 0.3, z, x + 7, 2, z + 4, WOOD), vb(x + 0.4, 2, z + 0.4, x + 6.6, 2.4, z + 3.6, '#5a3e2b'));
    for (let i = 0; i < 4; i++) parts.push(vb(x + 0.8 + i * 1.6, 2.4, z + 0.8, x + 1.8 + i * 1.6, 3.6 + rnd(seed, x + i, z) * 1.4, z + 3.2, pick(['#6fae4f', '#8cc867', '#ef9b7f', '#e9c46a'], rnd(seed, i, x + z))));
  }
  // pergola with string lights
  for (const [x, z] of [[-22.6, -15.4], [-22.6, -4], [-11, -15.4], [-11, -4]]) parts.push(vb(x - 0.4, 0.3, z - 0.4, x + 0.4, 9, z + 0.4, WOOD_DARK));
  for (const z of [-15.4, -4]) parts.push(vb(-23.4, 9, z - 0.5, -10.2, 9.8, z + 0.5, WOOD_DARK));
  for (let x = -22, i = 0; x < -11; x += 1.5, i++) parts.push(vb(x, 9.8, -15.8, x + 0.5, 10.3, -3.6, WOOD), vb(x + 0.1, 8.2, -10 + (i % 2) * 2, x + 0.5, 8.6, -9.6 + (i % 2) * 2, LAMP, 'glow'));
  parts.push(...bench(-17, -9.6), ...smallTree(-21, -0.4, seed + 1, 9), ...lamp(21, 15.6, 8));
  return parts;
}

/**
 * ROC — wave-roofed recreation centre (5 × 3 tiles): a long bronze-shingled shell rising and
 * falling like a wave, a big cut-out at one end with a golden rim, a green ceiling band and a
 * glass wall glowing at night, vertical light posts and benches on the plaza.
 */
export function waveRecCentre(seed: number): BoxPart[] {
  const SHELL = '#a99677';
  const GOLD = '#e0b04a';
  const parts: BoxPart[] = [vb(-30, 0, -18, 30, 0.3, 18, GRASS), vb(-30, 0.3, 4, 30, 0.4, 13, '#c9c2b4')];
  const H = (x: number) => (12 + 5 * Math.sin(((x + 28) / 56) * Math.PI * 1.6 + 0.5)) * Math.min(1, (28.5 - x) / 7);
  const U = (x: number) => (x > -26 && x < 4 ? 3 + 5.5 * Math.sin(((x + 26) / 30) * Math.PI) : 0);
  for (let x = -28, i = 0; x < 28; x += 2, i++) {
    const top = Math.max(4, H(x + 1));
    const under = U(x + 1);
    const c = i % 2 ? SHELL : shade(SHELL, 0.05);
    // the shell: back part full height, the front skin above the cut-out
    parts.push(vb(x, 0.3, -14, x + 2, top, -3, c));
    if (under > 0) {
      parts.push(vb(x, under + 0.3, -3, x + 2, top, 3.6, c), vb(x, under, -3, x + 2, under + 0.6, 3.8, GOLD));
      parts.push(vb(x, 0.3, -3.2, x + 2, Math.max(1, under - 2), -2.8, G), vb(x, Math.max(1, under - 2), -3.3, x + 2, under, -2.9, '#8cc867'));
    } else {
      parts.push(vb(x, 0.3, -3, x + 2, top, 3.6, c));
      if (x > 4 && x < 24) parts.push(vb(x, 1, 3.6, x + 2, 3.6, 3.85, G));
    }
    for (let y = 3; y < top - 1; y += 3) parts.push(vb(x, y, 3.6, x + 2, y + 0.2, 3.7, shade(SHELL, -0.12)));
  }
  // vertical light posts, benches, young trees
  for (const x of [-22, -14, -6, 2, 10]) parts.push(vb(x - 0.4, 0.4, 7.6, x + 0.4, 1, 8.4, IRON), vb(x - 0.25, 1, 7.75, x + 0.25, 9.6, 8.25, LAMP, 'glow'));
  parts.push(...bench(-18, 11), ...bench(6, 11), ...bench(18, 11));
  for (const [x, z] of [[25, 9], [27, 15], [-27, 15]]) parts.push(...smallTree(x, z, seed + x, 9));
  for (let x = -28; x < 28; x += 4) parts.push(vb(x, 0.3, 14, x + 3, 0.5, 17, rnd(seed, x) > 0.5 ? '#8cc867' : GRASS));
  return parts;
}

// --- Downtown -------------------------------------------------------------------------------------

/**
 * DNC — downtown glass towers (4 × 4 tiles): a crescent tower of diamond-lattice glass, a slender
 * observation tower with a red and white pod, a dark maroon tower, a blue-green glass tower, a
 * beige banded tower and low brick blocks along a tree-lined street.
 */
export function glassTowerCluster(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -24, 24, 0.3, 24, '#c9c2b4'), vb(-24, 0.3, 19, 24, 0.4, 24, PAVING)];
  // crescent tower: an arc of glass segments, a checker of two blues reads as a lattice
  for (let i = -4; i <= 4; i++) {
    const a = (i / 4) * 1.05;
    const x = -9 + Math.sin(a) * 10;
    const z = -2 - Math.cos(a) * 6;
    for (let y = 0.3, j = 0; y < 58; y += 4, j++) parts.push(vb(x - 1.5, y, z - 2.4, x + 1.5, Math.min(y + 4, 58), z + 2.4, (i + j) % 2 ? '#3c5a78' : '#4f7396'));
    parts.push(vb(x - 1.6, 58, z - 2.5, x + 1.6, 58.6, z + 2.5, '#2f3f52'));
  }
  // observation tower
  parts.push(vb(13.6, 0.3, 4.6, 16.4, 40, 7.4, '#d8d4cc'), ...round(15, 6, 40, 43, 4.2, '#c8372d'), ...round(15, 6, 43, 44.6, 4.4, '#f4f1ea'));
  parts.push(...round(15, 6, 44.6, 46, 4, G), ...round(15, 6, 46, 47, 4.4, '#c8372d'), ...round(15, 6, 47, 48.4, 2.6, '#d8d4cc'), vb(14.7, 48.4, 5.7, 15.3, 56, 6.3, '#d8d4cc'));
  parts.push(vb(14.2, 44.6, 10.2, 15.8, 46, 10.5, LAMP, 'glow'), vb(19.2, 44.6, 5.2, 19.5, 46, 6.8, LAMP, 'glow'), vb(14.85, 56, 5.85, 15.15, 56.6, 6.15, '#ff6a5a', 'glow'));
  // maroon tower, blue-green tower, beige tower
  const tower = (x0: number, z0: number, x1: number, z1: number, h: number, wall: string, band: string, step = 3) => {
    parts.push(vb(x0, 0.3, z0, x1, h, z1, wall));
    for (let y = 2; y < h - 1; y += step) parts.push(vb(x0 - 0.05, y, z1, x1 + 0.05, y + step * 0.45, z1 + 0.15, band), vb(x1, y, z0 - 0.05, x1 + 0.15, y + step * 0.45, z1 + 0.05, band));
  };
  tower(2, -22, 12, -12, 52, '#6e3b3b', '#8f5a55');
  parts.push(vb(3, 52, -21, 11, 55, -14, '#5a3030'), vb(6, 55, -19, 8, 61, -17, '#c9c6bf'));
  tower(15, -22, 23, -13, 46, '#3f8a98', '#6fb7c4', 4);
  tower(-23, 4, -14, 14, 34, '#c9a77e', G);
  parts.push(vb(-22, 34, 5, -15, 36, 13, '#b39468'));
  // low brick blocks along the street, lit shop windows
  tower(-12, 10, 2, 17, 12, '#b8694f', G);
  tower(4, 12, 12, 17, 9, '#c9845c', G);
  parts.push(vb(-12, 1, 17, 2, 3.4, 17.3, LAMP, 'glow'));
  for (const x of [-20, -6, 8, 20]) parts.push(...lamp(x, 20.6, 9));
  for (const x of [-14, 0, 14]) parts.push(...smallTree(x, 21.4, seed + x, 9));
  return parts;
}
