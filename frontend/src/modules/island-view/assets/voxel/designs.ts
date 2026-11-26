/**
 * More voxel designs (M23 rework, operator decision 2026-11-25: stay voxel, take shapes from the
 * Polyfork catalogue as reference only). Each builder follows our voxel rules: 12 voxels per tile,
 * front towards +z, one-tile buildings inside ±5.5 voxels, colours from `ART` picked by `seed`.
 * The Polyfork model each design was drawn from is named in its comment; nothing is copied from
 * the files, only the idea of the shape.
 */
import type { BoxPart } from '../boxes';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, windowX, windowZ } from './voxel';

const wallOf = (seed: number, k = 1) => pick(ART.walls, rnd(seed, k));
const roofOf = (seed: number, k = 2) => pick(ART.roofs, rnd(seed, k));
const G = ART.glass;
const T = ART.trim;

/** Ridge along z instead of x (swap x and z of a roof built along x). */
const alongZ = (parts: BoxPart[]): BoxPart[] => parts.map((p) => ({ ...p, p: [p.p[2], p.p[1], p.p[0]], s: [p.s[2], p.s[1], p.s[0]] }));

/** Thin horizontal lines every `step` voxels on a front face (lap siding). */
function siding(x0: number, x1: number, y0: number, y1: number, z: number, wall: string, step = 1): BoxPart[] {
  const out: BoxPart[] = [];
  for (let y = y0 + step; y < y1; y += step) out.push(vb(x0, y - 0.1, z, x1, y + 0.05, z + 0.15, shade(wall, -0.07)));
  return out;
}

const chimney = (x: number, z: number, y0: number, y1: number, c: string = ART.brick): BoxPart[] => [vb(x, y0, z, x + 1.4, y1, z + 1.4, c), vb(x - 0.3, y1, z - 0.3, x + 1.7, y1 + 0.5, z + 1.7, shade(c, -0.25))];
const shrub = (x: number, z: number, seed: number, w = 1.6): BoxPart[] => [vb(x, 0, z, x + w, 1.3, z + 1.2, pick(ART.leaf, rnd(seed, 9))), vb(x + 0.3, 1.3, z + 0.2, x + w - 0.3, 1.8, z + 1, shade(pick(ART.leaf, rnd(seed, 10)), 0.1))];
const door = (x0: number, x1: number, z: number, h = 3.4, c: string = ART.door): BoxPart[] => [vb(x0, 0.6, z, x1, h, z + 0.35, c), vb(x0 + (x1 - x0) * 0.75, 1.8, z + 0.3, x0 + (x1 - x0) * 0.75 + 0.3, 2.1, z + 0.5, '#e3b85a')];
const steps = (x0: number, x1: number, z: number, n = 1): BoxPart[] => Array.from({ length: n }, (_, i) => vb(x0, 0, z + i * 0.7, x1, 0.6 * (n - i), z + (i + 1) * 0.7, ART.concrete));

// --- Suburb houses --------------------------------------------------------------------------

/** After Polyfork "Porch-Front Cottage": steep gable facing the street, lap siding, deep front porch with posts and a carved gable trim. */
export function porchCottage(seed: number): BoxPart[] {
  const wall = wallOf(seed);
  const roof = roofOf(seed);
  return [
    vb(-4.5, 0, -4.5, 4.5, 0.6, 2.5, ART.concrete),
    vb(-4.5, 0.6, -4.5, 4.5, 5.6, 2.5, wall),
    ...siding(-4.5, 4.5, 0.6, 5.6, 2.5, wall),
    ...alongZ(gableRoof(-4.5, 2.5, -4.5, 4.5, 6.6, roof, wall, 1)),
    // porch with posts and its own little roof
    vb(-4.5, 0, 2.5, 4.5, 0.6, 5.5, ART.wood),
    ...[-4, 3.4].map((x) => vb(x, 0.6, 4.8, x + 0.6, 4.6, 5.4, T)),
    vb(-5, 4.6, 2.5, 5, 5.2, 5.8, shade(roof, -0.1)),
    vb(-3.6, 1.6, 5, 3.6, 1.9, 5.3, T), // porch rail
    ...door(-0.9, 0.9, 2.5),
    ...windowZ(-3.6, -2, 2, 4, 2.5, G),
    ...windowZ(2, 3.6, 2, 4, 2.5, G),
    ...windowZ(-0.8, 0.8, 7.6, 9, 2.5, G),
    // carved trim under the gable
    ...[-2.4, -1.2, 0, 1.2, 2.4].map((x) => vb(x - 0.3, 6.1, 3.2, x + 0.3, 6.6, 3.5, T)),
    ...shrub(-5.3, 5.8, seed),
  ];
}

/** After Polyfork "Single Storey Ranch House": long and low, hip roof, a brick base band, picture window and a tall chimney. */
export function ranchHouse(seed: number): BoxPart[] {
  const wall = wallOf(seed);
  const roof = roofOf(seed);
  return [
    vb(-5.5, 0, -3.5, 5.5, 1.4, 3.5, ART.brick),
    vb(-5.5, 1.4, -3.5, 5.5, 4.6, 3.5, wall),
    ...siding(-5.5, 5.5, 1.4, 4.6, 3.5, wall),
    ...hipRoof(-5.5, 5.5, -3.5, 3.5, 5.6, roof, 1, 3),
    ...door(-0.6, 0.9, 3.5, 3.6),
    vb(-1, 0, 3.5, 1.3, 0.5, 4.8, ART.brick),
    ...windowZ(-4.8, -1.8, 2, 3.8, 3.5, G), // picture window
    ...windowZ(2.2, 3.4, 2, 3.8, 3.5, G),
    ...windowX(-2, 0, 2, 3.8, 5.5, G),
    ...chimney(2.6, -2.2, 5, 9.5),
    ...shrub(3.6, 3.9, seed, 1.8),
  ];
}

/** After Polyfork "Split Level House": a low wing and a taller wing half a storey up, each with its own roof. */
export function splitLevel(seed: number): BoxPart[] {
  const wall = wallOf(seed);
  const wall2 = shade(wall, -0.06);
  const roof = roofOf(seed);
  return [
    // low wing (left) with the garage
    vb(-5.5, 0, -3, 0, 4.4, 3.5, wall2),
    ...gableRoof(-5.5, 0, -3, 3.5, 5.4, roof, wall2, 0.8),
    vb(-5, 0.4, 3.5, -0.8, 3.6, 3.85, ART.garage),
    ...[1.2, 2.2, 3.1].map((y) => vb(-5, y, 3.8, -0.8, y + 0.15, 3.95, shade(ART.garage, -0.12))),
    // tall wing (right), half a level up
    vb(0, 0, -4, 5.5, 7.4, 2.8, wall),
    ...siding(0, 5.5, 0, 7.4, 2.8, wall),
    ...alongZ(gableRoof(-4, 2.8, 0, 5.5, 8.4, roof, wall, 0.8)),
    ...door(0.8, 2.3, 2.8),
    ...steps(0.6, 2.5, 2.8, 2),
    ...windowZ(3, 4.8, 1.6, 3.4, 2.8, G),
    ...windowZ(1, 4.8, 4.6, 6.4, 2.8, G),
  ];
}

/** After Polyfork "Two Storey Family House": a front-facing gable with a dormer, two rows of windows and a small entry roof. */
export function familyHouse(seed: number): BoxPart[] {
  const wall = wallOf(seed);
  const roof = roofOf(seed);
  return [
    vb(-4.5, 0, -4.5, 4.5, 0.6, 3.5, ART.concrete),
    vb(-4.5, 0.6, -4.5, 4.5, 9, 3.5, wall),
    vb(-4.5, 4.8, 3.5, 4.5, 5.2, 3.8, T),
    ...alongZ(gableRoof(-4.5, 3.5, -4.5, 4.5, 10, roof, wall, 1)),
    vb(-1.5, 11, 0, 1.5, 13.5, 3, wall), // dormer
    ...windowZ(-0.8, 0.8, 11.5, 13, 3, G),
    vb(-2, 13.5, -0.2, 2, 14.2, 3.4, roof),
    ...door(-0.8, 0.8, 3.5),
    vb(-1.8, 3.8, 3.5, 1.8, 4.3, 5, shade(roof, -0.1)),
    ...windowZ(-3.8, -2, 1.8, 3.8, 3.5, G),
    ...windowZ(2, 3.8, 1.8, 3.8, 3.5, G),
    ...windowZ(-3.8, -2, 6, 8, 3.5, G),
    ...windowZ(-0.8, 0.8, 6, 8, 3.5, G),
    ...windowZ(2, 3.8, 6, 8, 3.5, G),
    ...chimney(2.5, -3.5, 9, 14),
    ...shrub(-5.2, 3.9, seed),
  ];
}

/** After Polyfork "Townhouse Row Unit": two narrow tall units side by side, each with a stoop, a bay and its own colour. */
export function rowUnits(seed: number): BoxPart[] {
  const roof = roofOf(seed);
  const unit = (x0: number, wall: string, s: number): BoxPart[] => [
    vb(x0, 0, -4.5, x0 + 5, 10, 3, wall),
    ...siding(x0, x0 + 5, 0, 10, 3, wall, 1.2),
    vb(x0 - 0.2, 10, -4.7, x0 + 5.2, 10.8, 3.3, shade(roof, -0.2)),
    vb(x0 + 2.6, 4.5, 3, x0 + 4.6, 8.5, 4.2, shade(wall, -0.05)), // bay
    ...windowZ(x0 + 2.9, x0 + 4.3, 5.2, 7.8, 4.2, G),
    ...door(x0 + 0.6, x0 + 2, 3, 3.6, pick(['#5b8fd6', '#d9605a', '#6fbf8a', ART.door], rnd(s, 3))),
    ...steps(x0 + 0.4, x0 + 2.2, 3, 2),
    ...windowZ(x0 + 2.9, x0 + 4.3, 1.6, 3.4, 3, G),
    ...windowZ(x0 + 0.7, x0 + 2, 5.2, 7.8, 3, G),
  ];
  return [...unit(-5.2, wallOf(seed, 1), seed), ...unit(0.2, wallOf(seed, 11), seed + 1)];
}

/** After Polyfork "Modern Cube House": stacked flat-roofed boxes, a cantilevered upper floor, big glass and a wood strip. */
export function modernCube(seed: number): BoxPart[] {
  const white = '#f4f1ea';
  const wood = '#c79a76';
  return [
    vb(-5, 0, -4, 2, 4.6, 3, white),
    vb(-5, 0.6, 3, -1, 4, 3.3, G),
    vb(2, 0, -4, 5, 4.6, 1, '#6b7280'), // garage box
    vb(2.3, 0.4, 1, 4.7, 3.6, 1.3, '#4a5060'),
    vb(-3, 4.6, -4.5, 5.2, 8.8, 3.6, white), // cantilevered top
    vb(-2.6, 5.4, 3.6, 2.6, 8, 3.9, G),
    vb(2.8, 4.6, 3.6, 5.2, 8.8, 3.9, wood),
    vb(-3.2, 8.8, -4.7, 5.4, 9.3, 3.8, '#5d6470'),
    ...door(0, 1.5, 3, 3.8, wood),
    vb(-5.2, 4.6, -4.2, -3, 4.9, 3.2, '#5d6470'),
    ...shrub(-5.5, 3.6, seed, 1.4),
  ];
}

/** After Polyfork "Modern Gable House": a dark, steep gable barn shape with no overhang and a fully glazed gable end. */
export function modernGable(seed: number): BoxPart[] {
  const dark = pick(['#5d6470', '#7a6a5c', '#8f9bc0', '#a8c69a'], rnd(seed, 4));
  const parts: BoxPart[] = [vb(-3.5, 0, -5, 3.5, 0.4, 4.5, ART.concrete)];
  for (let i = 0; i < 7; i++) {
    const half = 3.5 - i * 0.5;
    parts.push({ ...vb(-half, 0.4 + i * 1.5, -5, half, 1.9 + i * 1.5, 4.2, i % 2 ? shade(dark, -0.06) : dark), tag: i > 2 ? 'roof' : undefined });
  }
  // glazed front gable (stepped like the walls) and a wood door
  for (let i = 0; i < 5; i++) {
    const half = 2.8 - i * 0.5;
    parts.push(vb(-half, 0.8 + i * 1.5, 4.2, half, 2.2 + i * 1.5, 4.5, G));
  }
  parts.push(vb(-0.7, 0.4, 4.4, 0.7, 3.2, 4.7, '#c79a76'), vb(-3.6, 0, 4.5, 3.6, 0.3, 6, '#c79a76'));
  return parts;
}

/**
 * After Polyfork "Lighthouse Keeper's Cottage": a cottage with a little striped lighthouse tower at
 * its side (a playful touch). The lantern is window glass, so it lights only like the house's
 * windows do (the resident was active today, §7.2).
 */
export function lighthouseCottage(seed: number): BoxPart[] {
  const wall = '#f6f2ea';
  const roof = roofOf(seed);
  const band = pick(['#e46a5c', '#5b8fd6', '#6fbf8a'], rnd(seed, 5));
  const parts: BoxPart[] = [
    vb(-5, 0, -3, 1.5, 4.8, 3.5, wall),
    ...gableRoof(-5, 1.5, -3, 3.5, 5.8, roof, wall, 0.8),
    ...door(-2.3, -0.9, 3.5),
    ...windowZ(-4.4, -3, 2, 3.6, 3.5, G),
  ];
  for (let y = 0; y < 12; y += 2) parts.push(vb(1.8, y, -2.2, 5, y + 2, 1, (y / 2) % 2 ? band : wall));
  parts.push(vb(1.5, 12, -2.5, 5.3, 12.5, 1.3, '#4a5060'), vb(2.2, 12.5, -1.8, 4.6, 14.5, 0.6, G), ...hipRoof(2.2, 4.6, -1.8, 0.6, 15.5, '#4a5060', 0.4, 2));
  return parts;
}

/** After Polyfork "Crossing Keeper's Cottage": a narrow brick cottage with a slate roof, a lean-to and a little fenced garden. */
export function keeperCottage(seed: number): BoxPart[] {
  const brick = pick([ART.brick, '#c98a6a', '#b9775c'], rnd(seed, 6));
  const roof = pick(['#93b8db', '#8f9bc0', '#9fd0bd'], rnd(seed, 7));
  const parts: BoxPart[] = [
    vb(-5, 0, -2.5, 3, 5.2, 2, brick),
    ...gableRoof(-5, 3, -2.5, 2, 6.2, roof, brick, 0.8),
    vb(3, 0, -2.5, 5.5, 3.4, 2, '#e9dccb'), // lean-to
    vb(2.8, 3.4, -2.8, 5.8, 3.9, 2.3, roof),
    ...door(-1, 0.6, 2, 3.6, '#d9e6ee'),
    ...windowZ(-4.2, -2.6, 2, 3.8, 2, G),
    ...windowZ(1, 2.4, 2, 3.8, 2, G),
    ...chimney(-4.5, -1.5, 6, 9.5, brick),
  ];
  for (let x = -5; x <= 5; x += 1.5) parts.push(vb(x - 0.2, 0, 4.5, x + 0.2, 2, 4.8, T));
  parts.push(vb(-5, 1.3, 4.55, 5.3, 1.6, 4.75, T), ...shrub(-4, 2.6, seed, 2), ...shrub(2, 2.6, seed + 3, 2));
  return parts;
}

/** After Polyfork "Thatched Cottage": white walls under a thick, rounded straw roof that hangs low. */
export function thatchedCottage(seed: number): BoxPart[] {
  const straw = pick(['#e2c27a', '#d9b56a', '#e8cf8f'], rnd(seed, 8));
  const wall = '#f8f3e6';
  const parts: BoxPart[] = [vb(-4.5, 0, -3, 4.5, 4, 3, wall), vb(-4.5, 0, -3.2, 4.5, 0.6, 3.2, shade(ART.concrete, -0.1))];
  // thick roof: wide, rounded steps that overhang far
  const layers: [number, number, number][] = [
    [6.2, 4.8, 3.8],
    [5.9, 4.4, 4.8],
    [5.4, 3.6, 5.8],
    [4.8, 2.6, 6.8],
    [3.8, 1.4, 7.6],
  ];
  layers.forEach(([hx, hz, y], i) => parts.push({ ...vb(-hx, y, -hz, hx, y + 1, hz, i % 2 ? shade(straw, -0.08) : straw), tag: 'roof' }));
  parts.push(...door(-0.8, 0.8, 3, 3.2, '#8b5a3c'), ...windowZ(-3.6, -2, 1.6, 3, 3, G, '#8b5a3c'), ...windowZ(2, 3.6, 1.6, 3, 3, G, '#8b5a3c'));
  parts.push(...chimney(2.4, -1, 6.5, 9.8, '#cfc6b8'), ...shrub(-5, 3.6, seed), ...shrub(3.4, 3.6, seed + 5));
  return parts;
}

/** Log walls: alternating log tones every voxel, with log ends sticking out at the corners. */
function logWalls(x0: number, x1: number, z0: number, z1: number, h: number, wood: string): BoxPart[] {
  const out: BoxPart[] = [];
  for (let y = 0; y < h; y++) {
    const c = y % 2 ? wood : shade(wood, -0.1);
    out.push(vb(x0, y, z0, x1, y + 1, z1, c));
    for (const [x, z] of [[x0 - 0.4, z0 - 0.4], [x1, z0 - 0.4], [x0 - 0.4, z1], [x1, z1]]) out.push(vb(x, y + 0.1, z, x + 0.4, y + 0.9, z + 0.4, shade(wood, 0.12)));
  }
  return out;
}

/** After Polyfork "Porch Log Cabin": a log cabin with a full-width porch under a moss-green roof. */
export function porchLogCabin(seed: number): BoxPart[] {
  const wood = pick(['#b98159', '#a8714c', '#c08a5f'], rnd(seed, 12));
  const roof = pick(['#a8c69a', '#7f9a6a', '#9a4d3c'], rnd(seed, 13));
  return [
    ...logWalls(-4.5, 4.5, -4, 2, 5, wood),
    ...gableRoof(-4.5, 4.5, -4, 2, 6, roof, wood, 1),
    vb(-4.5, 0, 2, 4.5, 0.6, 5, shade(wood, -0.2)),
    ...[-4.2, -0.3, 3.6].map((x) => vb(x, 0.6, 4.4, x + 0.6, 4.6, 5, shade(wood, 0.1))),
    vb(-5, 4.6, 2, 5, 5.2, 5.4, roof),
    ...door(-1.6, -0.2, 2),
    ...windowZ(1, 3, 2, 3.8, 2, G, shade(wood, 0.2)),
    vb(1.2, 0.6, 3, 3.6, 1.6, 3.8, '#9b7356'), // a bench on the porch
    ...chimney(-4, -3.4, 5, 10, ART.concrete),
  ];
}

/** After Polyfork "A-Frame Cabin": a steep roof down to the ground, a glazed front triangle and a small deck. */
export function aFrameCabin(seed: number): BoxPart[] {
  const roof = pick(['#4a6890', '#5d6470', '#9a4d3c', '#7f9a6a'], rnd(seed, 14));
  const wood = '#c79a76';
  const parts: BoxPart[] = [];
  for (let i = 0; i < 9; i++) {
    const half = 4.6 - i * 0.55;
    parts.push({ ...vb(-half, i * 1.2, -4.5, half, (i + 1) * 1.2, 3, i % 2 ? shade(roof, -0.08) : roof), tag: 'roof' });
  }
  for (let i = 0; i < 7; i++) {
    const half = 3.8 - i * 0.55;
    parts.push(vb(-half, i * 1.2, 3, half, (i + 1) * 1.2, 3.3, i < 2 ? wood : G));
  }
  parts.push(vb(-0.7, 0, 3.2, 0.7, 2.8, 3.5, ART.door), vb(-4, 0, 3.3, 4, 0.5, 6, wood), vb(-4, 0.5, 5.7, 4, 1.6, 6, wood));
  return parts;
}

/** After Polyfork "Log Cabin": a small, plain log cabin with a stone chimney and a woodpile. */
export function logCabin(seed: number): BoxPart[] {
  const wood = pick(['#a8714c', '#b98159', '#94603f'], rnd(seed, 15));
  return [
    ...logWalls(-3.5, 3.5, -3.5, 3, 4.5, wood),
    ...gableRoof(-3.5, 3.5, -3.5, 3, 5.5, pick(['#7a5538', '#5d6470', '#9a4d3c'], rnd(seed, 16)), wood, 1),
    ...door(-0.7, 0.7, 3),
    ...windowZ(1.4, 2.8, 1.8, 3.4, 3, G, shade(wood, 0.2)),
    ...chimney(-4.6, -1, 0, 9.5, '#cfc6b8'),
    vb(2.2, 0, -5, 5, 1.6, -3.8, '#a67b55'),
    vb(2.4, 1.6, -4.9, 4.8, 2, -3.9, '#8a6343'),
  ];
}

// --- Downtown and inner city ------------------------------------------------------------------

/** Window grid on the front (z) and side (x) faces of a block. */
function windowGrid(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, floor: number, cols: number, glass = G, frame = T): BoxPart[] {
  const out: BoxPart[] = [];
  const w = (x1 - x0) / cols;
  const dz = (z1 - z0) / Math.max(2, Math.round(cols * ((z1 - z0) / (x1 - x0))));
  for (let y = y0 + 1; y + floor * 0.55 <= y1; y += floor) {
    for (let i = 0; i < cols; i++) out.push(...windowZ(x0 + i * w + w * 0.25, x0 + (i + 0.75) * w, y, y + floor * 0.55, z1, glass, frame));
    for (let z = z0 + dz * 0.25; z + dz * 0.5 <= z1; z += dz) out.push(...windowX(z, z + dz * 0.5, y, y + floor * 0.55, x1, glass, frame));
  }
  return out;
}

const cornice = (x0: number, x1: number, z0: number, z1: number, y: number, c: string): BoxPart[] => [vb(x0 - 0.5, y, z0 - 0.5, x1 + 0.5, y + 0.8, z1 + 0.5, c)];
const waterTank = (x: number, z: number, y: number): BoxPart[] => [
  ...[[0, 0], [2, 0], [0, 2], [2, 2]].map(([dx, dz]) => vb(x + dx, y, z + dz, x + dx + 0.3, y + 2, z + dz + 0.3, '#5a4636')),
  vb(x - 0.3, y + 2, z - 0.3, x + 2.6, y + 4.5, z + 2.6, '#a67b55'),
  vb(x, y + 4.5, z, x + 2.3, y + 5.3, z + 2.3, '#5d6470'),
];
const fireEscape = (x0: number, x1: number, z: number, y0: number, y1: number, floor: number): BoxPart[] => {
  const out: BoxPart[] = [];
  for (let y = y0; y < y1; y += floor) out.push(vb(x0, y, z, x1, y + 0.25, z + 1.2, '#2f3448'), vb(x0, y + 0.25, z + 1.1, x1, y + 1.2, z + 1.2, '#2f3448'));
  out.push(vb(x1 - 0.3, y0, z + 0.2, x1, y1, z + 0.5, '#2f3448'));
  return out;
};

/** After Polyfork "Brownstone Row House": four storeys of brown stone, a high stoop, bay windows and a heavy cornice. */
export function brownstone(seed: number): BoxPart[] {
  const stone = pick(['#a0614a', '#8f5a48', '#b07a5a'], rnd(seed, 20));
  return [
    vb(-5, 0, -5, 5, 18, 4, stone),
    ...windowGrid(-5, 5, -5, 4, 3, 18, 3.8, 3, G, '#efe2c2'),
    vb(-4.5, 3, 4, -1, 14, 5, shade(stone, -0.05)), // bay
    ...cornice(-5, 5, -5, 4, 18, '#efe2c2'),
    ...steps(0.5, 3.5, 4, 4),
    ...door(1, 3, 4, 5.6, '#5a3c2a'),
    ...waterTank(1, -3, 18.8),
  ];
}

/** After Polyfork "Prewar Apartment House": a tall brick block with a stone base, a cornice and a water tank. */
export function prewarApartment(seed: number): BoxPart[] {
  const brick = pick([ART.brick, '#b9775c', '#c98a6a'], rnd(seed, 21));
  return [
    vb(-5.5, 0, -4, 5.5, 4, 4, '#e9dccb'),
    vb(-5.5, 4, -4, 5.5, 28, 4, brick),
    ...windowGrid(-5.5, 5.5, -4, 4, 4, 28, 3.4, 4, G, '#efe2c2'),
    vb(-1.5, 0.4, 4, 1.5, 3.4, 4.4, ART.door),
    vb(-2.2, 3.4, 4, 2.2, 4, 5.2, '#5d6470'),
    ...cornice(-5.5, 5.5, -4, 4, 28, '#efe2c2'),
    ...waterTank(-4, -3, 28.8),
  ];
}

/** After Polyfork "Postwar Apartment Slab": long, plain, with balcony bands across every floor. */
export function postwarSlab(seed: number): BoxPart[] {
  const wall = pick(['#e9dccb', '#d9cdb5', '#efe6d6'], rnd(seed, 22));
  const parts: BoxPart[] = [vb(-5.5, 0, -3.5, 5.5, 34, 3.5, wall)];
  for (let y = 3; y < 34; y += 3.2) {
    parts.push(vb(-5.5, y, 3.5, 5.5, y + 0.4, 5, shade(wall, -0.1)), vb(-5.5, y + 0.4, 4.7, 5.5, y + 1.4, 5, shade(wall, -0.18)));
    parts.push(...windowZ(-4.8, -1.2, y + 1, y + 2.6, 3.5, G), ...windowZ(1.2, 4.8, y + 1, y + 2.6, 3.5, G));
  }
  parts.push(vb(-5.8, 34, -3.8, 5.8, 34.6, 3.8, '#5d6470'), vb(-1.2, 0, 3.5, 1.2, 2.6, 3.8, ART.door));
  return parts;
}

/** After Polyfork "Apartment Block": a white, wide walk-up of four floors with recessed balconies and a flat roof. */
export function apartmentBlock(seed: number): BoxPart[] {
  const accent = pick(['#9fd0bd', '#e3a1a6', '#f2c14e', '#93b8db'], rnd(seed, 23));
  const parts: BoxPart[] = [vb(-5.5, 0, -2.5, 5.5, 13, 3, '#f6f4ef')];
  for (let y = 1; y < 13; y += 3) {
    for (const x of [-4.8, -1.4, 2]) {
      parts.push(vb(x, y, 3, x + 2.8, y + 2.2, 3.15, G), vb(x - 0.2, y, 3, x + 3, y + 0.3, 4.2, accent));
      parts.push(vb(x - 0.2, y + 0.3, 4, x + 3, y + 1.2, 4.2, '#f6f4ef'));
    }
  }
  parts.push(vb(-5.8, 13, -2.8, 5.8, 13.5, 3.3, '#5d6470'), vb(-0.8, 0, 3, 0.8, 2.4, 3.3, ART.door));
  return parts;
}

/** After Polyfork "Brick Tenement": a narrow red brick building with a black fire escape down its front. */
export function tenement(seed: number): BoxPart[] {
  const brick = pick(['#b9573f', ART.brick, '#a8503c'], rnd(seed, 24));
  return [
    vb(-4.5, 0, -5, 4.5, 24, 3.5, brick),
    ...windowGrid(-4.5, 4.5, -5, 3.5, 3, 24, 3.6, 3, G, '#efe2c2'),
    ...fireEscape(-3.5, 1, 3.5, 4, 22, 3.6),
    vb(1.6, 0.4, 3.5, 3.6, 3.4, 3.9, ART.door),
    ...cornice(-4.5, 4.5, -5, 3.5, 24, shade(brick, -0.25)),
    ...waterTank(-2, -3, 24.8),
  ];
}

/** After Polyfork "Slab Apartment Block": a white tower with a dark ribbon of windows on every floor and a rooftop box. */
export function slabTower(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-5.5, 0, -5, 5.5, 26, 4, '#f6f8fb')];
  for (let y = 2; y < 26; y += 2.6) parts.push(vb(-5.5, y, 4, 5.5, y + 1.4, 4.2, ART.glassDark), vb(5.5, y, -5, 5.7, y + 1.4, 4, ART.glassDark));
  parts.push(vb(-2, 26, -2, 2.5, 28.5, 1.5, '#d9dee5'), vb(-1, 0, 4, 1, 2.6, 4.3, '#5d6470'), vb(-5.5, 0, 4, 5.5, 0.4, 5.5, ART.concrete));
  void seed;
  return parts;
}

/** After Polyfork "Office Tower": a glass curtain wall on a stone base, fins between the windows, a water tank up top. */
export function glassOffice(seed: number): BoxPart[] {
  // the whole curtain wall is window glass, so it lights up at night like other windows
  const glass = rnd(seed, 25) < 0.5 ? ART.glass : ART.glassDark;
  const parts: BoxPart[] = [vb(-5, 0, -5, 5, 4, 4.5, '#cfc6b8'), vb(-4.8, 4, -4.8, 4.8, 38, 4.3, glass)];
  for (let x = -4.8; x <= 4.8; x += 1.6) parts.push(vb(x - 0.15, 4, 4.3, x + 0.15, 38, 4.6, '#e8eef4'));
  for (let y = 4; y < 38; y += 3) parts.push(vb(-4.8, y, 4.3, 4.8, y + 0.3, 4.6, '#e8eef4'), vb(4.3, y, -4.8, 4.6, y + 0.3, 4.3, '#e8eef4'));
  parts.push(vb(-1.6, 0.4, 4.5, 1.6, 3.4, 4.8, '#3f4a58'), ...waterTank(1, -3, 38), vb(-5.2, 38, -5.2, 5.2, 38.6, 4.7, '#5d6470'));
  return parts;
}

/** After Polyfork "Art Deco Setback Tower": stepped back tiers with gold trim and a spire. */
export function decoSetback(seed: number): BoxPart[] {
  const stone = pick(['#efe2c2', '#e9dccb', '#f3dcc0'], rnd(seed, 26));
  const gold = '#e3b85a';
  const tiers: [number, number, number][] = [
    [5.5, 0, 16],
    [4.4, 16, 26],
    [3.2, 26, 33],
    [2, 33, 37],
  ];
  const parts: BoxPart[] = [];
  for (const [h, y0, y1] of tiers) {
    parts.push(vb(-h, y0, -h, h, y1, h, stone), vb(-h - 0.2, y1 - 0.5, -h - 0.2, h + 0.2, y1, h + 0.2, gold));
    for (let x = -h + 0.8; x < h - 0.6; x += 1.6) parts.push(vb(x, y0 + 1, h, x + 0.7, y1 - 1, h + 0.25, G), vb(h, y0 + 1, x, h + 0.25, y1 - 1, x + 0.7, G));
  }
  parts.push(vb(-0.4, 37, -0.4, 0.4, 42, 0.4, gold), vb(-1.6, 0.4, 5.5, 1.6, 4, 5.9, '#3f4a58'));
  return parts;
}

/** After Polyfork "Monolith Office Tower": a white slab cut by tall dark glass slots. */
export function monolithTower(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-4.5, 0, -4.5, 4.5, 30, 4.5, '#f6f8fb')];
  for (const x of [-3.2, -0.6, 2]) parts.push(vb(x, 2, 4.5, x + 1.2, 28, 4.7, ART.glassDark), vb(4.5, 2, x, 4.7, 28, x + 1.2, ART.glassDark));
  parts.push(vb(-1.4, 0, 4.5, 1.4, 3, 4.8, '#3f4a58'), vb(-4.7, 30, -4.7, 4.7, 30.5, 4.7, pick(['#b7a6f5', '#9fd0bd', '#e3a1a6'], rnd(seed, 27))));
  return parts;
}
