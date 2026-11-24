/**
 * Code-built box models (MVP art, requirement.md §19.0/§19.4).
 * Each builder returns parts in local coordinates around the object's footprint centre at
 * ground level. Building models fit their lot (w × d tiles). The Art Pass can replace any
 * of them per asset key without touching game logic (§20.4).
 */
import type { BuildingObject, ObjectOf } from '../layout';
import type { FeatureKey } from '../plan/features';
import { houseParts } from './voxel/houses';
import { ACCENTS, type MoodPalette, type VitalityMood } from '../mood';
import { asGhost, box, translate, type BoxPart } from './boxes';
import { BUILDING_VOXELS, placeholderModel } from './voxel/buildings';
import { lampPost } from './voxel/samples';
import { vturn } from './voxel/voxel';

export interface BuildCtx {
  palette: MoodPalette;
  mood: VitalityMood;
}

const WALL = '#fbf3e4';
const WOOD = '#a7825f';
const DOOR = '#a77b5a';
const DARK_WINDOW = '#64748b';
const WARM_LIGHT = '#ffd98a';
const SNOW = '#f6f8fb';
const ICE = '#d4ecf7';
const STONE = '#c9c2b8';
const GOLD = '#f2c94c';
const SILHOUETTE = '#c9c3e6';

/** Scale parts made for a 2×2 lot to another footprint. */
function fit(parts: BoxPart[], w: number, d: number): BoxPart[] {
  const sx = w / 2;
  const sz = d / 2;
  const sy = Math.min(sx, sz);
  return parts.map((b) => ({ ...b, p: [b.p[0] * sx, b.p[1] * sy, b.p[2] * sz], s: [b.s[0] * sx, b.s[1] * sy, b.s[2] * sz] }));
}

/** Upgrades (level 2+) add one gold marker per level at the front corner (max 4). */
function levelMarkers(level: number, w: number, d: number): BoxPart[] {
  const extra = Math.min(Math.max(level - 1, 0), 4);
  return Array.from({ length: extra }, (_, i) => box('glow', w / 2 - 0.15 - i * 0.14, 0, d / 2 - 0.12, 0.09, 0.22, 0.09, GOLD));
}

// --- Small things ----------------------------------------------------------------

/** A resident's house (Art Pass): its type, colours and facing come from the layout (requirement.md §7.2). */
export function house(item: ObjectOf<'house'>): BoxPart[] {
  return houseParts(item.houseType, item.colorIndex, item.facing, item.activeToday);
}

/** The M1 box house (kept for comparison in the asset gallery). */
export function boxHouse(item: Pick<ObjectOf<'house'>, 'colorIndex' | 'activeToday'>): BoxPart[] {
  const roof = ACCENTS[item.colorIndex % ACCENTS.length];
  const win = item.activeToday ? 'glow' : 'solid';
  const winColour = item.activeToday ? WARM_LIGHT : DARK_WINDOW;
  return [
    box('solid', 0, 0, 0, 0.72, 0.5, 0.72, WALL),
    box('solid', 0, 0.5, 0, 0.86, 0.14, 0.86, roof),
    box('solid', 0, 0.64, 0, 0.62, 0.13, 0.62, roof),
    box('solid', 0, 0.77, 0, 0.34, 0.1, 0.34, roof),
    box('solid', 0.2, 0.6, -0.18, 0.1, 0.34, 0.1, '#c9b8a6'),
    box('solid', 0.13, 0, 0.36, 0.16, 0.28, 0.03, DOOR),
    box(win, -0.16, 0.2, 0.365, 0.16, 0.14, 0.02, winColour),
    box(win, 0.365, 0.2, -0.15, 0.02, 0.14, 0.16, winColour),
    box(win, 0.365, 0.2, 0.15, 0.02, 0.14, 0.16, winColour),
  ];
}


export function tree(item: ObjectOf<'tree'>, { palette, mood }: BuildCtx): BoxPart[] {
  const leaves = palette.leaves[item.variant % 2];
  const k = mood === 'sleepy' ? 0.85 : 1;
  const parts: BoxPart[] = [box('solid', 0, 0, 0, 0.14, 0.32, 0.14, palette.trunk)];
  let top: number;
  if (item.variant === 0) {
    parts.push(box('solid', 0, 0.3, 0, 0.62 * k, 0.5 * k, 0.62 * k, leaves));
    parts.push(box('solid', 0, 0.3 + 0.5 * k, 0, 0.4 * k, 0.3 * k, 0.4 * k, leaves));
    top = 0.3 + 0.8 * k;
  } else if (item.variant === 1) {
    parts.push(box('solid', 0, 0.3, 0, 0.48 * k, 0.75 * k, 0.48 * k, leaves));
    parts.push(box('solid', 0, 0.3 + 0.75 * k, 0, 0.3 * k, 0.28 * k, 0.3 * k, leaves));
    top = 0.3 + 1.03 * k;
  } else {
    parts.push(box('solid', 0, 0.3, 0, 0.7 * k, 0.55 * k, 0.7 * k, leaves));
    top = 0.3 + 0.55 * k;
  }
  if (mood === 'sleepy') parts.push(box('solid', 0, top, 0, 0.34, 0.07, 0.34, SNOW));
  return parts;
}

/** A pathway light (voxel lamp post) at the tile's corner. */
export function lamp(): BoxPart[] {
  return translate(lampPost(), 0.38, 0.38);
}

const FLOWER_SPOTS = [
  [-0.25, -0.2],
  [0.2, -0.28],
  [0.05, 0.12],
  [-0.22, 0.26],
  [0.28, 0.22],
] as const;

export function flowers(item: ObjectOf<'flowers'>): BoxPart[] {
  return FLOWER_SPOTS.slice(0, 3 + (item.variant % 3)).map(([x, z], i) =>
    box('solid', x, 0, z, 0.1, 0.12, 0.1, ACCENTS[(item.variant + i) % ACCENTS.length]),
  );
}

export function snowPile(item: ObjectOf<'snow-pile'>): BoxPart[] {
  const dx = item.variant % 2 === 0 ? 0.1 : -0.1;
  return [box('solid', dx, 0, 0, 0.5, 0.15, 0.4, SNOW), box('solid', dx - 0.05, 0.15, 0.03, 0.28, 0.11, 0.22, SNOW)];
}

// --- Lots without a building ---------------------------------------------------------

/** A reserved plot: corner stakes with little flags (orange: future building, blue: Main Street). */
export function reservedPlot(item: ObjectOf<'reserved-plot'>): BoxPart[] {
  const flag = item.lotKind === 'main-street' ? '#8ec5ea' : '#f39a52';
  const hx = item.w / 2 - 0.12;
  const hz = item.d / 2 - 0.12;
  const parts: BoxPart[] = [];
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    parts.push(box('solid', x, 0, z, 0.06, 0.32, 0.06, WOOD));
    parts.push(box('solid', x + 0.06, 0.24, z, 0.1, 0.07, 0.02, flag));
  }
  return parts;
}

export function constructionSite(item: ObjectOf<'construction-site'>): BoxPart[] {
  const { w, d } = item;
  const pole = '#e0a96d';
  const hx = w / 2 - 0.35;
  const hz = d / 2 - 0.35;
  const parts: BoxPart[] = [
    box('solid', 0, 0, 0, w - 0.2, 0.03, d - 0.2, '#d9c7a5'),
    box('solid', 0, 0.03, 0, w - 0.7, 0.12, d - 0.7, STONE),
    box('solid', w / 2 - 0.22, 0.03, d / 2 - 0.22, 0.12, 0.2, 0.12, '#f39a52'),
  ];
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) parts.push(box('solid', x, 0.03, z, 0.06, 1.05, 0.06, pole));
  for (const y of [0.5, 1.02]) {
    parts.push(box('solid', 0, y, -hz, hx * 2, 0.05, 0.06, pole), box('solid', 0, y, hz, hx * 2, 0.05, 0.06, pole));
    parts.push(box('solid', -hx, y, 0, 0.06, 0.05, hz * 2, pole), box('solid', hx, y, 0, 0.06, 0.05, hz * 2, pole));
  }
  if (item.progress >= 0.5) {
    const beam = '#b98b5e';
    const ix = hx - 0.17;
    const iz = hz - 0.17;
    for (const [x, z] of [[-ix, -iz], [ix, -iz], [-ix, iz], [ix, iz]]) parts.push(box('solid', x, 0.15, z, 0.1, 0.75, 0.1, beam));
    parts.push(box('solid', 0, 0.9, 0, ix * 2 + 0.1, 0.08, iz * 2 + 0.1, beam));
    parts.push(box('solid', 0, 0.15, -iz, ix * 2, 0.38, 0.06, WALL));
  } else {
    parts.push(box('solid', -0.2, 0.15, -0.15, 0.4, 0.14, 0.3, '#c8a27a'), box('solid', 0.25, 0.15, 0.2, 0.3, 0.2, 0.3, '#b9b2a6'));
  }
  return parts;
}

// --- Buildings of the tree -------------------------------------------------------------

type Spec = { w: number; d: number; level: number };
type Builder = (s: Spec, ctx: BuildCtx) => BoxPart[];

/** Small scaffold at the back corner while a built building is upgraded in place. */
function upgradeScaffold(w: number, d: number): BoxPart[] {
  const pole = '#e0a96d';
  const x = -w / 2 + 0.2;
  const z = -d / 2 + 0.2;
  return [
    box('solid', x, 0, z, 0.05, 0.8, 0.05, pole),
    box('solid', x + 0.35, 0, z, 0.05, 0.8, 0.05, pole),
    box('solid', x + 0.175, 0.4, z, 0.4, 0.04, 0.05, pole),
    box('solid', x + 0.175, 0.78, z, 0.4, 0.04, 0.05, pole),
    box('solid', x + 0.2, 0, z + 0.3, 0.22, 0.16, 0.18, '#c8a27a'),
  ];
}

/**
 * The Art Pass model of a tree building (placeholder for unknown keys), turned to its facing.
 * Models are written for the lot's canonical size; a turned lot (e.g. 2×3 instead of 3×2) comes
 * with an odd facing from the layout, so the turn also fits the model to the lot.
 */
function treeModel(key: string, w: number, d: number, level: number, variant: number, facing: number, ctx: BuildCtx): BoxPart[] {
  const make = BUILDING_VOXELS[key];
  if (!make) return placeholderModel({ w, d, level, variant }, ctx);
  const turned = facing % 2 === 1;
  return vturn(make({ w: turned ? d : w, d: turned ? w : d, level, variant }, ctx), facing);
}

/** A built building of the tree (placeholder for unknown keys), with upgrade markers. */
export function building(item: BuildingObject, ctx: BuildCtx): BoxPart[] {
  return [...treeModel(item.buildingKey, item.w, item.d, item.level, item.variant, item.facing, ctx), ...levelMarkers(item.level, item.w, item.d), ...(item.upgrade ? upgradeScaffold(item.w, item.d) : [])];
}

// --- Signature features (feature library, requirement.md §7.9) ------------------------
// Symbolic blocks on a spare lot (2×2), not the real size or position.

const WATER = '#8ec5ea';
const WATER_DEEP = '#6fb1de';
const SAND = '#eadcb8';
const REED = '#7fae5b';

const pond: Builder = ({ w, d }, { mood }) => {
  const water = mood === 'sleepy' ? ICE : WATER;
  return fit(
    [
      box('solid', 0, 0, 0, 1.85, 0.04, 1.7, SAND),
      box('solid', 0.05, 0.02, 0.05, 1.5, 0.05, 1.3, water),
      box('solid', -0.2, 0.025, -0.15, 0.9, 0.05, 0.7, mood === 'sleepy' ? '#c3e1f0' : WATER_DEEP),
      ...[[-0.78, 0.55], [-0.68, 0.68], [0.75, -0.62]].map(([x, z]) => box('solid', x, 0.04, z, 0.06, 0.3, 0.06, REED)),
      // a duck (and its head)
      box('solid', 0.35, 0.07, 0.3, 0.16, 0.08, 0.1, '#ffffff'),
      box('solid', 0.42, 0.13, 0.3, 0.07, 0.07, 0.07, '#ffffff'),
      box('solid', 0.47, 0.14, 0.3, 0.05, 0.03, 0.04, '#f2a43a'),
      // a little wooden dock
      box('solid', -0.6, 0.06, 0.62, 0.36, 0.04, 0.32, WOOD),
    ],
    w,
    d,
  );
};

const creek: Builder = ({ w, d }, { palette, mood }) => {
  const water = mood === 'sleepy' ? ICE : WATER;
  return fit(
    [
      box('solid', 0, 0, 0, 1.9, 0.03, 1.9, palette.grass[1]),
      // a winding stream across the lot
      box('solid', -0.6, 0.02, -0.55, 0.7, 0.04, 0.32, water),
      box('solid', -0.15, 0.02, -0.25, 0.32, 0.04, 0.6, water),
      box('solid', 0.25, 0.02, 0.15, 0.6, 0.04, 0.32, water),
      box('solid', 0.62, 0.02, 0.55, 0.32, 0.04, 0.5, water),
      ...[[-0.85, -0.3], [0.1, -0.55], [0.55, -0.05], [0.25, 0.6]].map(([x, z]) => box('solid', x, 0.03, z, 0.14, 0.08, 0.12, STONE)),
      // footbridge
      box('solid', -0.15, 0.06, -0.25, 0.56, 0.05, 0.22, WOOD),
      box('solid', -0.15, 0.11, -0.36, 0.56, 0.1, 0.03, WOOD),
      box('solid', -0.15, 0.11, -0.14, 0.56, 0.1, 0.03, WOOD),
      box('solid', 0.75, 0.03, -0.7, 0.08, 0.26, 0.08, REED),
    ],
    w,
    d,
  );
};

const hill: Builder = ({ w, d }, { palette, mood }) => {
  const g = mood === 'sleepy' ? SNOW : palette.grass[0];
  const top = mood === 'sleepy' ? SNOW : palette.leaves[1];
  return fit(
    [
      box('solid', 0, 0, 0, 1.9, 0.22, 1.9, g),
      box('solid', 0.1, 0.22, 0.05, 1.45, 0.24, 1.4, g),
      box('solid', 0.2, 0.46, 0.1, 1.0, 0.24, 0.95, top),
      box('solid', 0.25, 0.7, 0.15, 0.55, 0.18, 0.5, top),
      // stepping stones up the front and a flag on top
      ...[0.82, 0.62].map((z, i) => box('solid', -0.5 + i * 0.1, 0.22 + i * 0.24, z - 0.1, 0.22, 0.04, 0.16, STONE)),
      box('solid', 0.25, 0.88, 0.15, 0.04, 0.55, 0.04, '#8a8f99'),
      box('solid', 0.36, 1.25, 0.15, 0.2, 0.13, 0.02, ACCENTS[0]),
    ],
    w,
    d,
  );
};

const bigPark: Builder = ({ w, d }, { palette, mood }) => {
  const leaves = palette.leaves;
  const parts: BoxPart[] = [
    box('solid', 0, 0, 0, 1.92, 0.04, 1.92, palette.grass[0]),
    box('solid', 0.05, 0.04, 0.2, 1.7, 0.02, 0.22, palette.path[0]),
  ];
  // three tall trees (bigger than island trees) and a picnic table
  for (const [x, z, h, v] of [[-0.55, -0.5, 1.1, 0], [0.4, -0.6, 0.9, 1], [0.6, 0.65, 1.0, 0]] as const) {
    parts.push(box('solid', x, 0.04, z, 0.14, 0.4, 0.14, palette.trunk));
    parts.push(box('solid', x, 0.4, z, 0.62, h * 0.6, 0.62, leaves[v]));
    parts.push(box('solid', x, 0.4 + h * 0.6, z, 0.4, h * 0.3, 0.4, leaves[v]));
    if (mood === 'sleepy') parts.push(box('solid', x, 0.4 + h * 0.9, z, 0.3, 0.06, 0.3, SNOW));
  }
  parts.push(
    box('solid', -0.45, 0.04, 0.62, 0.5, 0.05, 0.3, WOOD),
    box('solid', -0.45, 0.24, 0.62, 0.5, 0.04, 0.3, '#b88a64'),
    box('solid', -0.45, 0.04, 0.62, 0.06, 0.2, 0.06, WOOD),
  );
  return fit(parts, w, d);
};

const ctrainStation: Builder = ({ w, d }) => {
  const rail = '#8a8f99';
  return fit(
    [
      box('solid', 0, 0, 0, 1.9, 0.03, 1.9, '#d9cdb5'),
      // track
      box('solid', 0, 0.03, -0.45, 1.95, 0.03, 0.5, '#b9b2a6'),
      box('solid', 0, 0.06, -0.57, 1.95, 0.03, 0.04, rail),
      box('solid', 0, 0.06, -0.33, 1.95, 0.03, 0.04, rail),
      // a red-and-white CTrain car
      box('solid', -0.1, 0.09, -0.45, 1.3, 0.42, 0.42, '#f4f4f4'),
      box('solid', -0.1, 0.09, -0.45, 1.32, 0.12, 0.44, '#d94a4a'),
      ...[-0.55, -0.25, 0.05, 0.35].map((x) => box('glow', x, 0.32, -0.23, 0.18, 0.13, 0.02, '#cfe8f7')),
      box('solid', -0.1, 0.51, -0.45, 0.04, 0.16, 0.04, '#5d6470'),
      // platform with a shelter and a sign
      box('solid', 0, 0.03, 0.25, 1.9, 0.14, 0.7, '#e7dcc8'),
      box('solid', 0, 0.17, 0.52, 0.9, 0.5, 0.05, '#b3d8ec'),
      box('solid', -0.45, 0.17, 0.4, 0.05, 0.55, 0.05, '#5d6470'),
      box('solid', 0.45, 0.17, 0.4, 0.05, 0.55, 0.05, '#5d6470'),
      box('solid', 0, 0.72, 0.38, 1.05, 0.06, 0.42, '#d94a4a'),
      box('solid', 0.78, 0.17, 0.25, 0.05, 0.6, 0.05, '#5d6470'),
      box('solid', 0.78, 0.66, 0.25, 0.3, 0.16, 0.04, '#ffffff'),
    ],
    w,
    d,
  );
};

const school: Builder = ({ w, d }, { palette }) =>
  fit(
    [
      box('solid', 0, 0, 0, 1.9, 0.03, 1.9, palette.path[0]),
      box('solid', -0.25, 0.03, -0.25, 1.3, 0.62, 0.9, '#f0d9b5'),
      box('solid', -0.25, 0.65, -0.25, 1.42, 0.12, 1.02, '#d9776a'),
      box('solid', -0.25, 0.77, -0.25, 0.5, 0.22, 0.4, '#d9776a'),
      box('solid', -0.25, 0.82, -0.04, 0.2, 0.2, 0.02, '#ffffff'),
      box('solid', -0.25, 0.03, 0.21, 0.26, 0.36, 0.03, DOOR),
      ...[-0.7, -0.5, 0.0, 0.2].map((x) => box('glow', x, 0.35, 0.21, 0.14, 0.14, 0.02, WARM_LIGHT)),
      // flag pole and a small field with a goal
      box('solid', 0.75, 0.03, -0.7, 0.04, 0.95, 0.04, '#8a8f99'),
      box('solid', 0.86, 0.85, -0.7, 0.2, 0.12, 0.02, '#e05a5a'),
      box('solid', 0.3, 0.03, 0.62, 1.1, 0.02, 0.55, '#9fd08a'),
      box('solid', 0.8, 0.05, 0.62, 0.04, 0.26, 0.4, '#ffffff'),
    ],
    w,
    d,
  );

export const FEATURE_MODELS: Record<FeatureKey, Builder> = {
  'ctrain-station': ctrainStation,
  pond,
  hill,
  creek,
  'big-park': bigPark,
  school,
};

/** A signature feature on its spare lot. */
export function feature(item: ObjectOf<'feature'>, ctx: BuildCtx): BoxPart[] {
  return FEATURE_MODELS[item.featureKey]({ w: item.w, d: item.d, level: 1 }, ctx);
}

// --- CTrain (requirement.md §7.9) -----------------------------------------------------

const BALLAST = '#c9c2b8';
const SLEEPER = '#9b7a5c';
const RAIL = '#7d838c';
const DECK = '#b8a48c';

/**
 * A stretch of track along the smoothed line: ballast, two sleepers and two rails, rotated to the
 * stretch's direction (slightly longer so neighbouring stretches join without gaps).
 */
export function track(item: ObjectOf<'track'>): BoxPart[] {
  const len = Math.hypot(item.dx, item.dz);
  if (len < 1e-6) return [];
  const ang = Math.atan2(item.dx, item.dz); // rotation about y; boxes are long along z
  const r: [number, number, number] = [0, ang, 0];
  const mx = item.dx / 2;
  const mz = item.dz / 2;
  const ux = item.dx / len;
  const uz = item.dz / len;
  const px = uz; // perpendicular (right of travel)
  const pz = -ux;
  const L = len + 0.06;
  const parts: BoxPart[] = [box('solid', mx, 0, mz, 0.6, 0.03, L, BALLAST, r)];
  for (const k of [0.25, 0.75]) parts.push(box('solid', item.dx * k, 0.03, item.dz * k, 0.52, 0.03, 0.09, SLEEPER, r));
  for (const off of [-0.14, 0.14]) parts.push(box('solid', mx + px * off, 0.06, mz + pz * off, 0.05, 0.04, L, RAIL, r));
  return parts;
}

/** A track tile that needs more than the line: a rail bridge deck over water, or crossing planks on a path. */
export function rail(item: ObjectOf<'rail'>): BoxPart[] {
  const parts: BoxPart[] = [];
  if (item.overWater) {
    parts.push(box('solid', 0, -0.05, 0, 0.92, 0.06, 0.92, DECK));
    for (const [ox, oz] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) parts.push(box('solid', ox, -0.35, oz, 0.08, 0.3, 0.08, '#8a8f99'));
  }
  if (item.crossing) parts.push(box('solid', 0, 0.035, 0, 0.7, 0.03, 0.7, '#d8c3a0'));
  return parts;
}

/** A station platform beside the track: concrete platform, a shelter with a line-coloured roof, a sign. */
export function station(item: ObjectOf<'station'>): BoxPart[] {
  const long = item.along === 'x';
  const L = (long ? item.w : item.d) - 0.15;
  const roof = item.lines.length > 1 ? '#8b6fc4' : item.lines[0] === 'Blue' ? '#3f7fd6' : '#d94a4a';
  const xz = (a: number, c: number): [number, number] => (long ? [a, c] : [c, a]);
  const sz = (a: number, c: number): [number, number] => (long ? [a, c] : [c, a]);
  const part = (a: number, y: number, c: number, la: number, h: number, lc: number, col: string, layer: 'solid' | 'glow' = 'solid') => {
    const [x, z] = xz(a, c);
    const [w, d] = sz(la, lc);
    return box(layer, x, y, z, w, h, d, col);
  };
  return [
    part(0, 0, 0, L, 0.16, 0.82, '#e7dcc8'),
    part(0, 0.16, 0.36, L, 0.02, 0.06, '#f2c94c'), // yellow safety line... on the track side below
    part(0, 0.16, -0.32, L * 0.6, 0.48, 0.04, '#b3d8ec'),
    part(-L * 0.3, 0.16, -0.12, 0.05, 0.5, 0.05, '#5d6470'),
    part(L * 0.3, 0.16, -0.12, 0.05, 0.5, 0.05, '#5d6470'),
    part(0, 0.66, -0.15, L * 0.68, 0.06, 0.48, roof),
    part(L / 2 - 0.12, 0.16, 0.1, 0.05, 0.62, 0.05, '#5d6470'),
    part(L / 2 - 0.12, 0.66, 0.1, 0.05, 0.16, 0.3, '#ffffff'),
    part(-L * 0.15, 0.16, 0.05, 0.3, 0.1, 0.12, WOOD), // bench
    part(L * 0.1, 0.6, -0.15, 0.12, 0.05, 0.12, WARM_LIGHT, 'glow'),
  ];
}

/** A small signpost at the island edge where the track leaves (label: next station). */
export function railEnd(item: ObjectOf<'rail-end'>): BoxPart[] {
  // stands beside the track, on the side away from the travel direction
  const sx = item.dir.z !== 0 ? 0.42 : 0;
  const sz = item.dir.x !== 0 ? 0.42 : 0;
  return [
    box('solid', sx, 0, sz, 0.05, 0.55, 0.05, '#5d6470'),
    box('solid', sx, 0.45, sz, item.dir.x !== 0 ? 0.04 : 0.26, 0.16, item.dir.x !== 0 ? 0.26 : 0.04, '#ffffff'),
    box('solid', sx, 0.45, sz, item.dir.x !== 0 ? 0.05 : 0.08, 0.16, item.dir.x !== 0 ? 0.08 : 0.05, '#d94a4a'),
  ];
}

/** A locked (or ready) building: its model as a translucent ghost on its lot. */
export function silhouette(item: ObjectOf<'silhouette'>, ctx: BuildCtx): BoxPart[] {
  return asGhost(treeModel(item.buildingKey, item.w, item.d, 1, item.variant, item.facing, ctx), SILHOUETTE);
}
