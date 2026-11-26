/**
 * Place library: historic main-street track (community-identity build map, 2026-11-26).
 * Generic places, no brands, names or sign text. Voxels (12 per tile), front towards +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { flowerBed, IRON, lamp, PAVING } from './placeParts';
import { ART } from './samples';
import { gableRoof, pick, rnd, shade, vb, windowZ } from './voxel';

const G = ART.glass;
const SANDSTONE = '#d8c39a';

/** Café with a patio (2 × 1 tiles): a small shop front, tables under umbrellas, string lights. */
export function cafePatio(seed: number): BoxPart[] {
  const wall = pick(['#f4d6cc', '#eef0d8', '#f6e7c8'], rnd(seed, 1));
  const accent = pick(['#6fbf8a', '#e46a5c', '#5b8fd6'], rnd(seed, 2));
  const parts: BoxPart[] = [vb(-12, 0, -6, 12, 0.3, 6, PAVING)];
  parts.push(vb(-12, 0, -6, -1, 12, -1, wall), vb(-12, 12, -6, -0.6, 13, -0.6, shade(wall, -0.3)));
  parts.push(vb(-11, 0.3, -1, -5, 7, -0.7, G), vb(-4, 0, -1, -2, 7, -0.7, ART.door), ...windowZ(-10, -7, 9, 11, -1, G), ...windowZ(-5, -2, 9, 11, -1, G));
  for (let x = -12, i = 0; x < -1; x += 1.4, i++) parts.push(vb(x, 7.4, -1, x + 1.4, 8.2, 2, i % 2 ? accent : '#fbf8f2'));
  // patio fence, tables with umbrellas
  parts.push(vb(0, 0, 5.6, 12, 2, 6, IRON), vb(0, 0, -1, 0.4, 2, 6, IRON));
  const table = (x: number, z: number, c: string) => [vb(x - 1.2, 2.4, z - 1.2, x + 1.2, 2.8, z + 1.2, '#fbf8f2'), vb(x - 0.2, 0, z - 0.2, x + 0.2, 7, z + 0.2, '#f6f2ea'), ...asSway([vb(x - 2.4, 7, z - 2.4, x + 2.4, 7.6, z + 2.4, c)]), vb(x - 2.4, 0, z - 0.4, x - 1.6, 1.8, z + 0.4, IRON), vb(x + 1.6, 0, z - 0.4, x + 2.4, 1.8, z + 0.4, IRON)];
  parts.push(...table(3.5, 2.2, accent), ...table(9, 2.2, '#fbf8f2'));
  // string lights from the shop to a pole
  parts.push(vb(11.4, 0, -5.4, 11.8, 9, -5, IRON));
  for (let i = 0; i < 8; i++) parts.push(vb(-0.6 + i * 1.6, 8.4 - Math.sin((i / 7) * Math.PI) * 1.2, -3.4, -0.2 + i * 1.6, 8.8 - Math.sin((i / 7) * Math.PI) * 1.2, -3, '#ffe7a3', 'glow'));
  return parts;
}

/** Brick storefront (2 × 1 tiles): a two-storey brick block with a cornice, arched upper windows, a recessed door and an awning. */
export function brickStorefront(seed: number): BoxPart[] {
  const brick = pick([ART.brick, '#b85c45', '#c97b5a'], rnd(seed, 1));
  const accent = pick(['#2f6f5e', '#8f2f3a', '#2e4a7a'], rnd(seed, 2));
  const parts: BoxPart[] = [vb(-11, 0, -4, 11, 18, 4, brick)];
  for (let y = 2; y < 18; y += 2) parts.push(vb(-11, y, 3.9, 11, y + 0.15, 4.05, shade(brick, -0.12)));
  parts.push(vb(-11.6, 18, -4.6, 11.6, 19.4, 4.8, '#e9dccb'), vb(-11, 19.4, -4, 11, 20.4, 4.2, brick), vb(-11.8, 20.4, -4.8, 11.8, 21, 5, '#e9dccb'));
  // shop front: glass, a recessed door, a sign band (blank) and an awning
  parts.push(vb(-11, 0, 4, 11, 1, 4.6, accent), vb(-10, 1, 4, -2, 7, 4.3, G), vb(2, 1, 4, 10, 7, 4.3, G), vb(-1.6, 0, 3, 1.6, 7.4, 3.4, ART.door));
  parts.push(vb(-11, 7.6, 4, 11, 9.4, 4.5, accent), vb(-10.4, 8, 4.5, 10.4, 9, 4.6, '#e9c46a'));
  for (let x = -11, i = 0; x < 11; x += 2, i++) parts.push(vb(x, 9.8 - (i % 2) * 0.3, 4, x + 2, 10.4, 6, i % 2 ? accent : '#fbf8f2'));
  // arched windows upstairs
  for (const x of [-9, -3.5, 2, 7.5]) parts.push(vb(x - 0.5, 11.5, 3.9, x + 2.5, 16.5, 4.2, '#e9dccb'), vb(x, 12, 4, x + 2, 15.4, 4.35, G), vb(x + 0.5, 15.4, 4, x + 1.5, 16, 4.35, G));
  parts.push(...lamp(-10.8, 5.2, 9));
  return parts;
}

/** Sandstone school (3 × 2 tiles): a three-storey sandstone block, an arched central entrance, a bell cupola and a flagpole. */
export function sandstoneSchool(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#93cb6c'), vb(-6, 0, 4, 6, 0.35, 12, PAVING)];
  parts.push(vb(-16, 0, -9, 16, 22, 4, SANDSTONE), vb(-16.6, 0, -9.6, 16.6, 1.6, 4.6, shade(SANDSTONE, -0.15)));
  for (const y of [7.4, 14.8]) parts.push(vb(-16.3, y, -9.3, 16.3, y + 0.6, 4.3, shade(SANDSTONE, -0.1)));
  parts.push(vb(-16.8, 22, -9.8, 16.8, 23.4, 4.8, shade(SANDSTONE, -0.2)));
  for (let row = 0; row < 3; row++)
    for (let x = -14.5; x < 14; x += 3.6) {
      if (row === 0 && x > -4 && x < 3) continue;
      parts.push(...windowZ(x, x + 2, 2.4 + row * 7.4, 6.4 + row * 7.4, 4, G));
    }
  // the entrance: a projecting bay with an arch and steps
  parts.push(vb(-4.5, 0, 4, 4.5, 24, 6, shade(SANDSTONE, 0.05)), vb(-2.5, 0, 6, 2.5, 6, 6.3, ART.door), vb(-3, 6, 6, 3, 7, 6.3, shade(SANDSTONE, -0.2)));
  parts.push(vb(-4, 0, 6, 4, 0.8, 8, '#c9c2b4'), vb(-3.4, 0.8, 6, 3.4, 1.4, 7, '#c9c2b4'));
  parts.push(...gableRoof(-5, 5, 4, 6, 24, shade(SANDSTONE, -0.25), SANDSTONE, 0.4));
  // bell cupola on the roof and a flagpole in front
  parts.push(vb(-2, 23.4, -4, 2, 27, 0, '#fbf8f2'), vb(-1, 24, -0.1, 1, 26, 0.1, '#5a4030'), vb(-2.6, 27, -4.6, 2.6, 27.8, 0.6, '#8f9bc0'), vb(-1.4, 27.8, -3.4, 1.4, 29.4, -0.6, '#8f9bc0'), vb(-0.3, 29.4, -2.3, 0.3, 31, -1.7, IRON));
  parts.push(vb(10, 0, 9, 10.4, 20, 9.4, '#9aa1ab'), ...asSway([vb(10.4, 17, 9.1, 14.4, 19.6, 9.3, '#e0453c'), vb(11.6, 17.6, 9.05, 13.2, 19, 9.35, '#ffffff')]));
  parts.push(...flowerBed(-16, 6, 8, 4, seed), ...flowerBed(-16 + 26, 4.8, 4, 2.6, seed + 4));
  return parts;
}

/**
 * Heritage theatre (2 × 2 tiles), the historic main-street track's landmark: an art-deco front with
 * a stepped parapet, a marquee ringed with bulbs, a tall blade sign with lights (no text) and poster cases.
 */
export function heritageTheatre(seed: number): BoxPart[] {
  const wall = pick(['#f3dcc0', '#eadfca', '#f4d6cc'], rnd(seed, 1));
  const trim = pick(['#2e6f8e', '#8f2f3a', '#2f6f5e'], rnd(seed, 2));
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, PAVING)];
  parts.push(vb(-11, 0, -11, 11, 16, 6, wall));
  // stepped art-deco parapet
  parts.push(vb(-11, 16, 4, 11, 17.4, 6, wall), vb(-7, 17.4, 4.5, 7, 19, 6, wall), vb(-3, 19, 5, 3, 21, 6, wall), vb(-11.3, 15.6, 5.7, 11.3, 16, 6.3, trim));
  for (const x of [-9, -5, 5, 9]) parts.push(vb(x - 0.5, 1, 6, x + 0.5, 15.6, 6.4, shade(wall, -0.12)));
  // entrance doors, poster cases, ticket window
  parts.push(vb(-4.5, 0, 6, 4.5, 6.4, 6.3, G), vb(-0.2, 0, 6.2, 0.2, 6.4, 6.4, IRON));
  for (const x of [-8.5, 6]) parts.push(vb(x, 1.6, 6, x + 2.5, 6, 6.4, '#4a5060'), vb(x + 0.3, 1.9, 6.3, x + 2.2, 5.7, 6.45, pick(['#e9c46a', '#e3a1a6', '#93b8db'], rnd(seed, x))));
  // the marquee: a deep box over the doors, its edge ringed with bulbs
  parts.push(vb(-9, 7, 6, 9, 9.6, 10, trim), vb(-8.6, 7.4, 10, 8.6, 9.2, 10.2, '#fbf8f2'));
  for (let x = -8.6; x <= 8.6; x += 1.2) parts.push(vb(x - 0.25, 9.6, 9.6, x + 0.25, 10.1, 10.1, '#ffe7a3', 'glow'), vb(x - 0.25, 6.6, 9.6, x + 0.25, 7, 10.1, '#ffe7a3', 'glow'));
  // blade sign standing out from the front
  parts.push(vb(-1, 10, 6, 1, 31, 10, trim));
  for (let y = 11; y < 31; y += 1.6) parts.push(vb(-1.1, y, 9.6, 1.1, y + 0.5, 10.1, '#ffe7a3', 'glow'));
  parts.push(vb(-1.4, 31, 5.6, 1.4, 32, 10.4, '#e9c46a'));
  for (const x of [-10, 10]) parts.push(...windowZ(x - 1, x + 1, 11, 14, 6, G));
  parts.push(...lamp(-11, 10.5, 9), ...lamp(11, 10.5, 9));
  return parts;
}
