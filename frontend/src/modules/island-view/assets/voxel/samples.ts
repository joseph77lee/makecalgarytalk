/**
 * Art Pass style samples (M19, step 1): voxel models for review in the asset gallery (`?gallery`).
 * Not wired into the game yet. Colours follow the reference (docs/references/voxel-village-*.png).
 * One-tile models use x, z ∈ [-6, 6); two-by-two tile models use x, z ∈ [-12, 12). Front = +z.
 */
import type { BoxPart } from '../boxes';
import { gableRoof, hipRoof, pick, rnd, shade, vb, vmove, windowX, windowZ } from './voxel';

export const ART = {
  // Warm pastel palette (operator choice 2026-11-24).
  walls: ['#f6e7c8', '#f3dcc0', '#f7e3b5', '#eef0d8', '#f4d6cc', '#faf1e4', '#e9dccb', '#e4ecdc'],
  roofs: [
    '#ef9b7f', // coral
    '#f2b48a', // apricot
    '#e9c46a', // butter
    '#a8c69a', // sage
    '#e3a1a6', // dusty rose
    '#b9a6e2', // lavender
    '#9fd0bd', // mint
    '#d98366', // terracotta
    '#c79a76', // warm brown
    '#93b8db', // soft sky
    '#8f9bc0', // muted denim
  ],
  trim: '#f7f3ea',
  door: '#8b5a3c',
  glass: '#6aa8cf',
  glassDark: '#4c80a8',
  garage: '#e4dfd4',
  brick: '#c4694f',
  concrete: '#cfc9bd',
  wood: '#a7825f',
  dark: '#363c52',
  leaf: ['#79b85a', '#8cc867', '#6aa94f'],
  spruce: ['#4f8a5b', '#5f9a66'],
  trunk: '#7d5a3f',
  grass: ['#9fd47a', '#93cb6c'],
  path: ['#dcc79f', '#d3bd92'],
  skin: ['#f3d2b5', '#d9a77f', '#9c6b4a'],
  hair: ['#3a2a20', '#7a4b2a', '#d8b46a', '#222222'],
  shirts: ['#e46a5c', '#5b8fd6', '#f2c14e', '#6fbf8a', '#a77bd1', '#f08bb3'],
};

/** Mirror a gable roof onto the z axis (ridge along z). */
const swapXZ = (parts: BoxPart[]): BoxPart[] => parts.map((p) => ({ ...p, p: [p.p[2], p.p[1], p.p[0]], s: [p.s[2], p.s[1], p.s[0]] }));

const shrub = (x0: number, z0: number, w: number, d: number, seed: number): BoxPart[] => [
  vb(x0, 0, z0, x0 + w, 1.4, z0 + d, pick(ART.leaf, rnd(seed, 1))),
  vb(x0 + 0.5, 1.4, z0 + 0.3, x0 + w - 0.5, 2, z0 + d - 0.3, shade(pick(ART.leaf, rnd(seed, 2)), 0.1)),
];

// --- Houses (one tile) ---------------------------------------------------------------

/** Single-storey bungalow: low hip roof, front porch, chimney (older communities). */
export function bungalow(seed: number): BoxPart[] {
  const wall = pick(ART.walls, rnd(seed, 1));
  const roof = pick(ART.roofs, rnd(seed, 2));
  return [
    vb(-5, 0, -4, 5, 1, 4, ART.concrete),
    vb(-5, 1, -4, 5, 5, 4, wall),
    ...hipRoof(-5, 5, -4, 4, 6, roof, 1, 3),
    vb(-1, 1, 4, 1, 4, 4.4, ART.door),
    vb(-2, 0, 4, 2, 1, 6, ART.concrete),
    vb(-3, 1, 5.2, -2.4, 5, 5.8, ART.trim),
    vb(2.4, 1, 5.2, 3, 5, 5.8, ART.trim),
    vb(-3.5, 5, 4, 3.5, 5.6, 6.2, shade(roof, -0.1)),
    ...windowZ(-4, -2, 2, 4, 4, ART.glass),
    ...windowZ(2, 4, 2, 4, 4, ART.glass),
    ...windowX(-2.5, 0.5, 2, 4, 5, ART.glass),
    vb(2, 5, -2.5, 3.5, 9.5, -1, ART.brick),
    vb(1.7, 9.5, -2.8, 3.8, 10, -0.7, shade(ART.brick, -0.25)),
    ...shrub(-5, 4.5, 2, 1.3, seed),
    ...shrub(3.5, 4.5, 1.5, 1.3, seed + 7),
  ];
}

/** Two-storey detached house with a front-attached garage (newer suburbs). */
export function twoStoreyGarage(seed: number): BoxPart[] {
  const wall = pick(ART.walls, rnd(seed, 3));
  const roof = pick(ART.roofs, rnd(seed, 4));
  return [
    vb(-5.5, 0, -4.5, 1.5, 1, 3, ART.concrete),
    vb(-5.5, 1, -4.5, 1.5, 9, 3, wall),
    vb(-5.5, 5, 3, 1.5, 5.4, 3.3, ART.trim), // floor line
    ...gableRoof(-5.5, 1.5, -4.5, 3, 10, roof, wall),
    // garage, stepping forward
    vb(1.5, 0, -2, 5.5, 5, 5, shade(wall, -0.04)),
    ...hipRoof(1.5, 5.5, -2, 5, 6, roof, 0.6, 2),
    vb(2, 0.6, 5, 5, 4, 5.35, ART.garage),
    ...[1.4, 2.4, 3.4].map((y) => vb(2, y, 5.3, 5, y + 0.15, 5.45, shade(ART.garage, -0.12))),
    vb(1.8, 0, 5.4, 5.2, 0.15, 6, shade(ART.concrete, 0.1)),
    // entry
    vb(-3, 1, 3, -1.2, 4.2, 3.35, ART.door),
    vb(-3.5, 4.4, 3, -0.7, 4.8, 4.4, shade(roof, -0.1)),
    vb(-3.5, 0, 3, -0.7, 0.8, 4.5, ART.concrete),
    ...windowZ(-5, -3.6, 2, 3.8, 3, ART.glass),
    ...windowZ(-5, -3.2, 6, 8, 3, ART.glass),
    ...windowZ(-1.8, 0.8, 6, 8, 3, ART.glass),
    ...windowX(-3.5, -1, 6, 8, 1.5, ART.glass),
    ...shrub(-5.5, 3.4, 2, 1.4, seed),
  ];
}

/** Semi-detached (duplex): two mirrored homes under one roof, each with its own colour. */
export function semiDetached(seed: number): BoxPart[] {
  const a = pick(ART.walls, rnd(seed, 5));
  const b = pick(ART.walls, rnd(seed, 6) + 0.3);
  const roof = pick(ART.roofs, rnd(seed, 7));
  const half = (x0: number, x1: number, wall: string, doorX: number, s: number): BoxPart[] => [
    vb(x0, 1, -4, x1, 9, 3.5, wall),
    vb(doorX - 0.9, 1, 3.5, doorX + 0.9, 4.2, 3.85, ART.door),
    vb(doorX - 1.4, 4.4, 3.5, doorX + 1.4, 4.8, 4.8, shade(roof, -0.1)),
    vb(doorX - 1.4, 0, 3.5, doorX + 1.4, 0.8, 5, ART.concrete),
    ...windowZ(doorX < 0 ? x0 + 0.8 : x1 - 2.2, doorX < 0 ? x0 + 2.2 : x1 - 0.8, 2, 3.8, 3.5, ART.glass),
    ...windowZ(x0 + 0.8, x1 - 0.8, 6, 7.8, 3.5, ART.glass),
    ...shrub(doorX < 0 ? x0 : x1 - 1.6, 4, 1.6, 1.2, s),
  ];
  return [
    vb(-5.5, 0, -4, 5.5, 1, 3.5, ART.concrete),
    ...half(-5.5, 0, a, -1.6, seed),
    ...half(0, 5.5, b, 1.6, seed + 3),
    vb(-0.25, 1, 3.5, 0.25, 9, 3.75, ART.trim),
    ...gableRoof(-5.5, 5.5, -4, 3.5, 10, roof, ART.trim),
    ...windowX(-2.5, 0.5, 6, 7.8, 5.5, ART.glass),
    vb(-0.8, 10, -1.5, 0.8, 15, 0, ART.brick),
  ];
}

/** Townhouse row: three narrow two-storey homes with their own front gables and stoops. */
export function townhouses(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-5.7, 0, -4, 5.7, 1, 3, ART.concrete)];
  const roof = pick(ART.roofs, rnd(seed, 8));
  const xs: [number, number][] = [
    [-5.7, -1.9],
    [-1.9, 1.9],
    [1.9, 5.7],
  ];
  xs.forEach(([x0, x1], i) => {
    const wall = ART.walls[(Math.floor(rnd(seed, 9) * 7) + i * 2) % ART.walls.length];
    const mid = (x0 + x1) / 2;
    parts.push(
      vb(x0, 1, -4, x1, 9, 3, wall),
      ...swapXZ(gableRoof(-4, 3, x0, x1, 10, i === 1 ? shade(roof, 0.12) : roof, wall, 0.5)),
      vb(mid - 0.8, 1, 3, mid + 0.8, 4, 3.35, ART.door),
      vb(mid - 1.2, 0, 3, mid + 1.2, 1, 4.6, ART.concrete),
      vb(mid - 1.2, 0, 4.6, mid + 1.2, 0.5, 5.4, ART.concrete),
      ...windowZ(mid - 1.2, mid + 1.2, 6, 7.8, 3, ART.glass),
    );
  });
  return [...parts, ...windowX(-2.5, 0.5, 2, 3.8, 5.7, ART.glass), ...windowX(-2.5, 0.5, 6, 7.8, 5.7, ART.glass)];
}

/** Modern infill: skinny three-storey flat-roof home with dark cladding and a wood accent. */
export function infill(seed: number): BoxPart[] {
  const clad = rnd(seed, 10) < 0.5 ? ART.dark : '#e9e6df';
  const accent = ART.wood;
  return [
    vb(-3.2, 0, -5, 3.2, 1, 4, ART.concrete),
    vb(-3.2, 1, -5, 3.2, 12.5, 4, clad),
    vb(0.8, 1, 4, 3.2, 12.5, 4.3, accent),
    vb(-3.6, 12.5, -5.4, 3.6, 13.2, 4.4, shade(clad, clad === ART.dark ? 0.15 : -0.12)),
    vb(-3.2, 13.2, 3.9, 3.2, 14.2, 4.1, '#9fc3d6', 'solid'), // rooftop glass rail
    vb(-2.6, 1, 4, -0.6, 4.4, 4.35, ART.door),
    ...windowZ(-2.6, 0.2, 5.4, 8.2, 4, ART.glassDark, clad === ART.dark ? '#555c70' : ART.trim),
    ...windowZ(-2.6, 0.2, 9.2, 11.8, 4, ART.glassDark, clad === ART.dark ? '#555c70' : ART.trim),
    ...windowX(-4, 2, 3, 4.5, 3.2, ART.glassDark),
    ...windowX(-4, 2, 7, 11, 3.2, ART.glassDark),
    vb(-3.2, 0, 4.3, 3.2, 0.15, 6, shade(ART.concrete, 0.12)),
  ];
}

// --- Downtown (two by two tiles) -----------------------------------------------------

/** Glass office tower on a podium with setbacks and vertical mullions. */
export function officeTower(seed: number): BoxPart[] {
  const glass = rnd(seed, 11) < 0.5 ? '#79b1d6' : '#8fc0c9';
  const parts: BoxPart[] = [
    vb(-11, 0, -11, 11, 5, 11, ART.concrete),
    vb(-11, 1, 11, 11, 4, 11.4, '#a9d3ea'),
    vb(-8, 5, -8, 8, 40, 8, glass),
    vb(-6, 40, -6, 6, 46, 6, shade(glass, 0.08)),
    vb(-3, 46, -3, 3, 48, 3, '#9aa1ab'),
    vb(-0.3, 48, -0.3, 0.3, 54, 0.3, '#9aa1ab'),
  ];
  for (let x = -7; x <= 7; x += 2) parts.push(vb(x - 0.2, 5, 8, x + 0.2, 40, 8.3, shade(glass, 0.35)));
  for (let z = -7; z <= 7; z += 2) parts.push(vb(8, 5, z - 0.2, 8.3, 40, z + 0.2, shade(glass, 0.35)));
  for (let y = 9; y < 40; y += 4) parts.push(vb(-8, y, 8, 8, y + 0.3, 8.2, shade(glass, -0.15)), vb(8, y, -8, 8.2, y + 0.3, 8, shade(glass, -0.15)));
  // window bands between the floor lines (they light up at night)
  for (let y = 6; y < 39; y += 4) parts.push(vb(-7.6, y + 0.8, 8, 7.6, y + 2.6, 8.12, ART.glassDark), vb(8, y + 0.8, -7.6, 8.12, y + 2.6, 7.6, ART.glassDark));
  return parts;
}

/** Residential tower with balconies on every floor. */
export function condoTower(seed: number): BoxPart[] {
  const wall = rnd(seed, 12) < 0.5 ? '#efe7d6' : '#dfe8e4';
  const parts: BoxPart[] = [vb(-9, 0, -9, 9, 4, 9, ART.concrete), vb(-9, 1, 9, 9, 3.5, 9.4, '#a9d3ea'), vb(-7, 4, -7, 7, 34, 7, wall)];
  for (let y = 6; y < 34; y += 3) {
    parts.push(
      vb(-6, y, 7, 6, y + 1.8, 7.3, ART.glass),
      vb(-6.4, y - 0.4, 7, 6.4, y, 9, ART.trim),
      vb(-6.4, y, 8.7, 6.4, y + 1, 9, '#bcd8e6'),
      vb(7, y, -5, 7.3, y + 1.8, 5, ART.glass),
    );
  }
  parts.push(vb(-7.5, 34, -7.5, 7.5, 35, 7.5, shade(wall, -0.15)), vb(-4, 35, -4, 4, 37, 4, '#9aa1ab'));
  return parts;
}

/** Historic brick mid-rise (Stephen Avenue style) with storefronts and striped awnings. */
export function brickMidrise(seed: number): BoxPart[] {
  const brick = rnd(seed, 13) < 0.5 ? ART.brick : '#b8785a';
  const parts: BoxPart[] = [vb(-11, 0, -9, 11, 14, 9, brick), vb(-11.6, 14, -9.6, 11.6, 15, 9.6, '#efe2c2'), vb(-11, 4.5, 9, 11, 5, 9.4, '#efe2c2')];
  for (let x = -9; x <= 7; x += 4) {
    for (let y = 6; y <= 11; y += 3.5) parts.push(...windowZ(x, x + 2, y, y + 2.2, 9, ART.glass, '#efe2c2'));
    parts.push(vb(x - 0.5, 1, 9, x + 2.5, 4, 9.35, '#a9d3ea'));
    const awning = ['#e07f5b', '#6f9a64', '#5b8fd6', '#d9605a', '#f2c14e'][((x + 9) / 4) % 5];
    for (let k = 0; k < 4; k++) parts.push(vb(x - 0.6 + k * 0.8, 4, 9.3, x + 0.2 + k * 0.8, 4.4, 10.8, k % 2 ? ART.trim : awning));
  }
  for (let z = -7; z <= 5; z += 4) parts.push(...windowX(z, z + 2, 6, 8.2, 11, ART.glass, '#efe2c2'), ...windowX(z, z + 2, 9.5, 11.7, 11, ART.glass, '#efe2c2'));
  // flat roof: parapet edge, rooftop units, a water tank
  parts.push(vb(-10.6, 15, -9.2, 10.6, 15.6, 9.2, shade(brick, -0.1)), vb(-10, 15, -8.6, 10, 15.3, 8.6, '#b9b3a8'));
  parts.push(vb(-7, 15.3, -5, -3, 17, -2, '#9aa1ab'), vb(1, 15.3, -6, 4, 16.6, -3, '#a9b0b9'), vb(5, 15.3, 2, 8, 19, 5, '#8a6a4f'), vb(4.7, 19, 1.7, 8.3, 19.6, 5.3, '#6f5540'));
  return parts;
}

// --- Community building (two by two tiles) -------------------------------------------

/** Community hall: gabled main hall, lower annex, entrance canopy, sign board, flag. */
export function communityHall(seed: number): BoxPart[] {
  const wall = pick(['#efe2c2', '#d3e3ec', '#f3d8c2'], rnd(seed, 14));
  const roof = pick(['#6f9a64', '#e07f5b', '#7f8a99'], rnd(seed, 15));
  const parts: BoxPart[] = [
    vb(-10, 0, -7, 6, 1, 6, ART.concrete),
    vb(-10, 1, -7, 6, 9, 6, wall),
    ...gableRoof(-10, 6, -7, 6, 10, roof, wall, 1),
    vb(6, 0, -5, 11, 6, 4, shade(wall, -0.05)),
    ...hipRoof(6, 11, -5, 4, 7, '#9c97e6', 0.6, 2),
    // entrance
    vb(-4.5, 1, 6, -0.5, 5.5, 6.4, '#b98a5f'),
    vb(-3.5, 1, 6.3, -1.5, 4.5, 6.6, ART.glass),
    vb(-6, 5.5, 6, 1, 6.2, 9, shade(roof, -0.1)),
    vb(-5.6, 1, 8.2, -5, 5.5, 8.8, ART.trim),
    vb(0, 1, 8.2, 0.6, 5.5, 8.8, ART.trim),
    vb(-6, 0, 6, 1, 0.6, 10, ART.concrete),
    // sign board above the canopy
    vb(-6, 6.8, 6.1, 1, 8.6, 6.5, ART.trim),
    vb(-5.5, 7.1, 6.4, 0.5, 8.3, 6.6, '#3b4260'),
    ...windowZ(-9, -7, 2.5, 6, 6, ART.glass),
    ...windowZ(2, 4.5, 2.5, 6, 6, ART.glass),
    ...windowX(-6, -3, 2.5, 5.5, 11, ART.glass),
    ...windowX(-1, 2, 2.5, 5.5, 11, ART.glass),
    // flag
    vb(8.5, 0, 6, 8.9, 14, 6.4, '#9aa1ab'),
    vb(8.9, 11.5, 6.1, 12, 13.5, 6.3, '#d9605a'),
    vb(9.9, 12, 6.25, 11, 13, 6.4, ART.trim),
  ];
  return [...parts, ...shrub(-10, 6.5, 3, 1.5, seed), ...shrub(2, 6.5, 3, 1.5, seed + 1)];
}

// --- Props (one tile) ------------------------------------------------------------------

/** Leafy tree with a bumpy voxel canopy. */
export function leafyTree(seed: number, leafColour?: string, trunkColour: string = ART.trunk): BoxPart[] {
  const leaf = leafColour ?? pick(ART.leaf, rnd(seed, 16));
  const parts: BoxPart[] = [vb(-0.6, 0, -0.6, 0.6, 4.5, 0.6, trunkColour), vb(-3.5, 4, -3.5, 3.5, 8.5, 3.5, leaf), vb(-2.5, 8.5, -2.5, 2.5, 10, 2.5, shade(leaf, 0.08))];
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(rnd(seed, i, 1) * 6) - 3;
    const z = Math.floor(rnd(seed, i, 2) * 6) - 3;
    const y = 4.5 + Math.floor(rnd(seed, i, 3) * 4);
    parts.push(vb(x, y, z, x + 1.5, y + 1.5, z + 1.5, shade(leaf, (rnd(seed, i, 4) - 0.5) * 0.25)));
  }
  return parts;
}

/** Spruce (very Calgary): stacked tiers narrowing to the top. */
export function spruce(seed: number, colour?: string): BoxPart[] {
  const c = colour ?? pick(ART.spruce, rnd(seed, 17));
  return [
    vb(-0.5, 0, -0.5, 0.5, 2.5, 0.5, ART.trunk),
    vb(-3.5, 2, -3.5, 3.5, 4.5, 3.5, c),
    vb(-2.7, 4.5, -2.7, 2.7, 7, 2.7, shade(c, 0.06)),
    vb(-1.9, 7, -1.9, 1.9, 9.5, 1.9, c),
    vb(-1.1, 9.5, -1.1, 1.1, 11.5, 1.1, shade(c, 0.06)),
    vb(-0.4, 11.5, -0.4, 0.4, 12.5, 0.4, c),
  ];
}

export function lampPost(): BoxPart[] {
  return [vb(-0.6, 0, -0.6, 0.6, 0.6, 0.6, '#4a5060'), vb(-0.3, 0.6, -0.3, 0.3, 9, 0.3, '#4a5060'), vb(-0.9, 9, -0.9, 0.9, 10.4, 0.9, '#ffe7a3', 'glow'), vb(-1.1, 10.4, -1.1, 1.1, 10.8, 1.1, '#4a5060')];
}

export function bench(): BoxPart[] {
  return [
    vb(-3, 1.6, -0.8, 3, 2, 0.8, ART.wood),
    vb(-3, 2, -0.9, 3, 3.6, -0.5, ART.wood),
    vb(-2.8, 0, -0.6, -2.3, 1.6, 0.6, '#4a5060'),
    vb(2.3, 0, -0.6, 2.8, 1.6, 0.6, '#4a5060'),
  ];
}

/** A small car (sedan or pickup), parked along x. */
export function car(seed: number, pickup = false): BoxPart[] {
  const body = pick(['#e46a5c', '#5b8fd6', '#f2f2f2', '#3b4260', '#f2c14e', '#6fbf8a'], rnd(seed, 18));
  const parts: BoxPart[] = [vb(-4, 0.8, -1.8, 4, 2.6, 1.8, body)];
  if (pickup) {
    parts.push(vb(-1.5, 2.6, -1.7, 1.2, 4.2, 1.7, body), vb(-1.3, 2.8, 1.65, 1, 3.9, 1.8, ART.glassDark), vb(1.2, 2.6, -1.8, 4, 3.2, 1.8, shade(body, -0.15)));
  } else {
    parts.push(vb(-2.2, 2.6, -1.6, 2, 4, 1.6, shade(body, 0.1)), vb(-2, 2.8, 1.55, 1.8, 3.8, 1.7, ART.glassDark), vb(1.9, 2.8, -1.4, 2.1, 3.8, 1.4, ART.glassDark));
  }
  for (const [x, z] of [[-2.5, 1.8], [2.5, 1.8], [-2.5, -1.8], [2.5, -1.8]]) parts.push(vb(x - 0.8, 0, z - 0.3, x + 0.8, 1.4, z + 0.3, '#2a2d36'));
  parts.push(vb(3.95, 1.6, -1.4, 4.1, 2.1, -0.7, '#ffe7a3', 'glow'), vb(3.95, 1.6, 0.7, 4.1, 2.1, 1.4, '#ffe7a3', 'glow'));
  return parts;
}

export function mailbox(): BoxPart[] {
  return [vb(-0.25, 0, -0.25, 0.25, 3, 0.25, ART.wood), vb(-0.9, 3, -0.6, 0.9, 4.2, 0.6, '#5b8fd6'), vb(0.9, 3.6, -0.1, 1.1, 4.6, 0.1, '#d9605a')];
}

/** Picket fence piece along x. */
export function fence(): BoxPart[] {
  const parts: BoxPart[] = [vb(-6, 1.2, -0.2, 6, 1.6, 0.2, ART.trim), vb(-6, 2.6, -0.2, 6, 3, 0.2, ART.trim)];
  for (let x = -5.5; x < 6; x += 1.5) parts.push(vb(x - 0.3, 0, -0.25, x + 0.3, 3.6, 0.25, ART.trim));
  return parts;
}

// --- People -----------------------------------------------------------------------------

/** A voxel person (avatar / villager style), about 3/4 of a tile tall, facing +z. */
export function person(seed: number, shirt?: string): BoxPart[] {
  const skin = pick(ART.skin, rnd(seed, 19));
  const hair = pick(ART.hair, rnd(seed, 20));
  const top = shirt ?? pick(ART.shirts, rnd(seed, 21));
  const pants = pick(['#3b4260', '#5a4636', '#6b7280', '#2f3448'], rnd(seed, 22));
  const longHair = rnd(seed, 23) < 0.4;
  return [
    vb(-1.4, 0, -0.6, -0.2, 0.6, 1.2, '#2a2d36'),
    vb(0.2, 0, -0.6, 1.4, 0.6, 1.2, '#2a2d36'),
    vb(-1.4, 0.6, -0.6, -0.2, 3.4, 0.6, pants),
    vb(0.2, 0.6, -0.6, 1.4, 3.4, 0.6, pants),
    vb(-1.6, 3.4, -0.8, 1.6, 6.6, 0.8, top),
    vb(-2.4, 3.8, -0.6, -1.6, 6.4, 0.6, top),
    vb(1.6, 3.8, -0.6, 2.4, 6.4, 0.6, top),
    vb(-2.4, 3.2, -0.5, -1.6, 3.8, 0.5, skin),
    vb(1.6, 3.2, -0.5, 2.4, 3.8, 0.5, skin),
    vb(-1.4, 6.6, -1.2, 1.4, 9.2, 1.2, skin),
    vb(-0.8, 7.6, 1.15, -0.3, 8.1, 1.3, '#2a2d36'),
    vb(0.3, 7.6, 1.15, 0.8, 8.1, 1.3, '#2a2d36'),
    vb(-1.6, 9.2, -1.4, 1.6, 10, 1.4, hair),
    vb(-1.6, longHair ? 6.6 : 7.8, -1.4, 1.6, 9.2, -0.8, hair),
    ...(longHair ? [vb(-1.6, 6.8, -1, -1.3, 9.2, 0.6, hair), vb(1.3, 6.8, -1, 1.6, 9.2, 0.6, hair)] : []),
  ];
}

export { vmove };

// --- Sky (Art Pass samples, 2026-11-24) -----------------------------------------------------

/**
 * A puffy voxel cloud like the reference (docs/references/reference-cloud.jpeg): a few overlapping
 * rounded lobes filled with small voxels; only voxels on the surface are drawn. White on top,
 * a soft grey underside. Centred on the origin, about 2–3 tiles wide.
 */
export function cloud(seed: number): BoxPart[] {
  const lobes: [number, number, number, number, number][] = []; // cx, cy, cz, rx, ry (rz = ry * 1.1)
  const n = 2 + Math.floor(rnd(seed, 1) * 3);
  const width = 22 + Math.floor(rnd(seed, 2) * 12);
  for (let i = 0; i < n; i++) {
    const cx = -width / 2 + 6 + (i * (width - 12)) / Math.max(1, n - 1);
    const big = i === Math.floor(n / 2);
    const ry = big ? 5 + rnd(seed, i, 3) * 2 : 3 + rnd(seed, i, 4) * 2;
    lobes.push([cx, ry * 0.8, (rnd(seed, i, 5) - 0.5) * 3, ry * 1.5, ry]);
  }
  const inside = (x: number, y: number, z: number) =>
    y >= 0 && lobes.some(([cx, cy, cz, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / (ry * 1.1)) ** 2 <= 1);
  const parts: BoxPart[] = [];
  const X = Math.ceil(width / 2) + 4;
  for (let x = -X; x <= X; x++) {
    for (let y = 0; y <= 12; y++) {
      for (let z = -9; z <= 9; z++) {
        const c = [x + 0.5, y + 0.5, z + 0.5] as const;
        if (!inside(...c)) continue;
        const surface = !inside(c[0] + 1, c[1], c[2]) || !inside(c[0] - 1, c[1], c[2]) || !inside(c[0], c[1] + 1, c[2]) || !inside(c[0], c[1] - 1, c[2]) || !inside(c[0], c[1], c[2] + 1) || !inside(c[0], c[1], c[2] - 1);
        if (!surface) continue;
        parts.push(vb(x, y, z, x + 1, y + 1, z + 1, y <= 1 ? '#dfe5ee' : y <= 2 ? '#eef2f7' : '#ffffff'));
      }
    }
  }
  return parts;
}

/** Bird body (wings are separate so they can flap), facing +x. */
export function birdBody(): BoxPart[] {
  return [vb(-1, 0, -0.5, 1, 1, 0.5, '#3b4260'), vb(1, 0.3, -0.4, 1.8, 1.1, 0.4, '#3b4260'), vb(1.8, 0.5, -0.15, 2.3, 0.8, 0.15, '#f2a43a')];
}
/** One wing, attached at z = 0 and reaching towards +z (mirror for the other side). */
export function birdWing(): BoxPart[] {
  return [vb(-0.6, 0.6, 0, 0.8, 0.9, 2.4, '#4a5270')];
}

/**
 * Hot-air balloon like the reference (docs/references/reference-ballon.png): a round voxel envelope
 * in a patchwork of colours (only the shell voxels are drawn), narrowing into a neck over a wicker
 * basket, with a cloth banner hanging below (about 3 tiles tall).
 */
export function hotAirBalloon(seed: number): BoxPart[] {
  // Bright, saturated patchwork like the reference (red, yellow, teal, cream; blue in one set).
  // Weighted like the reference: mostly red, yellow and teal, a little cream.
  const palettes = [
    ['#ff4545', '#ff4545', '#ffcc2e', '#ffcc2e', '#16bfb0', '#16bfb0', '#fff3dc'],
    ['#ff4545', '#ff4545', '#ffcc2e', '#ffcc2e', '#3d8bfd', '#3d8bfd', '#fff3dc'],
    ['#ff4545', '#ff7a2e', '#ffcc2e', '#ffcc2e', '#16bfb0', '#16bfb0', '#fff3dc'],
  ];
  const pal = pick(palettes, rnd(seed, 30));
  const parts: BoxPart[] = [
    vb(-1.5, 0, -1.5, 1.5, 2, 1.5, '#b08a5c'),
    vb(-1.7, 2, -1.7, 1.7, 2.4, 1.7, '#7d5a3f'),
    vb(-1.2, 1, 1.5, 1.2, 1.4, 1.6, '#8f6c48'),
  ];
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) parts.push(vb(x - 0.1, 2.4, z - 0.1, x + 0.1, 7, z + 0.1, '#5a4636'));
  // banner hanging from the basket
  parts.push(vb(-0.1, -6, 1.6, 0.1, 0, 1.8, '#9aa1ab'), vb(-1.1, -5.5, 1.7, 1.1, -0.5, 1.9, '#f4ead5'), vb(-1.1, -5.9, 1.7, 1.1, -5.5, 1.9, '#d9534f'));
  // envelope: an elongated voxel sphere (radius 6, 1.3x taller), centre at y = 15
  const R = 6;
  const cy = 15;
  for (let y = -8; y <= 8; y++) {
    const ny = y / (R * 1.3);
    const ring = R * Math.sqrt(Math.max(0, 1 - ny * ny)) * (y < 0 ? 0.85 + 0.15 * (1 + ny) : 1);
    if (ring < 0.8) continue;
    for (let x = -R; x < R; x++) {
      for (let z = -R; z < R; z++) {
        const d = Math.hypot(x + 0.5, z + 0.5);
        if (d > ring || d < ring - 1.6) continue; // shell only
        // chunky patches: 8 gores around, bands of 3 voxels, a random colour per patch
        const sector = Math.floor(((Math.atan2(z + 0.5, x + 0.5) + Math.PI) / (2 * Math.PI)) * 8);
        const band = Math.floor((y + 8) / 3);
        const c = pal[Math.floor(rnd(seed, sector * 7 + band, 9) * pal.length)];
        parts.push(vb(x, cy + y, z, x + 1, cy + y + 1, z + 1, c));
      }
    }
  }
  // neck down to the basket ropes
  parts.push(vb(-1.5, 7, -1.5, 1.5, 7.6, 1.5, '#5a4636'));
  return parts;
}

/** A small passenger jet (generic livery, no airline branding), nose towards +x. */
export function airplane(): BoxPart[] {
  return [
    vb(-9, 0, -1.2, 9, 2.4, 1.2, '#f4f6f8'),
    vb(9, 0.3, -0.9, 11, 2.1, 0.9, '#e9edf1'),
    vb(11, 0.7, -0.5, 12, 1.7, 0.5, '#dfe5ea'),
    vb(-9, 0.8, -1.25, 9, 1.2, 1.25, '#d9605a'),
    ...Array.from({ length: 8 }, (_, i) => vb(-7 + i * 2, 1.4, 1.2, -6.2 + i * 2, 2, 1.3, '#4c80a8')),
    vb(8.5, 1.4, -0.8, 10, 2.1, 0.8, '#3b4260'),
    vb(-2, 0.4, -9, 2, 1, 9, '#e9edf1'),
    vb(-1, -0.6, -5, 1.6, 0.4, -3.6, '#cfd6dd'),
    vb(-1, -0.6, 3.6, 1.6, 0.4, 5, '#cfd6dd'),
    vb(-9, 2.4, -0.3, -6.5, 7, 0.3, '#e9edf1'),
    vb(-8.8, 5, -0.35, -7, 6.6, 0.35, '#d9605a'),
    vb(-9, 1.6, -3.5, -7, 2, 3.5, '#e9edf1'),
  ];
}

/** A bunch of party balloons on strings (e.g. tied to a house on a happy day). */
export function partyBalloons(seed: number): BoxPart[] {
  const colours = ['#e46a5c', '#f2c14e', '#5b8fd6', '#f08bb3', '#6fbf8a'];
  const parts: BoxPart[] = [];
  for (let i = 0; i < 4; i++) {
    const x = -1.5 + i * 1.1;
    const top = 8 + Math.floor(rnd(seed, i, 5) * 3);
    parts.push(vb(x - 0.05, 0, -0.05, x + 0.05, top, 0.05, '#9aa1ab'));
    parts.push(vb(x - 0.8, top, -0.8, x + 0.8, top + 2, 0.8, colours[(i + Math.floor(rnd(seed, 6) * 5)) % 5]));
    parts.push(vb(x - 0.5, top + 2, -0.5, x + 0.5, top + 2.4, 0.5, colours[(i + Math.floor(rnd(seed, 6) * 5)) % 5]));
  }
  return parts;
}

// --- Flowers ---------------------------------------------------------------------------

/** A flower bed with a wooden edge and mixed tulips / daisies. */
export function flowerBed(seed: number): BoxPart[] {
  const colours = ['#e46a5c', '#f2c14e', '#f08bb3', '#a77bd1', '#ffffff', '#f39a52'];
  const parts: BoxPart[] = [vb(-4.5, 0, -2.5, 4.5, 0.8, 2.5, ART.wood), vb(-4, 0, -2, 4, 0.9, 2, '#7a5a3c')];
  for (let x = -3.5; x <= 3.5; x += 1.4) {
    for (let z = -1.4; z <= 1.4; z += 1.4) {
      const c = colours[Math.floor(rnd(seed, x * 10, z * 10) * colours.length)];
      const h = 1.8 + rnd(seed, x, z) * 1.2;
      parts.push(vb(x - 0.12, 0.9, z - 0.12, x + 0.12, 0.9 + h, z + 0.12, '#5f9a4a'), vb(x - 0.45, 0.9 + h, z - 0.45, x + 0.45, 1.6 + h, z + 0.45, c));
    }
  }
  return parts;
}

/** Wild flowers scattered on grass (no bed). */
export function wildFlowers(seed: number): BoxPart[] {
  const colours = ['#f2c14e', '#ffffff', '#a77bd1', '#f08bb3', '#5b8fd6'];
  const parts: BoxPart[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -5 + rnd(seed, i, 1) * 10;
    const z = -5 + rnd(seed, i, 2) * 10;
    parts.push(vb(x - 0.1, 0, z - 0.1, x + 0.1, 1.2, z + 0.1, '#5f9a4a'), vb(x - 0.4, 1.2, z - 0.4, x + 0.4, 1.7, z + 0.4, colours[i % colours.length]));
  }
  return parts;
}

// --- Wildlife (occasional visitors in Calgary communities) ------------------------------------

/** Mule deer, facing +x; `buck` adds antlers. */
export function deer(buck: boolean): BoxPart[] {
  const coat = '#a77b55';
  const parts: BoxPart[] = [
    vb(-2.5, 3, -1, 2, 5.2, 1, coat),
    ...[[-2, -0.8], [-2, 0.4], [1.4, -0.8], [1.4, 0.4]].map(([x, z]) => vb(x, 0, z, x + 0.5, 3, z + 0.5, shade(coat, -0.15))),
    vb(1.6, 4.6, -0.6, 2.8, 7, 0.6, coat),
    vb(2.4, 6.4, -0.7, 4.2, 7.8, 0.7, coat),
    vb(4.2, 6.6, -0.4, 4.8, 7.4, 0.4, '#3a2a20'),
    vb(2.6, 7.8, -1.3, 3.2, 8.6, -0.5, coat),
    vb(2.6, 7.8, 0.5, 3.2, 8.6, 1.3, coat),
    vb(-3, 4.4, -0.4, -2.5, 5.6, 0.4, '#f4efe6'),
    vb(-3.1, 5, -0.3, -2.9, 5.8, 0.3, '#2f2a26'),
  ];
  if (buck) {
    for (const z of [-0.6, 0.6]) parts.push(vb(2.8, 7.8, z - 0.12, 3, 10, z + 0.12, '#d8c4a0'), vb(2.2, 9, z - 0.12, 3.8, 9.2, z + 0.12, '#d8c4a0'), vb(3.6, 9.2, z - 0.12, 3.8, 10.2, z + 0.12, '#d8c4a0'));
  }
  return parts;
}

/** White-tailed jackrabbit (common in Calgary), facing +x. Winter coat when `winter`. */
export function jackrabbit(winter: boolean): BoxPart[] {
  const fur = winter ? '#f2f2ee' : '#b39478';
  return [
    vb(-1.2, 0.4, -0.6, 0.8, 1.8, 0.6, fur),
    vb(-1.2, 0, -0.7, -0.2, 0.6, 0.7, shade(fur, -0.1)),
    vb(0.4, 0, -0.4, 0.8, 0.6, 0.4, shade(fur, -0.1)),
    vb(0.6, 1.4, -0.45, 1.6, 2.4, 0.45, fur),
    vb(0.8, 2.4, -0.35, 1.1, 4.2, -0.1, fur),
    vb(0.8, 2.4, 0.1, 1.1, 4.2, 0.35, fur),
    vb(1.5, 1.9, -0.15, 1.65, 2.1, 0.15, '#2f2a26'),
    vb(-1.6, 1, -0.3, -1.2, 1.6, 0.3, '#ffffff'),
  ];
}

/** Cougar, facing +x, long low body and a long tail. */
export function cougar(): BoxPart[] {
  const coat = '#c9a26f';
  return [
    vb(-3, 2, -0.9, 2.2, 3.8, 0.9, coat),
    ...[[-2.6, -0.8], [-2.6, 0.3], [1.5, -0.8], [1.5, 0.3]].map(([x, z]) => vb(x, 0, z, x + 0.6, 2.2, z + 0.5, shade(coat, -0.12))),
    vb(2, 2.8, -0.75, 3.6, 4.4, 0.75, coat),
    vb(3.6, 3, -0.45, 4.2, 3.8, 0.45, '#e9d8bd'),
    vb(4.1, 3.4, -0.15, 4.3, 3.6, 0.15, '#3a2a20'),
    vb(2.4, 4.4, -0.7, 2.8, 4.9, -0.3, coat),
    vb(2.4, 4.4, 0.3, 2.8, 4.9, 0.7, coat),
    vb(-6, 1.8, -0.25, -3, 2.4, 0.25, coat),
    vb(-6.6, 1.8, -0.3, -6, 2.6, 0.3, '#5a4636'),
  ];
}

/** Canada goose standing / walking on the grass, facing +x. */
export function gooseStanding(): BoxPart[] {
  return [
    vb(-1.6, 1.4, -0.9, 1.2, 3, 0.9, '#9a8470'),
    vb(-1.4, 2.6, -0.95, 0.8, 3.1, 0.95, '#7d6a58'), // folded wings
    vb(-2.2, 2, -0.6, -1.6, 2.8, 0.6, '#2b2b2b'), // tail
    vb(-1.9, 1.4, -0.5, -1.4, 2, 0.5, '#f4f1ea'), // white undertail
    vb(0.6, 1.6, -0.7, 1.4, 2.6, 0.7, '#e6dccf'), // pale breast
    vb(0.9, 3, -0.35, 1.5, 5.4, 0.35, '#1f1f1f'), // long black neck
    vb(1.2, 5, -0.45, 2.4, 5.9, 0.45, '#1f1f1f'), // head
    vb(1.3, 5, -0.5, 1.9, 5.7, 0.5, '#ffffff'), // white chinstrap
    vb(2.4, 5.2, -0.15, 2.9, 5.5, 0.15, '#2b2b2b'), // bill
    vb(-0.4, 0, -0.5, -0.1, 1.4, -0.2, '#2b2b2b'),
    vb(-0.4, 0, 0.2, -0.1, 1.4, 0.5, '#2b2b2b'),
  ];
}

/** Canada goose in flight (body and neck), facing +x; wings are separate so they can flap. */
export function gooseFlyingBody(): BoxPart[] {
  return [
    vb(-1.8, 0, -0.7, 1, 1.2, 0.7, '#9a8470'),
    vb(-2.4, 0.2, -0.5, -1.8, 0.9, 0.5, '#2b2b2b'),
    vb(1, 0.3, -0.3, 2.8, 0.9, 0.3, '#1f1f1f'),
    vb(2.8, 0.2, -0.4, 3.8, 1, 0.4, '#1f1f1f'),
    vb(2.9, 0.2, -0.45, 3.4, 0.8, 0.45, '#ffffff'),
    vb(3.8, 0.4, -0.12, 4.2, 0.7, 0.12, '#2b2b2b'),
  ];
}
/** One goose wing, attached at z = 0 and reaching towards +z. */
export function gooseWing(): BoxPart[] {
  return [vb(-1.2, 0.8, 0, 0.6, 1.1, 3.2, '#7d6a58'), vb(-1.2, 0.8, 3.2, 0.2, 1.1, 4.2, '#4a3f35')];
}

// --- More downtown (2026-11-24) -----------------------------------------------------------

/** Window bands on the +z and +x faces every `step` voxels (lit at night in the gallery). */
function floorWindows(half: number, y0: number, y1: number, step: number, inset = 1): BoxPart[] {
  const out: BoxPart[] = [];
  for (let y = y0; y + 1.6 <= y1; y += step) {
    out.push(vb(-half + inset, y, half, half - inset, y + 1.6, half + 0.25, ART.glass));
    out.push(vb(half, y, -half + inset, half + 0.25, y + 1.6, half - inset, ART.glass));
  }
  return out;
}

/** Observation tower inspired by Calgary's skyline (no names or logos): slim shaft, glass pod, beacon. */
export function observationTower(): BoxPart[] {
  const shaft = '#efe6d6';
  const parts: BoxPart[] = [vb(-9, 0, -9, 9, 1, 9, ART.concrete), vb(-6, 1, -6, 6, 6, 6, '#f2dcc4'), ...floorWindows(6, 2, 6, 3)];
  for (let i = 0; i < 6; i++) {
    const w = 3.2 - i * 0.25;
    parts.push(vb(-w, 6 + i * 8, -w, w, 14 + i * 8, w, i % 2 ? shaft : shade(shaft, -0.05)));
  }
  parts.push(
    vb(-5.5, 54, -5.5, 5.5, 55, 5.5, shade(shaft, -0.1)),
    vb(-5, 55, -5, 5, 58, 5, '#8fc0d8'),
    vb(-5.5, 58, -5.5, 5.5, 59, 5.5, shade(shaft, -0.1)),
    vb(-4, 59, -4, 4, 61, 4, '#e8705a'),
    vb(-1, 61, -1, 1, 64, 1, '#e8705a'),
    vb(-0.3, 64, -0.3, 0.3, 69, 0.3, '#9aa1ab'),
    vb(-0.6, 69, -0.6, 0.6, 70, 0.6, '#ffe7a3', 'glow'),
  );
  return parts;
}

/** Modern crescent-shaped glass tower (curved front), with floor lines. */
export function crescentTower(): BoxPart[] {
  const glass = '#9fcadc';
  const parts: BoxPart[] = [vb(-11, 0, -11, 11, 4, 11, ART.concrete), vb(-11, 1, 11, 11, 3.5, 11.3, ART.glass)];
  for (let x = -10; x < 10; x++) {
    const t = (x + 0.5) / 10;
    const back = -8 + t * t * 6; // curved: the middle sits further back
    const front = back + 7;
    const h = 46 - Math.abs(t) * 6;
    parts.push(vb(x, 4, back, x + 1, h, front, x % 2 ? glass : shade(glass, 0.06)));
    for (let y = 7; y < h; y += 3) parts.push(vb(x, y, front, x + 1, y + 1.6, front + 0.25, ART.glass));
  }
  parts.push(vb(-4, 46, -4, 4, 48, 1, '#a9b0b9'));
  return parts;
}

/** Stepped art-deco tower: warm stone, vertical piers, setbacks, a gold crown. */
export function artDecoTower(): BoxPart[] {
  const stone = '#ead7b8';
  const parts: BoxPart[] = [vb(-10, 0, -10, 10, 18, 10, stone), ...floorWindows(10, 3, 18, 3, 1.5)];
  parts.push(vb(-7.5, 18, -7.5, 7.5, 32, 7.5, shade(stone, 0.04)), ...floorWindows(7.5, 20, 32, 3, 1.5));
  parts.push(vb(-5, 32, -5, 5, 40, 5, stone), ...floorWindows(5, 33, 40, 3, 1));
  for (const x of [-9, -5, -1, 3, 7]) parts.push(vb(x, 1, 10, x + 1, 18, 10.6, shade(stone, -0.1)));
  for (const z of [-9, -5, -1, 3, 7]) parts.push(vb(10, 1, z, 10.6, 18, z + 1, shade(stone, -0.1)));
  parts.push(vb(-3, 40, -3, 3, 43, 3, '#e3b85a'), vb(-1.5, 43, -1.5, 1.5, 46, 1.5, '#e3b85a'), vb(-0.4, 46, -0.4, 0.4, 50, 0.4, '#e3b85a'));
  return parts;
}

/** Hotel mid-rise: peach stucco, balconies, a blank sign board and a rooftop pool. */
export function hotel(): BoxPart[] {
  const wall = '#f3cdb3';
  const parts: BoxPart[] = [vb(-10, 0, -8, 10, 4, 8, ART.concrete), vb(-10, 1, 8, 10, 3.6, 8.3, ART.glass), vb(-9, 4, -7, 9, 24, 7, wall)];
  for (let y = 6; y < 24; y += 3) {
    for (let x = -8; x <= 6; x += 3.5) parts.push(vb(x, y, 7, x + 2, y + 1.6, 7.25, ART.glass), vb(x - 0.3, y - 0.3, 7, x + 2.3, y, 8.2, ART.trim));
    parts.push(vb(9, y, -6, 9.25, y + 1.6, 6, ART.glass));
  }
  parts.push(
    vb(-9.5, 24, -7.5, 9.5, 25, 7.5, shade(wall, -0.12)),
    vb(-6, 25, -5, 2, 25.4, 3, '#7fd0e6'),
    vb(-6.5, 25, -5.5, 2.5, 25.6, -5, ART.trim),
    vb(3, 25, -4, 8, 27, 2, '#d8cfc2'),
    vb(-6, 20, 7.3, 6, 23, 7.6, ART.trim), // blank sign board
    vb(-5.5, 20.4, 7.5, 5.5, 22.6, 7.7, '#e46a5c'),
  );
  return parts;
}

// --- Downtown homes that fit one house lot (2026-11-24) -------------------------------------

/** Small apartment block (5–7 storeys) with balconies, for downtown house lots. */
export function apartment(seed: number): BoxPart[] {
  const wall = pick(['#f3dcc0', '#eef0d8', '#f6e7c8', '#f4d6cc', '#e9dccb'], rnd(seed, 40));
  const floors = 5 + Math.floor(rnd(seed, 41) * 3);
  const top = 1 + floors * 3;
  const parts: BoxPart[] = [vb(-5, 0, -5, 5, 1, 5, ART.concrete), vb(-5, 1, -5, 5, top, 5, wall)];
  for (let f = 0; f < floors; f++) {
    const y = 2 + f * 3;
    parts.push(vb(-4, y, 5, -0.5, y + 1.6, 5.25, ART.glass), vb(0.5, y, 5, 4, y + 1.6, 5.25, ART.glass));
    parts.push(vb(5, y, -4, 5.25, y + 1.6, -0.5, ART.glass), vb(5, y, 0.5, 5.25, y + 1.6, 4, ART.glass));
    if (f > 0) parts.push(vb(-4.3, y - 0.4, 5, 4.3, y, 6.2, ART.trim), vb(-4.3, y, 5.9, 4.3, y + 0.8, 6.2, '#cfe3ee'));
  }
  parts.push(vb(-1, 1, 5, 1, 1.9, 5.3, ART.door), vb(-5.4, top, -5.4, 5.4, top + 0.7, 5.4, shade(wall, -0.12)), vb(-2, top + 0.7, -3, 2, top + 2.2, 1, '#a9b0b9'));
  return parts;
}

/** Brick loft (3–4 storeys) with big windows and a rooftop garden, for downtown house lots. */
export function loft(seed: number): BoxPart[] {
  const brick = pick(['#c4694f', '#b8785a', '#c98a6a'], rnd(seed, 42));
  const floors = 3 + Math.floor(rnd(seed, 43) * 2);
  const top = 1 + floors * 3.2;
  const parts: BoxPart[] = [vb(-5, 0, -4.5, 5, top, 4.5, brick), vb(-5.4, top, -4.9, 5.4, top + 0.8, 4.9, '#efe2c2')];
  for (let f = 0; f < floors; f++) {
    const y = 1.6 + f * 3.2;
    for (const x of [-3.8, -0.9, 2]) parts.push(...windowZ(x, x + 1.8, y, y + 2, 4.5, f === 0 && x === -0.9 ? ART.door : ART.glass, '#efe2c2'));
    parts.push(...windowX(-3, 0, y, y + 2, 5, ART.glass, '#efe2c2'));
  }
  parts.push(vb(-4, top + 0.8, -3.5, 0, top + 1.6, 0, '#7a5a3c'), vb(-3.6, top + 1.6, -3.1, -0.4, top + 2.4, -0.4, pick(ART.leaf, rnd(seed, 44))));
  return parts;
}

/** Neck height of the voxel person, in voxels (the head turns around it). */
export const PERSON_NECK = 6.6;

/** The voxel person split into body and head (head moved down so it pivots at the neck). */
export function personSplit(seed: number, shirt?: string): { body: BoxPart[]; head: BoxPart[] } {
  const all = person(seed, shirt);
  const isHead = (b: BoxPart) => b.p[1] * 12 >= PERSON_NECK && Math.abs(b.p[0]) * 12 < 1.7;
  return {
    body: all.filter((b) => !isHead(b)),
    head: all.filter(isHead).map((b) => ({ ...b, p: [b.p[0], b.p[1] - PERSON_NECK / 12, b.p[2]] as [number, number, number] })),
  };
}
