/**
 * Art Pass models for the signature features (M19, requirement.md §7.9) and the CTrain parts
 * (station platform, train car, track details). Feature blocks sit on 2×2 spare lots (voxels
 * x, z ∈ [-12, 12), front +z); `variant` picks a design per community.
 */
import { asSway, type BoxPart } from '../boxes';
import type { BuildCtx } from '../models';
import type { FeatureKey } from '../../plan/features';
import { ART, leafyTree, spruce } from './samples';
import { VOXEL_DESIGNS as N } from './designFit';
import { hipRoof, shade, vb, vmove, vturn, windowX, windowZ } from './voxel';

type Model = (variant: number, ctx: BuildCtx) => BoxPart[];

const WATER = '#8ec5ea';
const WATER_DEEP = '#78b5df';
const ICE = '#d6eef9';
const SNOW = '#f6f8fb';
const SAND = '#eedcb4';
const STONE = '#cfc6b8';
const REED = '#86a85a';

/** Columns of an irregular blob (pond / lake) over x; each column spans [-half, half] in z. */
function blob(x0: number, x1: number, rz: number, wobble: number, seed: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = x0; x < x1; x++) {
    const t = ((x + 0.5 - x0) / (x1 - x0)) * 2 - 1;
    out.push([x, Math.sqrt(Math.max(0, 1 - t * t)) * (rz + Math.sin(x * 0.8 + seed) * wobble)]);
  }
  return out;
}

const duck = (x: number, z: number, y: number): BoxPart[] => [
  vb(x, y, z, x + 1.6, y + 0.9, z + 1, '#ffffff'),
  vb(x + 1.1, y + 0.9, z + 0.2, x + 1.8, y + 1.6, z + 0.8, '#3f7f5a'),
  vb(x + 1.8, y + 1.1, z + 0.35, x + 2.3, y + 1.35, z + 0.65, '#f2a43a'),
];

const pond: Model = (variant, { palette, snow }) => {
  const water = snow ? ICE : WATER;
  const deep = snow ? shade(ICE, -0.05) : WATER_DEEP;
  const parts: BoxPart[] = [vb(-11.5, 0, -11.5, 11.5, 0.3, 11.5, palette.grass[0])];
  for (const [x, half] of blob(-10, 10, 8, 1.2, variant)) {
    parts.push(vb(x, 0.1, -half - 1, x + 1, 0.45, half + 1, snow ? SNOW : SAND));
    parts.push(vb(x, 0.2, -half, x + 1, 0.55, half, Math.abs(x) < 5 && half > 4 ? deep : water));
  }
  if (!snow) {
    parts.push(...duck(-3, -1, 0.55), ...duck(2, 2.5, 0.55));
    for (const [x, z] of [[-6, 3], [4, -4], [1, 5]]) parts.push(vb(x, 0.55, z, x + 1.4, 0.65, z + 1.2, '#7fb85a'));
  }
  for (const [x, z] of [[-10, 5], [-9.4, 6.2], [8.6, -6.4], [9.2, -5.2], [-8, -6]]) parts.push(vb(x, 0.3, z, x + 0.4, 3.4, z + 0.4, REED), vb(x - 0.05, 3.4, z - 0.05, x + 0.45, 4.2, z + 0.45, '#7a5a3c'));
  // a little dock and a bench
  parts.push(vb(-2, 0.5, 7.5, 2, 1, 11, ART.wood), vb(-2, 0, 10.6, -1.5, 1, 11.1, shade(ART.wood, -0.2)), vb(1.5, 0, 10.6, 2, 1, 11.1, shade(ART.wood, -0.2)));
  parts.push(vb(6, 1.6, 8.6, 10, 2, 10, ART.wood), vb(6, 2, 9.6, 10, 3.4, 10, ART.wood));
  return parts;
};

const hill: Model = (variant, { palette, snow }) => {
  const g = snow ? SNOW : palette.grass[0];
  const top = snow ? shade(SNOW, -0.02) : palette.leaves[1];
  const parts: BoxPart[] = [];
  const layers = 7;
  for (let i = 0; i < layers; i++) {
    const r = 11.5 - i * 1.5;
    const ox = -i * 0.4;
    // a rounded layer: an octagon of two boxes
    parts.push(vb(ox - r, i * 1.4, -r * 0.7, ox + r, (i + 1) * 1.4, r * 0.7, i < 3 ? g : top), vb(ox - r * 0.7, i * 1.4, -r, ox + r * 0.7, (i + 1) * 1.4, r, i < 3 ? g : top));
  }
  // steps up the front, a bench and a lone spruce on top
  for (let i = 0; i < 5; i++) parts.push(vb(3 - i * 0.4, i * 1.4, 10.8 - i * 1.5, 5.4 - i * 0.4, i * 1.4 + 1.5, 11.8 - i * 1.5, STONE));
  const topY = layers * 1.4;
  parts.push(vb(-3.5, topY, 0.5, 0, topY + 0.5, 1.6, ART.wood), vb(-3.5, topY + 0.5, 0.5, 0, topY + 1.8, 0.9, ART.wood));
  parts.push(...vmove(variant % 2 === 0 ? spruce(variant) : leafyTree(variant), -4, topY, -3));
  if (!snow) for (let i = 0; i < 6; i++) parts.push(vb(-10 + i * 3.4, 1.4, 6 + (i % 2), -9.4 + i * 3.4, 2.1, 6.6 + (i % 2), ['#e9c46a', '#ffffff', '#e3a1a6'][i % 3]));
  return parts;
};

const creek: Model = (variant, { palette, snow }) => {
  const water = snow ? ICE : WATER;
  const parts: BoxPart[] = [vb(-11.5, 0, -11.5, 11.5, 0.3, 11.5, palette.grass[1])];
  // a winding creek from the back-left to the front-right, one column per voxel
  for (let x = -12; x < 12; x++) {
    const zc = Math.sin((x + variant) * 0.28) * 4 - x * 0.35;
    parts.push(vb(x, 0.1, zc - 3.2, x + 1, 0.4, zc + 3.2, snow ? SNOW : '#b8a37a'));
    parts.push(vb(x, 0.15, zc - 2.2, x + 1, 0.5, zc + 2.2, x % 4 === 0 ? shade(water, 0.06) : water));
  }
  for (const [x, z] of [[-9, 6], [-4, -4], [5, 6.5], [8, -3]]) parts.push(vb(x, 0.3, z, x + 1.6, 1.2, z + 1.2, STONE), vb(x + 0.3, 1.2, z + 0.2, x + 1.2, 1.6, z + 1, shade(STONE, 0.08)));
  // an arched footbridge across the middle
  const bz = Math.sin(variant * 0.28) * 4;
  for (let i = 0; i < 7; i++) {
    const h = [0.6, 1.2, 1.6, 1.8, 1.6, 1.2, 0.6][i];
    parts.push(vb(-2, h, bz - 4.5 + i * 1.3, 2, h + 0.5, bz - 3.2 + i * 1.3, ART.wood));
  }
  parts.push(vb(-2.2, 1.6, bz - 4.5, -1.8, 3.4, bz + 4.6, shade(ART.wood, -0.15)), vb(1.8, 1.6, bz - 4.5, 2.2, 3.4, bz + 4.6, shade(ART.wood, -0.15)));
  for (const [x, z] of [[-11, -8], [-10.4, -7], [9.6, 8], [10.2, 9]]) parts.push(vb(x, 0.3, z, x + 0.4, 3, z + 0.4, REED));
  return parts;
};

const bigPark: Model = (variant, { palette }) => {
  const parts: BoxPart[] = [vb(-11.5, 0, -11.5, 11.5, 0.3, 11.5, palette.grass[0])];
  parts.push(vb(-11.5, 0.3, 1, 11.5, 0.5, 3.4, palette.path[0]));
  const trees: [number, number, boolean][] = variant % 2 === 0 ? [[-7, -7, false], [0, -8, true], [7, -6, false], [-8, 8, true], [8, 8, false]] : [[-6, -6, true], [6, -6.5, true], [-1, -7.5, false], [-7.5, 7, false], [7, 7, true]];
  // M23 designs (variants 2–3) bring the newer tree shapes
  const fresh = variant % 4 >= 2;
  const leafy = [N.shadeTree, N.ornamentalTree, N.oliveTree];
  const evergreen = [N.tallPine, N.firTree, N.coneTree];
  trees.forEach(([x, z, conifer], i) =>
    parts.push(...vmove(fresh ? asSway((conifer ? evergreen : leafy)[(variant + i) % 3].build(variant + i)) : conifer ? spruce(variant + i) : leafyTree(variant + i), x, 0.3, z)),
  );
  // picnic table, bench and a frisbee on the grass
  parts.push(vb(-2.5, 1.6, 6, 2.5, 2, 9, ART.wood), vb(-2.5, 0.3, 5.2, 2.5, 1, 5.8, ART.wood), vb(-2.5, 0.3, 9.2, 2.5, 1, 9.8, ART.wood), vb(-0.3, 0.3, 7.2, 0.3, 1.6, 7.8, shade(ART.wood, -0.2)));
  parts.push(vb(4, 1.4, -1.8, 8, 1.8, -0.6, ART.wood), vb(4, 1.8, -1.8, 8, 3, -1.4, ART.wood));
  parts.push(vb(-5, 0.35, -2, -3.6, 0.6, -0.6, '#e46a5c'));
  return parts;
};

const flagPole = (x: number, z: number, h = 14): BoxPart[] => [
  vb(x - 0.25, 0, z - 0.25, x + 0.25, h, z + 0.25, '#9aa1ab'),
  vb(x + 0.25, h - 3, z - 0.15, x + 1.25, h - 0.6, z + 0.15, '#e0453c'),
  vb(x + 1.25, h - 3, z - 0.15, x + 3.25, h - 0.6, z + 0.15, '#ffffff'),
  vb(x + 1.95, h - 2.2, z - 0.2, x + 2.55, h - 1.4, z + 0.2, '#e0453c'),
  vb(x + 3.25, h - 3, z - 0.15, x + 4.25, h - 0.6, z + 0.15, '#e0453c'),
];

const school: Model = (variant, { palette }) => {
  const brick = variant % 2 === 0;
  const wall = brick ? '#d98a6a' : '#f3dcc0';
  const roof = brick ? '#5a6d8a' : '#ef9b7f';
  const parts: BoxPart[] = [vb(-11.5, 0, -11.5, 11.5, 0.3, 11.5, palette.path[0])];
  if (variant % 4 === 2) parts.push(...N.brickSchool.build(variant));
  else if (variant % 4 === 3) parts.push(...N.schoolhouse.build(variant));
  else {
    parts.push(vb(-11, 0.3, -11, 5, 9, -2, wall), vb(-11.4, 9, -11.4, 5.4, 9.6, -1.6, ART.trim), ...hipRoof(-11, 5, -11, -2, 10.6, roof, 0.6, 3));
    for (const x of [-10, -6.5, 1]) parts.push(...windowZ(x, x + 2.5, 1.8, 4, -2, ART.glass), ...windowZ(x, x + 2.5, 5.4, 7.6, -2, ART.glass));
    parts.push(...windowX(-9, -4, 1.8, 4, 5, ART.glass), ...windowX(-9, -4, 5.4, 7.6, 5, ART.glass));
    parts.push(vb(-4, 0.3, -2, -1, 4.2, -1.6, ART.door), vb(-5, 4.4, -2, 0, 5, 1, shade(roof, -0.1)), vb(-4.6, 5.4, -1.9, -0.4, 7.2, -1.5, '#fff6e3'));
  }
  // playing field with a goal, a bike rack and the flag
  parts.push(vb(-11, 0.3, 2, 6, 0.5, 11, '#9fd08a'), vb(-11, 0.5, 6.3, 6, 0.55, 6.7, '#ffffff'), vb(4.6, 0.5, 4, 5, 3, 9, '#ffffff'));
  parts.push(vb(-10.6, 0.5, 4, -10.2, 3, 9, '#ffffff'), vb(-10.6, 2.6, 4, -10.2, 3, 9, '#ffffff'));
  for (let i = 0; i < 4; i++) parts.push(vb(7.5, 0.3, -1 + i * 1.6, 8, 1.8, -0.4 + i * 1.6, '#8a8f99'));
  parts.push(...flagPole(6.5, -9));
  return parts;
};

/** Symbolic station (a station close by, but no track inside the community): a short platform, a shelter and a parked car. */
const ctrainStationFeature: Model = (variant, ctx) => {
  const parts: BoxPart[] = [vb(-11.5, 0, -11.5, 11.5, 0.3, 11.5, ctx.palette.path[0])];
  parts.push(vb(-11.5, 0.3, -11.5, 11.5, 0.6, -3, '#b9b2a6'));
  for (let x = -11; x < 11.5; x += 2) parts.push(vb(x, 0.6, -10.5, x + 0.8, 0.9, -4, '#8a6a4f'));
  parts.push(vb(-11.5, 0.9, -9.2, 11.5, 1.3, -8.6, '#7d838c'), vb(-11.5, 0.9, -6.4, 11.5, 1.3, -5.8, '#7d838c'));
  // a parked car on the track (along x) and the platform beside it, safety edge towards the track
  parts.push(...vmove(vturn(ctrainCarParts(true, true), 1), -1, 1.1, -7.3));
  parts.push(...vmove(vturn(stationPlatformParts(['Red'], 2, variant), 2), 0, 0, 5));
  return parts;
};

export const FEATURE_VOXELS: Record<FeatureKey, Model> = {
  'ctrain-station': ctrainStationFeature,
  pond,
  hill,
  creek,
  'big-park': bigPark,
  school,
};

// --- CTrain ---------------------------------------------------------------------------------

/**
 * One CTrain car (Calgary light-rail look: white body, red band, dark window band, a pantograph on
 * the roof), built along +z (heading 0), centred, wheels at y = 0. About 0.9 tile long.
 */
export function ctrainCarParts(front: boolean, back: boolean): BoxPart[] {
  const L = 5.2;
  const parts: BoxPart[] = [
    vb(-2.1, 0, -L + 0.6, 2.1, 0.7, L - 0.6, '#3a3f4a'), // bogies / skirt
    vb(-2.2, 0.7, -L, 2.2, 4.6, L, '#f4f4f2'),
    vb(-2.25, 0.9, -L - 0.02, 2.25, 1.8, L + 0.02, '#d9453c'), // red band
    vb(-2.25, 2.4, -L + 0.8, 2.25, 3.8, L - 0.8, '#3b4a63'), // window band
    vb(-1.8, 4.6, -L + 0.4, 1.8, 5.1, L - 0.4, '#c9ccd2'), // roof
  ];
  for (let z = -L + 1.4; z < L - 1; z += 2.2) parts.push(vb(2.25, 2.6, z, 2.3, 3.6, z + 1.6, '#9fc3dd', 'glow'), vb(-2.3, 2.6, z, -2.25, 3.6, z + 1.6, '#9fc3dd', 'glow'));
  parts.push(vb(-0.15, 5.1, -1.2, 0.15, 6.6, -0.9, '#5d6470'), vb(-1.2, 6.6, -1.4, 1.2, 6.8, -0.7, '#5d6470')); // pantograph
  if (front) parts.push(vb(-1.8, 2.4, L, 1.8, 3.9, L + 0.25, '#3b4a63'), vb(-1.6, 1, L, -0.8, 1.6, L + 0.3, '#ffe7a3', 'glow'), vb(0.8, 1, L, 1.6, 1.6, L + 0.3, '#ffe7a3', 'glow'), vb(-1, 4, L, 1, 4.5, L + 0.2, '#ffcc2e', 'glow'));
  if (back) parts.push(vb(-1.6, 1, -L - 0.3, -0.8, 1.6, -L, '#ff5a4f', 'glow'), vb(0.8, 1, -L - 0.3, 1.6, 1.6, -L, '#ff5a4f', 'glow'));
  return parts;
}

/**
 * A station platform two tiles long (canonical: along x, track side towards +z): concrete deck with a
 * yellow safety edge on the track side, a glass shelter with a roof in the line colour, a bench,
 * a ticket machine, a lamp and a sign pole.
 */
export function stationPlatformParts(lines: string[], lengthTiles: number, variant: number): BoxPart[] {
  const hx = lengthTiles * 6 - 0.4;
  const roof = lines.length > 1 ? '#8b6fc4' : lines[0] === 'Blue' ? '#3f7fd6' : '#d94a4a';
  const parts: BoxPart[] = [
    vb(-hx, 0, -5.6, hx, 1.8, 5.6, '#e7dcc8'),
    vb(-hx, 1.8, 4.4, hx, 1.9, 5.4, '#f2c94c'),
    vb(-hx, 1.8, 4.1, hx, 1.85, 4.4, '#ffffff'),
  ];
  const sx = Math.min(hx - 1, 6);
  parts.push(vb(-sx, 1.8, -4.6, sx, 7.2, -4.2, '#bfe0ee'));
  for (const x of [-sx, 0, sx]) parts.push(vb(x - 0.3, 1.8, -4.8, x + 0.3, 8, -4.2, '#5d6470'), vb(x - 0.3, 1.8, 0.4, x + 0.3, 8, 1, '#5d6470'));
  parts.push(vb(-sx - 0.8, 8, -5.4, sx + 0.8, 8.8, 1.8, roof), vb(-sx - 0.8, 8.8, -5.4, sx + 0.8, 9.1, 1.8, shade(roof, 0.2)));
  parts.push(vb(-3.5, 1.8, -3.6, 3.5, 2.8, -2.4, ART.wood), vb(-3.5, 2.8, -3.9, 3.5, 4.2, -3.5, ART.wood));
  parts.push(vb(hx - 3, 1.8, -3, hx - 1.4, 5.6, -1.6, variant % 2 ? '#d94a4a' : '#3f7fd6'), vb(hx - 2.8, 4, -1.65, hx - 1.6, 5, -1.55, '#bfe3ff', 'glow'));
  parts.push(vb(-hx + 1, 1.8, 2, -hx + 1.5, 10, 2.5, '#5d6470'), vb(-hx + 0.6, 9, 1.9, -hx + 3.4, 10.4, 2.6, '#ffffff'), vb(-hx + 0.9, 9.3, 2.55, -hx + 3.1, 10.1, 2.65, roof));
  parts.push(vb(hx - 1.2, 1.8, 2.6, hx - 0.8, 9.6, 3, '#5d6470'), vb(hx - 1.6, 9.6, 2.2, hx - 0.4, 10.6, 3.4, '#ffe7a3', 'glow'));
  return parts;
}

/** An overhead-wire pole beside the track (built at the origin, arm towards +x). */
export function catenaryPole(): BoxPart[] {
  return [vb(-0.3, 0, -0.3, 0.3, 9, 0.3, '#8a8f99'), vb(-0.3, 8.4, -0.2, 4.6, 8.8, 0.2, '#8a8f99'), vb(4.2, 7.6, -0.15, 4.5, 8.4, 0.15, '#5d6470')];
}

/** A railway crossing sign (white crossbuck, two red lights), built at the origin. */
export function crossingSign(): BoxPart[] {
  return [
    vb(-0.25, 0, -0.25, 0.25, 6.5, 0.25, '#e9ecef'),
    { layer: 'solid', p: [0, 6.2 / 12, 0], s: [3.4 / 12, 0.5 / 12, 0.15 / 12], c: '#ffffff', r: [0, 0, 0.6] },
    { layer: 'solid', p: [0, 6.2 / 12, 0], s: [3.4 / 12, 0.5 / 12, 0.15 / 12], c: '#ffffff', r: [0, 0, -0.6] },
    vb(-1.3, 4.2, -0.3, -0.5, 5, 0.3, '#ff5a4f', 'glow'),
    vb(0.5, 4.2, -0.3, 1.3, 5, 0.3, '#ff5a4f', 'glow'),
    vb(-1.5, 4.6, -0.2, 1.5, 4.7, 0.2, '#2f3448'),
  ];
}

/** "Next station" sign post (board facing +z). */
export function railEndSignParts(): BoxPart[] {
  return [vb(-0.3, 0, -0.3, 0.3, 7, 0.3, '#5d6470'), vb(-2.6, 5, -0.25, 2.6, 7.4, 0.25, '#ffffff'), vb(-2.4, 5.2, 0.2, 2.4, 7.2, 0.35, '#3b4260'), vb(1.2, 5.8, 0.3, 2.2, 6.6, 0.4, '#ffcc2e')];
}

export const FEATURE_VARIANTS: Record<FeatureKey, number> = { 'ctrain-station': 2, pond: 2, hill: 2, creek: 2, 'big-park': 4, school: 4 };
