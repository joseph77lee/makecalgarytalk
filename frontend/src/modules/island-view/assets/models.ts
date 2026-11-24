/**
 * Code-built box models (MVP art, requirement.md §19.0/§19.4).
 * Each builder returns parts in local coordinates around the object's footprint centre at
 * ground level. Building models fit their lot (w × d tiles). The Art Pass can replace any
 * of them per asset key without touching game logic (§20.4).
 */
import type { BuildingObject, ObjectOf } from '../layout';
import { houseParts } from './voxel/houses';
import { ACCENTS, type MoodPalette, type VitalityMood } from '../mood';
import { asGhost, box, translate, type BoxPart } from './boxes';
import { BUILDING_VOXELS, placeholderModel } from './voxel/buildings';
import { FEATURE_VOXELS, catenaryPole, crossingSign, railEndSignParts, stationPlatformParts } from './voxel/features';
import { shade } from './voxel/voxel';
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
const STONE = '#c9c2b8';
const GOLD = '#f2c94c';
const SILHOUETTE = '#c9c3e6';


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

// --- Signature features and CTrain (Art Pass models in voxel/features.ts) ------------------

/** A signature feature on its spare lot: the community's design, facing the path. */
export function feature(item: ObjectOf<'feature'>, ctx: BuildCtx): BoxPart[] {
  return vturn(FEATURE_VOXELS[item.featureKey](item.variant, ctx), item.facing);
}

const BALLAST = '#cbbfae';
const SLEEPER = '#8f6a4c';
const RAIL = '#7d838c';
const DECK = '#b8a48c';

/** Rotate parts about the y axis by `a` radians (three.js convention), keeping their own rotation. */
function rotY(parts: BoxPart[], a: number): BoxPart[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return parts.map((b) => ({ ...b, p: [b.p[0] * c + b.p[2] * s, b.p[1], -b.p[0] * s + b.p[2] * c], r: [b.r?.[0] ?? 0, (b.r?.[1] ?? 0) + a, b.r?.[2] ?? 0] }));
}

/**
 * A stretch of track along the smoothed line: ballast with sloped edges, three sleepers and two
 * rails, rotated to the stretch's direction (slightly longer so stretches join without gaps). Every
 * few stretches an overhead-wire pole stands beside the line.
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
  const parts: BoxPart[] = [box('solid', mx, 0, mz, 0.66, 0.025, L, shade(BALLAST, -0.06), r), box('solid', mx, 0.02, mz, 0.56, 0.02, L, BALLAST, r)];
  for (const k of [0.17, 0.5, 0.83]) parts.push(box('solid', item.dx * k, 0.04, item.dz * k, 0.5, 0.03, 0.08, SLEEPER, r));
  for (const off of [-0.13, 0.13]) parts.push(box('solid', mx + px * off, 0.07, mz + pz * off, 0.045, 0.045, L, RAIL, r));
  if (item.pole) {
    // pole on the right of the line, arm reaching over it
    const pole = rotY(catenaryPole(), Math.atan2(pz, -px));
    parts.push(...translate(pole, px * 0.42, pz * 0.42));
  }
  return parts;
}

/** A track tile that needs more than the line: a rail bridge over water, or a level crossing on a path. */
export function rail(item: ObjectOf<'rail'>): BoxPart[] {
  const parts: BoxPart[] = [];
  const alongX = item.links.px || item.links.nx;
  if (item.overWater) {
    parts.push(box('solid', 0, -0.06, 0, 0.94, 0.07, 0.94, DECK));
    for (const [ox, oz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) parts.push(box('solid', ox, -0.45, oz, 0.09, 0.4, 0.09, '#8a8f99'));
    // side railings along the track
    for (const side of [-0.44, 0.44]) parts.push(alongX ? box('solid', 0, 0.01, side, 0.94, 0.12, 0.04, '#a9b0b9') : box('solid', side, 0.01, 0, 0.04, 0.12, 0.94, '#a9b0b9'));
  }
  if (item.crossing) {
    parts.push(box('solid', 0, 0.045, 0, 0.72, 0.03, 0.72, '#d8c3a0'));
    // crossing signs at two opposite corners
    parts.push(...translate(crossingSign(), 0.42, 0.42), ...translate(crossingSign(), -0.42, -0.42));
  }
  return parts;
}

/** A station platform beside the track (safety edge towards the track, layout `facing`). */
export function station(item: ObjectOf<'station'>): BoxPart[] {
  return vturn(stationPlatformParts(item.lines, Math.max(item.w, item.d), item.variant), item.facing);
}

/** The "next station" sign beside the track where it leaves the island, facing back inland. */
export function railEnd(item: ObjectOf<'rail-end'>): BoxPart[] {
  const sx = item.dir.z !== 0 ? 0.42 : 0;
  const sz = item.dir.x !== 0 ? 0.42 : 0;
  // board faces against the travel direction (towards the island)
  const facing = item.dir.z > 0 ? 2 : item.dir.z < 0 ? 0 : item.dir.x > 0 ? 3 : 1;
  return translate(vturn(railEndSignParts(), facing), sx, sz);
}

/** A locked (or ready) building: its model as a translucent ghost on its lot. */
export function silhouette(item: ObjectOf<'silhouette'>, ctx: BuildCtx): BoxPart[] {
  return asGhost(treeModel(item.buildingKey, item.w, item.d, 1, item.variant, item.facing, ctx), SILHOUETTE);
}
