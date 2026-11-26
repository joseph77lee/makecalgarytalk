/**
 * Place library: golf and special-district (ranch and heritage rail) tracks (community-identity
 * build map, 2026-11-26). Generic places, no brands or sign text. Voxels (12 per tile), front +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, fence, flowerBed, IRON, LAMP, lamp, PAVING, smallTree, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, windowZ } from './voxel';

const G = ART.glass;
const FAIRWAY = '#86c45e';
const GREEN = '#a6dc7a';
const SAND = '#ecd9a6';
const BARN = '#b5443a';

/** A golf flag on a pin at (x, z) that waves in the wind. */
const flag = (x: number, z: number, c = '#e0453c'): BoxPart[] => [vb(x - 0.15, 0, z - 0.15, x + 0.15, 8, z + 0.15, '#fbf8f2'), ...asSway([vb(x + 0.15, 6, z - 0.1, x + 2.6, 7.8, z + 0.1, c)]), vb(x - 0.5, 0, z - 0.5, x + 0.5, 0.35, z + 0.5, '#2b2f3a')];

// --- Golf: putting green → driving range → cart barn → clubhouse --------------------------------

/** Putting green (2 × 2 tiles): a round green with a flag, two sand bunkers, a bench and a ball washer. */
export function puttingGreen(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, FAIRWAY)];
  for (let x = -10; x < 10; x += 1)
    for (let z = -10; z < 10; z += 1) {
      const r = ((x + 0.5 + 1) / 9.5) ** 2 + ((z + 0.5) / 8) ** 2;
      if (r < 1) parts.push(vb(x, 0.3, z, x + 1, 0.45, z + 1, (x + z) % 4 === 0 ? shade(GREEN, -0.04) : GREEN));
      else if (((x + 0.5 - 7) / 3.4) ** 2 + ((z + 0.5 - 7) / 2.4) ** 2 < 1 || ((x + 0.5 + 9) / 2.4) ** 2 + ((z + 0.5 + 6) / 3.4) ** 2 < 1) parts.push(vb(x, 0.25, z, x + 1, 0.4, z + 1, SAND));
    }
  parts.push(...flag(1, -2, pick(['#e0453c', '#f2c14e'], rnd(seed, 1))));
  for (const [x, z] of [[-3, 3], [4, 1], [-1, 5]]) parts.push(vb(x - 0.3, 0.45, z - 0.3, x + 0.3, 0.9, z + 0.3, '#ffffff'));
  parts.push(...bench(-6, 10.5), vb(9, 0, -10, 9.6, 4, -9.4, IRON), vb(8.6, 4, -10.4, 10, 5.4, -9, '#5b8fd6'));
  parts.push(...smallTree(9.4, 9.4, seed, 9));
  return parts;
}

/** Driving range (3 × 2 tiles): a covered tee line with mats and ball buckets, yardage flags out on the grass. */
export function drivingRange(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, FAIRWAY)];
  for (let z = -12; z < 2; z += 3) parts.push(vb(-18, 0.3, z, 18, 0.36, z + 1.5, shade(FAIRWAY, 0.05)));
  // the tee shelter along the front
  parts.push(vb(-17, 0.3, 4, 17, 0.8, 12, '#cfc9bd'));
  for (let x = -16; x <= 16; x += 4) parts.push(vb(x - 0.3, 0.8, 10.5, x + 0.3, 8, 11.1, '#e9dccb'));
  parts.push(vb(-17.5, 8, 6, 17.5, 8.8, 12, '#2e6f5e'), vb(-17.5, 8.8, 9, 17.5, 9.4, 12, shade('#2e6f5e', -0.15)));
  for (let x = -14; x <= 14; x += 4) {
    parts.push(vb(x - 1.4, 0.8, 4.6, x + 1.4, 0.9, 8, '#4f8a5b'), vb(x + 1.6, 0.8, 7, x + 2.6, 1.8, 8, '#d0453c'));
    parts.push(vb(x + 1.7, 1.8, 7.1, x + 2.5, 2.1, 7.9, '#ffffff'));
  }
  // yardage flags and a few balls out on the range
  [[-10, -4], [2, -8], [12, -2]].forEach(([x, z], i) => parts.push(...flag(x, z, ['#e0453c', '#f2c14e', '#5b8fd6'][i])));
  for (let i = 0; i < 10; i++) parts.push(vb(-15 + rnd(seed, i, 1) * 30, 0.36, -11 + rnd(seed, i, 2) * 12, -14.6 + rnd(seed, i, 1) * 30, 0.7, -10.6 + rnd(seed, i, 2) * 12, '#ffffff'));
  parts.push(vb(-18, 0, -12, 18, 12, -11.7, '#cfe3d4'));
  for (let x = -17.8; x <= 17.8; x += 3.56) parts.push(vb(x - 0.2, 0, -12, x + 0.2, 13, -11.6, IRON));
  return parts;
}

/** Cart barn (2 × 1 tiles): an open-front shed with a green roof, three golf carts and a charging post. */
export function cartBarn(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -6, 12, 0.3, 6, PAVING)];
  parts.push(vb(-11, 0, -5.5, 11, 8, -4.5, '#d9c3a0'), vb(-11, 0, -5.5, -10, 8, 3, '#d9c3a0'), vb(10, 0, -5.5, 11, 8, 3, '#d9c3a0'));
  parts.push(...gableRoof(-11, 11, -5.5, 3, 8.6, '#2e6f5e', '#d9c3a0', 0.5));
  const cart = (x: number, c: string) => [
    vb(x - 1.6, 0.8, -3, x + 1.6, 2.6, 2.6, c),
    vb(x - 1.6, 2.6, -3, x + 1.6, 3.4, -1, '#2b2f3a'),
    vb(x - 1.6, 5.4, -3.2, x + 1.6, 5.8, 2.8, '#fbf8f2'),
    vb(x - 1.5, 2.6, 2.2, x - 1.2, 5.4, 2.5, '#9aa1ab'), vb(x + 1.2, 2.6, 2.2, x + 1.5, 5.4, 2.5, '#9aa1ab'),
    vb(x - 1.5, 2.6, -3.1, x - 1.2, 5.4, -2.8, '#9aa1ab'), vb(x + 1.2, 2.6, -3.1, x + 1.5, 5.4, -2.8, '#9aa1ab'),
    vb(x - 1.8, 0, -2.4, x + 1.8, 1, -1.4, '#2b2f3a'), vb(x - 1.8, 0, 1.4, x + 1.8, 1, 2.4, '#2b2f3a'),
    vb(x - 1.2, 2.6, -2.8, x - 0.2, 4.6, -2, '#c98a4b'),
  ];
  parts.push(...cart(-6, '#fbf8f2'), ...cart(0, pick(['#fbf8f2', '#f2c14e'], rnd(seed, 1))), ...cart(6, '#fbf8f2'));
  parts.push(vb(9, 0, 4, 10, 4, 5, '#4a5060'), vb(9.2, 3, 5, 9.8, 3.6, 5.1, '#6fbf8a', 'glow'));
  return parts;
}

/**
 * Clubhouse (3 × 2 tiles), the golf track's landmark: a long timber-and-stone lodge with a deep roof,
 * a clock cupola, a patio with umbrellas looking over a green with a flag, and lanterns.
 */
export function clubhouse(seed: number): BoxPart[] {
  const roof = pick(['#2e6f5e', '#4a5060', '#8a6a52'], rnd(seed, 1));
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, FAIRWAY)];
  parts.push(vb(-15, 0, -11, 15, 3, -1, '#a9a196'), vb(-15, 3, -11, 15, 11, -1, '#e9dccb'));
  for (let x = -15; x <= 15; x += 3.75) parts.push(vb(x - 0.4, 3, -1.3, x + 0.4, 11, -0.9, '#8a6a52'));
  parts.push(...hipRoof(-16, 16, -11, 0, 12, roof, 1, 4));
  for (let x = -13; x < 13; x += 3.75) parts.push(...windowZ(x, x + 2.2, 4.5, 9, -1, G));
  // clock cupola
  parts.push(vb(-2.5, 15, -8, 2.5, 21, -3, '#fbf8f2'), vb(-1.6, 17, -3.1, 1.6, 20, -2.9, '#fbf8f2'), vb(-1.2, 17.4, -2.95, 1.2, 19.6, -2.8, '#2b2f3a'), vb(-0.1, 18.4, -2.8, 0.1, 19.4, -2.7, '#fbf8f2'));
  parts.push(...hipRoof(-3, 3, -8.5, -2.5, 22, roof, 0.6, 3), vb(-0.3, 25, -5.8, 0.3, 27.4, -5.2, '#e9c46a'), vb(-1, 20.4, -6, 1, 21, -5, LAMP, 'glow'));
  // patio and a little green with a flag
  parts.push(vb(-15, 0.3, -1, 3, 1, 5, '#cfc9bd'), vb(-15, 1, 4.6, 3, 2.8, 5, '#fbf8f2'));
  const umbrella = (x: number, c: string) => [vb(x - 0.2, 1, 1.8, x + 0.2, 7, 2.2, '#f6f2ea'), ...asSway([vb(x - 2.4, 7, -0.4, x + 2.4, 7.6, 4.4, c)]), vb(x - 1.2, 2.6, 0.8, x + 1.2, 3, 3.2, '#fbf8f2')];
  parts.push(...umbrella(-11, '#fbf8f2'), ...umbrella(-4.5, roof));
  for (let x = 6; x < 17; x += 1) for (let z = 1; z < 11; z += 1) if (((x + 0.5 - 11.5) / 5.5) ** 2 + ((z + 0.5 - 6) / 4.8) ** 2 < 1) parts.push(vb(x, 0.3, z, x + 1, 0.45, z + 1, GREEN));
  parts.push(...flag(12, 6), vb(-2, 0.3, 5, 0, 0.35, 12, '#e2d9c8'), ...lamp(-16.5, 3, 9), ...lamp(4.5, 3, 9), ...flowerBed(-15, 7, 6, 3, seed));
  return parts;
}

// --- Special district (ranch and heritage rail): hay & tractor → horse corral → red barn → heritage railway

/** Hay field (2 × 2 tiles): round bales on stubble, a small red tractor with a hay wagon, a split-rail fence. */
export function hayField(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#d8c27a')];
  for (let z = -11; z < 12; z += 2) parts.push(vb(-12, 0.3, z, 12, 0.4, z + 0.6, '#c9b06a'));
  for (const [x, z] of [[-8, -7], [-3, -8], [3, -6], [8, -8]]) parts.push(vb(x - 2, 0.3, z - 1.6, x + 2, 3.6, z + 1.6, '#e3c97a'), vb(x - 2.1, 0.6, z - 1.4, x + 2.1, 3.3, z + 1.4, shade('#e3c97a', -0.08)));
  // tractor and wagon facing +x
  const red = pick(['#d0453c', '#2f7a4a'], rnd(seed, 1));
  parts.push(vb(-2, 1.2, 2, 4, 4, 5, red), vb(-2, 4, 2.4, 1, 7.4, 4.6, red), vb(-1.8, 4.6, 2.3, 0.8, 7, 4.7, G), vb(4, 1.2, 2.6, 6.4, 3.4, 4.4, red), vb(5.4, 3.4, 3.2, 5.8, 6, 3.6, '#2b2f3a'));
  parts.push(vb(-2.4, 0, 1.4, 0.8, 3.6, 2, '#2b2f3a'), vb(-2.4, 0, 5, 0.8, 3.6, 5.6, '#2b2f3a'), vb(3.4, 0, 1.6, 5.4, 2, 2, '#2b2f3a'), vb(3.4, 0, 5, 5.4, 2, 5.4, '#2b2f3a'));
  parts.push(vb(-11, 1.4, 1.6, -3, 2.4, 5.8, WOOD), vb(-11, 0, 1.4, -9.6, 1.4, 2, '#2b2f3a'), vb(-5, 0, 1.4, -3.6, 1.4, 2, '#2b2f3a'));
  for (const x of [-9.6, -6.6]) parts.push(vb(x - 1.4, 2.4, 2, x + 1.4, 4.8, 5.4, '#e3c97a'));
  parts.push(...fence(-11.5, 11, 11.5, 11, WOOD_DARK, 3), ...fence(-11.5, 8, -11.5, 11, WOOD_DARK, 3));
  return parts;
}

/** A small voxel horse facing +x. */
function horse(x: number, z: number, coat: string): BoxPart[] {
  const mane = shade(coat, -0.35);
  return [
    vb(x - 2, 3, z - 0.8, x + 2, 5.4, z + 0.8, coat),
    vb(x + 1.6, 4.6, z - 0.6, x + 2.8, 7.4, z + 0.6, coat), vb(x + 2.4, 6.4, z - 0.55, x + 4, 7.6, z + 0.55, coat),
    vb(x + 1.4, 5.6, z - 0.2, x + 2.2, 7.8, z + 0.2, mane), vb(x - 2.6, 3.6, z - 0.2, x - 2, 5.2, z + 0.2, mane),
    ...[[-1.6, -0.6], [1.2, -0.6], [-1.6, 0.3], [1.2, 0.3]].map(([dx, dz]) => vb(x + dx, 0, z + dz, x + dx + 0.5, 3, z + dz + 0.4, shade(coat, -0.15))),
  ];
}

/** Horse corral (2 × 2 tiles): a rail-fenced paddock of packed earth, two horses, a water trough and a hay feeder. */
export function horseCorral(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#93cb6c'), vb(-11, 0.3, -11, 11, 0.4, 11, '#c9a77a')];
  parts.push(...fence(-11, -11, 11, -11, WOOD, 4), ...fence(-11, -11, -11, 11, WOOD, 4), ...fence(11, -11, 11, 11, WOOD, 4), ...fence(-11, 11, -3, 11, WOOD, 4), ...fence(3, 11, 11, 11, WOOD, 4));
  parts.push(vb(-3, 0, 10.6, -2.4, 6, 11.4, WOOD_DARK), vb(2.4, 0, 10.6, 3, 6, 11.4, WOOD_DARK), vb(-3, 6, 10.6, 3, 6.8, 11.4, WOOD_DARK));
  const coats = ['#8a5a3a', '#5a3a2a', '#d9c3a0', '#3a3030', '#b07a4a'];
  parts.push(...horse(-4, -3, pick(coats, rnd(seed, 1))), ...horse(4, 4, pick(coats, rnd(seed, 2))));
  parts.push(vb(5, 0.4, -9, 10, 2, -7, '#9aa1ab'), vb(5.4, 1.4, -8.6, 9.6, 1.9, -7.4, '#8ec5ea'));
  parts.push(vb(-10, 0.4, 6, -6, 4, 9, WOOD_DARK), vb(-9.6, 4, 6.4, -6.4, 5.4, 8.6, '#e3c97a'));
  return parts;
}

/** Red barn (2 × 2 tiles): a gambrel-roofed red barn with white trim, a hay loft door and a silo beside it. */
export function redBarn(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#93cb6c'), vb(-4, 0, 4, 4, 0.35, 12, '#c9a77a')];
  parts.push(vb(-9, 0, -9, 5, 10, 4, BARN));
  // gambrel roof: steep lower slopes, gentle upper ones
  const steps: [number, number][] = [[10, 0], [11.5, 1], [13, 2], [14.5, 3.5], [15.5, 5], [16.2, 6.5]];
  steps.forEach(([y, inset], i) => parts.push({ ...vb(-9.6, y, -9.5 + inset, 5.6, y + 1.5, 4.5 - inset, i % 2 ? shade('#5a5f6a', -0.08) : '#5a5f6a'), tag: 'roof' }));
  for (let i = 0; i < 5; i++) parts.push(vb(-9, 10 + i * 1.4, -9 + Math.min(i, 3) * 1.1, -8.9, 11.4 + i * 1.4, 4 - Math.min(i, 3) * 1.1, BARN), vb(4.9, 10 + i * 1.4, -9 + Math.min(i, 3) * 1.1, 5, 11.4 + i * 1.4, 4 - Math.min(i, 3) * 1.1, BARN));
  // white trim: big X doors and a loft door
  parts.push(vb(-5, 0, 4, 1, 7, 4.3, shade(BARN, -0.1)), vb(-5.2, 0, 4.2, 1.2, 0.5, 4.5, '#fbf8f2'), vb(-5.2, 6.8, 4.2, 1.2, 7.3, 4.5, '#fbf8f2'), vb(-5.2, 0, 4.2, -4.7, 7.3, 4.5, '#fbf8f2'), vb(0.7, 0, 4.2, 1.2, 7.3, 4.5, '#fbf8f2'), vb(-2.25, 0, 4.2, -1.75, 7.3, 4.5, '#fbf8f2'));
  parts.push(vb(-3.5, 10.5, 4, -0.5, 13.5, 4.4, '#fbf8f2'), vb(-3, 11, 4.3, -1, 13, 4.5, shade(BARN, -0.2)));
  // silo: a tall round-ish tower with a dome
  for (let y = 0; y < 22; y += 2) parts.push(vb(6.5, y, -9, 11.5, y + 2, -4, y % 4 ? '#c9c2b4' : '#d8d2c6'));
  parts.push(vb(7, 22, -8.5, 11, 23.4, -4.5, '#9aa1ab'), vb(7.8, 23.4, -7.7, 10.2, 24.6, -5.3, '#9aa1ab'));
  parts.push(vb(-8, 7.6, 4.2, -6.6, 8.4, 4.8, LAMP, 'glow'), ...smallTree(-9.4, 9, seed, 10), ...fence(5, 11, 11.5, 11, '#fbf8f2', 3));
  return parts;
}

/**
 * Heritage railway (3 × 2 tiles), the special-district track's landmark: a short track with a red
 * steam locomotive and a caboose, a little station platform with a lantern and a tall wooden water tower.
 */
export function heritageRailway(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#93cb6c'), vb(-18, 0.3, -2.5, 18, 0.7, 2.5, '#a99c88')];
  for (let x = -17.5; x < 18; x += 2) parts.push(vb(x, 0.7, -2.2, x + 0.9, 1, 2.2, WOOD_DARK));
  parts.push(vb(-18, 1, -1.6, 18, 1.3, -1.2, '#7a7f8a'), vb(-18, 1, 1.2, 18, 1.3, 1.6, '#7a7f8a'));
  // locomotive facing +x
  const red = pick(['#b5443a', '#2f4a6a'], rnd(seed, 1));
  parts.push(vb(-2, 2.6, -2, 8, 7, 2, '#2b2f3a'), vb(8, 1.4, -2.2, 9.4, 3, 2.2, '#c9483c'), vb(5.5, 7, -0.8, 7, 10.5, 0.8, '#2b2f3a'), vb(5.1, 10.5, -1.2, 7.4, 11.2, 1.2, '#2b2f3a'));
  parts.push(vb(1.5, 7, -1, 3, 8.4, 1, '#c9a66b'), vb(8, 5, -0.6, 8.2, 6.2, 0.6, LAMP, 'glow'));
  parts.push(vb(-7, 2.6, -2.4, -2, 10, 2.4, red), vb(-7.4, 10, -2.8, -1.6, 10.8, 2.8, '#2b2f3a'), vb(-6.2, 6, 2.4, -2.8, 8.6, 2.5, G));
  for (const x of [-5.5, -1, 2.5, 6]) parts.push(vb(x - 1.2, 1.2, -2.5, x + 1.2, 3.6, -2.2, '#c9483c'), vb(x - 1.2, 1.2, 2.2, x + 1.2, 3.6, 2.5, '#c9483c'));
  // caboose
  parts.push(vb(-16.5, 2.4, -2.2, -9, 8, 2.2, '#c9483c'), vb(-17, 8, -2.6, -8.5, 8.6, 2.6, '#5a2f2a'), vb(-14.4, 8.6, -1.6, -11.2, 10.6, 1.6, '#c9483c'), vb(-14.8, 10.6, -2, -10.8, 11.2, 2, '#5a2f2a'));
  for (const x of [-15, -11]) parts.push(vb(x, 4.4, 2.2, x + 1.8, 6.4, 2.4, G));
  parts.push(vb(-16, 1.2, -2.4, -14, 2.6, 2.4, '#2b2f3a'), vb(-11.5, 1.2, -2.4, -9.5, 2.6, 2.4, '#2b2f3a'));
  // platform with a bench and a lantern post
  parts.push(vb(-14, 0.3, 4, 6, 1.4, 9, '#cfc9bd'), ...bench(-6, 7).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 1.1 / 12, b.p[2]] as [number, number, number] })));
  parts.push(vb(2, 1.4, 7.5, 2.5, 9, 8, IRON), vb(1.6, 9, 7.1, 2.9, 10.4, 8.4, LAMP, 'glow'));
  // water tower on four legs with a spout over the track
  for (const [x, z] of [[11, -10], [16, -10], [11, -5], [16, -5]]) parts.push(vb(x - 0.5, 0, z - 0.5, x + 0.5, 14, z + 0.5, WOOD_DARK));
  parts.push(vb(10, 14, -11, 17, 24, -4, WOOD), ...hipRoof(10, 17, -11, -4, 25, '#5a5f6a', 0.6, 4));
  for (let y = 15; y < 24; y += 3) parts.push(vb(9.9, y, -11.1, 17.1, y + 0.4, -3.9, '#4a3a30'));
  parts.push(vb(12.8, 16, -4, 13.6, 16.8, -1.8, '#4a3a30'));
  return parts;
}
