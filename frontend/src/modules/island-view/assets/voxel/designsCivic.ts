/**
 * More voxel designs for community buildings (M23 rework: Polyfork shapes as reference only; see
 * designs.ts): entrance arches, warming huts, halls, schools, a theatre, a picnic shelter and a
 * garden shed. Centred on the origin, front towards +z, in voxels (12 per tile).
 */
import type { BoxPart } from '../boxes';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, windowX, windowZ } from './voxel';

const G = ART.glass;
const T = ART.trim;
const LIGHT = '#ffd98a';
const alongZ = (parts: BoxPart[]): BoxPart[] => parts.map((p) => ({ ...p, p: [p.p[2], p.p[1], p.p[0]], s: [p.s[2], p.s[1], p.s[0]] }));
const door = (x0: number, x1: number, z: number, h: number, c: string = ART.door): BoxPart => vb(x0, 0.3, z, x1, h, z + 0.4, c);

// --- Entrance arches (one tile) ------------------------------------------------------------

/** After Polyfork "Town Welcome Arch": two stone posts and a curved sign board across the road. */
export function welcomeArch(seed: number): BoxPart[] {
  const sign = pick(['#a8c69a', '#93b8db', '#ef9b7f'], rnd(seed, 1));
  const parts: BoxPart[] = [vb(-6, 0, -0.9, -4.4, 11, 0.9, '#cfc6b8'), vb(4.4, 0, -0.9, 6, 11, 0.9, '#cfc6b8'), vb(-6.3, 11, -1.1, -4.1, 11.6, 1.1, '#b8b0a4'), vb(4.1, 11, -1.1, 6.3, 11.6, 1.1, '#b8b0a4')];
  // a gently curved board: higher in the middle
  for (let i = 0; i < 5; i++) {
    const x = -4.4 + i * 1.76;
    const lift = [0, 0.6, 0.9, 0.6, 0][i];
    parts.push(vb(x, 8.4 + lift, -0.4, x + 1.76, 10.4 + lift, 0.4, i % 2 ? shade(sign, 0.06) : sign));
  }
  parts.push(vb(-3.6, 9, 0.4, 3.6, 10.2, 0.55, '#fff6e3'), vb(-5.6, 11.6, -0.3, -4.8, 12.6, 0.3, LIGHT, 'glow'), vb(4.8, 11.6, -0.3, 5.6, 12.6, 0.3, LIGHT, 'glow'));
  return parts;
}

/** After Polyfork "Main Gate (Arch with Lodges)": two little lodges with pointed roofs joined by an arched gateway. */
export function lodgeGate(seed: number): BoxPart[] {
  const wall = pick(ART.walls, rnd(seed, 2));
  const roof = pick(ART.roofs, rnd(seed, 3));
  const lodge = (x: number): BoxPart[] => [vb(x - 1.6, 0, -1.6, x + 1.6, 7, 1.6, wall), ...hipRoof(x - 1.6, x + 1.6, -1.6, 1.6, 8, roof, 0.5, 3), ...windowZ(x - 0.6, x + 0.6, 3, 5, 1.6, G)];
  return [...lodge(-4.4), ...lodge(4.4), vb(-2.8, 7, -1, 2.8, 9.4, 1, wall), vb(-2.8, 6.2, -1, -2.2, 7, 1, wall), vb(2.2, 6.2, -1, 2.8, 7, 1, wall), vb(-3, 9.4, -1.2, 3, 10, 1.2, shade(roof, -0.15)), vb(-1.8, 7.4, 1, 1.8, 8.8, 1.15, '#fff6e3')];
}

/** After Polyfork "Amusement Park Entrance Arch": a candy-striped arch with flags and lights (playful). */
export function funArch(seed: number): BoxPart[] {
  const a = pick(['#e46a5c', '#f08bb3', '#a77bd1'], rnd(seed, 4));
  const parts: BoxPart[] = [];
  for (const x of [-5.6, 4.4]) for (let y = 0; y < 12; y += 1.5) parts.push(vb(x, y, -0.6, x + 1.2, y + 1.5, 0.6, (y / 1.5) % 2 ? a : '#fff6e3'));
  for (let i = 0; i < 7; i++) {
    const x = -4.4 + i * 1.26;
    const lift = Math.sin((i / 6) * Math.PI) * 2;
    parts.push(vb(x, 10.5 + lift, -0.5, x + 1.26, 12 + lift, 0.5, i % 2 ? a : '#f2c14e'), vb(x + 0.4, 10.2 + lift, 0.5, x + 0.8, 10.6 + lift, 0.7, LIGHT, 'glow'));
  }
  for (const x of [-5, 5]) parts.push(vb(x - 0.1, 12, -0.1, x + 0.1, 15, 0.1, '#9aa1ab'), vb(x + 0.1, 13.8, -0.05, x + 1.6, 15, 0.05, x < 0 ? '#5b8fd6' : '#6fbf8a'));
  return parts;
}

// --- Warming huts (on the 3×3 lot, about 1.75 tiles) -------------------------------------------

/** After Polyfork "Piste Patrol Hut": a red ski-patrol hut with a white cross, a lookout deck and a radio mast. */
export function patrolHut(): BoxPart[] {
  const red = '#d9605a';
  return [
    vb(-9, 0.3, -8, 7, 9, 5, red),
    ...gableRoof(-9, 7, -8, 5, 10, '#f6f8fb', red, 1.2),
    vb(-2.4, 4.4, 5, 0.4, 5.4, 5.3, '#ffffff'),
    vb(-1.5, 3.4, 5, -0.5, 6.4, 5.3, '#ffffff'),
    door(2, 4.4, 5, 6),
    ...windowZ(-7.5, -4.5, 3, 6.5, 5, G),
    ...windowX(-5, -1, 3, 6.5, 7, G),
    vb(7, 0.3, -6, 11, 6, -1, shade(red, -0.1)), // lookout
    vb(6.8, 6, -6.2, 11.2, 6.5, -0.8, ART.wood),
    vb(7, 6.5, -6.2, 11.2, 8, -6, ART.wood),
    vb(-6, 15, -2, -5.6, 22, -1.6, '#9aa1ab'),
    vb(-6.4, 21, -2.4, -5.2, 21.4, -1.2, '#e0453c'),
  ];
}

/** After Polyfork "Mountain Refuge Hut": a stone ground floor, a wooden upper floor with shutters and a wide, low roof. */
export function refugeHut(seed: number): BoxPart[] {
  const roof = pick(['#7f9a6a', '#9a4d3c', '#5d6470'], rnd(seed, 5));
  const parts: BoxPart[] = [vb(-9, 0.3, -8, 8, 5, 5, '#b8b0a4'), vb(-9, 5, -8, 8, 10, 5, '#b98159')];
  for (let x = -8.5; x < 8; x += 2.4) parts.push(vb(x, 0.6, 5, x + 1.6, 1.2 + rnd(seed, x) * 2, 5.25, shade('#b8b0a4', -0.12)));
  parts.push(...alongZ(hipRoof(-8, 5, -9, 8, 11, roof, 1.6, 3)), door(-1.4, 1.4, 5, 4.4, '#7a5538'));
  for (const x of [-6.5, 3.5]) parts.push(...windowZ(x, x + 2, 6.4, 8.6, 5, G, '#7a5538'), vb(x - 1, 6.2, 5.1, x - 0.4, 8.8, 5.4, '#9a4d3c'), vb(x + 2.4, 6.2, 5.1, x + 3, 8.8, 5.4, '#9a4d3c'));
  parts.push(vb(-9.4, 5, 5, 8.4, 5.4, 7, '#a67b55'));
  return parts;
}

// --- Community halls (on the 3×3 lot, about 2.4 tiles) ----------------------------------------

/** After Polyfork "Country Station Building": a long single storey with a deep canopy on posts and a clock gable. */
export function stationHall(seed: number): BoxPart[] {
  const wall = pick(ART.walls, rnd(seed, 6));
  const roof = pick(ART.roofs, rnd(seed, 7));
  const parts: BoxPart[] = [vb(-14, 0.3, -9, 12, 9, 3, wall), ...gableRoof(-14, 12, -9, 3, 10, roof, wall, 1)];
  parts.push(vb(-15, 7.5, 3, 13, 8.2, 9, shade(roof, -0.1)));
  for (let x = -14; x <= 12; x += 6.5) parts.push(vb(x, 0.3, 8.2, x + 0.6, 7.5, 8.8, T));
  for (let x = -12; x < 10; x += 4) parts.push(...windowZ(x, x + 2, 2.4, 6, 3, G));
  parts.push(door(-1.2, 1.2, 3, 6.4), vb(-2.5, 14, 2.6, 2.5, 18, 3.2, wall), vb(-1.2, 15, 3.2, 1.2, 17.2, 3.4, '#fff6e3'), vb(-0.1, 16, 3.4, 0.1, 17, 3.5, '#2a2d36'));
  return parts;
}

/** After Polyfork "Governor's Audience Hall": a grand hall on a stepped stone base, red columns and a sweeping double roof (fantasy). */
export function grandHall(seed: number): BoxPart[] {
  const roof = pick(['#9fd0bd', '#e9c46a', '#93b8db'], rnd(seed, 8));
  const parts: BoxPart[] = [vb(-14, 0, -10, 14, 1.4, 8, '#cfc6b8'), vb(-12.5, 1.4, -9, 12.5, 2.6, 7, '#d9d2c6'), vb(-11, 2.6, -8, 11, 10, 4, '#f3dcc0')];
  for (let x = -10.6; x <= 10.6; x += 3) parts.push(vb(x, 2.6, 4.4, x + 0.9, 10, 5.3, '#c9483c'));
  parts.push(...hipRoof(-11, 11, -8, 5.6, 11, roof, 2, 2), vb(-9, 13, -6.5, 9, 14.5, 3.5, '#f3dcc0'), ...hipRoof(-9, 9, -6.5, 3.5, 15.5, roof, 1.6, 4));
  for (const [x, z] of [[-13.4, -9.4], [12.2, -9.4], [-13.4, 6.4], [12.2, 6.4]]) parts.push(vb(x, 11, z, x + 1.2, 12.2, z + 1.2, roof));
  parts.push(door(-2, 2, 4, 8, '#9a4d3c'), vb(-3, 0, 8, 3, 1.4, 11, '#cfc6b8'));
  return parts;
}

/** After Polyfork "Toy-Town School": a chunky toy-block building in bright colours with a little bell tower. */
export function toyBlockHall(seed: number): BoxPart[] {
  const [a, b, c] = pick([['#ef9b7f', '#9fd0bd', '#f2c14e'], ['#93b8db', '#f08bb3', '#a8c69a']], rnd(seed, 9));
  return [
    vb(-12, 0.3, -8, -2, 10, 4, a),
    vb(-2, 0.3, -8, 6, 13, 4, b),
    vb(6, 0.3, -8, 13, 8, 4, c),
    ...gableRoof(-12, -2, -8, 4, 11, c, a, 0.8),
    ...hipRoof(6, 13, -8, 4, 9, a, 0.8, 3),
    vb(-2.4, 13, -8.4, 6.4, 13.8, 4.4, '#fff6e3'),
    vb(0, 13.8, -3, 4, 18, 1, '#fff6e3'),
    ...hipRoof(0, 4, -3, 1, 19, a, 0.6, 3),
    vb(1.2, 15, 1, 2.8, 16.6, 1.2, '#e3b85a'),
    door(0, 4, 4, 7, '#fff6e3'),
    ...[-10.5, -6.5].flatMap((x) => windowZ(x, x + 2.6, 3, 7, 4, G, '#fff6e3')),
    ...[7.5, 10.5].flatMap((x) => windowZ(x, x + 2, 3, 6, 4, G, '#fff6e3')),
    ...windowZ(0, 4, 8.5, 11.5, 4, G, '#fff6e3'),
  ];
}

/** After Polyfork "Santa's Workshop": a timber-framed workshop with a steep snowy roof, a big chimney and a candy-cane door (winter fantasy). */
export function workshopHall(): BoxPart[] {
  const wall = '#f6e7c8';
  const beam = '#8b5a3c';
  const parts: BoxPart[] = [vb(-12, 0.3, -8, 12, 11, 4, wall)];
  for (let x = -12; x <= 12; x += 4) parts.push(vb(x - 0.3, 0.3, 4, x + 0.3, 11, 4.3, beam));
  parts.push(vb(-12, 5.5, 4, 12, 6, 4.3, beam));
  parts.push(...gableRoof(-12, 12, -8, 4, 12, '#c9483c', wall, 1.5));
  parts.push(vb(-13.5, 11.5, -9.5, 13.5, 12, 5.5, '#f6f8fb'), vb(6, 12, -6, 9, 22, -3, ART.brick), vb(5.6, 22, -6.4, 9.4, 23, -2.6, '#f6f8fb'));
  for (let y = 0.3; y < 8; y += 1.4) parts.push(vb(-2, y, 4.2, 2, y + 0.7, 4.6, (y / 1.4) % 2 < 1 ? '#e0453c' : '#ffffff'));
  for (const x of [-9.5, -5.5, 4, 8]) parts.push(...windowZ(x, x + 2, 2, 4.6, 4, LIGHT, beam), ...windowZ(x, x + 2, 7, 9.6, 4, G, beam));
  return parts;
}

// --- Schools and a theatre (2×2 feature lot) ------------------------------------------------------

/** After Polyfork "Public School": two brick storeys, a white cornice, rows of tall windows and a flag. */
export function brickSchool(seed: number): BoxPart[] {
  const brick = pick([ART.brick, '#c98a6a', '#d98a6a'], rnd(seed, 10));
  const parts: BoxPart[] = [vb(-9, 0.3, -8, 7, 10, -1, brick), vb(-9.4, 10, -8.4, 7.4, 10.8, -0.6, T), ...hipRoof(-9, 7, -8, -1, 11.8, '#5a6d8a', 0.4, 2)];
  for (let x = -8; x < 6; x += 2.6) parts.push(...windowZ(x, x + 1.4, 2, 4.4, -1, G), ...windowZ(x, x + 1.4, 6, 8.6, -1, G));
  parts.push(vb(-2.6, 0.3, -1, 0.6, 5, -0.6, T), vb(-2, 0.3, -0.7, 0, 4.4, -0.4, ART.door), vb(-3, 5, -1, 1, 5.6, 1, T));
  return parts;
}

/** After Polyfork "One-Room Schoolhouse": a small red schoolhouse with a white bell tower over the door. */
export function schoolhouse(): BoxPart[] {
  const red = '#c9483c';
  return [
    vb(-6, 0.3, -9, 2, 7, -1, red),
    ...alongZ(gableRoof(-9, -1, -6, 2, 8, '#5d6470', red, 0.8)),
    vb(-3.2, 0.3, -1, -0.8, 4.8, -0.6, '#fff6e3'),
    vb(-3.6, 12, -3.6, -0.4, 15, -0.4, '#fff6e3'),
    ...hipRoof(-3.6, -0.4, -3.6, -0.4, 16, '#5d6470', 0.4, 3),
    vb(-2.4, 12.6, -0.4, -1.6, 13.8, -0.3, '#e3b85a'),
    ...windowX(-8, -6, 2.4, 5, 2, G),
    ...windowX(-4.5, -2.5, 2.4, 5, 2, G),
  ];
}

/** After Polyfork "Movie Theater": a flat front with a lit marquee, a vertical sign and poster cases. */
export function movieTheatre(seed: number): BoxPart[] {
  const wall = pick(['#e9dccb', '#f3dcc0', '#d9cdb5'], rnd(seed, 11));
  const sign = pick(['#e0453c', '#a77bd1', '#5b8fd6'], rnd(seed, 12));
  const parts: BoxPart[] = [vb(-10, 0.3, -9, 10, 11, 3, wall), vb(-10.4, 11, -9.4, 10.4, 11.8, 3.4, shade(wall, -0.2))];
  parts.push(vb(-7, 5, 3, 7, 7.2, 6, '#2a2d36'), vb(-7, 7.2, 3, 7, 7.6, 6.2, LIGHT, 'glow'), vb(-6.6, 5.4, 6, 6.6, 6.8, 6.2, '#fff6e3'));
  parts.push(vb(-1, 7.6, 3, 1, 16, 4.4, sign), vb(-0.6, 8.4, 4.4, 0.6, 15.2, 4.6, LIGHT, 'glow'));
  parts.push(vb(-4, 0.3, 3, 4, 4.4, 3.3, G), vb(-8.6, 1, 3, -5.6, 4.4, 3.3, '#f2c14e'), vb(5.6, 1, 3, 8.6, 4.4, 3.3, '#9fd0bd'));
  return parts;
}

// --- Park and garden -------------------------------------------------------------------------

/** After Polyfork "Park Picnic Shelter": an open hip-roofed shelter on posts over two picnic tables. */
export function picnicShelter(seed: number): BoxPart[] {
  const roof = pick(ART.roofs, rnd(seed, 13));
  const parts: BoxPart[] = [vb(-5.5, 0, -5, 5.5, 0.3, 5, '#cfc6b8')];
  for (const [x, z] of [[-5, -4.5], [4.4, -4.5], [-5, 3.9], [4.4, 3.9]]) parts.push(vb(x, 0.3, z, x + 0.6, 6.5, z + 0.6, ART.wood));
  parts.push(...hipRoof(-5, 5, -4.5, 4.5, 7.5, roof, 1, 4));
  for (const z of [-2, 1.6]) parts.push(vb(-3, 1.8, z - 0.9, 3, 2.2, z + 0.9, '#b08a64'), vb(-3, 1, z - 1.9, 3, 1.3, z - 1.3, '#b08a64'), vb(-3, 1, z + 1.3, 3, 1.3, z + 1.9, '#b08a64'), vb(-0.3, 0.3, z - 0.3, 0.3, 1.8, z + 0.3, '#8a6343'));
  return parts;
}

/** After Polyfork "Backyard Garden Shed": a small painted shed with double doors and a window box. */
export function gardenShed(seed: number): BoxPart[] {
  const wall = pick(['#a8c69a', '#93b8db', '#e3a1a6', '#f2c14e'], rnd(seed, 14));
  return [
    vb(-2.6, 0, -2.4, 2.6, 4.4, 2.4, wall),
    ...gableRoof(-2.6, 2.6, -2.4, 2.4, 5.4, pick(ART.roofs, rnd(seed, 15)), wall, 0.5),
    vb(-1.4, 0.2, 2.4, 1.4, 3.6, 2.7, T),
    vb(-0.05, 0.2, 2.6, 0.05, 3.6, 2.8, shade(wall, -0.3)),
    ...windowX(-1, 1, 2, 3.4, 2.6, G),
    vb(2.6, 1.4, -1.2, 3.2, 1.9, 1.2, '#8a6343'),
    vb(2.7, 1.9, -1, 3.1, 2.4, 1, '#ef9b7f'),
  ];
}
