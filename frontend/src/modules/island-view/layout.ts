/**
 * Island layout: stored island plan + community view state → tiles and placed objects.
 *
 * Positions come only from the stored plan (requirement.md §7.8), so they never change.
 * Land of stages up to `landStage` is shown; the rest of the real outline is drawn as
 * "future land" clouds. Each lot shows the most advanced building of its growth chain
 * (§7.6): a construction site while a new building goes up, else the last built one (with a
 * small scaffold while it is upgraded in place), else a silhouette.
 */
import { vitalityMood, type VitalityMood } from './mood';
import { BUILDING_TREE, chainOnLot } from './plan/buildingTree';
import {
  PLAZA,
  houseLotOrder,
  lotTiles,
  stageMap,
  tileKey,
  walkableTiles,
  type IslandPlan,
  type LotRect,
  type Tile,
} from './plan/islandPlan';
import { MAX_MINI_VILLAGERS, type BuildingView, type CommunityViewState, type Remaining } from './types';

export { tileKey, type Tile };

export const FIXED_ASSET_KEYS = [
  'house',
  'tree',
  'lamp',
  'flowers',
  'snow-pile',
  'mini-villager',
  'construction-site',
  'silhouette',
  'reserved-plot',
] as const;
export type FixedAssetKey = (typeof FIXED_ASSET_KEYS)[number];
/** `building.<key>` draws a built building of the tree (or the placeholder for unknown keys). */
export type AssetKey = FixedAssetKey | `building.${string}`;

interface Base {
  id: string;
  /** World coordinates of the footprint centre (ground level y = 0). */
  x: number;
  z: number;
  /** Land stage the object belongs to (revealed after that stage's land has risen). */
  stage: number;
}

interface Footprint {
  w: number;
  d: number;
}

export type PlacedObject =
  | (Base & { assetKey: 'house'; houseId: string; nickname: string; activeToday: boolean; colorIndex: number; founding: boolean; mine: boolean })
  | (Base & { assetKey: 'tree'; variant: number })
  | (Base & { assetKey: 'lamp' })
  | (Base & { assetKey: 'flowers'; variant: number })
  | (Base & { assetKey: 'snow-pile'; variant: number })
  | (Base & { assetKey: 'mini-villager'; index: number; startTile: Tile; colorIndex: number })
  | (Base & Footprint & { assetKey: 'construction-site'; buildingKey: string; title: string; progress: number; level: number })
  | (Base & Footprint & { assetKey: 'silhouette'; buildingKey: string; title: string; ready: boolean; remaining: Remaining | null })
  | (Base & Footprint & { assetKey: 'reserved-plot'; lotKind: string })
  | (Base &
      Footprint & {
        assetKey: `building.${string}`;
        buildingKey: string;
        title: string;
        level: number;
        /** Next building of the growth chain on this lot, if any (for the label). */
        next: { title: string; remaining: Remaining | null; status: BuildingView['status'] } | null;
        /** Upgrade in place under way (§7.6): the built model stays, `level` is the built one. */
        upgrade: { level: number; progress: number } | null;
      });

export type ObjectOf<K extends PlacedObject['assetKey']> = Extract<PlacedObject, { assetKey: K }>;
export type BuildingObject = Extract<PlacedObject, { assetKey: `building.${string}` }>;

export interface IslandTile extends Tile {
  kind: 'grass' | 'path' | 'water' | 'bridge';
  stage: number;
  /** On the outer edge of the current land (draw the dirt underneath). */
  edge: boolean;
}

export interface IslandLayout {
  landStage: number;
  mood: VitalityMood;
  tiles: IslandTile[];
  /** The rest of the real outline (future land). */
  futureTiles: Tile[];
  objects: PlacedObject[];
  walkable: Tile[];
  /** Radius (tiles) of the current land around the plaza, for camera fitting. */
  landRadius: number;
  cameraAzimuth: number;
  hiddenHouseCount: number;
}

/** Deterministic hash → [0, 1). */
export function hash01(a: number, b: number, salt: number): number {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(salt, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const centreOf = (r: LotRect) => ({ x: r.x + r.w / 2, z: r.z + r.d / 2 });
const N4: Tile[] = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

export function buildIslandLayout(plan: IslandPlan, state: CommunityViewState): IslandLayout {
  const landStage = state.landStage;
  const mood: VitalityMood = state.vitality === null ? 'normal' : vitalityMood(state.vitality);
  const stages = stageMap(plan);
  const stageOf = (t: Tile) => stages.get(tileKey(t)) ?? 99;
  const on = (t: Tile) => stageOf(t) <= landStage;
  const byKey = new Map(state.buildings.map((b) => [b.key, b]));
  const objects: PlacedObject[] = [];
  const occupied = new Set<string>();

  // Terrain.
  const pathKeys = new Set([...PLAZA, ...plan.paths].map(tileKey));
  const waterKeys = new Set(plan.water.map(tileKey));
  const bridgeKeys = new Set(plan.bridges.map(tileKey));
  const land = plan.tiles.filter(on);
  const landKeys = new Set(land.map(tileKey));
  const kindOf = (k: string): IslandTile['kind'] =>
    waterKeys.has(k) ? 'water' : bridgeKeys.has(k) ? 'bridge' : pathKeys.has(k) ? 'path' : 'grass';
  const tiles: IslandTile[] = land.map((t) => ({
    x: t.x,
    z: t.z,
    stage: t.stage,
    kind: kindOf(tileKey(t)),
    edge: N4.some((d) => !landKeys.has(tileKey({ x: t.x + d.x, z: t.z + d.z }))),
  }));
  const futureTiles = plan.tiles.filter((t) => !on(t)).map(({ x, z }) => ({ x, z }));

  // Lots.
  const freeSpares: { key: string; rect: LotRect }[] = [];
  const usedLots: string[] = [];
  const freeMainStreet: { key: string; rect: LotRect }[] = [];
  for (const [lotKey, spec] of Object.entries(BUILDING_TREE.lots)) {
    const rect = plan.lots[lotKey];
    const rTiles = lotTiles(rect);
    const stage = Math.max(...rTiles.map(stageOf), spec.landStage);
    const base = { ...centreOf(rect), w: rect.w, d: rect.d, stage };
    // Lots not open yet, spare lots and lots without a building yet stay plain (walkable) land.
    if (spec.landStage > landStage || !rTiles.every(on)) continue;
    if (spec.kind === 'spare') {
      freeSpares.push({ key: lotKey, rect });
      continue;
    }
    if (spec.kind === 'main-street') {
      // Faint markers only; shops arrive in Phase 4 (requirement.md §22.4). Also a fallback
      // spot for unknown buildings when the spare lots run out.
      freeMainStreet.push({ key: lotKey, rect });
      continue;
    }
    const chain = chainOnLot(lotKey);
    if (chain.length === 0) continue; // reserved for a later building (e.g. the Phase 3 landmark)
    const views = chain.map((b) => byKey.get(b.key));
    const shown = views.some((v) => v && v.status !== 'locked');
    // Locked buildings are not drawn (requirement.md §7.6): the lot stays plain, walkable land.
    if (!shown) continue;
    usedLots.push(lotKey);
    if (spec.kind !== 'entrance') rTiles.forEach((t) => occupied.add(tileKey(t)));
    const buildingIdx = views.findIndex((v) => v?.status === 'building' && v.level === 1);
    let builtIdx = -1;
    views.forEach((v, i) => {
      // An upgrade (building at level 2+) stands on a built building: draw that one.
      if (v?.status === 'built' || (v?.status === 'building' && v.level > 1)) builtIdx = i;
    });
    if (buildingIdx >= 0) {
      const v = views[buildingIdx] as BuildingView;
      objects.push({ ...base, id: `lot:${lotKey}`, assetKey: 'construction-site', buildingKey: v.key, title: v.title, progress: v.progress, level: v.level });
    } else if (builtIdx >= 0) {
      const v = views[builtIdx] as BuildingView;
      const nextSpec = chain[builtIdx + 1];
      const nextView = nextSpec ? byKey.get(nextSpec.key) : undefined;
      objects.push({
        ...base,
        id: `lot:${lotKey}`,
        assetKey: `building.${v.key}`,
        buildingKey: v.key,
        title: v.title,
        ...builtLevel(v),
        next: nextSpec ? { title: nextSpec.name, remaining: nextView?.remaining ?? null, status: nextView?.status ?? 'locked' } : null,
      });
    } else {
      const first = chain[0];
      const v = views[0];
      objects.push({
        ...base,
        id: `lot:${lotKey}`,
        assetKey: 'silhouette',
        buildingKey: first.key,
        title: first.name,
        ready: v?.status === 'opened',
        remaining: v?.remaining ?? null,
      });
    }
  }

  // Buildings the tree does not know yet: placeholder on spare lots (requirement.md §7.6b).
  const treeKeys = new Set(BUILDING_TREE.buildings.map((b) => b.key));
  let hiddenUnknown = 0;
  for (const b of state.buildings) {
    if (treeKeys.has(b.key) || (b.status !== 'building' && b.status !== 'built')) continue;
    const spare = freeSpares.shift() ?? freeMainStreet.shift();
    if (!spare) {
      hiddenUnknown++;
      continue;
    }
    const base = { ...centreOf(spare.rect), w: spare.rect.w, d: spare.rect.d, stage: BUILDING_TREE.lots[spare.key].landStage };
    usedLots.push(spare.key);
    lotTiles(spare.rect).forEach((t) => occupied.add(tileKey(t)));
    objects.push(
      b.status === 'building' && b.level === 1
        ? { ...base, id: `lot:${spare.key}`, assetKey: 'construction-site', buildingKey: b.key, title: b.title, progress: b.progress, level: b.level }
        : { ...base, id: `lot:${spare.key}`, assetKey: 'building.placeholder', buildingKey: b.key, title: b.title, ...builtLevel(b), next: null },
    );
  }

  for (const m of freeMainStreet) {
    objects.push({ ...centreOf(m.rect), w: m.rect.w, d: m.rect.d, stage: BUILDING_TREE.lots[m.key].landStage, id: `lot:${m.key}`, assetKey: 'reserved-plot', lotKind: 'main-street' });
  }

  // Pathway lights (a building without a lot): lamps along the shown paths once built.
  if (byKey.get('pathway-lights')?.status === 'built') {
    plan.paths.filter(on).forEach((t, i) => {
      if (i % 3 === 1) objects.push({ assetKey: 'lamp', id: `lamp:${tileKey(t)}`, x: t.x + 0.5, z: t.z + 0.5, stage: stageOf(t) });
    });
  }

  // Houses: each resident's fixed lot (slot); data without slots fills the lots in slot order.
  const lotOrder = houseLotOrder(plan);
  const houseTiles: string[] = [];
  let offLand = 0;
  state.houses.forEach((h, i) => {
    const t = lotOrder[h.slot ?? i];
    if (!t || !on(t)) {
      offLand += 1;
      return;
    }
    houseTiles.push(tileKey(t));
    objects.push({
      assetKey: 'house',
      id: `house:${h.id}`,
      houseId: h.id,
      x: t.x + 0.5,
      z: t.z + 0.5,
      stage: stageOf(t),
      nickname: h.nickname,
      activeToday: h.activeToday,
      colorIndex: hashString(h.id),
      founding: h.founding === true,
      mine: h.mine === true,
    });
    occupied.add(tileKey(t));
  });
  const houseLotKeys = new Set(plan.houses.map(tileKey));

  for (const t of plan.trees.filter(on)) {
    objects.push({ assetKey: 'tree', id: `tree:${tileKey(t)}`, x: t.x + 0.5, z: t.z + 0.5, stage: stageOf(t), variant: Math.floor(hash01(t.x, t.z, 3) * 3) });
    occupied.add(tileKey(t));
  }

  // Mood decorations on free grass (never blocking).
  if (mood !== 'normal') {
    for (const t of land) {
      const k = tileKey(t);
      if (pathKeys.has(k) || waterKeys.has(k) || occupied.has(k) || houseLotKeys.has(k) || hash01(t.x, t.z, 2) >= 0.12) continue;
      const decor = { id: `decor:${k}`, x: t.x + 0.5, z: t.z + 0.5, stage: t.stage, variant: Math.floor(hash01(t.x, t.z, 4) * 4) };
      objects.push(mood === 'lively' ? { ...decor, assetKey: 'flowers' } : { ...decor, assetKey: 'snow-pile' });
    }
  }

  const walkable = walkableTiles(plan, landStage, houseTiles, usedLots);

  // Mini villagers start on the paths and plaza.
  const walkKeys = new Set(walkable.map(tileKey));
  const pathTiles = [...PLAZA, ...plan.paths].filter((t) => walkKeys.has(tileKey(t)));
  const villagers = Math.min(state.miniVillagerCount, MAX_MINI_VILLAGERS);
  for (let i = 0; i < villagers && pathTiles.length > 0; i++) {
    const t = pathTiles[Math.floor(hash01(i, villagers, 5) * pathTiles.length)];
    objects.push({ assetKey: 'mini-villager', id: `villager:${i}`, x: t.x + 0.5, z: t.z + 0.5, stage: stageOf(t), index: i, startTile: t, colorIndex: i });
  }

  const landRadius = Math.max(4, ...land.map((t) => Math.hypot(t.x + 0.5, t.z + 0.5)));
  return {
    landStage,
    mood,
    tiles,
    futureTiles,
    objects,
    walkable,
    landRadius,
    cameraAzimuth: plan.cameraAzimuth,
    hiddenHouseCount: offLand + (state.extraResidents ?? 0) + hiddenUnknown,
  };
}

/** Built level and upgrade info: a building at level N under construction is built at N − 1. */
function builtLevel(v: BuildingView): { level: number; upgrade: { level: number; progress: number } | null } {
  return v.status === 'building' && v.level > 1
    ? { level: v.level - 1, upgrade: { level: v.level, progress: v.progress } }
    : { level: v.level, upgrade: null };
}

/** Tile to walk to when helping a building (the avatar stops next to its lot). */
export function buildingSiteTile(layout: IslandLayout, buildingKey: string): Tile | null {
  const chainLot = BUILDING_TREE.buildings.find((b) => b.key === buildingKey)?.lot;
  const o = layout.objects.find(
    (x) => ('buildingKey' in x && x.buildingKey === buildingKey) || (chainLot !== undefined && chainLot !== null && x.id === `lot:${chainLot}`),
  );
  if (!o) return null;
  const w = 'w' in o ? o.w : 1;
  const d = 'd' in o ? o.d : 1;
  return { x: Math.floor(o.x - w / 2 + w - 1), z: Math.floor(o.z - d / 2 + d - 1) };
}
