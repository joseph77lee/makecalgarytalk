/**
 * Persona landmarks and town-centre pieces (concept for the community-identity build map,
 * 2026-11-25; shown in the gallery's "Concept: Mahogany" view, not used by the islands yet).
 * Lake persona: lakeside lighthouse, beach house, boardwalk, sailing dock with boats, beach
 * umbrellas. Town centre: main-street shops and a plaza with a fountain. Voxels (12 per tile),
 * front towards +z, centred on the origin unless noted.
 */
import { asSway, type BoxPart } from '../boxes';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, windowX, windowZ } from './voxel';

const LAMP = '#ffe7a3';
const WOOD = '#b88a64';
const WOOD_DARK = '#8a6343';
const G = ART.glass;

// --- Lake persona ---------------------------------------------------------------------------

/**
 * Lakeside lighthouse, the lake persona's final landmark (about 2 × 2 tiles, 4 tiles tall): a rock
 * base, a striped tapering tower, a balcony, a lantern that lights at night and a red cap.
 */
export function lakeLighthouse(seed: number): BoxPart[] {
  const band = pick(['#e46a5c', '#5b8fd6', '#6fbf8a'], rnd(seed, 1));
  const parts: BoxPart[] = [];
  // rocks
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 9 + rnd(seed, i) * 2;
    const s = 3 + rnd(seed, i, 2) * 2;
    parts.push(vb(Math.cos(a) * r - s / 2, 0, Math.sin(a) * r - s / 2, Math.cos(a) * r + s / 2, 1.5 + rnd(seed, i, 3) * 2, Math.sin(a) * r + s / 2, shade('#a9a39a', (rnd(seed, i, 4) - 0.5) * 0.2)));
  }
  parts.push(vb(-9, 0, -9, 9, 2, 9, '#b8b0a4'));
  // keeper's room at the foot
  parts.push(vb(-8, 2, 1, -2, 8, 7, '#f6f2ea'), ...gableRoof(-8, -2, 1, 7, 9, band, '#f6f2ea', 0.6), vb(-5.6, 2, 7, -4.2, 6, 7.3, ART.door), ...windowX(2.5, 5, 4, 6, -2, G));
  // tower: tapering, stripes every 4 voxels
  for (let y = 2, i = 0; y < 38; y += 4, i++) {
    const h = 5.2 - i * 0.18;
    parts.push(vb(-h, y, -h, h, y + 4, h, i % 2 ? band : '#fbf8f2'));
  }
  for (const y of [12, 22, 30]) parts.push(...windowZ(-0.8, 0.8, y, y + 2, 4.6, G));
  // balcony, lantern, cap
  parts.push(vb(-5.4, 38, -5.4, 5.4, 39, 5.4, '#4a5060'));
  for (let i = -5; i <= 5; i += 2) parts.push(vb(i - 0.2, 39, 5, i + 0.2, 40.6, 5.4, '#4a5060'), vb(i - 0.2, 39, -5.4, i + 0.2, 40.6, -5, '#4a5060'), vb(5, 39, i - 0.2, 5.4, 40.6, i + 0.2, '#4a5060'), vb(-5.4, 39, i - 0.2, -5, 40.6, i + 0.2, '#4a5060'));
  parts.push(vb(-3, 39, -3, 3, 44, 3, LAMP, 'glow'), vb(-3.4, 44, -3.4, 3.4, 45, 3.4, '#4a5060'), ...hipRoof(-3.4, 3.4, -3.4, 3.4, 46, '#c9483c', 0.4, 4), vb(-0.3, 50, -0.3, 0.3, 52, 0.3, '#4a5060'));
  return parts;
}

/** A beach umbrella (striped canopy that sways a little) with two loungers. */
export function beachUmbrella(seed: number): BoxPart[] {
  const c = pick(['#e46a5c', '#5b8fd6', '#f2c14e', '#f08bb3', '#6fbf8a'], rnd(seed, 2));
  return [
    vb(-0.2, 0, -0.2, 0.2, 5, 0.2, '#f6f2ea'),
    ...asSway([vb(-2.4, 5, -2.4, 2.4, 5.5, 2.4, c), vb(-1.6, 5.5, -1.6, 1.6, 6, 1.6, '#fbf8f2'), vb(-0.6, 6, -0.6, 0.6, 6.4, 0.6, c)]),
    vb(1.2, 0, 1.6, 4.6, 0.8, 2.8, '#fbf8f2'),
    vb(-4.6, 0, 1.6, -1.2, 0.8, 2.8, '#fbf8f2'),
    vb(3.8, 0.8, 1.6, 4.6, 1.8, 2.8, '#fbf8f2'),
    vb(-4.6, 0.8, 1.6, -3.8, 1.8, 2.8, '#fbf8f2'),
    vb(1.4, 0.8, 1.7, 3.6, 0.9, 2.7, c),
  ];
}

/**
 * Beach house (3 × 2 tiles): a bright pavilion on a wooden deck by the water, big windows,
 * a teal hip roof, a lifeguard chair and umbrellas on the sand in front.
 */
export function beachHouse(seed: number): BoxPart[] {
  const wall = '#fbf8f2';
  const roof = pick(['#9fd0bd', '#93b8db', '#ef9b7f'], rnd(seed, 3));
  const parts: BoxPart[] = [vb(-17, 0, -11, 17, 1, 4, WOOD)];
  for (let x = -17; x < 17; x += 1.5) parts.push(vb(x, 0.95, -11, x + 0.1, 1.05, 4, WOOD_DARK));
  parts.push(vb(-12, 1, -10, 8, 11, -1, wall), ...hipRoof(-13, 9, -11, 0, 12, roof, 1, 4));
  for (let x = -11; x < 7; x += 3.6) parts.push(...windowZ(x, x + 2.6, 3, 9, -1, G));
  parts.push(vb(-2, 1, -1, 2, 8, -0.6, '#5b8fd6'), vb(-12.4, 1, -1, -11.6, 11, -0.2, wall), vb(7.6, 1, -1, 8.4, 11, -0.2, wall));
  // the deck's rail and steps down to the sand
  parts.push(vb(-17, 1, 3.6, -3, 2.6, 4, '#fbf8f2'), vb(3, 1, 3.6, 17, 2.6, 4, '#fbf8f2'), vb(-3, 0, 4, 3, 0.5, 5.5, WOOD));
  // a tower with a flag (the persona's colour) and a lifeguard chair
  parts.push(vb(9, 1, -9, 15, 16, -3, roof), ...hipRoof(9, 15, -9, -3, 17, shade(roof, -0.15), 0.6, 3), ...windowZ(10.5, 13.5, 11, 14, -3, G));
  parts.push(vb(11.8, 20, -6.2, 12.2, 25, -5.8, '#9aa1ab'), ...asSway([vb(12.2, 23, -6.1, 15, 25, -5.9, '#e46a5c')]));
  parts.push(vb(13, 0, 6, 13.6, 7, 6.6, '#fbf8f2'), vb(15.4, 0, 6, 16, 7, 6.6, '#fbf8f2'), vb(12.6, 7, 5.6, 16.4, 7.6, 9, '#e46a5c'), vb(12.6, 7.6, 5.6, 16.4, 10, 6, '#e46a5c'));
  return parts;
}

/** A boardwalk along the shore, `tiles` long along x, on posts, with a rope rail on the lake side (−z). */
export function boardwalk(tiles: number): BoxPart[] {
  const len = tiles * 12;
  const parts: BoxPart[] = [vb(-len / 2, 0, -2.5, len / 2, 0.8, 2.5, WOOD)];
  for (let x = -len / 2; x < len / 2; x += 1.2) parts.push(vb(x, 0.75, -2.5, x + 0.12, 0.85, 2.5, WOOD_DARK));
  for (let x = -len / 2 + 1; x < len / 2; x += 4) parts.push(vb(x, -3, -2.6, x + 0.6, 3, -2, WOOD_DARK), vb(x, -3, 2, x + 0.6, 0.8, 2.6, WOOD_DARK));
  parts.push(vb(-len / 2, 2.4, -2.5, len / 2, 2.7, -2.2, '#e9dccb'));
  for (let x = -len / 2 + 6; x < len / 2; x += 12) parts.push(vb(x - 0.3, 0.8, 2, x + 0.3, 9, 2.6, '#4a5060'), vb(x - 0.8, 9, 1.8, x + 0.8, 10.4, 2.8, LAMP, 'glow'));
  return parts;
}

/** A small sailboat (along x) with a white sail that sways. */
export function sailboat(seed: number): BoxPart[] {
  const hull = pick(['#fbf8f2', '#5b8fd6', '#e46a5c', '#f2c14e'], rnd(seed, 4));
  return [
    vb(-4, -0.6, -1.4, 3.4, 1.2, 1.4, hull),
    vb(3.4, -0.4, -0.9, 4.6, 1.2, 0.9, hull),
    vb(-3.6, 1.2, -1, 2.8, 1.5, 1, WOOD),
    vb(-0.2, 1.2, -0.2, 0.2, 11, 0.2, '#e9dccb'),
    ...asSway([vb(0.2, 2, -0.1, 3.8, 10.5, 0.1, '#fbf8f2'), vb(-3.4, 2, -0.1, -0.2, 8, 0.1, pick(['#e46a5c', '#5b8fd6', '#fbf8f2'], rnd(seed, 5)))]),
  ];
}

/** A sailing dock: planks out into the lake along −z, `tiles` long, with mooring posts. */
export function sailingDock(tiles: number): BoxPart[] {
  const len = tiles * 12;
  const parts: BoxPart[] = [vb(-2, 0, -len, 2, 0.8, 0, WOOD), vb(-6, 0, -len, 6, 0.8, -len + 4, WOOD)];
  for (let z = -len; z < 0; z += 1.2) parts.push(vb(-2, 0.75, z, 2, 0.85, z + 0.12, WOOD_DARK));
  for (let z = -len + 1; z < 0; z += 5) parts.push(vb(-2.6, -3, z, -2, 1.6, z + 0.6, WOOD_DARK), vb(2, -3, z, 2.6, 1.6, z + 0.6, WOOD_DARK));
  return parts;
}

// --- Town centre --------------------------------------------------------------------------------

/** A main-street shop (2 × 1 tiles): shop front with a striped awning, a sign and an upper floor. */
export function mainStreetShop(seed: number): BoxPart[] {
  const wall = pick(ART.walls, rnd(seed, 6));
  const accent = pick(['#e46a5c', '#5b8fd6', '#6fbf8a', '#f2c14e', '#a77bd1'], rnd(seed, 7));
  const parts: BoxPart[] = [vb(-11, 0, -5, 11, 13, 4, wall), vb(-11.4, 13, -5.4, 11.4, 14, 4.4, shade(wall, -0.25))];
  parts.push(vb(-9, 0.5, 4, 2, 6, 4.3, G), vb(4, 0, 4, 7, 6, 4.3, ART.door));
  for (let x = -10, i = 0; x < 10; x += 2, i++) parts.push(vb(x, 6.6, 4, x + 2, 7.4, 7, i % 2 ? accent : '#fbf8f2'));
  parts.push(vb(-7, 8, 4, 7, 9.8, 4.4, '#fbf8f2'), vb(-6, 8.4, 4.4, 6, 9.4, 4.5, accent));
  for (const x of [-9, -3.5, 2, 7.5]) parts.push(...windowZ(x, x + 2, 10.4, 12.4, 4, G));
  parts.push(vb(-10.6, 0, 5, -8.6, 1.6, 7, ART.wood), vb(8.6, 0, 5.4, 10.6, 2.4, 7, '#6fae4f'));
  return parts;
}

/** The central plaza (`size` tiles square): paving in a ring pattern, a fountain, a flag, flower beds and benches. */
export function plaza(size: number): BoxPart[] {
  const h = (size * 12) / 2;
  const parts: BoxPart[] = [vb(-h, 0, -h, h, 0.3, h, '#e2d9c8')];
  for (let x = -h; x < h; x += 3) for (let z = -h; z < h; z += 3) if (((x + z) / 3) % 2 === 0) parts.push(vb(x, 0.28, z, x + 3, 0.34, z + 3, '#d3c8b4'));
  // fountain
  parts.push(vb(-7, 0.3, -7, 7, 2.2, 7, '#cfc6b8'), vb(-6, 0.3, -6, 6, 2.3, 6, '#8ec5ea'), vb(-2, 2, -2, 2, 5, 2, '#cfc6b8'), vb(-3.4, 5, -3.4, 3.4, 5.8, 3.4, '#cfc6b8'), vb(-2.6, 5.6, -2.6, 2.6, 5.9, 2.6, '#8ec5ea'), vb(-0.6, 5.8, -0.6, 0.6, 9, 0.6, '#c8e6f4', 'glow'));
  // flower beds at the corners and benches facing the fountain
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = sx * (h - 4);
    const cz = sz * (h - 4);
    parts.push(vb(cx - 3, 0.3, cz - 3, cx + 3, 1.4, cz + 3, '#a67b55'), vb(cx - 2.6, 1.4, cz - 2.6, cx + 2.6, 2.4, cz + 2.6, '#6fae4f'));
    for (let i = 0; i < 4; i++) parts.push(vb(cx - 2 + i * 1.2, 2.4, cz - 0.4, cx - 1.4 + i * 1.2, 3, cz + 0.4, pick(['#ef9b7f', '#e9c46a', '#e3a1a6', '#b9a6e2'], rnd(i, cx, cz))));
  }
  for (const [x, z, alongX] of [[0, -11, true], [0, 11, true], [-11, 0, false], [11, 0, false]] as const) parts.push(alongX ? vb(x - 3, 1.6, z - 0.8, x + 3, 2, z + 0.8, ART.wood) : vb(x - 0.8, 1.6, z - 3, x + 0.8, 2, z + 3, ART.wood), alongX ? vb(x - 2.8, 0.3, z - 0.6, x + 2.8, 1.6, z + 0.6, '#4a5060') : vb(x - 0.6, 0.3, z - 2.8, x + 0.6, 1.6, z + 2.8, '#4a5060'));
  parts.push(vb(h - 2.5, 0.3, -h + 2, h - 2, 18, -h + 2.5, '#9aa1ab'), ...asSway([vb(h - 2, 15, -h + 2.1, h + 2, 17.6, -h + 2.4, '#e0453c'), vb(h - 0.7, 15.6, -h + 2.05, h + 0.7, 17, -h + 2.45, '#ffffff')]));
  return parts;
}
