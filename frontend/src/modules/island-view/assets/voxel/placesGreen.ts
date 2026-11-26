/**
 * Place library: golf and special-district (ranch and heritage rail) tracks (community-identity
 * build map, 2026-11-26). Generic places, no brands or sign text. Voxels (12 per tile), front +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, fence, flowerBed, IRON, LAMP, lamp, PAVING, smallTree, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, vmove, windowZ } from './voxel';

const G = ART.glass;
const FAIRWAY = '#86c45e';
const ROUGH = '#79b357';
const GREEN = '#a6dc7a';
const SAND = '#ecd9a6';
const BARN = '#b5443a';

/** A golf flag on a pin at (x, z) that waves in the wind. */
const flag = (x: number, z: number, c = '#e0453c'): BoxPart[] => [vb(x - 0.15, 0, z - 0.15, x + 0.15, 8, z + 0.15, '#fbf8f2'), ...asSway([vb(x + 0.15, 6, z - 0.1, x + 2.6, 7.8, z + 0.1, c)]), vb(x - 0.5, 0, z - 0.5, x + 0.5, 0.35, z + 0.5, '#2b2f3a')];

// --- Golf: short golf hole → driving range → cart barn → clubhouse --------------------------------

/**
 * Short golf hole (5 × 3 tiles): a raised tee, a fairway that bends around a pond, two sand bunkers,
 * a round green with a flag, a cart path and trees along the rough.
 */
export function golfHole(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-30, 0, -18, 30, 0.3, 18, ROUGH)];
  const bend = (x: number) => 5 * Math.sin((x + 30) / 16) - 2;
  for (let x = -28; x < 28; x += 2) {
    const c = bend(x + 1);
    const half = 5 + Math.sin((x + 30) / 9) * 1.2;
    for (let z = Math.floor(c - half); z < c + half; z += 2) parts.push(vb(x, 0.3, z, x + 2, 0.42, z + 2, ((x + z) / 2) % 2 ? FAIRWAY : shade(FAIRWAY, 0.05)));
  }
  // tee box at the left end, green at the right end
  parts.push(vb(-29, 0.3, bend(-26) - 3, -23, 1.2, bend(-26) + 3, shade(FAIRWAY, 0.08)));
  for (const dz of [-1.5, 1.5]) parts.push(vb(-25.6, 1.2, bend(-26) + dz - 0.4, -24.8, 1.8, bend(-26) + dz + 0.4, '#e0453c'));
  const gx = 21;
  const gz = bend(gx);
  for (let x = gx - 8; x < gx + 8; x += 1) for (let z = gz - 7; z < gz + 7; z += 1) if (((x + 0.5 - gx) / 7.5) ** 2 + ((z + 0.5 - gz) / 6.5) ** 2 < 1) parts.push(vb(x, 0.42, z, x + 1, 0.55, z + 1, (x + z) % 4 === 0 ? shade(GREEN, -0.04) : GREEN));
  parts.push(...flag(gx + 1, gz - 1, pick(['#e0453c', '#f2c14e'], rnd(seed, 1))));
  // bunkers beside the green and the pond in the bend
  const blob = (cx: number, cz: number, rx: number, rz: number, c: string, y: number) => {
    for (let x = Math.floor(cx - rx); x < cx + rx; x += 1) for (let z = Math.floor(cz - rz); z < cz + rz; z += 1) if (((x + 0.5 - cx) / rx) ** 2 + ((z + 0.5 - cz) / rz) ** 2 < 1) parts.push(vb(x, 0.3, z, x + 1, y, z + 1, c));
  };
  blob(gx - 9, gz + 6, 3.4, 2.2, SAND, 0.45);
  blob(gx + 4, gz - 8, 3, 2, SAND, 0.45);
  blob(-2, 11, 8, 4.5, '#8ec5ea', 0.38);
  for (const [x, z] of [[-9, 9], [5, 13], [-4, 15]]) parts.push(vb(x, 0.3, z, x + 0.3, 3.4, z + 0.3, '#6f9a4f'), vb(x + 0.8, 0.3, z + 0.3, x + 1.1, 2.8, z + 0.6, '#7a5638'));
  // cart path along the back and trees in the rough
  for (let x = -26; x < 26; x += 2) parts.push(vb(x, 0.3, -15.5, x + 2, 0.4, -13.5, '#d6d0c4'));
  for (const [x, z, h] of [[-18, 14, 10], [-27, -13, 11], [12, 14, 9], [27, 13, 10], [6, -11, 10], [-12, -11, 9]]) parts.push(...smallTree(x, z, seed + x, h));
  parts.push(...bench(-20, -11.5));
  return parts;
}

/** Driving range (5 × 3 tiles): a long covered tee line with mats and ball buckets, a range with yardage flags, a tall net at the far end. */
export function drivingRange(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-30, 0, -18, 30, 0.3, 18, FAIRWAY)];
  for (let z = -18; z < 6; z += 4) parts.push(vb(-30, 0.3, z, 30, 0.36, z + 2, shade(FAIRWAY, 0.05)));
  // the tee shelter along the front
  parts.push(vb(-28, 0.3, 9, 28, 0.8, 18, '#cfc9bd'));
  for (let x = -27; x <= 27; x += 4.5) parts.push(vb(x - 0.3, 0.8, 16.5, x + 0.3, 8, 17.1, '#e9dccb'));
  parts.push(vb(-28.5, 8, 12, 28.5, 8.8, 18, '#2e6f5e'), vb(-28.5, 8.8, 15, 28.5, 9.4, 18, shade('#2e6f5e', -0.15)));
  for (let x = -24.75; x <= 24.75; x += 4.5) {
    parts.push(vb(x - 1.4, 0.8, 9.6, x + 1.4, 0.9, 13, '#4f8a5b'), vb(x + 1.6, 0.8, 12, x + 2.6, 1.8, 13, '#d0453c'));
    parts.push(vb(x + 1.7, 1.8, 12.1, x + 2.5, 2.1, 12.9, '#ffffff'));
  }
  // target greens with yardage flags out on the range, and scattered balls
  [[-16, -2, '#e0453c'], [0, -9, '#f2c14e'], [16, 0, '#5b8fd6'], [6, -14, '#a77bd1']].forEach(([x, z, c]) => {
    for (let dx = -3; dx < 3; dx++) for (let dz = -2; dz < 2; dz++) if ((dx + 0.5) ** 2 / 9 + (dz + 0.5) ** 2 / 4 < 1) parts.push(vb((x as number) + dx, 0.36, (z as number) + dz, (x as number) + dx + 1, 0.45, (z as number) + dz + 1, GREEN));
    parts.push(...flag(x as number, z as number, c as string));
  });
  for (let i = 0; i < 18; i++) parts.push(vb(-26 + rnd(seed, i, 1) * 52, 0.36, -16 + rnd(seed, i, 2) * 22, -25.6 + rnd(seed, i, 1) * 52, 0.7, -15.6 + rnd(seed, i, 2) * 22, '#ffffff'));
  parts.push(vb(-30, 0, -18, 30, 13, -17.7, '#cfe3d4'));
  for (let x = -29.8; x <= 29.8; x += 4.97) parts.push(vb(x - 0.2, 0, -18, x + 0.2, 14, -17.6, IRON));
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
 * Clubhouse (4 × 3 tiles), the golf track's landmark: a long timber-and-stone lodge with a deep roof,
 * a clock cupola and a patio with umbrellas, looking over the last hole's green with its flag and bunker.
 */
export function clubhouse(seed: number): BoxPart[] {
  const roof = pick(['#2e6f5e', '#4a5060', '#8a6a52'], rnd(seed, 1));
  const lodge: BoxPart[] = [];
  lodge.push(vb(-15, 0, -11, 15, 3, -1, '#a9a196'), vb(-15, 3, -11, 15, 11, -1, '#e9dccb'));
  for (let x = -15; x <= 15; x += 3.75) lodge.push(vb(x - 0.4, 3, -1.3, x + 0.4, 11, -0.9, '#8a6a52'));
  lodge.push(...hipRoof(-16, 16, -11, 0, 12, roof, 1, 4));
  for (let x = -13; x < 13; x += 3.75) lodge.push(...windowZ(x, x + 2.2, 4.5, 9, -1, G));
  lodge.push(vb(-2.5, 15, -8, 2.5, 21, -3, '#fbf8f2'), vb(-1.6, 17, -3.1, 1.6, 20, -2.9, '#fbf8f2'), vb(-1.2, 17.4, -2.95, 1.2, 19.6, -2.8, '#2b2f3a'), vb(-0.1, 18.4, -2.8, 0.1, 19.4, -2.7, '#fbf8f2'));
  lodge.push(...hipRoof(-3, 3, -8.5, -2.5, 22, roof, 0.6, 3), vb(-0.3, 25, -5.8, 0.3, 27.4, -5.2, '#e9c46a'), vb(-1, 20.4, -6, 1, 21, -5, LAMP, 'glow'));
  lodge.push(vb(-15, 0.3, -1, 15, 1, 6, '#cfc9bd'), vb(-15, 1, 5.6, 15, 2.8, 6, '#fbf8f2'));
  const umbrella = (x: number, c: string) => [vb(x - 0.2, 1, 2.3, x + 0.2, 7, 2.7, '#f6f2ea'), ...asSway([vb(x - 2.4, 7, 0.1, x + 2.4, 7.6, 4.9, c)]), vb(x - 1.2, 2.6, 1.3, x + 1.2, 3, 3.7, '#fbf8f2')];
  lodge.push(...umbrella(-10, '#fbf8f2'), ...umbrella(-3, roof), ...umbrella(4, '#fbf8f2'), ...lamp(-15.5, 4, 9), ...lamp(15.5, 4, 9));
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, FAIRWAY), ...vmove(lodge, -7, 0, -5)];
  // the last hole's green to the right, a bunker, a path from the patio, flower beds
  for (let x = 6; x < 23; x += 1) for (let z = -2; z < 16; z += 1) if (((x + 0.5 - 15) / 8) ** 2 + ((z + 0.5 - 7) / 7.5) ** 2 < 1) parts.push(vb(x, 0.3, z, x + 1, 0.45, z + 1, (x + z) % 4 === 0 ? shade(GREEN, -0.04) : GREEN));
  for (let x = 9; x < 15; x += 1) for (let z = 14; z < 17.6; z += 1) if (((x + 0.5 - 12) / 3.2) ** 2 + ((z + 0.5 - 15.6) / 1.8) ** 2 < 1) parts.push(vb(x, 0.25, z, x + 1, 0.4, z + 1, SAND));
  parts.push(...flag(16, 6));
  for (let z = 1; z < 17; z += 2) parts.push(vb(-8, 0.3, z, -6, 0.38, z + 2, '#e2d9c8'));
  parts.push(...flowerBed(-22, 6, 6, 3, seed), ...flowerBed(-22, 11, 6, 3, seed + 1), ...smallTree(-19, 15.5, seed, 9), ...smallTree(21, -14, seed + 2, 10), ...bench(2, 15));
  return parts;
}

// --- Special district (ranch and heritage rail): hay & tractor → horse corral → red barn → heritage railway

/** Hay field (3 × 3 tiles): round bales on stubble, a small tractor pulling a hay wagon, a split-rail fence with a gate. */
export function hayField(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, '#d8c27a')];
  for (let z = -17; z < 18; z += 2) parts.push(vb(-18, 0.3, z, 18, 0.4, z + 0.6, '#c9b06a'));
  for (const [x, z] of [[-12, -11], [-6, -13], [1, -10], [8, -13], [13, -8], [-14, -3], [10, 9], [14, 13]]) parts.push(vb(x - 2, 0.3, z - 1.6, x + 2, 3.6, z + 1.6, '#e3c97a'), vb(x - 2.1, 0.6, z - 1.4, x + 2.1, 3.3, z + 1.4, shade('#e3c97a', -0.08)));
  const red = pick(['#d0453c', '#2f7a4a'], rnd(seed, 1));
  parts.push(vb(-2, 1.2, 2, 4, 4, 5, red), vb(-2, 4, 2.4, 1, 7.4, 4.6, red), vb(-1.8, 4.6, 2.3, 0.8, 7, 4.7, G), vb(4, 1.2, 2.6, 6.4, 3.4, 4.4, red), vb(5.4, 3.4, 3.2, 5.8, 6, 3.6, '#2b2f3a'));
  parts.push(vb(-2.4, 0, 1.4, 0.8, 3.6, 2, '#2b2f3a'), vb(-2.4, 0, 5, 0.8, 3.6, 5.6, '#2b2f3a'), vb(3.4, 0, 1.6, 5.4, 2, 2, '#2b2f3a'), vb(3.4, 0, 5, 5.4, 2, 5.4, '#2b2f3a'));
  parts.push(vb(-11, 1.4, 1.6, -3, 2.4, 5.8, WOOD), vb(-11, 0, 1.4, -9.6, 1.4, 2, '#2b2f3a'), vb(-5, 0, 1.4, -3.6, 1.4, 2, '#2b2f3a'));
  for (const x of [-9.6, -6.6]) parts.push(vb(x - 1.4, 2.4, 2, x + 1.4, 4.8, 5.4, '#e3c97a'));
  parts.push(...fence(-17.5, 17, -4, 17, WOOD_DARK, 3), ...fence(4, 17, 17.5, 17, WOOD_DARK, 3), ...fence(-17.5, 6, -17.5, 17, WOOD_DARK, 3), ...fence(17.5, 6, 17.5, 17, WOOD_DARK, 3));
  parts.push(vb(-4, 0, 16.6, -3.4, 4, 17.4, WOOD_DARK), vb(3.4, 0, 16.6, 4, 4, 17.4, WOOD_DARK));
  parts.push(...smallTree(-14, 12, seed, 11));
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

/** Horse corral (3 × 3 tiles): a rail-fenced paddock of packed earth, three horses, a run-in shelter, a water trough and a hay feeder. */
export function horseCorral(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, '#93cb6c'), vb(-17, 0.3, -17, 17, 0.4, 17, '#c9a77a')];
  parts.push(...fence(-17, -17, 17, -17, WOOD, 4), ...fence(-17, -17, -17, 17, WOOD, 4), ...fence(17, -17, 17, 17, WOOD, 4), ...fence(-17, 17, -3, 17, WOOD, 4), ...fence(3, 17, 17, 17, WOOD, 4));
  parts.push(vb(-3, 0, 16.6, -2.4, 6, 17.4, WOOD_DARK), vb(2.4, 0, 16.6, 3, 6, 17.4, WOOD_DARK), vb(-3, 6, 16.6, 3, 6.8, 17.4, WOOD_DARK));
  // a run-in shelter along the back fence
  parts.push(vb(-15, 0.4, -16, -1, 7, -15.4, WOOD_DARK), vb(-15, 0.4, -16, -14.4, 7, -10, WOOD_DARK), vb(-1.6, 0.4, -16, -1, 7, -10, WOOD_DARK));
  parts.push({ ...vb(-15.6, 7, -16.6, -0.4, 7.8, -9.4, '#5a5f6a'), tag: 'roof' });
  const coats = ['#8a5a3a', '#5a3a2a', '#d9c3a0', '#3a3030', '#b07a4a'];
  parts.push(...horse(-6, 2, pick(coats, rnd(seed, 1))), ...horse(6, 8, pick(coats, rnd(seed, 2))), ...horse(8, -6, pick(coats, rnd(seed, 3))));
  parts.push(vb(9, 0.4, -15, 15, 2, -13, '#9aa1ab'), vb(9.4, 1.4, -14.6, 14.6, 1.9, -13.4, '#8ec5ea'));
  parts.push(vb(-15, 0.4, 10, -11, 4, 14, WOOD_DARK), vb(-14.6, 4, 10.4, -11.4, 5.4, 13.6, '#e3c97a'));
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
