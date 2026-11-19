/**
 * Stored island plans (requirement.md §7.8): one JSON file per community, generated once by
 * frontend/scripts/island_plans.py and never regenerated after launch, so positions never change.
 * Coordinates: tile (x, z); the plaza is tiles x, z ∈ {-1, 0}; its centre is the world origin.
 */
import { BUILDING_TREE, LAND_STAGE_COUNT } from './buildingTree';

export interface Tile {
  x: number;
  z: number;
}
export interface PlanTile extends Tile {
  stage: number;
}
export interface LotRect extends Tile {
  w: number;
  d: number;
}

export interface IslandPlan {
  code: string;
  name: string;
  /** All tiles of the full island, in reveal order. */
  tiles: PlanTile[];
  paths: Tile[];
  lots: Record<string, LotRect>;
  /** House lots, centre outward (residents take them in order). */
  houses: Tile[];
  trees: Tile[];
  /** Default camera orbit angle (long side vertical on a portrait phone). */
  cameraAzimuth: number;
}

export const tileKey = ({ x, z }: Tile): string => `${x},${z}`;
export const PLAZA: Tile[] = [
  { x: -1, z: -1 },
  { x: 0, z: -1 },
  { x: -1, z: 0 },
  { x: 0, z: 0 },
];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isIntArray = (v: unknown, group: number): v is number[] =>
  Array.isArray(v) && v.length % group === 0 && v.every((n) => Number.isInteger(n));

function pairs(flat: number[]): Tile[] {
  const out: Tile[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] });
  return out;
}

/** Decodes a stored plan file; throws with a clear message if it is malformed. */
export function decodePlan(raw: unknown): IslandPlan {
  const fail = (what: string): never => {
    throw new Error(`Invalid island plan: ${what}`);
  };
  if (!isObj(raw)) return fail('not an object');
  if (raw.v !== 1) fail(`unsupported version ${String(raw.v)}`);
  if (typeof raw.code !== 'string' || typeof raw.name !== 'string') fail('code/name');
  if (!isIntArray(raw.tiles, 3)) fail('tiles');
  if (!isIntArray(raw.paths, 2) || !isIntArray(raw.houses, 2) || !isIntArray(raw.trees, 2)) fail('paths/houses/trees');
  if (!isObj(raw.lots)) fail('lots');
  if (typeof raw.cameraAzimuth !== 'number' || !Number.isFinite(raw.cameraAzimuth)) fail('cameraAzimuth');
  const t = raw.tiles as number[];
  const tiles: PlanTile[] = [];
  for (let i = 0; i < t.length; i += 3) {
    if (t[i + 2] < 0 || t[i + 2] >= LAND_STAGE_COUNT) fail(`tile stage ${t[i + 2]}`);
    tiles.push({ x: t[i], z: t[i + 1], stage: t[i + 2] });
  }
  const lots: Record<string, LotRect> = {};
  for (const [k, v] of Object.entries(raw.lots as Obj)) {
    if (!isIntArray(v, 4) || (v as number[]).length !== 4) fail(`lot ${k}`);
    const [x, z, w, d] = v as number[];
    lots[k] = { x, z, w, d };
  }
  for (const k of Object.keys(BUILDING_TREE.lots)) if (!lots[k]) fail(`missing lot ${k}`);
  return {
    code: raw.code as string,
    name: raw.name as string,
    tiles,
    paths: pairs(raw.paths as number[]),
    lots,
    houses: pairs(raw.houses as number[]),
    trees: pairs(raw.trees as number[]),
    cameraAzimuth: raw.cameraAzimuth as number,
  };
}

export const lotTiles = (r: LotRect): Tile[] => {
  const out: Tile[] = [];
  for (let i = 0; i < r.w; i++) for (let j = 0; j < r.d; j++) out.push({ x: r.x + i, z: r.z + j });
  return out;
};

/** Stage of every tile ("x,z" → stage). */
export function stageMap(plan: IslandPlan): Map<string, number> {
  return new Map(plan.tiles.map((t) => [tileKey(t), t.stage]));
}

/** Lot keys that exist on this land stage (the entrance never blocks walking). */
export function activeLots(plan: IslandPlan, landStage: number): string[] {
  return Object.keys(plan.lots).filter((k) => (BUILDING_TREE.lots[k]?.landStage ?? 0) <= landStage);
}

/**
 * Tiles reachable on foot from the plaza on a land stage: land of that stage minus lot tiles
 * on land (all lots, or only `usedLots`; the entrance never blocks), the first `houseCount`
 * house lots shown, and trees. Plans are generated so this holds with every lot blocked,
 * so leaving empty lots walkable can never cut a path.
 */
export function walkableTiles(plan: IslandPlan, landStage: number, houseCount: number, usedLots?: Iterable<string>): Tile[] {
  const stages = stageMap(plan);
  const on = (t: Tile) => (stages.get(tileKey(t)) ?? 99) <= landStage;
  const blocked = new Set<string>();
  // By default every lot on land blocks (the strictest case, used to validate plans);
  // the game passes only lots that have something on them, so empty plots stay walkable.
  const lotKeys = usedLots ? new Set(usedLots) : new Set(Object.keys(plan.lots));
  for (const [k, r] of Object.entries(plan.lots)) {
    if (BUILDING_TREE.lots[k]?.kind === 'entrance' || !lotKeys.has(k)) continue;
    lotTiles(r).filter(on).forEach((t) => blocked.add(tileKey(t)));
  }
  plan.houses.filter(on).slice(0, houseCount).forEach((t) => blocked.add(tileKey(t)));
  plan.trees.filter(on).forEach((t) => blocked.add(tileKey(t)));
  const out: Tile[] = [];
  const seen = new Set(PLAZA.map(tileKey));
  const queue = [...PLAZA];
  while (queue.length > 0) {
    const t = queue.shift() as Tile;
    out.push(t);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: t.x + dx, z: t.z + dz };
      const k = tileKey(n);
      if (!seen.has(k) && on(n) && !blocked.has(k)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return out;
}
