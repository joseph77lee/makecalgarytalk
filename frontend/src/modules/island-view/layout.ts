/**
 * Island layout: stored island plan + community view state → tiles and placed objects.
 *
 * Positions come only from the stored plan (requirement.md §7.8), so they never change.
 * Land of stages up to `landStage` is shown; the rest of the real outline is drawn as
 * "future land" clouds. Each lot shows the most advanced building of its growth chain
 * (§7.6): a construction site while a new building goes up, else the last built one (with a
 * small scaffold while it is upgraded in place), else a silhouette.
 */
import { houseModelHeight, houseStyleFor, houseTypeFor, type HouseType } from './assets/voxel/houses';
import { vitalityMood, type VitalityMood } from './mood';
import { BUILDING_TREE, chainOnLot } from './plan/buildingTree';
import { featuresFor, type CommunityFeature, type FeatureKey } from './plan/features';
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
  'feature',
  'rail',
  'track',
  'station',
  'rail-end',
  'prop',
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

/** Art Pass look of a tree building on its lot: which way it faces and which design it uses. */
interface Look {
  /** Front towards +z (0), +x (1), −z (2) or −x (3); odd only for lots turned from their canonical shape. */
  facing: number;
  /** Design choice, fixed per community and building (hash of both). */
  variant: number;
}

export type PlacedObject =
  | (Base & {
      assetKey: 'house';
      houseId: string;
      nickname: string;
      activeToday: boolean;
      colorIndex: number;
      founding: boolean;
      mine: boolean;
      /** Art Pass house type for this community (requirement.md §7.2, §19). */
      houseType: HouseType;
      /** Front towards +z (0), +x (1), −z (2) or −x (3): the nearest path, else open land. */
      facing: number;
      /** Height of the house in tiles (labels and taps). */
      height: number;
      /** A village house with no owner (requirement.md v1.41 §7.2): no name, no tap, half lit at night. */
      village?: boolean;
    })
  | (Base & { assetKey: 'tree'; variant: number })
  | (Base & { assetKey: 'lamp' })
  | (Base & { assetKey: 'flowers'; variant: number })
  | (Base & { assetKey: 'snow-pile'; variant: number })
  | (Base & { assetKey: 'mini-villager'; index: number; startTile: Tile; colorIndex: number })
  | (Base & Footprint & Look & { assetKey: 'construction-site'; buildingKey: string; title: string; progress: number; level: number })
  | (Base & Footprint & Look & { assetKey: 'silhouette'; buildingKey: string; title: string; ready: boolean; remaining: Remaining | null })
  | (Base & Footprint & { assetKey: 'reserved-plot'; lotKind: string })
  /** A signature feature (requirement.md §7.9) on a spare lot; appears when its land has risen. */
  | (Base & Footprint & Look & { assetKey: 'feature'; featureKey: FeatureKey; name: string | null })
  /** One CTrain track tile under the line: drawn only as a rail bridge (over water) or a level crossing (path). */
  | (Base & { assetKey: 'rail'; links: RailLinks; overWater: boolean; crossing: boolean })
  /** A stretch of CTrain track between two smoothed points (world coordinates; the object sits at the first). */
  | (Base & { assetKey: 'track'; dx: number; dz: number; /** An overhead-wire pole stands at this stretch. */ pole: boolean })
  /** A CTrain station platform beside the track (real position). */
  | (Base & Footprint & Look & { assetKey: 'station'; name: string; lines: string[]; along: 'x' | 'z' })
  /** A street prop on free grass (never blocks walking): bench, flower bed, parked car or mailbox. */
  | (Base & { assetKey: 'prop'; kind: PropKind; facing: number; seed: number })
  /** Sign where the track leaves the island: the next station beyond. */
  | (Base & { assetKey: 'rail-end'; next: string; dir: Tile })
  | (Base &
      Footprint &
      Look & {
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

export type PropKind = 'bench' | 'flowers' | 'car' | 'mailbox';

/** At most this many street props per island (busy, not cluttered). */
export const MAX_PROPS = 70;

export interface RailLinks {
  /** +x, -x, +z, -z neighbours connected by rails. */
  px: boolean;
  nx: boolean;
  pz: boolean;
  nz: boolean;
}

/** A track run in order, for the trains (tiles with their land stage). */
export interface RailRoute {
  line: string;
  tiles: (Tile & { stage: number })[];
  /** Smoothed track line through the tile centres (world x, z), one point per tile. */
  points: { x: number; z: number }[];
  /** Indices of tiles next to a station platform (trains stop there). */
  stops: number[];
}

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
  /** CTrain track runs (all of them; the scene shows the parts on risen land). */
  railRoutes: RailRoute[];
  walkable: Tile[];
  /** Radius (tiles) of the current land around the plaza, for camera fitting. */
  landRadius: number;
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

/**
 * @param villagers how many mini villagers walk this island given its walkable tile count
 *   (requirement.md v1.41 §7.3: random by island size, chosen per visit); default: the state's count.
 */
export function buildIslandLayout(
  plan: IslandPlan,
  state: CommunityViewState,
  features: CommunityFeature[] = featuresFor(plan.code),
  villagerCountFor?: (walkableTiles: number) => number,
): IslandLayout {
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
  const featureQueue = [...features];
  for (const [lotKey, spec] of Object.entries(BUILDING_TREE.lots)) {
    const rect = plan.lots[lotKey];
    const rTiles = lotTiles(rect);
    const stage = Math.max(...rTiles.map(stageOf), spec.landStage);
    const base = { ...centreOf(rect), w: rect.w, d: rect.d, stage };
    const onLand = spec.landStage <= landStage && rTiles.every(on);
    // Signature features take the spare lots in plan order, on land or not (§7.9).
    // A feature keeps its lot while the land is still to come, and appears with that land.
    if (spec.kind === 'spare' && featureQueue.length > 0) {
      const f = featureQueue.shift() as CommunityFeature;
      if (onLand) {
        objects.push({ ...base, facing: lotFacing(rect, pathKeys, false), variant: hashString(`${plan.code}:${f.key}`), id: `feature:${f.key}`, assetKey: 'feature', featureKey: f.key, name: f.name });
        usedLots.push(lotKey);
        rTiles.forEach((t) => occupied.add(tileKey(t)));
      }
      continue;
    }
    // Lots not open yet, spare lots and lots without a building yet stay plain (walkable) land.
    if (!onLand) continue;
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
    const facing = lotFacing(rect, pathKeys, spec.kind === 'entrance');
    const variant = (key: string) => hashString(`${plan.code}:${key}`);
    const buildingIdx = views.findIndex((v) => v?.status === 'building' && v.level === 1);
    let builtIdx = -1;
    views.forEach((v, i) => {
      // An upgrade (building at level 2+) stands on a built building: draw that one.
      if (v?.status === 'built' || (v?.status === 'building' && v.level > 1)) builtIdx = i;
    });
    if (buildingIdx >= 0) {
      const v = views[buildingIdx] as BuildingView;
      objects.push({ ...base, facing, variant: variant(v.key), id: `lot:${lotKey}`, assetKey: 'construction-site', buildingKey: v.key, title: v.title, progress: v.progress, level: v.level });
    } else if (builtIdx >= 0) {
      const v = views[builtIdx] as BuildingView;
      const nextSpec = chain[builtIdx + 1];
      const nextView = nextSpec ? byKey.get(nextSpec.key) : undefined;
      objects.push({
        ...base,
        facing,
        variant: variant(v.key),
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
        facing,
        variant: variant(first.key),
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
    const base = {
      ...centreOf(spare.rect),
      w: spare.rect.w,
      d: spare.rect.d,
      stage: BUILDING_TREE.lots[spare.key].landStage,
      facing: lotFacing(spare.rect, pathKeys, false),
      variant: hashString(`${plan.code}:${b.key}`),
    };
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

  // CTrain (requirement.md §7.9): track tiles, station platforms and next-station signs on land.
  const railRoutes: RailRoute[] = [];
  const links = new Map<string, RailLinks>();
  const link = (a: Tile, b: Tile) => {
    const l = links.get(tileKey(a)) ?? { px: false, nx: false, pz: false, nz: false };
    if (b.x > a.x) l.px = true;
    else if (b.x < a.x) l.nx = true;
    else if (b.z > a.z) l.pz = true;
    else l.nz = true;
    links.set(tileKey(a), l);
  };
  const stationTiles = plan.stations.map((st) => lotTiles(st.rect));
  for (const run of plan.rail) {
    run.tiles.forEach((t, i) => {
      if (i > 0) link(t, run.tiles[i - 1]);
      if (i < run.tiles.length - 1) link(t, run.tiles[i + 1]);
    });
    const stops = run.tiles.flatMap((t, i) =>
      stationTiles.some((tiles) => tiles.some((s) => Math.abs(s.x - t.x) + Math.abs(s.z - t.z) === 1)) ? [i] : [],
    );
    const points = smoothTrack(run.tiles);
    railRoutes.push({ line: run.line, tiles: run.tiles.map((t) => ({ ...t, stage: stageOf(t) })), points, stops });
    // Rails follow the smoothed line, so diagonal runs look straight instead of stair-stepped.
    const ends = plan.railEnds.filter((e) => run.tiles.some((t) => t.x === e.tile.x && t.z === e.tile.z));
    const line = [...points];
    for (const e of ends) {
      const out = { x: e.tile.x + 0.5 + e.dir.x * 0.5, z: e.tile.z + 0.5 + e.dir.z * 0.5 };
      if (run.tiles[0].x === e.tile.x && run.tiles[0].z === e.tile.z) line.unshift(out);
      else line.push(out);
    }
    const tileStage = (pt: { x: number; z: number }) => stageOf({ x: Math.floor(pt.x), z: Math.floor(pt.z) });
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      const st = Math.max(tileStage(a), tileStage(b));
      if (st > landStage) continue;
      objects.push({ assetKey: 'track', id: `track:${run.line}:${tileKey(run.tiles[0])}:${i}`, x: a.x, z: a.z, stage: st, dx: b.x - a.x, dz: b.z - a.z, pole: i % 3 === 1 });
    }
  }
  for (const e of plan.railEnds) link(e.tile, { x: e.tile.x + e.dir.x, z: e.tile.z + e.dir.z });
  for (const [k, l] of links) {
    const [x, z] = k.split(',').map(Number);
    const t = { x, z };
    if (!on(t)) continue;
    occupied.add(k); // no flowers or snow piles on the track
    const overWater = waterKeys.has(k);
    const crossing = pathKeys.has(k);
    if (overWater || crossing) objects.push({ assetKey: 'rail', id: `rail:${k}`, x: x + 0.5, z: z + 0.5, stage: stageOf(t), links: l, overWater, crossing });
  }
  plan.stations.forEach((st, i) => {
    const tiles = stationTiles[i];
    if (!tiles.every(on)) return;
    tiles.forEach((t) => occupied.add(tileKey(t)));
    objects.push({
      assetKey: 'station',
      id: `station:${st.name}`,
      ...centreOf(st.rect),
      w: st.rect.w,
      d: st.rect.d,
      stage: Math.max(...tiles.map(stageOf)),
      name: st.name,
      lines: st.lines,
      along: st.rect.w >= st.rect.d ? 'x' : 'z',
      facing: platformFacing(st.rect, links),
      variant: hashString(`${plan.code}:${st.name}`),
    });
  });
  for (const e of plan.railEnds) {
    if (!on(e.tile)) continue;
    objects.push({ assetKey: 'rail-end', id: `rail-end:${e.next}`, x: e.tile.x + 0.5, z: e.tile.z + 0.5, stage: stageOf(e.tile), next: e.next, dir: e.dir });
  }

  // Pathway lights (a building without a lot): lamps along the shown paths once built.
  if (byKey.get('pathway-lights')?.status === 'built') {
    plan.paths.filter(on).forEach((t, i) => {
      if (i % 3 === 1) objects.push({ assetKey: 'lamp', id: `lamp:${tileKey(t)}`, x: t.x + 0.5, z: t.z + 0.5, stage: stageOf(t) });
    });
  }

  // Houses: each resident's fixed lot (slot); data without slots fills the lots in slot order.
  const lotOrder = houseLotOrder(plan);
  const style = houseStyleFor(plan.code);
  const lotKeys = new Set(plan.houses.map(tileKey));
  const plantedTreeKeys = new Set(plan.trees.map(tileKey));
  const blockedForDoor = (k: string) => lotKeys.has(k) || plantedTreeKeys.has(k) || waterKeys.has(k) || occupied.has(k);
  const houseTiles: string[] = [];
  let offLand = 0;
  state.houses.forEach((h, i) => {
    const t = lotOrder[h.slot ?? i];
    if (!t || !on(t)) {
      offLand += 1;
      return;
    }
    houseTiles.push(tileKey(t));
    const colorIndex = hashString(h.id);
    const houseType = houseTypeFor(style, colorIndex);
    objects.push({
      assetKey: 'house',
      id: `house:${h.id}`,
      houseId: h.id,
      x: t.x + 0.5,
      z: t.z + 0.5,
      stage: stageOf(t),
      nickname: h.nickname,
      activeToday: h.activeToday,
      colorIndex,
      founding: h.founding === true,
      mine: h.mine === true,
      houseType,
      facing: houseFacing(t, pathKeys, (k) => landKeys.has(k) && !blockedForDoor(k)),
      height: houseModelHeight(houseType, colorIndex),
    });
    occupied.add(tileKey(t));
  });
  // Every other house lot on the risen land gets a village house, so the village fills up as the
  // island grows whatever the number of players (§7.2). Archived residents' lots are among them.
  for (const t of lotOrder) {
    const k = tileKey(t);
    if (!on(t) || occupied.has(k)) continue;
    houseTiles.push(k);
    const colorIndex = hashString(`village:${plan.code}:${k}`);
    const houseType = houseTypeFor(style, colorIndex);
    objects.push({
      assetKey: 'house',
      id: `village:${k}`,
      houseId: `village:${k}`,
      x: t.x + 0.5,
      z: t.z + 0.5,
      stage: stageOf(t),
      nickname: '',
      activeToday: false,
      colorIndex,
      founding: false,
      mine: false,
      houseType,
      facing: houseFacing(t, pathKeys, (n) => landKeys.has(n) && !blockedForDoor(n)),
      height: houseModelHeight(houseType, colorIndex),
      village: true,
    });
    occupied.add(k);
  }
  const houseLotKeys = new Set(plan.houses.map(tileKey));

  for (const t of plan.trees.filter(on)) {
    objects.push({ assetKey: 'tree', id: `tree:${tileKey(t)}`, x: t.x + 0.5, z: t.z + 0.5, stage: stageOf(t), variant: Math.floor(hash01(t.x, t.z, 3) * 3) });
    occupied.add(tileKey(t));
  }

  // Street props (Art Pass, "busier communities") and flower patches. They stand on their
  // tile, so walkers go around them: a prop is only placed where it cuts nobody off (every tile
  // that could be reached on foot before stays reachable), never on paths, the plaza or track.
  const baseWalkable = walkableTiles(plan, landStage, houseTiles, usedLots);
  const standing = new Set<string>(); // tiles with a prop or decoration on them
  const cutsOff = (k: string) => {
    const open = new Set(baseWalkable.map(tileKey));
    if (!open.has(k)) return false;
    for (const b of standing) open.delete(b);
    open.delete(k);
    return reachableFromPlaza(open) < open.size;
  };
  const railKeys = new Set(plan.rail.flatMap((r) => r.tiles).map(tileKey));
  // building lots stay clear even while empty: a building will stand there one day
  const buildingLotKeys = new Set(Object.values(plan.lots).flatMap((r) => lotTiles(r)).map(tileKey));
  const free = (k: string) =>
    !pathKeys.has(k) && !waterKeys.has(k) && !occupied.has(k) && !houseLotKeys.has(k) && !railKeys.has(k) && !buildingLotKeys.has(k);
  const houseKeys = new Set(houseTiles);
  let props = 0;
  for (const t of land) {
    if (props >= MAX_PROPS) break;
    const k = tileKey(t);
    if (!free(k)) continue;
    const near = (keys: Set<string>) => N4.findIndex((d) => keys.has(tileKey({ x: t.x + d.x, z: t.z + d.z })));
    const pathSide = near(pathKeys);
    const houseSide = near(houseKeys);
    const r = hash01(t.x, t.z, 11);
    const plazaNear = Math.hypot(t.x + 0.5, t.z + 0.5) < 5;
    // N4 order is +x, −x, +z, −z; facing order is +z, +x, −z, −x
    const facingOf = (side: number) => (side < 0 ? 0 : [1, 3, 0, 2][side]);
    let kind: PropKind | null = null;
    let facing = 0;
    if (houseSide >= 0 && pathSide >= 0 && r < 0.14) {
      // in a driveway between the house and the road: a car nose-in (its front is the model's +x),
      // or the mailbox by the road
      kind = style === 'downtown' || r < 0.08 ? 'car' : 'mailbox';
      facing = kind === 'car' ? (facingOf(houseSide) + 3) % 4 : facingOf(pathSide);
    } else if (houseSide >= 0 && r < 0.05) {
      kind = 'mailbox';
      facing = facingOf(houseSide);
    } else if (pathSide >= 0 && r < (style === 'downtown' ? 0.09 : 0.04)) {
      // parked at the roadside, along the road
      kind = 'car';
      facing = facingOf(pathSide);
    } else if (pathSide >= 0 && r < 0.12) {
      kind = 'bench';
      facing = facingOf(pathSide);
    } else if ((pathSide >= 0 && r < 0.18) || (plazaNear && r < 0.35)) {
      kind = 'flowers';
      facing = facingOf(houseSide >= 0 ? houseSide : pathSide);
    }
    if (!kind || cutsOff(k)) continue;
    objects.push({ assetKey: 'prop', id: `prop:${k}`, x: t.x + 0.5, z: t.z + 0.5, stage: t.stage, kind, facing, seed: hashString(k) });
    occupied.add(k);
    standing.add(k);
    props++;
  }

  // A few wild flower patches on free grass, on every island whatever its mood (requirement.md
  // v1.40 §7.4); under snow the model draws a little snow pile instead (§10.4).
  for (const t of land) {
    const k = tileKey(t);
    if (!free(k) || hash01(t.x, t.z, 2) >= 0.05 || cutsOff(k)) continue;
    objects.push({ assetKey: 'flowers', id: `decor:${k}`, x: t.x + 0.5, z: t.z + 0.5, stage: t.stage, variant: Math.floor(hash01(t.x, t.z, 4) * 4) });
    occupied.add(k);
    standing.add(k);
  }

  const walkable = baseWalkable.filter((t) => !standing.has(tileKey(t)));

  // Mini villagers start on the paths and plaza.
  const walkKeys = new Set(walkable.map(tileKey));
  const pathTiles = [...PLAZA, ...plan.paths].filter((t) => walkKeys.has(tileKey(t)));
  const villagers = Math.min(villagerCountFor ? villagerCountFor(walkable.length) : state.miniVillagerCount, MAX_MINI_VILLAGERS);
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
    railRoutes,
    walkable,
    landRadius,
    hiddenHouseCount: offLand + (state.extraResidents ?? 0) + hiddenUnknown,
  };
}

/** How many of the `open` tiles can be reached on foot from the plaza (4-connected). */
function reachableFromPlaza(open: Set<string>): number {
  const seen = new Set<string>();
  const queue = PLAZA.map(tileKey).filter((k) => open.has(k));
  queue.forEach((k) => seen.add(k));
  while (queue.length > 0) {
    const [x, z] = (queue.pop() as string).split(',').map(Number);
    for (const d of N4) {
      const n = `${x + d.x},${z + d.z}`;
      if (open.has(n) && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen.size;
}

/**
 * Smoothed track line through the tile centres (moving average over 7 tiles, ends kept), so a
 * 4-connected staircase of tiles becomes a straight diagonal line.
 */
export function smoothTrack(tiles: Tile[]): { x: number; z: number }[] {
  const c = tiles.map((t) => ({ x: t.x + 0.5, z: t.z + 0.5 }));
  return c.map((p, i) => {
    const r = Math.min(3, i, c.length - 1 - i);
    if (r === 0) return p;
    let x = 0;
    let z = 0;
    for (let j = i - r; j <= i + r; j++) {
      x += c[j].x;
      z += c[j].z;
    }
    return { x: x / (2 * r + 1), z: z / (2 * r + 1) };
  });
}

/**
 * Which way a building faces on its lot: the side with the most path or plaza tiles next to it.
 * A non-square lot only turns in ways that keep its shape (wide along x → +z or −z). The entrance
 * (welcome sign, arch) faces away from the plaza, along the road out. Ties face the plaza.
 */
export function lotFacing(rect: LotRect, pathKeys: Set<string>, entrance: boolean): number {
  const cx = rect.x + rect.w / 2;
  const cz = rect.z + rect.d / 2;
  const towardsPlaza = Math.abs(cz) >= Math.abs(cx) ? (cz <= 0 ? 0 : 2) : cx <= 0 ? 1 : 3;
  if (entrance) return (towardsPlaza + 2) % 4;
  const allowed = rect.w === rect.d ? [0, 1, 2, 3] : rect.w > rect.d ? [0, 2] : [1, 3];
  const sideTiles = (f: number): Tile[] => {
    const out: Tile[] = [];
    if (f === 0) for (let i = 0; i < rect.w; i++) out.push({ x: rect.x + i, z: rect.z + rect.d });
    if (f === 2) for (let i = 0; i < rect.w; i++) out.push({ x: rect.x + i, z: rect.z - 1 });
    if (f === 1) for (let j = 0; j < rect.d; j++) out.push({ x: rect.x + rect.w, z: rect.z + j });
    if (f === 3) for (let j = 0; j < rect.d; j++) out.push({ x: rect.x - 1, z: rect.z + j });
    return out;
  };
  let best = allowed.includes(towardsPlaza) ? towardsPlaza : allowed[0];
  let bestScore = -1;
  for (const f of allowed) {
    const score = sideTiles(f).filter((t) => pathKeys.has(tileKey(t))).length + (f === towardsPlaza ? 0.5 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

/** A platform's safety edge faces the track: the long side that has track tiles next to it. */
export function platformFacing(rect: LotRect, railTiles: { has: (k: string) => boolean }): number {
  if (rect.w >= rect.d) {
    for (let i = 0; i < rect.w; i++) if (railTiles.has(tileKey({ x: rect.x + i, z: rect.z + rect.d }))) return 0;
    return 2;
  }
  for (let j = 0; j < rect.d; j++) if (railTiles.has(tileKey({ x: rect.x + rect.w, z: rect.z + j }))) return 1;
  return 3;
}

/** Directions in `facing` order: +z, +x, −z, −x. */
const FACING_DIRS: Tile[] = [
  { x: 0, z: 1 },
  { x: 1, z: 0 },
  { x: 0, z: -1 },
  { x: -1, z: 0 },
];

/**
 * Which way a house faces: towards a path or plaza tile next to it, else towards open land next
 * to it, else towards the plaza (the island centre). Ties keep the `facing` order.
 */
export function houseFacing(t: Tile, pathKeys: Set<string>, isOpen: (k: string) => boolean): number {
  const keyAt = (i: number) => tileKey({ x: t.x + FACING_DIRS[i].x, z: t.z + FACING_DIRS[i].z });
  for (let i = 0; i < 4; i++) if (pathKeys.has(keyAt(i))) return i;
  for (let i = 0; i < 4; i++) if (isOpen(keyAt(i))) return i;
  const cx = -(t.x + 0.5);
  const cz = -(t.z + 0.5);
  return Math.abs(cz) >= Math.abs(cx) ? (cz >= 0 ? 0 : 2) : cx >= 0 ? 1 : 3;
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
