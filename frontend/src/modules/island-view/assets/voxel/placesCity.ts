/**
 * Place library: downtown and food-street tracks (community-identity build map, 2026-11-26).
 * Generic places, no brands, names or sign text. Voxels (12 per tile), front towards +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, flowerBed, IRON, LAMP, lamp, PAVING, smallTree } from './placeParts';
import { ART } from './samples';
import { gableRoof, pick, rnd, shade, vb } from './voxel';

const G = ART.glass;
const GD = ART.glassDark;
const BRIGHT = ['#e46a5c', '#f2c14e', '#6fbf8a', '#5b8fd6', '#a77bd1', '#f08bb3'];

// --- Downtown: pocket plaza → skywalk → glass office → signature tower -------------------------

/** Pocket plaza (2 × 2 tiles): granite paving, an abstract sculpture, planters with trees, benches. */
export function pocketPlaza(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#d6d2ca')];
  for (let x = -12; x < 12; x += 4) for (let z = -12; z < 12; z += 4) if (((x + z) / 4) % 2 === 0) parts.push(vb(x, 0.28, z, x + 4, 0.34, z + 4, '#c4bfb5'));
  // sculpture: three tilted rings of coloured blocks on a plinth
  const c = pick(['#e46a5c', '#5b8fd6', '#f2c14e'], rnd(seed, 1));
  parts.push(vb(-3, 0.3, -3, 3, 2, 3, '#9aa1ab'));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    parts.push(vb(Math.cos(a) * 4 - 0.8, 6 + Math.sin(a) * 4, -0.8, Math.cos(a) * 4 + 0.8, 7.6 + Math.sin(a) * 4, 0.8, i % 2 ? c : shade(c, -0.15)));
  }
  parts.push(vb(-0.5, 2, -0.5, 0.5, 3, 0.5, '#9aa1ab'));
  for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) parts.push(vb(x - 2.5, 0.3, z - 2.5, x + 2.5, 2, z + 2.5, '#8f8778'), ...smallTree(x, z, seed + x + z, 10).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 2 / 12, b.p[2]] as [number, number, number] })));
  parts.push(...bench(0, 9.5), ...bench(0, -9.5), ...lamp(-11, 0), ...lamp(11, 0));
  return parts;
}

/** Skywalk (3 × 1 tiles): an enclosed glass footbridge on the second floor between two building corners. */
export function skywalk(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -17.7 : 9.7;
    const wall = s < 0 ? '#c9c2b4' : '#a9b4c2';
    parts.push(vb(x0, 0, -5.5, x0 + 8, 26, 5.5, wall));
    for (let y = 2; y < 26; y += 4) parts.push(vb(x0 + 0.6, y, 5.4, x0 + 7.4, y + 2.6, 5.8, G));
    parts.push(vb(x0 - 0.3, 26, -5.8, x0 + 8.3, 27, 5.8, shade(wall, -0.25)));
  }
  // the bridge: frame, glass sides, a lit strip under the roof
  parts.push(vb(-10, 9, -3, 10, 10, 3, '#6b7280'), vb(-10, 15, -3, 10, 16, 3, '#6b7280'));
  parts.push(vb(-10, 10, 2.6, 10, 15, 3, G), vb(-10, 10, -3, 10, 15, -2.6, GD));
  for (let x = -10; x <= 10; x += 4) parts.push(vb(x - 0.3, 10, -3, x + 0.3, 15, 3.1, '#6b7280'));
  parts.push(vb(-9, 14.4, -0.4, 9, 14.8, 0.4, LAMP, 'glow'));
  parts.push(...lamp(-4, 4.5, 8), ...lamp(4, 4.5, 8));
  return parts;
}

/** Glass office (2 × 2 tiles): a stepped glass tower with dark mullions, a stone base and a lobby canopy. */
export function glassOffice(seed: number): BoxPart[] {
  const tint = pick([G, '#7fb3d6', '#8fc1c9'], rnd(seed, 1));
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, PAVING), vb(-10, 0, -10, 10, 6, 10, '#bfb8aa')];
  parts.push(vb(-9, 0.3, 10, 9, 5, 10.3, GD), vb(-4, 5.6, 10, 4, 6.2, 12, '#4a5060'));
  const block = (h0: number, h1: number, r: number) => {
    parts.push(vb(-r, h0, -r, r, h1, r, tint));
    for (let x = -r; x <= r; x += 2) parts.push(vb(x - 0.15, h0, r - 0.1, x + 0.15, h1, r + 0.15, '#3f4a5c'), vb(r - 0.1, h0, x - 0.15, r + 0.15, h1, x + 0.15, '#3f4a5c'));
    for (let y = h0 + 3; y < h1; y += 3) parts.push(vb(-r - 0.1, y, -r - 0.1, r + 0.1, y + 0.3, r + 0.1, '#3f4a5c'));
  };
  block(6, 30, 8);
  block(30, 40, 6);
  parts.push(vb(-6.4, 40, -6.4, 6.4, 41, 6.4, '#3f4a5c'), vb(-2, 41, -2, 2, 44, 2, '#9aa1ab'));
  parts.push(...lamp(-11, 11, 8), ...lamp(11, 11, 8));
  return parts;
}

/**
 * Signature tower (2 × 2 tiles), the downtown track's landmark: a slender tower that narrows in
 * three steps to a crown and a spire, its crown and top band lit at night, on a plaza with a lit fountain.
 */
export function signatureTower(seed: number): BoxPart[] {
  const tint = pick(['#7fb3d6', '#93b8db', '#8fc1c9'], rnd(seed, 2));
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#d6d2ca')];
  const steps: [number, number, number][] = [[0, 34, 8], [34, 54, 6.5], [54, 66, 5]];
  for (const [h0, h1, r] of steps) {
    parts.push(vb(-r, h0, -r, r, h1, r, tint));
    for (let x = -r + 1; x < r; x += 2.5) parts.push(vb(x - 0.2, h0, r - 0.1, x + 0.2, h1, r + 0.2, '#f2f4f6'), vb(r - 0.1, h0, x - 0.2, r + 0.2, h1, x + 0.2, '#f2f4f6'));
    parts.push(vb(-r - 0.4, h1 - 1, -r - 0.4, r + 0.4, h1, r + 0.4, '#f2f4f6'));
  }
  // the crown: a lit glass lantern and a spire
  parts.push(vb(-4, 66, -4, 4, 72, 4, '#c8e6f4', 'glow'), vb(-4.4, 72, -4.4, 4.4, 73, 4.4, '#f2f4f6'), vb(-2, 73, -2, 2, 76, 2, '#f2f4f6'), vb(-0.4, 76, -0.4, 0.4, 86, 0.4, '#9aa1ab'), vb(-0.8, 86, -0.8, 0.8, 87.4, 0.8, '#ff6b5b', 'glow'));
  parts.push(vb(-8.6, 32, -8.6, 8.6, 33, 8.6, LAMP, 'glow'));
  // lobby and a small fountain in front
  parts.push(vb(-6, 0.3, 8, 6, 6, 8.3, ART.glassDark), vb(-7, 6, 8, 7, 6.6, 10.5, '#4a5060'));
  parts.push(vb(-11, 0.3, 9, -5, 1.4, 11.6, '#cfc6b8'), vb(-10.4, 0.3, 9.6, -5.6, 1.5, 11, '#8ec5ea'), vb(-8.3, 1.4, 10.1, -7.7, 4, 10.6, '#c8e6f4', 'glow'));
  parts.push(...flowerBed(6, 9, 5.5, 2.6, seed), ...lamp(-11, -11, 8), ...lamp(11, -11, 8));
  return parts;
}

// --- Food street: food trucks → market stalls → lantern street → food hall ---------------------

/** Food trucks (2 × 2 tiles): two trucks with serving hatches and awnings, picnic tables, a string of lights. */
export function foodTrucks(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#cfc9bd')];
  const truck = (x: number, c: string) => {
    parts.push(vb(x - 4.5, 1.2, -9, x + 4.5, 9, -3, c), vb(x + 4.5, 1.2, -8.6, x + 7, 6.5, -3.4, shade(c, -0.1)), vb(x + 5.2, 4, -3.4, x + 6.8, 6, -3.3, G));
    parts.push(vb(x - 3.5, 4, -3.1, x + 3, 7.4, -2.9, '#fbf8f2'), vb(x - 3.5, 4.4, -3, x + 3, 7, -2.8, '#3a3f4c'), vb(x - 4, 7.6, -3.2, x + 3.5, 8, -1, shade(c, -0.2)));
    for (const wx of [x - 3, x + 4.5]) parts.push(vb(wx - 1, 0, -9.2, wx + 1, 2, -8.8, '#2b2f3a'), vb(wx - 1, 0, -3.2, wx + 1, 2, -2.8, '#2b2f3a'));
    parts.push(vb(x - 4.5, 9, -8, x - 1, 10.4, -5, '#d9d9d9'));
  };
  truck(-5.5, pick(BRIGHT, rnd(seed, 1)));
  truck(4.5, pick(BRIGHT, rnd(seed, 2)));
  const table = (x: number, z: number) => [vb(x - 2.4, 2.4, z - 1, x + 2.4, 2.8, z + 1, ART.wood), vb(x - 2.4, 1.2, z - 2.2, x + 2.4, 1.6, z - 1.6, ART.wood), vb(x - 2.4, 1.2, z + 1.6, x + 2.4, 1.6, z + 2.2, ART.wood), vb(x - 2, 0, z - 0.3, x - 1.4, 2.4, z + 0.3, ART.wood), vb(x + 1.4, 0, z - 0.3, x + 2, 2.4, z + 0.3, ART.wood)];
  parts.push(...table(-6, 5), ...table(5, 5));
  parts.push(vb(-11.6, 0, 10.5, -11, 9, 11.1, IRON), vb(11, 0, 10.5, 11.6, 9, 11.1, IRON));
  for (let i = 0; i < 12; i++) parts.push(vb(-10.4 + i * 1.9, 8.2 - Math.sin((i / 11) * Math.PI) * 1.4, 10.6, -10 + i * 1.9, 8.6 - Math.sin((i / 11) * Math.PI) * 1.4, 11, LAMP, 'glow'));
  return parts;
}

/** Market stalls (3 × 2 tiles): six stalls in two rows with striped canopies, crates of produce, flowers and bread, lamps down the aisle. */
export function marketStalls(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#d9cfbd')];
  const goods = [['#e46a5c', '#f2c14e', '#6fae4f'], ['#f08bb3', '#fbf8f2', '#b9a6e2'], ['#c98a4b', '#e0b070', '#a86b3c'], ['#6fae4f', '#8cc867', '#f2c14e']];
  [[-12, -6], [0, -6], [12, -6], [-12, 6], [0, 6], [12, 6]].forEach(([x, z], i) => {
    const c = pick(BRIGHT, rnd(seed, i));
    parts.push(vb(x - 4, 0, z - 2.5, x + 4, 3, z + 2.5, ART.wood), vb(x - 4, 3, z - 2.5, x + 4, 3.3, z + 2.5, '#d9c3a0'));
    for (const px of [x - 3.8, x + 3.4]) for (const pz of [z - 2.4, z + 2]) parts.push(vb(px, 0, pz, px + 0.4, 7.6, pz + 0.4, '#9aa1ab'));
    for (let k = 0; k < 8; k++) parts.push(...asSway([vb(x - 4.4 + k * 1.1, 7.6 + (k % 2) * 0.3, z - 3, x - 3.3 + k * 1.1, 8.2 + (k % 2) * 0.3, z + 3, k % 2 ? c : '#fbf8f2')]));
    for (let k = 0; k < 3; k++) parts.push(vb(x - 3.4 + k * 2.4, 3.3, z - 1.6, x - 1.4 + k * 2.4, 4.4, z + 1.6, '#a07a52'), vb(x - 3.2 + k * 2.4, 4.4, z - 1.4, x - 1.6 + k * 2.4, 5, z + 1.4, goods[i % 4][k]));
  });
  parts.push(...lamp(-6, 0, 8), ...lamp(6, 0, 8));
  return parts;
}

/** Lantern street (3 × 1 tiles): a lane under strings of round paper lanterns between poles, with benches and planters. */
export function lanternStreet(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -6, 18, 0.3, 6, '#cfc9bd'), vb(-18, 0.3, -1.2, 18, 0.35, 1.2, '#bfb8aa')];
  const posts = [-17, -8.5, 0, 8.5, 17];
  for (const x of posts) for (const z of [-5, 5]) parts.push(vb(x - 0.35, 0, z - 0.35, x + 0.35, 12, z + 0.35, '#8a2f2a'), vb(x - 0.7, 12, z - 0.7, x + 0.7, 12.6, z + 0.7, '#5a1f1c'));
  const colours = ['#e0453c', '#f2a14e', '#f2c14e'];
  for (const x of posts)
    for (let i = 1; i < 6; i++) {
      const z = -5 + i * (10 / 6);
      const y = 11 - Math.sin((i / 6) * Math.PI) * 1.6;
      parts.push(...asSway([vb(x - 0.9, y - 1.8, z - 0.9, x + 0.9, y, z + 0.9, LAMP, 'glow'), vb(x - 1.1, y - 1.4, z - 1.1, x + 1.1, y - 0.4, z + 1.1, pick(colours, rnd(seed, x, i)))]));
    }
  for (let x = -16; x < 16; x += 0.9) parts.push(vb(x, 11.5, -0.1, x + 0.9, 11.7, 0.1, '#5a1f1c'));
  parts.push(...bench(-12.7, -3.6), ...bench(4.2, -3.6), ...bench(-4.2, 3.6), ...bench(12.7, 3.6), ...flowerBed(-16, 2.4, 4, 3, seed), ...flowerBed(12, -5.4, 4, 3, seed + 2));
  return parts;
}

/**
 * Food hall (3 × 2 tiles), the food-street track's landmark: a big hall under a glazed gable, a row
 * of colourful vendor banners, a lit roof sign of stacked colour blocks (no text), patio tables in front.
 */
export function foodHall(seed: number): BoxPart[] {
  const wall = pick(['#c4694f', '#b8765a', '#d08a5e'], rnd(seed, 1));
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#d9cfbd')];
  parts.push(vb(-16, 0, -11, 16, 13, 3, wall));
  for (let y = 2; y < 13; y += 2) parts.push(vb(-16, y, 2.9, 16, y + 0.15, 3.05, shade(wall, -0.12)));
  parts.push(...gableRoof(-16, 16, -11, 3, 14, '#4a5060', wall, 1));
  // a glazed strip along the ridge
  parts.push(vb(-14, 19, -5, 14, 20.6, -3, '#c8e6f4'));
  // big arched front windows and doors
  for (const x of [-12, -4, 4, 12]) parts.push(vb(x - 3, 0.3, 3, x + 3, 9, 3.3, x === -4 || x === 4 ? ART.glassDark : G), vb(x - 3.5, 9, 3, x + 3.5, 10, 3.4, '#e9dccb'));
  for (let i = 0; i < 8; i++) parts.push(...asSway([vb(-15 + i * 4, 10.6, 3.4, -12.6 + i * 4, 13, 3.6, pick(BRIGHT, rnd(seed, i, 3)))]));
  // the roof sign: stacked colour blocks on a frame, lit
  parts.push(vb(-0.4, 20, -5, 0.4, 24, -4.2, IRON));
  for (let i = 0; i < 5; i++) parts.push(vb(-7 + i * 2.8, 24, -5.2, -4.6 + i * 2.8, 28, -4, pick(BRIGHT, rnd(seed, i, 9))));
  for (let x = -7; x < 7; x += 1.4) parts.push(vb(x, 28.2, -5, x + 0.6, 28.8, -4.2, LAMP, 'glow'));
  // patio: tables with umbrellas, string lights on two poles
  const table = (x: number, z: number, c: string) => [vb(x - 1.4, 2.4, z - 1.4, x + 1.4, 2.8, z + 1.4, '#fbf8f2'), vb(x - 0.2, 0, z - 0.2, x + 0.2, 7, z + 0.2, '#f6f2ea'), ...asSway([vb(x - 2.6, 7, z - 2.6, x + 2.6, 7.6, z + 2.6, c)])];
  parts.push(...table(-11, 8, pick(BRIGHT, rnd(seed, 21))), ...table(0, 8.5, '#fbf8f2'), ...table(11, 8, pick(BRIGHT, rnd(seed, 22))));
  parts.push(...lamp(-17, 11, 9), ...lamp(17, 11, 9));
  return parts;
}
