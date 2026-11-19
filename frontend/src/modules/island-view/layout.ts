/**
 * Island layout: turns a CommunityViewState into tiles and placed objects.
 *
 * Coordinates: tile (x, z) is an integer index; an island of size N covers
 * x, z ∈ [-N/2, N/2 - 1], so the island is centred on the world origin and a
 * tile's centre is at world (x + 0.5, z + 0.5). The camera looks from +x/+z,
 * so the entrance (road end + name sign) is at the +z edge.
 *
 * Stability rule (requirement.md §7.8): every slot is defined once on the
 * largest grid and is independent of the current size. A smaller island
 * simply shows the slots that fit, so growing never moves existing things.
 */
import { vitalityMood, type VitalityMood } from './mood';
import {
  BUILDING_KINDS,
  ISLAND_SIZES,
  PROJECT_KINDS,
  MAX_ISLAND_SIZE,
  MAX_MINI_VILLAGERS,
  type BuildingKind,
  type CommunityViewState,
  type IslandSize,
  type ProjectKind,
} from './types';

export interface Tile {
  x: number;
  z: number;
}

interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

/** Ring 0 is the centre 2×2; a tile is on an island of size N when ring < N/2. */
export const ringOf = ({ x, z }: Tile): number => Math.max(x >= 0 ? x : -x - 1, z >= 0 ? z : -z - 1);
export const isOnIsland = (t: Tile, size: number): boolean => ringOf(t) < size / 2;
export const tileKey = ({ x, z }: Tile): string => `${x},${z}`;

const rectTiles = (r: Rect): Tile[] => {
  const out: Tile[] = [];
  for (let x = r.x; x < r.x + r.w; x++) for (let z = r.z; z < r.z + r.d; z++) out.push({ x, z });
  return out;
};
const rectRing = (r: Rect): number => Math.max(...rectTiles(r).map(ringOf));
const rectCentre = (r: Rect) => ({ x: r.x + r.w / 2, z: r.z + r.d / 2 });

// ---------------------------------------------------------------------------
// Fixed layout template (all fit inside the smallest 8×8 island)
// ---------------------------------------------------------------------------

/** Centre plaza. */
export const PLAZA: Rect = { x: -1, z: -1, w: 2, d: 2 };
/** The road runs from the plaza to the entrance at the +z edge, two tiles wide. */
const ROAD_XS = [-1, 0];

export function isPathTile(t: Tile): boolean {
  const inPlaza = t.x >= PLAZA.x && t.x < PLAZA.x + PLAZA.w && t.z >= PLAZA.z && t.z < PLAZA.z + PLAZA.d;
  return inPlaza || (ROAD_XS.includes(t.x) && t.z >= PLAZA.z + PLAZA.d);
}

/** Unlock buildings (2×2). */
export const BUILDING_SLOTS: Record<BuildingKind, Rect> = {
  playground: { x: -3, z: -3, w: 2, d: 2 },
  'community-centre': { x: 1, z: -3, w: 2, d: 2 },
  park: { x: -3, z: 1, w: 2, d: 2 },
};

/** Project construction sites (2×2), filled in the order the server lists projects. */
export const PROJECT_SLOTS: Rect[] = [
  { x: 1, z: 1, w: 2, d: 2 },
  { x: -1, z: -3, w: 2, d: 2 },
  { x: 1, z: -1, w: 2, d: 2 },
];

/** Tile in front of project site `index` (the avatar walks next to it to help). */
export function projectSiteTile(index: number): Tile {
  const r = PROJECT_SLOTS[index];
  if (!r) throw new RangeError(`no project slot ${index}`);
  return { x: r.x + r.w - 1, z: r.z + r.d - 1 };
}

// ---------------------------------------------------------------------------
// Global slot tables (computed once for the largest island)
// ---------------------------------------------------------------------------

/** Deterministic hash → [0, 1). Same tile always gets the same tree/flowers. */
function hash01(a: number, b: number, salt: number): number {
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

const half = MAX_ISLAND_SIZE / 2;
/** All tiles of the largest island, ordered from the centre outward (ring, distance, angle). */
const ALL_TILES: Tile[] = (() => {
  const tiles: Tile[] = [];
  for (let x = -half; x < half; x++) for (let z = -half; z < half; z++) tiles.push({ x, z });
  const dist = (t: Tile) => Math.hypot(t.x + 0.5, t.z + 0.5);
  const angle = (t: Tile) => Math.atan2(t.z + 0.5, t.x + 0.5);
  return tiles.sort((a, b) => ringOf(a) - ringOf(b) || dist(a) - dist(b) || angle(a) - angle(b));
})();

const BASE_FIXED_TILES = new Set([...Object.values(BUILDING_SLOTS), ...PROJECT_SLOTS].flatMap(rectTiles).map(tileKey));

const N4 = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const neighbours = (t: Tile, dirs: readonly (readonly [number, number])[]): Tile[] =>
  dirs.map(([dx, dz]) => ({ x: t.x + dx, z: t.z + dz }));

const isFree = (t: Tile) => !isPathTile(t) && !FIXED_TILES.has(tileKey(t));
const PLAZA_TILES = rectTiles(PLAZA);

/**
 * Reachability guard: with `blocked` tiles filled, every open tile of an island
 * of `size` must be reachable from the plaza, and every house lot must keep a
 * reachable neighbour (its door). Lots count as blocked here, so the island stays
 * walkable however many houses are built.
 */
function staysReachable(blocked: Set<string>, lots: Tile[], size: number): boolean {
  const seen = new Set<string>(PLAZA_TILES.map(tileKey));
  const queue = [...PLAZA_TILES];
  while (queue.length > 0) {
    const t = queue.pop() as Tile;
    for (const n of neighbours(t, N4)) {
      const k = tileKey(n);
      if (!seen.has(k) && isOnIsland(n, size) && !blocked.has(k)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  const openTiles = size * size - [...blocked].filter((k) => {
    const [x, z] = k.split(',').map(Number);
    return isOnIsland({ x, z }, size);
  }).length;
  if (seen.size !== openTiles) return false;
  return lots.every((l) => !isOnIsland(l, size) || neighbours(l, N4).some((n) => seen.has(tileKey(n))));
}

/** Island sizes on which tile t exists. */
const sizesContaining = (t: Tile) => ISLAND_SIZES.filter((s) => isOnIsland(t, s));

/**
 * Showcase: one 1×1 spot per project kind (catalog order) for the miniature of its
 * completed project, in the front row on both sides of the entrance road (8×8 edge).
 * Reserved (no houses or trees) but NOT blocking: like flowers and lamps, characters may
 * walk over them. The smallest island's edge is a one-tile corridor, so blocking spots
 * there would cut paths or cost house lots.
 */
export const SHOWCASE_SLOTS: Record<ProjectKind, Tile> = {
  'ice-rink': { x: -2, z: 3 },
  'flower-path': { x: 1, z: 3 },
  'holiday-decorations': { x: -3, z: 3 },
  'snowman-garden': { x: 2, z: 3 },
  'lantern-street': { x: -4, z: 3 },
  'bird-feeders': { x: 3, z: 3 },
};

const FIXED_TILES = new Set([...BASE_FIXED_TILES, ...Object.values(SHOWCASE_SLOTS).map(tileKey)]);

/** House lots: free tiles, centre outward, never touching another lot (8-neighbours). */
const HOUSE_SLOTS: Tile[] = [];
const BLOCKED_BY_LOTS = new Set(BASE_FIXED_TILES);
for (const t of ALL_TILES) {
  const k = tileKey(t);
  if (!isFree(t) || neighbours(t, N8).some((n) => BLOCKED_BY_LOTS.has(tileKey(n)) && !BASE_FIXED_TILES.has(tileKey(n)))) {
    continue;
  }
  BLOCKED_BY_LOTS.add(k);
  if (sizesContaining(t).every((s) => staysReachable(BLOCKED_BY_LOTS, [...HOUSE_SLOTS, t], s))) {
    HOUSE_SLOTS.push(t);
  } else {
    BLOCKED_BY_LOTS.delete(k);
  }
}
const HOUSE_SLOT_KEYS = new Set(HOUSE_SLOTS.map(tileKey));

/** Trees: some free tiles that are not lots, off the road edges, never cutting off a path. */
const TREE_TILES: Tile[] = [];
const BLOCKED_BY_TREES = new Set(BLOCKED_BY_LOTS);
for (const t of ALL_TILES) {
  const k = tileKey(t);
  if (!isFree(t) || HOUSE_SLOT_KEYS.has(k) || hash01(t.x, t.z, 1) >= 0.34) continue;
  if (neighbours(t, N4).some(isPathTile)) continue;
  BLOCKED_BY_TREES.add(k);
  if (sizesContaining(t).every((s) => staysReachable(BLOCKED_BY_TREES, HOUSE_SLOTS, s))) {
    TREE_TILES.push(t);
  } else {
    BLOCKED_BY_TREES.delete(k);
  }
}
const TREE_KEYS = new Set(TREE_TILES.map(tileKey));

/** Mood decorations (flowers when lively, snow piles when gloomy); never block walking. */
const DECOR_TILES: Tile[] = ALL_TILES.filter(
  (t) => isFree(t) && !HOUSE_SLOT_KEYS.has(tileKey(t)) && !TREE_KEYS.has(tileKey(t)) && hash01(t.x, t.z, 2) < 0.22,
);

// ---------------------------------------------------------------------------
// Layout output
// ---------------------------------------------------------------------------

export const ASSET_KEYS = [
  'house',
  'building.playground',
  'building.community-centre',
  'building.park',
  'silhouette',
  'construction-site',
  ...PROJECT_KINDS.map((k) => `showcase.${k}` as const),
  'tree',
  'sign',
  'lamp',
  'flowers',
  'snow-pile',
  'mini-villager',
] as const;
export type AssetKey = (typeof ASSET_KEYS)[number];

interface Base {
  id: string;
  /** World coordinates of the footprint centre (ground level y = 0). */
  x: number;
  z: number;
  /** Outermost ring the object touches; used to reveal objects after growth. */
  ring: number;
}

export type PlacedObject =
  | (Base & { assetKey: 'house'; houseId: string; nickname: string; activeToday: boolean; colorIndex: number })
  | (Base & { assetKey: `building.${BuildingKind}` })
  | (Base & { assetKey: 'silhouette'; target: BuildingKind; remaining: { streakDays: number; residents: number } | null })
  | (Base & { assetKey: 'construction-site'; stage: 'scaffolding' | 'frame'; progress: number; title: string; level: number })
  | (Base & { assetKey: `showcase.${ProjectKind}`; kind: ProjectKind; level: number })
  | (Base & { assetKey: 'tree'; variant: number })
  | (Base & { assetKey: 'sign'; name: string })
  | (Base & { assetKey: 'lamp' })
  | (Base & { assetKey: 'flowers' | 'snow-pile'; variant: number })
  | (Base & { assetKey: 'mini-villager'; index: number; startTile: Tile; colorIndex: number });

/** The placed-object type for one asset key. */
export type ObjectOf<K extends AssetKey> = PlacedObject extends infer P
  ? P extends { assetKey: infer A }
    ? K extends A
      ? P & { assetKey: K }
      : never
    : never
  : never;

export interface IslandTile extends Tile {
  kind: 'grass' | 'path';
  ring: number;
}

export interface IslandLayout {
  size: IslandSize;
  mood: VitalityMood;
  tiles: IslandTile[];
  objects: PlacedObject[];
  /** Tiles reachable on foot from the plaza (villagers now, avatar pathfinding in M2). */
  walkable: Tile[];
  /** Houses that did not fit (only possible on the largest island). */
  hiddenHouseCount: number;
}

/** Number of house lots on an island of this size. */
export const houseCapacity = (size: number): number => HOUSE_SLOTS.filter((t) => isOnIsland(t, size)).length;

export function buildIslandLayout(state: CommunityViewState): IslandLayout {
  const size = state.islandSize;
  const mood = state.vitality === null ? 'normal' : vitalityMood(state.vitality);
  const on = (t: Tile) => isOnIsland(t, size);
  const objects: PlacedObject[] = [];
  const blocked = new Set<string>();
  const block = (tiles: Tile[]) => tiles.forEach((t) => blocked.add(tileKey(t)));

  const tiles: IslandTile[] = ALL_TILES.filter(on).map((t) => ({
    ...t,
    kind: isPathTile(t) ? 'path' : 'grass',
    ring: ringOf(t),
  }));

  // Houses: one per shown resident, centre outward.
  const lots = HOUSE_SLOTS.filter(on);
  state.houses.slice(0, lots.length).forEach((h, i) => {
    const t = lots[i];
    objects.push({
      assetKey: 'house',
      id: `house:${h.id}`,
      houseId: h.id,
      x: t.x + 0.5,
      z: t.z + 0.5,
      ring: ringOf(t),
      nickname: h.nickname,
      activeToday: h.activeToday,
      colorIndex: hashString(h.id),
    });
    block([t]);
  });

  // Unlock buildings: real building when unlocked, faded silhouette when locked.
  for (const kind of BUILDING_KINDS) {
    const rect = BUILDING_SLOTS[kind];
    const b = state.buildings[kind];
    const base = { id: `building:${kind}`, ...rectCentre(rect), ring: rectRing(rect) };
    objects.push(
      b.unlocked
        ? { ...base, assetKey: `building.${kind}` }
        : { ...base, assetKey: 'silhouette', target: kind, remaining: b.remaining },
    );
    block(rectTiles(rect));
  }

  // Active projects: construction sites in the order the server lists them.
  state.projects.slice(0, PROJECT_SLOTS.length).forEach((p, i) => {
    const rect = PROJECT_SLOTS[i];
    objects.push({
      id: `project:${p.id}`,
      ...rectCentre(rect),
      ring: rectRing(rect),
      assetKey: 'construction-site',
      stage: p.stage,
      progress: p.progress,
      title: p.title,
      level: p.level,
    });
    block(rectTiles(rect));
  });

  // Completed projects: one miniature per kind on its showcase spot.
  for (const item of state.showcase) {
    const t = SHOWCASE_SLOTS[item.kind];
    objects.push({
      id: `showcase:${item.kind}`,
      x: t.x + 0.5,
      z: t.z + 0.5,
      ring: ringOf(t),
      assetKey: `showcase.${item.kind}`,
      kind: item.kind,
      level: item.level,
    });
    // Not blocking (see SHOWCASE_SLOTS).
  }

  for (const t of TREE_TILES.filter(on)) {
    objects.push({
      assetKey: 'tree',
      id: `tree:${tileKey(t)}`,
      x: t.x + 0.5,
      z: t.z + 0.5,
      ring: ringOf(t),
      variant: Math.floor(hash01(t.x, t.z, 3) * 3),
    });
    block([t]);
  }

  if (mood !== 'normal') {
    for (const t of DECOR_TILES.filter(on)) {
      objects.push({
        assetKey: mood === 'lively' ? 'flowers' : 'snow-pile',
        id: `decor:${tileKey(t)}`,
        x: t.x + 0.5,
        z: t.z + 0.5,
        ring: ringOf(t),
        variant: Math.floor(hash01(t.x, t.z, 4) * 4),
      });
    }
  }

  // Entrance arch with the community name at the road end (+z edge).
  const lastRow = size / 2 - 1;
  objects.push({ assetKey: 'sign', id: 'sign', x: 0, z: lastRow + 0.5, ring: lastRow, name: state.communityName });

  // Lamps at the back of the plaza and along the road.
  const lampAt = (x: number, z: number, ring: number) =>
    objects.push({ assetKey: 'lamp', id: `lamp:${x},${z}`, x, z, ring });
  lampAt(-0.92, -0.92, 0);
  lampAt(0.92, -0.92, 0);
  for (let z = 2; z < lastRow; z += 3) {
    lampAt(-0.92, z + 0.5, ringOf({ x: 0, z }));
    lampAt(0.92, z + 0.5, ringOf({ x: 0, z }));
  }

  // Walkable = reachable from the plaza without crossing blocked tiles.
  const walkable: Tile[] = [];
  const seen = new Set<string>();
  const queue: Tile[] = rectTiles(PLAZA);
  queue.forEach((t) => seen.add(tileKey(t)));
  while (queue.length > 0) {
    const t = queue.shift() as Tile;
    walkable.push(t);
    for (const n of neighbours(t, N4)) {
      const k = tileKey(n);
      if (!seen.has(k) && on(n) && !blocked.has(k)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }

  // Mini villagers start on path tiles (spread deterministically).
  const pathTiles = walkable.filter(isPathTile);
  const villagers = Math.min(state.miniVillagerCount, MAX_MINI_VILLAGERS);
  for (let i = 0; i < villagers; i++) {
    const t = pathTiles[Math.floor(hash01(i, villagers, 5) * pathTiles.length)];
    objects.push({
      assetKey: 'mini-villager',
      id: `villager:${i}`,
      x: t.x + 0.5,
      z: t.z + 0.5,
      ring: ringOf(t),
      index: i,
      startTile: t,
      colorIndex: i,
    });
  }

  return {
    size,
    mood,
    tiles,
    objects,
    walkable,
    hiddenHouseCount: Math.max(0, state.houses.length - lots.length),
  };
}
