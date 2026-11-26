/**
 * Code-built box models (MVP art, requirement.md §19.0/§19.4).
 * Each builder returns parts in local coordinates around the object's footprint centre at
 * ground level. Building models fit their lot (w × d tiles). The Art Pass can replace any
 * of them per asset key without touching game logic (§20.4).
 */
import type { BuildingObject, ObjectOf } from '../layout';
import { houseParts } from './voxel/houses';
import { ACCENTS, type MoodPalette } from '../mood';
import { asGhost, box, translate, type BoxPart } from './boxes';
import { BUILDING_VOXELS, placeholderModel } from './voxel/buildings';
import { LANDMARK_LIBRARY, type LandmarkKey } from './voxel/landmarkLibrary';
import { PLACE_LIBRARY, type PlaceKey } from './voxel/placeLibrary';
import { finishAllSides } from './allSides';
import { decorationGarden } from './voxel/placeParts';
import { FEATURE_VOXELS, catenaryPole, crossingSign, railEndSignParts, stationPlatformParts } from './voxel/features';
import { shade, vb } from './voxel/voxel';
import { bench as benchModel, car as carModel, flowerBed as flowerBedModel, lampPost, leafyTree, mailbox as mailboxModel, spruce } from './voxel/samples';
import { rnd, vturn } from './voxel/voxel';
import { VOXEL_DESIGNS as N } from './voxel/designFit';

export interface BuildCtx {
  palette: MoodPalette;
  /** Snow lies on the island (real weather, requirement.md v1.40 §10.4). */
  snow: boolean;
}

const WALL = '#fbf3e4';
const WOOD = '#a7825f';
const DOOR = '#a77b5a';
const DARK_WINDOW = '#64748b';
const WARM_LIGHT = '#ffd98a';
const SNOW = '#f6f8fb';
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
  return houseParts(item.houseType, item.colorIndex, item.facing);
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


/**
 * An island tree (Art Pass voxel): leafy trees in the palette's leaf colours, one in three an
 * evergreen; M23 adds more shapes (shade, ornamental, olive, lollipop; tall and young pines, fir,
 * column, cone) mixed in by position. Snow on the ground puts snow on the tops too.
 */
export function tree(item: ObjectOf<'tree'>, { palette, snow }: BuildCtx): BoxPart[] {
  const seed = Math.round(item.x * 131 + item.z * 977);
  const sleepy = snow;
  const evergreen = item.variant === 2;
  const pool = evergreen ? EVERGREENS : LEAFY;
  const pickIdx = Math.floor(rnd(seed, 44) * pool.length) % pool.length;
  let parts: BoxPart[];
  if (pickIdx === 0 && evergreen) {
    parts = spruce(seed, sleepy ? '#4f8a6b' : undefined);
    if (sleepy) parts.push(vb(-2.7, 7, -2.7, 2.7, 7.4, 2.7, SNOW), vb(-1.9, 9.5, -1.9, 1.9, 9.9, 1.9, SNOW), vb(-1.1, 11.5, -1.1, 1.1, 11.9, 1.1, SNOW));
  } else if (pickIdx === 0) {
    parts = leafyTree(seed, palette.leaves[item.variant % 2], palette.trunk);
    if (sleepy) parts.push(vb(-2.5, 10, -2.5, 2.5, 10.5, 2.5, SNOW), vb(-3.5, 8.5, -3.5, -1, 8.9, 3.5, SNOW));
  } else {
    parts = pool[pickIdx](seed);
    if (sleepy) parts.push(...snowCap(parts));
  }
  // the crown (everything above the lowest third of a tile) sways in the wind
  return parts.map((b) => (b.layer === 'solid' && b.p[1] - b.s[1] / 2 > 0.3 ? { ...b, layer: 'sway' } : b));
}

const LEAFY: ((seed: number) => BoxPart[])[] = [leafyTree, N.shadeTree.build, N.ornamentalTree.build, N.oliveTree.build, N.lollipopTree.build];
const EVERGREENS: ((seed: number) => BoxPart[])[] = [spruce, N.tallPine.build, N.youngPine.build, N.firTree.build, N.columnShrub.build, N.coneTree.build];

/** A thin layer of snow on the highest box of a model (its top). */
function snowCap(parts: BoxPart[]): BoxPart[] {
  let topBox: BoxPart | null = null;
  for (const b of parts) if (b.layer !== 'glow' && (!topBox || b.p[1] + b.s[1] / 2 > topBox.p[1] + topBox.s[1] / 2)) topBox = b;
  if (!topBox) return [];
  const y = topBox.p[1] + topBox.s[1] / 2;
  return [{ layer: 'solid', p: [topBox.p[0], y + 0.4 / 24, topBox.p[2]], s: [topBox.s[0] * 1.02, 0.4 / 12, topBox.s[2] * 1.02], c: SNOW }];
}

/** A pathway light (voxel lamp post) at the tile's corner. */
export function lamp(item: ObjectOf<'lamp'>): BoxPart[] {
  // one lamp design per lamp row (M23: post, arm lamp, garland lamp or cobra light)
  const row = Math.floor(item.x + item.z);
  const build = LAMPS[Math.floor(rnd(row, 61) * LAMPS.length) % LAMPS.length];
  return translate(build(), 0.38, 0.38);
}

const LAMPS: (() => BoxPart[])[] = [lampPost, lampPost, () => N.armLamp.build(0), () => N.garlandLamp.build(0), () => N.cobraLight.build(0)];

/** Blossom spots of a wild flower patch, close together in the middle of the tile. */
const FLOWER_SPOTS = [
  [-0.12, -0.08],
  [0.1, -0.12],
  [0.02, 0.08],
  [-0.14, 0.12],
  [0.15, 0.1],
] as const;

/**
 * A wild flower patch: a low clump of leaves with blossoms of one colour (plus a white one), so it
 * reads as one patch instead of scattered coloured dots. Under snow it is a little snow pile.
 */
export function flowers(item: ObjectOf<'flowers'>, ctx?: BuildCtx): BoxPart[] {
  if (ctx?.snow) return snowPileParts(item.variant);
  const colour = ACCENTS[item.variant % ACCENTS.length];
  const leaf = '#6fae55';
  const parts: BoxPart[] = [box('solid', 0, 0, 0, 0.42, 0.07, 0.36, leaf), box('solid', 0.03, 0.07, -0.02, 0.28, 0.05, 0.24, shade(leaf, 0.08))];
  FLOWER_SPOTS.slice(0, 3 + (item.variant % 3)).forEach(([x, z], i) => {
    parts.push(box('solid', x, 0.07, z, 0.03, 0.1, 0.03, leaf), box('solid', x, 0.16, z, 0.11, 0.07, 0.11, i === 2 ? '#fdf8f0' : colour));
  });
  return parts;
}

export function snowPile(item: ObjectOf<'snow-pile'>): BoxPart[] {
  // about one pile in four is a snowman (winter launch theme, §19.1)
  if (item.variant % 4 === 0) return vturn(N.snowman.build(Math.round(item.x * 7 + item.z * 13)), Math.round(item.x + item.z) % 4);
  return snowPileParts(item.variant);
}

function snowPileParts(variant: number): BoxPart[] {
  const dx = variant % 2 === 0 ? 0.1 : -0.1;
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
    parts.push(box('sway', x + 0.06, 0.24, z, 0.1, 0.07, 0.02, flag));
  }
  return parts;
}

/**
 * A construction site (Art Pass voxel): a dirt pad, an orange-and-white safety fence with a gate,
 * and scaffolding. Before half progress: piles of bricks, lumber and sand, a wheelbarrow and cones;
 * from half progress the building's frame rises inside the scaffold. Big lots get a tower crane.
 */
export function constructionSite(item: ObjectOf<'construction-site'>): BoxPart[] {
  const hx = item.w * 6 - 0.6;
  const hz = item.d * 6 - 0.6;
  const parts: BoxPart[] = [vb(-hx, 0, -hz, hx, 0.35, hz, '#c9a77c'), vb(-hx + 1, 0.35, -hz + 1, hx - 1, 0.45, hz - 1, '#b8946a')];
  // Low, soft safety fence (cream and pale terracotta, gate at the front): the site reads as
  // "in progress" without outshining the houses and people around it. Strong orange stays on
  // the gate cones only.
  const FENCE_TOP = 1.95;
  for (let x = -hx; x < hx - 0.1; x += 2) {
    const c = Math.round((x + hx) / 2) % 2 ? '#e6b896' : '#f1e7d6';
    const x1 = Math.min(x + 2, hx);
    if (Math.abs(x + 1) > 2) parts.push(vb(x, 0.35, hz - 0.3, x1, FENCE_TOP, hz, c));
    parts.push(vb(x, 0.35, -hz, x1, FENCE_TOP, -hz + 0.3, c));
  }
  for (let z = -hz; z < hz - 0.1; z += 2) {
    const c = Math.round((z + hz) / 2) % 2 ? '#e6b896' : '#f1e7d6';
    const z1 = Math.min(z + 2, hz);
    parts.push(vb(-hx, 0.35, z, -hx + 0.3, FENCE_TOP, z1, c), vb(hx - 0.3, 0.35, z, hx, FENCE_TOP, z1, c));
  }
  // Scaffolding around the middle, in one of three shapes per community (variant) so sites
  // do not all look the same: both long sides, an L along the back and one side, or the back only.
  const sx = Math.min(hx - 3, 9);
  const sz = Math.min(hz - 3, 9);
  const pipe = '#c9cdd3';
  const plank = '#b98b5e';
  const shape = item.variant % 3;
  const levels = item.progress >= 0.5 ? 3 : shape === 2 ? 1 : 2;
  const top = 0.45 + levels * 3.4;
  const posts: [number, number][] =
    shape === 0 ? [[-sx, -sz], [sx, -sz], [-sx, sz], [sx, sz], [0, -sz], [0, sz]] : shape === 1 ? [[-sx, -sz], [sx, -sz], [-sx, sz], [0, -sz], [-sx, 0]] : [[-sx, -sz], [sx, -sz], [0, -sz]];
  for (const [x, z] of posts) parts.push(vb(x - 0.3, 0.45, z - 0.3, x + 0.3, top, z + 0.3, pipe));
  for (let l = 1; l <= levels; l++) {
    const y = 0.45 + l * 3.4;
    parts.push(vb(-sx, y - 0.3, -sz - 0.6, sx, y, -sz + 0.6, plank)); // back walkway (every shape)
    if (shape === 0) {
      parts.push(vb(-sx, y - 0.3, sz - 0.6, sx, y, sz + 0.6, plank));
      parts.push(vb(-sx - 0.2, y - 0.2, -sz, -sx + 0.2, y, sz, pipe), vb(sx - 0.2, y - 0.2, -sz, sx + 0.2, y, sz, pipe));
    } else if (shape === 1) {
      parts.push(vb(-sx - 0.6, y - 0.3, -sz, -sx + 0.6, y, sz, plank)); // side walkway
    }
  }
  if (item.progress >= 0.5) {
    // the frame rises with progress: corner posts, a floor and part of the walls
    const h = 2 + Math.round((item.progress - 0.5) * 2 * 6);
    const fx = sx - 1.5;
    const fz = sz - 1.5;
    parts.push(vb(-fx, 0.45, -fz, fx, 1.2, fz, '#cfc9bd'));
    for (const [x, z] of [[-fx, -fz], [fx, -fz], [-fx, fz], [fx, fz]]) parts.push(vb(x - 0.5, 1.2, z - 0.5, x + 0.5, 1.2 + h, z + 0.5, '#a67b55'));
    parts.push(vb(-fx, 1.2, -fz, fx, 1.2 + h * 0.6, -fz + 0.8, '#efe2c2'), vb(-fx, 1.2 + h, -fz - 0.3, fx, 1.8 + h, fz + 0.3, '#a67b55'));
  } else {
    parts.push(vb(-sx + 1, 0.45, -sz + 1, -sx + 4, 2.4, -sz + 3.4, '#c4694f'), vb(-sx + 1.3, 2.4, -sz + 1.3, -sx + 3.7, 3, -sz + 3.1, '#d98a6a')); // bricks
    if (item.w >= 2 && item.d >= 2) {
      parts.push(vb(1, 0.45, -2, 7, 1.4, 0, '#d6b07a'), vb(1, 1.4, -1.8, 7, 2.2, -0.2, '#c49a64')); // lumber
      parts.push(vb(-3, 0.45, 2, 1, 1.6, 5, '#e6cf9a'), vb(-2.2, 1.6, 2.8, 0.2, 2.4, 4.2, '#e6cf9a')); // sand
      parts.push(vb(3, 0.45, 3, 5.6, 1.6, 4.6, '#5b8fd6'), vb(5.6, 0.8, 3.6, 7.4, 1, 4, '#5d6470')); // wheelbarrow
    }
  }
  for (const x of [-2.5, 2.5]) parts.push(vb(x - 0.6, 0.35, hz + 0.3 - 1.5, x + 0.6, 0.6, hz + 0.3 - 0.3, '#f39a52'), vb(x - 0.3, 0.6, hz - 1.2, x + 0.3, 2, hz - 0.6, '#f39a52'));
  if (item.w >= 3 && item.d >= 3) {
    // small tower crane in the back corner
    const cx = -hx + 2.5;
    const cz = -hz + 2.5;
    parts.push(vb(cx - 0.8, 0.45, cz - 0.8, cx + 0.8, 20, cz + 0.8, '#f2c14e'), vb(cx - 0.8, 20, cz - 0.6, cx + 16, 21, cz + 0.6, '#f2c14e'), vb(cx - 2.4, 20, cz - 0.8, cx - 0.8, 22.4, cz + 0.8, '#7d838c'));
    parts.push(vb(cx + 10, 13, cz - 0.1, cx + 10.2, 20, cz + 0.1, '#5d6470'), vb(cx + 9.4, 12, cz - 0.6, cx + 10.8, 13, cz + 0.6, '#5d6470'));
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
  // Persona places and landmarks (requirement v1.48 §7.6): written for their own footprint, front +z.
  const library = PLACE_LIBRARY[key as PlaceKey] ?? LANDMARK_LIBRARY[key as LandmarkKey];
  if (library) return vturn(finishAllSides(library.build(variant)), facing);
  if (key.startsWith('decoration-')) return vturn(decorationGarden(variant), facing);
  const make = BUILDING_VOXELS[key];
  if (!make) return placeholderModel({ w, d, level, variant }, ctx);
  const turned = facing % 2 === 1;
  return vturn(finishAllSides(make({ w: turned ? d : w, d: turned ? w : d, level, variant }, ctx)), facing);
}

/** A built building of the tree (placeholder for unknown keys), with upgrade markers. */
export function building(item: BuildingObject, ctx: BuildCtx): BoxPart[] {
  return [...treeModel(item.buildingKey, item.w, item.d, item.level, item.variant, item.facing, ctx), ...levelMarkers(item.level, item.w, item.d), ...(item.upgrade ? upgradeScaffold(item.w, item.d) : [])];
}

// --- Signature features and CTrain (Art Pass models in voxel/features.ts) ------------------

/** A signature feature on its spare lot: the community's design, facing the path. */
export function feature(item: ObjectOf<'feature'>, ctx: BuildCtx): BoxPart[] {
  return vturn(finishAllSides(FEATURE_VOXELS[item.featureKey](item.variant, ctx)), item.facing);
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

/** A street prop (bench, flower bed, parked car, mailbox), turned to face its path or house. */
export function prop(item: ObjectOf<'prop'>): BoxPart[] {
  const r = rnd(item.seed, 51);
  const parts =
    item.kind === 'bench'
      ? [benchModel, benchModel, () => N.parkBench.build(0), () => N.logBench.build(0)][Math.floor(r * 4) % 4]()
      : item.kind === 'flowers'
        ? flowerBedModel(item.seed)
        : item.kind === 'car'
          ? CARS[Math.floor(r * CARS.length) % CARS.length](item.seed)
          : r < 0.5
            ? mailboxModel()
            : N.curbMailbox.build(item.seed);
  return vturn(parts, item.facing);
}

/** Parked cars: the M19 sedan and pickup plus the M23 designs. */
const CARS: ((seed: number) => BoxPart[])[] = [(s) => carModel(s, s % 5 === 0), (s) => carModel(s, false), N.suv.build, N.minivan.build, N.pickupTruck.build, N.hatchback.build, N.townCar.build];

/** A locked (or ready) building: its model as a translucent ghost on its lot. */
export function silhouette(item: ObjectOf<'silhouette'>, ctx: BuildCtx): BoxPart[] {
  return asGhost(treeModel(item.buildingKey, item.w, item.d, 1, item.variant, item.facing, ctx), SILHOUETTE);
}
