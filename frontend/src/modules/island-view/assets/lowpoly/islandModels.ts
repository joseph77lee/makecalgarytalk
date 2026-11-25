/**
 * Which Polyfork model each island object wears, and how (M23, requirement.md v1.45 §19.1: a grown
 * community looks varied, never patterned). Pure and deterministic from the object's own seed, so
 * a house never changes and the layout can read the same choice for its label height.
 *
 * Variety comes from: several models per house type (all 22 house and tower picks are used), a
 * pastel roof and wall per house, mirrored plans, small size changes, row-house pairs, and small
 * yard trees beside narrow houses.
 */
import type { ObjectOf } from '../../layout';
import type { HouseType } from '../voxel/houses';
import { ART } from '../voxel/samples';
import { rnd } from '../voxel/voxel';
import { LP_HEIGHTS, type LpName } from './catalogue';
import type { BoxPart } from '../boxes';
import type { LpPlacement, PlaceCtx } from './placement';

/** House models per house type (requirement.md §7.2 mix by community style picks the type). */
export const HOUSE_MODELS: Record<HouseType, LpName[]> = {
  bungalow: ['ranch', 'porchCottage', 'crossingCottage', 'thatchedCottage', 'logCabin', 'aFrame', 'porchLogCabin'],
  twoStoreyGarage: ['twoStorey', 'splitLevel', 'gableHouse', 'lighthouseCottage', 'porchCottage'],
  semiDetached: ['splitLevel', 'gableHouse', 'cubeHouse', 'ranch'],
  townhouses: ['townhouse', 'townhouse', 'cubeHouse'],
  infill: ['cubeHouse', 'gableHouse', 'townhouse', 'twoStorey'],
  apartment: ['prewarApartment', 'postwarSlab', 'apartmentBlock', 'tenement', 'slabBlock', 'brownstone'],
  loft: ['officeTower', 'artDecoTower', 'monolithTower', 'tenement', 'slabBlock'],
};

/** Row units are half a tile wide: two stand side by side, mirrored. */
const PAIRED = new Set<LpName>(['townhouse']);
/** Shallow houses leave room behind them; narrow ones beside them (for a yard tree). */
const ROOM_BEHIND = new Set<LpName>(['ranch', 'splitLevel', 'gableHouse', 'crossingCottage', 'thatchedCottage']);
const ROOM_BESIDE = new Set<LpName>(['aFrame', 'logCabin']);
const YARD_TREES: LpName[] = ['evergreenShrub', 'coneTree', 'youngPine', 'lollipopTree'];
const TOWERS = new Set<HouseType>(['apartment', 'loft']);

export interface HouseLook {
  model: LpName;
  scale: number;
  mirror: boolean;
  roof: string;
  wall: string;
}

const pick = <T,>(list: readonly T[], r: number): T => list[Math.min(list.length - 1, Math.floor(r * list.length))];

export function houseLook(type: HouseType, seed: number): HouseLook {
  const model = pick(HOUSE_MODELS[type], rnd(seed, 31));
  return {
    model,
    scale: TOWERS.has(type) ? 1 : 0.94 + rnd(seed, 32) * 0.1,
    mirror: rnd(seed, 33) < 0.5,
    roof: pick(ART.roofs, rnd(seed, 2)),
    wall: pick(ART.walls, rnd(seed, 1)),
  };
}

/** Height of the house in tiles (labels and tap boxes). */
export function houseModelHeight(type: HouseType, seed: number): number {
  const look = houseLook(type, seed);
  return LP_HEIGHTS[look.model] * look.scale;
}

/** A point given in the house's own frame (front +z) on the island. */
function at(item: { x: number; z: number }, turn: number, lx: number, lz: number): { x: number; z: number } {
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  return { x: item.x + lx * c + lz * s, z: item.z - lx * s + lz * c };
}

export function placeHouse(item: ObjectOf<'house'>, ctx: PlaceCtx): LpPlacement[] {
  const look = houseLook(item.houseType, item.colorIndex);
  const turn = (item.facing * Math.PI) / 2;
  // residents light up when they were active today; about half of the village houses at night (§7.2)
  const lit = item.activeToday ? 2 : item.village && rnd(item.colorIndex, 91) < 0.5 ? 1 : 0;
  const base = { model: look.model, turn, scale: look.scale, lit, roof: look.roof, wall: look.wall } as const;
  const out: LpPlacement[] = [];
  if (PAIRED.has(look.model)) {
    for (const side of [-1, 1]) out.push({ ...base, ...at(item, turn, side * 0.215 * look.scale, 0), mirror: side > 0 });
  } else out.push({ ...base, x: item.x, z: item.z, mirror: look.mirror });

  if (!ctx.lowQuality && rnd(item.colorIndex, 34) < 0.6 && (ROOM_BEHIND.has(look.model) || ROOM_BESIDE.has(look.model))) {
    const side = look.mirror ? -1 : 1;
    const spot = ROOM_BEHIND.has(look.model) ? at(item, turn, side * 0.3, -0.36) : at(item, turn, side * 0.33, -0.15);
    out.push({ model: pick(YARD_TREES, rnd(item.colorIndex, 35)), ...spot, turn: rnd(item.colorIndex, 36) * Math.PI * 2, scale: 0.5 + rnd(item.colorIndex, 37) * 0.15 });
  }
  return out;
}

/** Leafy and evergreen tree models (our tree variants 0–1 are leafy, 2 is a spruce). */
export const TREE_MODELS = {
  leafy: ['shadeTree', 'ornamentalTree', 'oliveTree', 'lollipopTree', 'shadeTree'] as LpName[],
  evergreen: ['tallPine', 'fir', 'youngPine', 'evergreenShrub', 'coneTree', 'tallPine'] as LpName[],
};

export function placeTree(item: ObjectOf<'tree'>): LpPlacement[] {
  const seed = Math.round(item.x * 131 + item.z * 977);
  const pool = item.variant === 2 ? TREE_MODELS.evergreen : TREE_MODELS.leafy;
  return [{ model: pick(pool, rnd(seed, 41)), x: item.x, z: item.z, turn: rnd(seed, 42) * Math.PI * 2, mirror: rnd(seed, 43) < 0.5, scale: 0.88 + rnd(seed, 44) * 0.22 }];
}

export const CAR_MODELS: LpName[] = ['suv', 'minivan', 'pickup', 'hatchback', 'townCar'];
export const BENCH_MODELS: LpName[] = ['parkBench', 'parkBench', 'alpineBench'];
export const LAMP_MODELS: LpName[] = ['streetLamp', 'garlandLamp', 'cobraLight'];

/** Parked cars, benches and mailboxes; flower beds keep their box models. */
export function placeProp(item: ObjectOf<'prop'>): LpPlacement[] | null {
  const turn = (item.facing * Math.PI) / 2;
  const model = item.kind === 'car' ? pick(CAR_MODELS, rnd(item.seed, 51)) : item.kind === 'bench' ? pick(BENCH_MODELS, rnd(item.seed, 52)) : item.kind === 'mailbox' ? 'mailbox' : null;
  return model ? [{ model, x: item.x, z: item.z, turn }] : null;
}

/** Where a path lamp stands in its tile (the corner, like the box lamp). */
export const LAMP_SPOT = 0.38;

/** Path lamps: one model per island style is calmer than a mix, so it is picked per lamp row (x + z). */
export function placeLamp(item: ObjectOf<'lamp'>): LpPlacement[] {
  const seed = Math.round(item.x * 131 + item.z * 977);
  return [{ model: pick(LAMP_MODELS, rnd(Math.floor(item.x + item.z), 61)), x: item.x + LAMP_SPOT, z: item.z + LAMP_SPOT, turn: Math.floor(rnd(seed, 62) * 4) * (Math.PI / 2), lit: 1 }];
}

/** A soft warm pool on the ground under a lit lamp (same look as under box lamps). */
export function lampPool(_item: ObjectOf<'lamp'>, ctx: PlaceCtx): BoxPart[] {
  if (!ctx.lightsOn) return [];
  return [
    { layer: 'mist', p: [LAMP_SPOT, 0.02, LAMP_SPOT], s: [1.6, 0.02, 1.6], c: '#ffd27a' },
    { layer: 'mist', p: [LAMP_SPOT, 0.03, LAMP_SPOT], s: [0.9, 0.02, 0.9], c: '#ffe2a0' },
  ];
}

/** About one snow pile in four is a snowman (winter launch theme, §19.1). */
export function placeSnowPile(item: ObjectOf<'snow-pile'>): LpPlacement[] | null {
  if (item.variant % 4 !== 0) return null;
  const seed = Math.round(item.x * 131 + item.z * 977);
  return [{ model: 'snowman', x: item.x, z: item.z, turn: rnd(seed, 71) * Math.PI * 2 }];
}
