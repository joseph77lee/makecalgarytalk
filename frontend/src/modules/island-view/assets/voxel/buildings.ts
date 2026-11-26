/**
 * Art Pass models for the building tree (M19, requirement.md §7.6, §19). Each building is written
 * for its lot's canonical size (the wide side along x, front towards +z) in voxels (12 per tile),
 * and has two or three designs; a community always gets the same design (`variant`), so the
 * community halls of Mahogany and Bowness look different. The layout turns the model to face the
 * nearest path (`facing`).
 */
import type { BuildCtx } from '../models';
import { asSway, type BoxPart } from '../boxes';
import { ART } from './samples';
import { VOXEL_DESIGNS as N } from './designFit';
import { gableRoof, hipRoof, pick, rnd, shade, vb, vmove, vturn, windowX, windowZ } from './voxel';

export interface BuildingSpec {
  /** Lot size in tiles as placed on the island (may be the canonical size turned). */
  w: number;
  d: number;
  level: number;
  /** Design choice for this community (hash of the community code and the building key). */
  variant: number;
}

type Model = (s: BuildingSpec, ctx: BuildCtx) => BoxPart[];

const SNOW = '#f6f8fb';
const ICE = '#d6eef9';
const STONE = '#cfc6b8';
const WOOD = ART.wood;
const LIGHT = '#ffd98a';

const pad = (hx: number, hz: number, c: string, h = 0.4): BoxPart => vb(-hx, 0, -hz, hx, h, hz, c);
const bush = (x: number, z: number, c: string, s = 2): BoxPart[] => [vb(x, 0, z, x + s, s * 0.7, z + s, c), vb(x + 0.4, s * 0.7, z + 0.4, x + s - 0.4, s, z + s - 0.4, shade(c, 0.08))];
const lampPostAt = (x: number, z: number, h = 8): BoxPart[] => [
  vb(x - 0.3, 0, z - 0.3, x + 0.3, h, z + 0.3, '#4a5060'),
  vb(x - 0.8, h, z - 0.8, x + 0.8, h + 1.2, z + 0.8, '#ffe7a3', 'glow'),
  vb(x - 1, h + 1.2, z - 1, x + 1, h + 1.6, z + 1, '#4a5060'),
];
const flowers = (x0: number, z0: number, x1: number, z1: number, seed: number): BoxPart[] => {
  const out: BoxPart[] = [vb(x0, 0, z0, x1, 0.8, z1, '#8a6a4c')];
  const cs = ['#ef9b7f', '#e9c46a', '#e3a1a6', '#b9a6e2', '#ffffff'];
  for (let x = x0 + 0.5; x < x1 - 0.4; x += 1.2) out.push(vb(x, 0.8, z0 + 0.3, x + 0.7, 1.6, z1 - 0.3, cs[Math.floor(rnd(seed, x * 10) * cs.length)]));
  return out;
};
/** A small Canadian flag (red bars, white centre with a red mark) on a pole at (x, z). */
const flagAt = (x: number, z: number, h = 16): BoxPart[] => [
  vb(x - 0.25, 0, z - 0.25, x + 0.25, h, z + 0.25, '#9aa1ab'),
  ...asSway([
  vb(x + 0.25, h - 3, z - 0.15, x + 1.25, h - 0.6, z + 0.15, '#e0453c'),
  vb(x + 1.25, h - 3, z - 0.15, x + 3.25, h - 0.6, z + 0.15, '#ffffff'),
  vb(x + 1.95, h - 2.2, z - 0.2, x + 2.55, h - 1.4, z + 0.2, '#e0453c'),
  vb(x + 3.25, h - 3, z - 0.15, x + 4.25, h - 0.6, z + 0.15, '#e0453c'),
  ]),
];

// --- Entrance (1×1) -------------------------------------------------------------------------

const welcomeSign: Model = ({ variant }) => {
  const v = variant % 4;
  if (v === 3) return N.welcomeArch.build(variant);
  if (v === 0) {
    return [
      vb(-4.5, 0, -0.5, -3.5, 9, 0.5, WOOD),
      vb(3.5, 0, -0.5, 4.5, 9, 0.5, WOOD),
      vb(-5, 4.5, -0.6, 5, 8, 0.6, '#fff6e3'),
      vb(-5.5, 8, -0.9, 5.5, 8.8, 0.9, WOOD),
      ...flowers(-4, 1, 4, 2.6, variant),
    ];
  }
  if (v === 1) {
    return [
      vb(-5, 0, -1.6, 5, 2, 1.6, STONE),
      vb(-4.5, 2, -1, 4.5, 7, 1, '#efe6d6'),
      vb(-5, 7, -1.3, 5, 7.8, 1.3, STONE),
      vb(-3.5, 3, 1, 3.5, 6, 1.3, '#a8c69a'),
      ...bush(-5.5, 2, '#79b85a', 1.6),
      ...bush(3.9, 2, '#79b85a', 1.6),
    ];
  }
  const c = pick(['#ef9b7f', '#9fd0bd', '#b9a6e2'], rnd(variant, 3));
  return [
    vb(-4.5, 0, -0.5, -3.7, 8, 0.5, c),
    vb(3.7, 0, -0.5, 4.5, 8, 0.5, c),
    vb(-5, 4, -0.5, 5, 8, 0.5, '#fff6e3'),
    vb(-3, 8, -0.5, 3, 9, 0.5, '#fff6e3'),
    vb(-1.5, 9, -0.5, 1.5, 9.8, 0.5, '#fff6e3'),
    vb(-5, 3.6, -0.7, 5, 4, 0.7, c),
    ...flowers(-3.5, 1, 3.5, 2.4, variant + 1),
  ];
};

const gatewayArch: Model = ({ variant }) => {
  const v = variant % 5;
  if (v >= 3) return [...(v === 3 ? N.lodgeGate : N.funArch).build(variant), ...bush(-6, 1.4, '#79b85a', 2), ...bush(4, 1.4, '#79b85a', 2)];
  const pillar = v === 0 ? STONE : v === 1 ? ART.brick : WOOD;
  const beam = v === 2 ? shade(WOOD, -0.15) : v === 1 ? '#efe2c2' : WOOD;
  return [
    vb(-6, 0, -1.2, -3.6, 16, 1.2, pillar),
    vb(3.6, 0, -1.2, 6, 16, 1.2, pillar),
    vb(-6.3, 15, -1.5, -3.3, 16, 1.5, shade(pillar, -0.12)),
    vb(3.3, 15, -1.5, 6.3, 16, 1.5, shade(pillar, -0.12)),
    vb(-6, 16, -1, 6, 18, 1, beam),
    vb(-4, 11.5, -0.4, 4, 15.5, 0.4, '#fff6e3'),
    vb(-3.6, 11.9, 0.35, 3.6, 15.1, 0.5, v === 1 ? '#3b4260' : '#a8c69a'),
    vb(-5.4, 18, -0.6, -4.2, 19.4, 0.6, LIGHT, 'glow'),
    vb(4.2, 18, -0.6, 5.4, 19.4, 0.6, LIGHT, 'glow'),
    ...bush(-6, 1.4, '#79b85a', 2),
    ...bush(4, 1.4, '#79b85a', 2),
  ];
};

// --- Lot a (3×3): fire pit → warming hut → community hall -----------------------------------

const firePit: Model = ({ variant }, { palette }) => {
  const parts: BoxPart[] = [pad(12, 12, '#dccfb4'), vb(-14, 0, -6, -12, 0.4, 6, '#dccfb4'), vb(12, 0, -6, 14, 0.4, 6, '#dccfb4')];
  // the stone ring with its logs and flames (M23 designs: three kinds of ring)
  parts.push(...vmove([N.firePit1, N.firePit2, N.firePit3][variant % 3].build(variant), 0, 0.4, 0));
  // log benches (3 or 4 sides) and Adirondack-style chairs
  const sides = variant % 2 === 0 ? [0, 1, 2, 3] : [0, 1, 3];
  for (const sd of sides) {
    const [x, z, alongX] = [[0, 9, true], [9, 0, false], [0, -9, true], [-9, 0, false]][sd] as [number, number, boolean];
    parts.push(alongX ? vb(x - 5, 0.4, z - 1, x + 5, 2.4, z + 1, '#9b7356') : vb(x - 1, 0.4, z - 5, x + 1, 2.4, z + 5, '#9b7356'));
  }
  // firewood stack and string lights between corner poles
  parts.push(vb(9, 0.4, 9, 14, 3, 13, '#a67b55'), vb(9.3, 3, 9.3, 13.7, 3.4, 12.7, '#8a6343'));
  const corners: [number, number][] = [[-15, -15], [15, -15], [15, 15], [-15, 15]];
  for (const [x, z] of corners) parts.push(vb(x - 0.4, 0, z - 0.4, x + 0.4, 10, z + 0.4, WOOD));
  for (let k = 0; k < 4; k++) {
    const [ax, az] = corners[k];
    const [bx, bz] = corners[(k + 1) % 4];
    for (let t = 1; t < 10; t++) {
      const x = ax + ((bx - ax) * t) / 10;
      const z = az + ((bz - az) * t) / 10;
      const sag = 9.5 - Math.sin((t / 10) * Math.PI) * 1.6;
      parts.push(vb(x - 0.3, sag, z - 0.3, x + 0.3, sag + 0.6, z + 0.3, ['#ffd98a', '#ffb4a0', '#bfe3ff'][t % 3], 'glow'));
    }
  }
  return [...parts, ...bush(-16, 8, palette.leaves[0], 3), ...bush(13, -16, palette.leaves[1], 3)];
};

const warmingHut: Model = ({ variant }, { palette }) => {
  const v = variant % 5;
  const parts: BoxPart[] = [pad(17, 17, '#dccfb4', 0.3)];
  if (v >= 3) {
    // M23 designs: a ski-patrol hut or a mountain refuge hut
    parts.push(...vmove((v === 3 ? N.patrolHut : N.refugeHut).build(variant), -1, 0.3, -2));
  } else if (v === 0) {
    // log cabin
    for (let y = 0; y < 9; y++) parts.push(vb(-11, 0.3 + y, -10, 9, 1.3 + y, 6, y % 2 ? '#b98159' : '#a8714c'));
    parts.push(...gableRoof(-11, 9, -10, 6, 10.3, '#9a4d3c', '#b98159', 1.5));
    parts.push(vb(-2, 0.3, 6, 1.5, 6.5, 6.4, ART.door), ...windowZ(-8.5, -5, 3, 6, 6, ART.glass, '#efe2c2'), ...windowZ(4, 7, 3, 6, 6, ART.glass, '#efe2c2'), ...windowX(-6, -2, 3, 6, 9, ART.glass, '#efe2c2'));
    parts.push(vb(-12, 0.3, 6, 10, 1, 11, '#b08a64'), vb(-11.5, 1, 10, -10.5, 8, 11, WOOD), vb(8.5, 1, 10, 9.5, 8, 11, WOOD), vb(-12.5, 8, 6, 10.5, 9, 11.5, '#8a3f30'));
    parts.push(vb(4, 10, -6, 7, 20, -3, STONE), vb(3.6, 20, -6.4, 7.4, 21, -2.6, shade(STONE, -0.2)));
  } else if (v === 1) {
    // A-frame chalet
    for (let i = 0; i < 12; i++) parts.push(vb(-10 + i, 0.3 + i * 1.6, -9, 10 - i, 1.9 + i * 1.6, 6, i % 2 ? '#3f5a7a' : '#4a6890'));
    parts.push(vb(-7, 0.3, 6, 7, 9, 6.4, '#e9dccb'), vb(-4, 0.3, 6.3, 4, 8, 6.6, ART.glass), vb(-1.2, 0.3, 6.5, 1.2, 5, 6.8, ART.door));
    parts.push(vb(-11, 0.3, 6, 11, 1, 11, '#b08a64'), vb(-11, 1, 10.6, 11, 3, 11, WOOD));
  } else {
    // modern hut: flat roof, wood cladding, big window, canopy
    parts.push(vb(-11, 0.3, -9, 9, 9, 6, '#e8dccb'));
    for (let x = -11; x < 9; x += 2) parts.push(vb(x, 0.3, 6, x + 1, 9, 6.3, '#b98a62'));
    parts.push(vb(-8, 2, 6.2, 2, 7.5, 6.6, ART.glass), vb(3, 0.3, 6.2, 6, 6.5, 6.6, ART.door), vb(-12, 9, -10, 10, 10.2, 10, '#5d6470'), vb(-12, 0.3, 6, 10, 0.9, 10, STONE));
  }
  // skate rack and notice board
  parts.push(vb(11, 0.3, 4, 16, 3, 5, WOOD), ...[11.5, 13, 14.5].map((x) => vb(x, 2, 4.8, x + 0.8, 2.8, 5.6, '#e46a5c')));
  parts.push(vb(11, 0.3, -6, 11.6, 7, -5.4, WOOD), vb(15, 0.3, -6, 15.6, 7, -5.4, WOOD), vb(10.6, 4, -6.2, 16, 7, -5.6, '#fff6e3'));
  return [...parts, ...bush(-16, 12, palette.leaves[0], 3), ...bush(12, -16, palette.leaves[1], 3)];
};

const communityHall: Model = ({ variant }, { palette }) => {
  const v = variant % 7;
  const parts: BoxPart[] = [pad(17, 17, '#d9cdb5', 0.3)];
  if (v >= 3) {
    // M23 designs: station hall, grand hall, toy-block hall, workshop hall
    parts.push(...vmove([N.stationHall, N.grandHall, N.toyBlockHall, N.workshopHall][v - 3].build(variant), -1, 0.3, -2));
  } else if (v === 0) {
    const wall = pick(['#f6e7c8', '#f3dcc0', '#eef0d8'], rnd(variant, 5));
    const roof = pick(['#a8c69a', '#ef9b7f', '#93b8db'], rnd(variant, 6));
    parts.push(vb(-15, 0.3, -11, 9, 12, 7, wall), ...gableRoof(-15, 9, -11, 7, 13, roof, wall, 1.2));
    parts.push(vb(9, 0.3, -8, 16, 8, 5, shade(wall, -0.05)), ...hipRoof(9, 16, -8, 5, 9, '#b9a6e2', 0.8, 3));
    for (const x of [-13, -9, 3, 6]) parts.push(...windowZ(x, x + 2.5, 3, 8, 7, ART.glass));
    parts.push(...windowX(-8, -4, 3, 7, 16, ART.glass), ...windowX(-1, 3, 3, 7, 16, ART.glass));
    parts.push(vb(-5, 0.3, 7, 1, 7, 7.4, '#b98a5f'), vb(-4, 0.3, 7.3, 0, 6, 7.6, ART.glass), vb(-7, 7.5, 7, 3, 8.3, 12, shade(roof, -0.12)));
    parts.push(vb(-6.6, 0.3, 11, -5.8, 7.5, 11.8, ART.trim), vb(1.8, 0.3, 11, 2.6, 7.5, 11.8, ART.trim), vb(-7, 0.3, 7, 3, 0.9, 13, STONE));
    parts.push(vb(-7, 9, 7.1, 3, 11.5, 7.6, ART.trim), vb(-6.5, 9.4, 7.5, 2.5, 11.1, 7.8, '#3b4260'));
  } else if (v === 1) {
    // modern: flat roof, glass front, wood fins, solar panels
    parts.push(vb(-15, 0.3, -11, 13, 11, 7, '#eee6d8'), vb(-15.5, 11, -11.5, 13.5, 12, 7.5, '#5d6470'));
    parts.push(vb(-13, 1, 7, 4, 10, 7.4, ART.glass));
    for (let x = -13; x <= 4; x += 2.5) parts.push(vb(x, 1, 7.2, x + 0.6, 10, 8.2, '#b98a62'));
    parts.push(vb(6, 0.3, 7, 10, 7, 7.4, ART.door), vb(4.5, 7.5, 7, 12, 8.2, 11, '#5d6470'), ...windowX(-8, 2, 3, 9, 13, ART.glass));
    for (let x = -12; x <= 8; x += 5) for (let z = -9; z <= 3; z += 4) parts.push(vb(x, 12, z, x + 4, 12.6, z + 3, '#2f4a7a'), vb(x + 0.2, 12.6, z + 0.2, x + 3.8, 12.7, z + 2.8, '#4f78b8'));
  } else {
    // brick hall with white trim and a cupola clock
    parts.push(vb(-14, 0.3, -11, 12, 11, 7, ART.brick), vb(-14.5, 11, -11.5, 12.5, 11.8, 7.5, ART.trim), ...hipRoof(-14, 12, -11, 7, 12.8, '#5a6d8a', 1, 5));
    for (const x of [-12, -8, 4, 8]) parts.push(...windowZ(x, x + 2.4, 3, 8.5, 7, ART.glass, ART.trim));
    parts.push(...windowX(-8, -4, 3, 8, 12, ART.glass, ART.trim), ...windowX(-1, 3, 3, 8, 12, ART.glass, ART.trim));
    parts.push(vb(-3.5, 0.3, 7, 1.5, 8, 7.4, ART.trim), vb(-2.5, 0.3, 7.3, 0.5, 7, 7.6, ART.door), vb(-4.5, 8, 7, 2.5, 11, 9, ART.trim), vb(-4, 0.3, 7, 2, 0.9, 11, STONE));
    parts.push(vb(-3, 17.8, -3, 2, 22, 2, ART.trim), vb(-1.6, 19, 2, 0.6, 21.2, 2.3, '#3b4260'), vb(-3.6, 22, -3.6, 2.6, 23, 2.6, '#5a6d8a'), vb(-1.2, 23, -1.2, 0.2, 25, 0.2, '#e3b85a'));
  }
  return [...parts, ...flagAt(14, 13), ...bush(-16, 10, palette.leaves[0], 3), ...bush(10, 12, palette.leaves[1], 2.5), ...flowers(-15, 13, -7, 15, variant)];
};

// --- Lot b (3×2, canonical wide along x): frozen pond → skating rink → hockey rink -----------

const frozenPond: Model = ({ variant }, { palette }) => {
  const parts: BoxPart[] = [vb(-17, 0, -11, 17, 0.4, 11, palette.grass[0])];
  // an irregular pond: one column of ice per voxel along x
  for (let x = -14; x < 14; x++) {
    const t = (x + 0.5) / 14;
    const half = Math.sqrt(Math.max(0, 1 - t * t)) * (7.5 + Math.sin(x * 0.7 + variant) * 1.2);
    parts.push(vb(x, 0.2, -half - 1.2, x + 1, 0.9, half + 1.2, SNOW), vb(x, 0.4, -half, x + 1, 1, half, x % 3 === 0 ? shade(ICE, -0.04) : ICE));
  }
  parts.push(vb(-6, 1, -1, 2, 1.05, -0.6, '#b3d8ec'), vb(3, 1, 2, 3.4, 1.05, 6, '#b3d8ec'));
  for (const [x, z] of [[-15, 6], [-14, 7.5], [14, -7], [13, -8.5]]) parts.push(vb(x, 0.4, z, x + 0.5, 4, z + 0.5, '#9a8a5a'), vb(x - 0.1, 4, z - 0.1, x + 0.6, 5, z + 0.6, '#7a5a3c'));
  parts.push(vb(-4, 0.4, 9, 4, 2, 10, WOOD), vb(-4, 2, 10, 4, 4, 10.5, WOOD), vb(10, 0.4, 7, 10.6, 5, 7.6, WOOD), vb(9.6, 3, 7.6, 11, 4.5, 7.8, '#e46a5c'));
  return parts;
};

function rinkBase(hx: number, hz: number, cap: string): BoxPart[] {
  const parts: BoxPart[] = [vb(-hx, 0, -hz, hx, 0.6, hz, ICE)];
  const b = '#ffffff';
  parts.push(vb(-hx + 2, 0, -hz, hx - 2, 2.2, -hz + 0.5, b), vb(-hx + 2, 0, hz - 0.5, hx - 2, 2.2, hz, b));
  parts.push(vb(-hx, 0, -hz + 2, -hx + 0.5, 2.2, hz - 2, b), vb(hx - 0.5, 0, -hz + 2, hx, 2.2, hz - 2, b));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(vb(sx * (hx - 2), 0, sz * (hz - 0.5), sx * (hx - 1), 2.2, sz * (hz - 1.5), b), vb(sx * (hx - 1), 0, sz * (hz - 1.5), sx * (hx - 0.5), 2.2, sz * (hz - 2), b));
  parts.push(vb(-hx + 2, 2.2, -hz - 0.1, hx - 2, 2.6, -hz + 0.6, cap), vb(-hx + 2, 2.2, hz - 0.6, hx - 2, 2.6, hz + 0.1, cap));
  parts.push(vb(-hx - 0.1, 2.2, -hz + 2, -hx + 0.6, 2.6, hz - 2, cap), vb(hx - 0.6, 2.2, -hz + 2, hx + 0.1, 2.6, hz - 2, cap));
  return parts;
}

const skatingRink: Model = ({ variant }, { palette }) => {
  const cap = ['#93b8db', '#ef9b7f', '#a8c69a'][variant % 3];
  return [
    vb(-17.5, 0, -11.5, 17.5, 0.3, 11.5, palette.grass[1]),
    ...rinkBase(15, 9, cap),
    vb(-6, 0.6, -1, 6, 0.65, 1, '#c8e6f4'),
    ...[-10, 0, 10].map((x) => vb(x - 3, 0, 9.8, x + 3, 1.8, 11, WOOD)),
    ...lampPostAt(-16.5, -10.5),
    ...lampPostAt(16.5, -10.5),
    vb(-17, 0, 6, -16, 3, 9, '#e9dccb'),
  ];
};

const hockeyRink: Model = ({ variant }, { palette }) => {
  const cap = ['#e46a5c', '#3d6fb8'][variant % 2];
  const parts: BoxPart[] = [vb(-17.5, 0, -11.5, 17.5, 0.3, 11.5, palette.grass[1]), ...rinkBase(15.5, 8.5, cap)];
  parts.push(vb(-0.3, 0.6, -8, 0.3, 0.65, 8, '#e0453c'), vb(-5.3, 0.6, -8, -4.7, 0.65, 8, '#3d6fb8'), vb(4.7, 0.6, -8, 5.3, 0.65, 8, '#3d6fb8'));
  parts.push(vb(-1.5, 0.6, -1.5, 1.5, 0.66, 1.5, '#e0453c'));
  for (const sx of [-1, 1]) {
    const x = sx * 12.5;
    parts.push(vb(x - 0.8, 0.6, -1.6, x + 0.8, 2.6, -1.2, '#e0453c'), vb(x - 0.8, 0.6, 1.2, x + 0.8, 2.6, 1.6, '#e0453c'), vb(x - 0.8, 2.2, -1.6, x + 0.8, 2.6, 1.6, '#e0453c'), vb(x + sx * 0.4, 0.6, -1.2, x + sx * 0.8, 2.2, 1.2, '#f4f4f4'));
  }
  for (const [x, z] of [[-17, -11], [17, -11], [-17, 11], [17, 11]]) parts.push(...lampPostAt(x * 0.97, z * 0.9, 13));
  parts.push(vb(-10, 0, 9.4, 10, 1.4, 11.4, '#a9b0b9'), vb(-10, 1.4, 10.4, 10, 2.8, 11.4, '#a9b0b9'));
  return parts;
};

// --- 2×2 lots ----------------------------------------------------------------------------

const playground: Model = ({ variant }) => {
  const sets = [
    ['#ef9b7f', '#e9c46a', '#9fd0bd', '#b9a6e2'],
    ['#e0453c', '#ffcc2e', '#3d8bfd', '#6fbf8a'],
  ];
  const [a, b, c, d] = sets[variant % 2];
  const post = '#efe2c2';
  const swings = [
    vb(1, 0.4, -10, 1.6, 8, -9.4, d), vb(10, 0.4, -10, 10.6, 8, -9.4, d), vb(1, 8, -10, 10.6, 8.6, -9.4, d),
    vb(3.2, 3, -10.4, 4.8, 3.4, -9, a), vb(6.8, 3, -10.4, 8.4, 3.4, -9, b),
    vb(3.9, 3.4, -9.8, 4.1, 8, -9.6, '#8a8f99'), vb(7.5, 3.4, -9.8, 7.7, 8, -9.6, '#8a8f99'),
  ];
  // M23 designs (variants 2–3): slide, roundabout, spring rider and seesaw beside the swings
  if (variant % 4 >= 2)
    return [
      pad(11.5, 11.5, '#f0c9a8', 0.4),
      ...swings,
      ...vmove(vturn(N.slide.build(variant), 1), -5.5, 0.4, -4),
      ...vmove(N.roundabout.build(variant), 6, 0.4, 5.5),
      ...vmove(N.springRider.build(variant), -6.5, 0.4, 6),
      ...vmove(vturn(N.teeterTotter.build(variant), 1), 0, 0.4, 2),
    ];
  return [
    pad(11.5, 11.5, '#f0c9a8', 0.4),
    // tower with a roof and a slide
    ...[[-9, -9], [-3, -9], [-9, -3], [-3, -3]].map(([x, z]) => vb(x, 0.4, z, x + 0.8, 9, z + 0.8, post)),
    vb(-9.4, 4.5, -9.4, -1.8, 5.2, -1.8, shade(post, -0.1)),
    ...hipRoof(-9.4, -1.8, -9.4, -1.8, 10, a, 0.6, 4),
    { layer: 'solid', p: [(-1 + 4) / 2 / 12, 2.8 / 12, -5.5 / 12], s: [7 / 12, 0.4 / 12, 3 / 12], c: b, r: [0, 0, -0.6] },
    vb(-6.5, 0.4, -1.8, -5, 4.5, -1.2, c),
    ...swings,
    // sandbox and a spring rider
    vb(2, 0.4, 2, 10, 1.4, 10, WOOD), vb(2.6, 0.4, 2.6, 9.4, 1.5, 9.4, '#f2dc9a'), vb(5, 1.5, 4, 6.5, 2.5, 5.5, c),
    vb(-7, 0.4, 5, -6.4, 2.5, 5.6, '#8a8f99'), vb(-8, 2.5, 4.4, -5.4, 4, 6.2, d), vb(-5.6, 3.6, 4.8, -4.6, 4.8, 5.8, d),
  ];
};

const sleddingHill: Model = ({ variant }, { palette }) => {
  const parts: BoxPart[] = [pad(11.5, 11.5, palette.grass[0], 0.3)];
  for (let i = 0; i < 7; i++) parts.push(vb(-11 + i * 0.5, 0.3 + i * 1.5, -11 + i * 0.5, 9 - i * 2.4, 1.8 + i * 1.5, 9 - i * 2.4, i % 2 ? SNOW : shade(SNOW, -0.03)));
  for (let i = 0; i < 6; i++) parts.push(vb(8 - i * 2.4, 0.3, -11 + i * 0.5, 10 - i * 2.4, 1.8 + i * 1.5, -9 + i * 0.5, '#c9b9a0'));
  parts.push(vb(3, 0.3, 6, 6, 1, 7.5, '#e46a5c'), vb(3, 1, 7.3, 6, 1.8, 7.5, '#e46a5c'), vb(-2, 0.3, 9.5, 3, 1, 10.5, '#5b8fd6'));
  for (let x = -11; x <= 10; x += 2) parts.push(vb(x, 0.3, 10.8, x + 0.4, 3, 11.2, '#f39a52'));
  parts.push(vb(-11, 1.8, 10.9, 10.5, 2.4, 11.1, '#f39a52'));
  parts.push(vb(-10, 9.3, -10, -9.4, 14, -9.4, '#9aa1ab'), vb(-9.4, 12, -9.8, -6.5, 13.6, -9.6, ['#ef9b7f', '#9fd0bd'][variant % 2]));
  return parts;
};

const dogPark: Model = ({ variant }, { palette }) => {
  const parts: BoxPart[] = [pad(11.5, 11.5, palette.grass[1], 0.3)];
  const f = '#efe2c2';
  parts.push(vb(-11.5, 0.3, -11.5, 11.5, 3, -11, f), vb(-11.5, 0.3, -11.5, -11, 3, 11.5, f), vb(11, 0.3, -11.5, 11.5, 3, 11.5, f), vb(-11.5, 0.3, 11, 4, 3, 11.5, f));
  for (let x = -11; x <= 11; x += 3) parts.push(vb(x - 0.3, 0.3, 11, x + 0.3, 3.8, 11.6, shade(f, -0.15)));
  // agility: hurdles and a tunnel
  for (const x of [-7, -2]) parts.push(vb(x, 0.3, -6, x + 0.4, 3, -5.6, '#e0453c'), vb(x, 0.3, -1, x + 0.4, 3, -0.6, '#e0453c'), vb(x, 2.4, -6, x + 0.4, 2.8, -0.6, '#ffffff'));
  for (let i = 0; i < 5; i++) {
    const h = [1.5, 2.6, 3, 2.6, 1.5][i];
    parts.push(vb(3 + i * 1.2, 0.3, -8, 4.2 + i * 1.2, 0.3 + h, -8 + 0.6, '#3d8bfd'), vb(3 + i * 1.2, 0.3, -4.6, 4.2 + i * 1.2, 0.3 + h, -4, '#3d8bfd'), vb(3 + i * 1.2, h - 0.3, -8, 4.2 + i * 1.2, 0.3 + h, -4, '#3d8bfd'));
  }
  // two dogs, a water bowl, a bench and a bag station
  const dog = (x: number, z: number, c: string): BoxPart[] => [vb(x, 1.3, z, x + 3, 2.6, z + 1.2, c), vb(x + 2.6, 2.2, z + 0.1, x + 3.8, 3.4, z + 1.1, c), vb(x + 3.8, 2.5, z + 0.35, x + 4.3, 3, z + 0.85, '#2f2a26'), ...[[x + 0.2, z], [x + 0.2, z + 0.8], [x + 2.4, z], [x + 2.4, z + 0.8]].map(([lx, lz]) => vb(lx, 0.3, lz, lx + 0.4, 1.3, lz + 0.4, shade(c, -0.15))), vb(x - 0.8, 2.3, z + 0.4, x, 2.7, z + 0.8, c)];
  parts.push(...dog(-6, 4, ['#c9a26f', '#2f2a26'][variant % 2]), ...dog(2, 6, ['#d9c3a0', '#8a6343'][variant % 2]));
  parts.push(vb(7, 0.3, 7, 9, 0.9, 9, '#9aa1ab'), vb(7.3, 0.9, 7.3, 8.7, 1, 8.7, '#7fc4e6'));
  parts.push(vb(-10, 1.6, 7, -6, 2, 9, WOOD), vb(-10, 2, 8.6, -6, 3.4, 9, WOOD), vb(9, 0.3, -10, 9.5, 5, -9.5, '#5d6470'), vb(8.5, 3.5, -10.2, 10, 5, -9.8, '#6fbf8a'));
  return parts;
};

const communityGarden: Model = ({ variant }, { palette }) => {
  const fresh = variant % 2 === 1; // M23 design: a painted shed and a flower bed
  const parts: BoxPart[] = [pad(11.5, 11.5, palette.path[0], 0.3)];
  const crops = ['#6fae4f', '#e0453c', '#f39a52', '#9fd36a'];
  for (const [x, z] of [[-10, -10], [-2, -10], [-10, -2], [-2, -2]]) {
    parts.push(vb(x, 0.3, z, x + 6.5, 1.8, z + 6.5, WOOD), vb(x + 0.5, 0.3, z + 0.5, x + 6, 2, z + 6, '#7a5a3c'));
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const c = crops[Math.floor(rnd(variant, x * 7 + i, z * 5 + j) * crops.length)];
        parts.push(vb(x + 1 + i * 1.8, 2, z + 1 + j * 1.8, x + 2.2 + i * 1.8, 3.2, z + 2.2 + j * 1.8, c === '#6fae4f' ? c : '#6fae4f'));
        if (c !== '#6fae4f') parts.push(vb(x + 1.3 + i * 1.8, 3.2, z + 1.3 + j * 1.8, x + 1.9 + i * 1.8, 3.8, z + 1.9 + j * 1.8, c));
      }
    }
  }
  // shed, sunflowers, scarecrow, watering can
  if (fresh) parts.push(...vmove(N.gardenShed.build(variant), 8.5, 0.3, -8), ...vmove(N.gardenBed.build(variant), 3, 0.3, 8.7));
  else parts.push(vb(6, 0.3, -11, 11, 6, -5, '#a8c69a'), ...gableRoof(6, 11, -11, -5, 7, '#ef9b7f', '#a8c69a', 0.6), vb(7.8, 0.3, -5, 9.6, 4.5, -4.7, ART.door));
  for (const x of [6.5, 8.5, 10.5]) parts.push(vb(x, 0.3, 2, x + 0.4, 7, 2.4, '#5f9a4a'), vb(x - 0.6, 7, 1.6, x + 1, 8.4, 2.8, '#ffcc2e'), vb(x - 0.1, 7.4, 2.7, x + 0.5, 8, 2.9, '#7a5a3c'));
  parts.push(vb(8, 0.3, 7, 8.4, 6, 7.4, WOOD), vb(6.5, 4, 7, 10, 4.4, 7.4, WOOD), vb(7.4, 4.4, 6.8, 9, 6, 7.6, '#5b8fd6'), vb(7.6, 6, 6.9, 8.8, 7.2, 7.5, '#f2dc9a'), vb(7.2, 7.2, 6.6, 9.2, 7.6, 7.8, '#c79a76'));
  parts.push(vb(2, 0.3, 8, 4, 1.8, 9.5, '#6fbf8a'), vb(4, 1, 8.5, 5.4, 1.4, 9, '#6fbf8a'));
  return parts;
};

// --- Neighbourhood park (3×3) -------------------------------------------------------------

const neighbourhoodPark: Model = ({ variant }, { palette }) => {
  const fresh = variant % 4 >= 2; // M23 designs: picnic shelter, new trees, park benches, a drinking fountain
  const parts: BoxPart[] = [pad(17.5, 17.5, palette.grass[0], 0.3)];
  parts.push(vb(-17, 0.3, -1.5, 17, 0.5, 1.5, palette.path[0]), vb(-1.5, 0.3, -17, 1.5, 0.5, 17, palette.path[0]));
  if (variant % 2 === 0 && fresh) {
    parts.push(...vmove(N.picnicShelter.build(variant), 0, 0.5, 0));
  } else if (variant % 2 === 0) {
    // gazebo
    parts.push(vb(-6, 0.5, -6, 6, 1.5, 6, '#efe2c2'));
    for (const [x, z] of [[-5, -5], [4.2, -5], [-5, 4.2], [4.2, 4.2]]) parts.push(vb(x, 1.5, z, x + 0.8, 8, z + 0.8, ART.trim));
    parts.push(...hipRoof(-5.5, 5.5, -5.5, 5.5, 9, pick(['#ef9b7f', '#9fd0bd', '#b9a6e2'], rnd(variant, 12)), 1, 5), vb(-0.4, 14, -0.4, 0.4, 15.5, 0.4, '#e3b85a'));
  } else {
    // fountain
    parts.push(vb(-6, 0.5, -6, 6, 2, 6, STONE), vb(-5, 0.5, -5, 5, 2.1, 5, '#8ec5ea'), vb(-1.2, 2, -1.2, 1.2, 5, 1.2, STONE), vb(-2.5, 5, -2.5, 2.5, 5.6, 2.5, STONE), vb(-0.6, 5.6, -0.6, 0.6, 8, 0.6, '#c8e6f4', 'glow'));
  }
  const tree = (x: number, z: number, c: string): BoxPart[] => [vb(x - 0.6, 0.3, z - 0.6, x + 0.6, 5, z + 0.6, palette.trunk), vb(x - 3.5, 5, z - 3.5, x + 3.5, 10, z + 3.5, c), vb(x - 2.4, 10, z - 2.4, x + 2.4, 12, z + 2.4, shade(c, 0.08))];
  if (fresh) {
    const trees = [N.shadeTree, N.ornamentalTree, N.firTree, N.lollipopTree];
    ([[-11, -11], [11, -11], [-11, 11], [12, 12]] as const).forEach(([x, z], i) => parts.push(...vmove(asSway(trees[(i + variant) % trees.length].build(variant + i)), x, 0.3, z)));
    parts.push(...vmove(vturn(N.parkBench.build(0), 2), -7, 0.3, 3.6), ...vmove(N.parkBench.build(0), 8, 0.3, -3.9), ...vmove(vturn(N.parkBench.build(0), 3), 3.6, 0.3, 11), ...vmove(N.drinkingFountain.build(0), 3, 0.3, -3));
  } else {
    parts.push(...tree(-11, -11, palette.leaves[0]), ...tree(11, -11, palette.leaves[1]), ...tree(-11, 11, palette.leaves[1]), ...tree(12, 12, palette.leaves[0]));
    for (const [x, z, along] of [[-9, 3, true], [6, -4.5, true], [3, 9, false]] as const) parts.push(along ? vb(x, 0.3, z, x + 4, 2, z + 1.2, WOOD) : vb(x, 0.3, z, x + 1.2, 2, z + 4, WOOD));
  }
  parts.push(...flowers(4, 4, 9, 7, variant), ...flowers(-9, -8, -4, -5, variant + 2), ...lampPostAt(-3, 14), ...lampPostAt(14, -3));
  return parts;
};

/** Generic model for buildings the client does not know yet (requirement.md §7.6b, §20.4). */
const placeholder: Model = ({ w, d }) => {
  const hx = w * 6 - 1;
  const hz = d * 6 - 1;
  return [pad(hx, hz, '#dccfb4', 0.3), vb(-Math.min(7, hx - 2), 0.3, -Math.min(7, hz - 2), Math.min(7, hx - 2), 8, Math.min(7, hz - 2), '#efe2c2'), ...hipRoof(-Math.min(7, hx - 2), Math.min(7, hx - 2), -Math.min(7, hz - 2), Math.min(7, hz - 2), 9, '#b9a6e2', 1, 3)];
};

export const BUILDING_VOXELS: Record<string, Model> = {
  'welcome-sign': welcomeSign,
  'gateway-arch': gatewayArch,
  'fire-pit': firePit,
  'warming-hut': warmingHut,
  'community-hall': communityHall,
  'frozen-pond': frozenPond,
  'skating-rink': skatingRink,
  'hockey-rink': hockeyRink,
  playground,
  'sledding-hill': sleddingHill,
  'dog-park': dogPark,
  'community-garden': communityGarden,
  'neighbourhood-park': neighbourhoodPark,
};

export const placeholderModel = placeholder;

/** How many designs a building has (for tests and the gallery). */
export const BUILDING_VARIANTS: Record<string, number> = {
  'welcome-sign': 4,
  'gateway-arch': 5,
  'fire-pit': 3,
  'warming-hut': 5,
  'community-hall': 7,
  'frozen-pond': 1,
  'skating-rink': 3,
  'hockey-rink': 2,
  playground: 4,
  'sledding-hill': 2,
  'dog-park': 2,
  'community-garden': 2,
  'neighbourhood-park': 4,
};
