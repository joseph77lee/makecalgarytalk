import { describe, expect, it } from 'vitest';
import {
  ASSET_KEYS,
  BUILDING_SLOTS,
  PROJECT_SLOTS,
  SHOWCASE_SLOTS,
  projectSiteTile,
  buildIslandLayout,
  houseCapacity,
  isOnIsland,
  isPathTile,
  ringOf,
  tileKey,
  type AssetKey,
  type IslandLayout,
  type ObjectOf,
  type PlacedObject,
  type Tile,
} from './layout';
import mock from './mockCommunityState.json';
import { parseCommunityViewState } from './parseState';
import { ISLAND_SIZES, PROJECT_KINDS, type CommunityViewState, type IslandSize } from './types';

function baseState(): CommunityViewState {
  const r = parseCommunityViewState(mock);
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return r.state;
}

const residents = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `r${i}`, nickname: `R${i}`, activeToday: i % 2 === 0 }));

function stateWith(patch: Partial<CommunityViewState>): CommunityViewState {
  return { ...baseState(), speechBubbles: [], ...patch };
}

const of = <K extends AssetKey>(l: IslandLayout, k: K) =>
  l.objects.filter((o): o is ObjectOf<K> => o.assetKey === k);

/** Tiles an object physically occupies (blocks walking). */
function footprint(o: PlacedObject): Tile[] {
  if (o.assetKey.startsWith('building.') || o.assetKey === 'silhouette' || o.assetKey === 'construction-site') {
    return [
      { x: o.x - 1, z: o.z - 1 },
      { x: o.x, z: o.z - 1 },
      { x: o.x - 1, z: o.z },
      { x: o.x, z: o.z },
    ];
  }
  if (o.assetKey === 'house' || o.assetKey === 'tree') return [{ x: o.x - 0.5, z: o.z - 0.5 }];
  return [];
}

/** Upper bound of cumulative residents for each tier (requirement.md §7.8). */
const TIER_MAX_RESIDENTS: Record<IslandSize, number> = { 8: 2, 12: 5, 16: 10, 20: 25, 26: 50, 32: 80 };

describe('island tiles', () => {
  it.each(ISLAND_SIZES)('size %s has N×N tiles, all on the island', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size }));
    expect(l.tiles).toHaveLength(size * size);
    expect(new Set(l.tiles.map(tileKey)).size).toBe(size * size);
    for (const t of l.tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-size / 2);
      expect(t.x).toBeLessThan(size / 2);
      expect(t.z).toBeGreaterThanOrEqual(-size / 2);
      expect(t.z).toBeLessThan(size / 2);
    }
  });

  it.each(ISLAND_SIZES)('size %s: the road reaches the entrance edge', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size }));
    const edge = l.tiles.filter((t) => t.kind === 'path' && t.z === size / 2 - 1);
    expect(edge.map((t) => t.x).sort()).toEqual([-1, 0]);
  });
});

describe('fixed slots', () => {
  const rects = [...Object.values(BUILDING_SLOTS), ...PROJECT_SLOTS];
  const tilesOf = (r: { x: number; z: number; w: number; d: number }) =>
    Array.from({ length: r.w * r.d }, (_, i) => ({ x: r.x + (i % r.w), z: r.z + Math.floor(i / r.w) }));

  it('all buildings and project sites fit on the smallest island', () => {
    for (const r of rects) for (const t of tilesOf(r)) expect(isOnIsland(t, 8)).toBe(true);
  });

  it('do not overlap each other or the road', () => {
    const all = rects.flatMap(tilesOf);
    expect(new Set(all.map(tileKey)).size).toBe(all.length);
    expect(all.filter(isPathTile)).toEqual([]);
  });
});

describe('houses', () => {
  it.each(ISLAND_SIZES)('size %s holds the most residents its tier can have', (size) => {
    expect(houseCapacity(size)).toBeGreaterThanOrEqual(TIER_MAX_RESIDENTS[size]);
    const l = buildIslandLayout(stateWith({ islandSize: size, houses: residents(TIER_MAX_RESIDENTS[size]) }));
    expect(of(l, 'house')).toHaveLength(TIER_MAX_RESIDENTS[size]);
    expect(l.hiddenHouseCount).toBe(0);
  });

  it('fill from the centre outward', () => {
    const l = buildIslandLayout(stateWith({ islandSize: 32, houses: residents(40) }));
    const rings = of(l, 'house').map((h) => h.ring);
    expect(rings).toEqual([...rings].sort((a, b) => a - b));
  });

  it('never touch each other (8 neighbours)', () => {
    const l = buildIslandLayout(stateWith({ islandSize: 32, houses: residents(houseCapacity(32)) }));
    const keys = new Set(of(l, 'house').map((h) => `${h.x},${h.z}`));
    for (const h of of(l, 'house')) {
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        expect(keys.has(`${h.x + dx},${h.z + dz}`)).toBe(false);
      }
    }
  });

  it('report overflow instead of overlapping when there are too many', () => {
    const cap = houseCapacity(8);
    const l = buildIslandLayout(stateWith({ islandSize: 8, houses: residents(cap + 3) }));
    expect(of(l, 'house')).toHaveLength(cap);
    expect(l.hiddenHouseCount).toBe(3);
  });

  it('carry nickname and lights state', () => {
    const l = buildIslandLayout(stateWith({ houses: [{ id: 'a', nickname: 'Sarah', activeToday: false }] }));
    expect(of(l, 'house')[0]).toMatchObject({ houseId: 'a', nickname: 'Sarah', activeToday: false });
  });
});

describe('no overlaps and reachability', () => {
  it.each(ISLAND_SIZES)('size %s at full houses: blocking objects never share a tile', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size, houses: residents(houseCapacity(size)) }));
    const all = l.objects.flatMap(footprint);
    expect(new Set(all.map(tileKey)).size).toBe(all.length);
    for (const t of all) {
      expect(isOnIsland(t, size)).toBe(true);
      expect(isPathTile(t)).toBe(false);
    }
  });

  it.each(ISLAND_SIZES)('size %s: every house, building and site can be reached on foot', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size, houses: residents(houseCapacity(size)) }));
    const walk = new Set(l.walkable.map(tileKey));
    for (const o of l.objects) {
      const fp = footprint(o);
      if (fp.length === 0) continue;
      const touches = fp.some((t) =>
        [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => walk.has(tileKey({ x: t.x + dx, z: t.z + dz }))),
      );
      if (o.assetKey === 'tree') continue; // trees may sit in corners
      expect(touches, `${o.id} is not reachable`).toBe(true);
    }
  });

  it.each(ISLAND_SIZES)('size %s: walkable tiles are on the island and not blocked', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size, houses: residents(houseCapacity(size)) }));
    const blocked = new Set(l.objects.flatMap(footprint).map(tileKey));
    for (const t of l.walkable) {
      expect(isOnIsland(t, size)).toBe(true);
      expect(blocked.has(tileKey(t))).toBe(false);
    }
    // the whole road is walkable
    const road = l.tiles.filter((t) => t.kind === 'path').map(tileKey);
    const walk = new Set(l.walkable.map(tileKey));
    expect(road.every((k) => walk.has(k))).toBe(true);
  });
});

describe('growth keeps things in place (requirement.md §7.8)', () => {
  for (let i = 0; i < ISLAND_SIZES.length - 1; i++) {
    const small = ISLAND_SIZES[i];
    const big = ISLAND_SIZES[i + 1];
    it(`${small} → ${big}: every house, building, site and tree stays where it was`, () => {
      const houses = residents(TIER_MAX_RESIDENTS[small]);
      const a = buildIslandLayout(stateWith({ islandSize: small, houses }));
      const b = buildIslandLayout(stateWith({ islandSize: big, houses }));
      const pos = new Map(b.objects.map((o) => [o.id, `${o.x},${o.z}`]));
      for (const o of a.objects) {
        if (o.assetKey === 'sign' || o.assetKey === 'mini-villager') continue; // sign moves to the new edge; villagers wander
        expect(pos.get(o.id), o.id).toBe(`${o.x},${o.z}`);
      }
    });
  }

  it.each(ISLAND_SIZES)('size %s: the name sign stands at the entrance edge', (size) => {
    const sign = of(buildIslandLayout(stateWith({ islandSize: size })), 'sign')[0];
    expect(sign).toMatchObject({ x: 0, z: size / 2 - 0.5, name: 'Mahogany' });
  });

  it('every object records the outermost ring it touches', () => {
    const l = buildIslandLayout(stateWith({ islandSize: 20, houses: residents(25) }));
    for (const o of l.objects) {
      const fp = footprint(o);
      if (fp.length) expect(o.ring).toBe(Math.max(...fp.map(ringOf)));
      expect(o.ring).toBeLessThan(10);
    }
  });
});

describe('state → objects', () => {
  it('locked buildings become silhouettes with what is missing', () => {
    const l = buildIslandLayout(baseState());
    expect(of(l, 'building.playground')).toHaveLength(1);
    expect(of(l, 'silhouette').map((s) => [s.target, s.remaining])).toEqual([
      ['community-centre', { streakDays: 4, residents: 1 }],
      ['park', { streakDays: 27, residents: 0 }],
    ]);
  });

  it('unlocked buildings never show as silhouettes', () => {
    const s = baseState();
    const l = buildIslandLayout({
      ...s,
      buildings: { playground: { unlocked: true }, 'community-centre': { unlocked: true }, park: { unlocked: true } },
    });
    expect(of(l, 'silhouette')).toEqual([]);
    expect(of(l, 'building.park')).toHaveLength(1);
  });

  it('active projects are construction sites; completed ones are showcase miniatures', () => {
    const l = buildIslandLayout(baseState());
    expect(of(l, 'construction-site').map((c) => [c.stage, c.progress, c.level])).toEqual([
      ['frame', 0.55, 1],
      ['scaffolding', 0.2, 1],
      ['scaffolding', 0.1, 1],
    ]);
    expect(of(l, 'showcase.holiday-decorations')).toHaveLength(1);
    expect(of(l, 'showcase.lantern-street')[0]).toMatchObject({ level: 2 });
    expect(of(l, 'showcase.ice-rink')).toEqual([]);
  });

  it('every showcase spot fits on the smallest island, off the road, one per kind', () => {
    const tiles = Object.values(SHOWCASE_SLOTS);
    expect(new Set(tiles.map(tileKey)).size).toBe(PROJECT_KINDS.length);
    for (const t of tiles) {
      expect(isOnIsland(t, 8)).toBe(true);
      expect(isPathTile(t)).toBe(false);
    }
  });

  it.each(ISLAND_SIZES)('size %s: no house, tree, building or site ever sits on a showcase spot', (size) => {
    const l = buildIslandLayout(stateWith({ islandSize: size, houses: residents(houseCapacity(size)) }));
    const spots = new Set(Object.values(SHOWCASE_SLOTS).map(tileKey));
    const clash = l.objects.flatMap(footprint).filter((t) => spots.has(tileKey(t)));
    expect(clash).toEqual([]);
    // showcase spots are walkable (not blocking)
    const walk = new Set(l.walkable.map(tileKey));
    for (const k of spots) expect(walk.has(k)).toBe(true);
  });

  it.each(ISLAND_SIZES)('size %s: a full showcase and full houses stay reachable', (size) => {
    const showcase = PROJECT_KINDS.map((kind) => ({ kind, level: 1 }));
    const l = buildIslandLayout(stateWith({ islandSize: size, showcase, houses: residents(houseCapacity(size)) }));
    const walk = new Set(l.walkable.map(tileKey));
    for (const o of l.objects.filter((x) => x.assetKey.startsWith('showcase.') || x.assetKey === 'house')) {
      const t = { x: o.x - 0.5, z: o.z - 0.5 };
      const reachable = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => walk.has(tileKey({ x: t.x + dx, z: t.z + dz })));
      expect(reachable, `${o.id} is not reachable`).toBe(true);
    }
  });

  it('projectSiteTile is a corner tile of each project site', () => {
    PROJECT_SLOTS.forEach((r, i) => {
      const t = projectSiteTile(i);
      expect(t.x).toBe(r.x + r.w - 1);
      expect(t.z).toBe(r.z + r.d - 1);
    });
    expect(() => projectSiteTile(3)).toThrow(RangeError);
  });

  it('missing Vitality draws the Normal mood; unknown unlock conditions stay null', () => {
    const l = buildIslandLayout(
      stateWith({ vitality: null, buildings: { ...baseState().buildings, park: { unlocked: false, remaining: null } } }),
    );
    expect(l.mood).toBe('normal');
    expect(of(l, 'silhouette').find((x) => x.target === 'park')?.remaining).toBeNull();
  });

  it('mood decorations follow Vitality', () => {
    const at = (vitality: number) => buildIslandLayout(stateWith({ vitality, islandSize: 16 }));
    expect(of(at(80), 'flowers').length).toBeGreaterThan(0);
    expect(of(at(80), 'snow-pile')).toEqual([]);
    expect(of(at(45), 'flowers')).toEqual([]);
    expect(of(at(45), 'snow-pile')).toEqual([]);
    expect(of(at(10), 'snow-pile').length).toBeGreaterThan(0);
    expect(of(at(10), 'flowers')).toEqual([]);
    expect(at(10).mood).toBe('gloomy');
  });

  it('mini villagers: count from state, start on the road, capped at 20', () => {
    const l = buildIslandLayout(stateWith({ miniVillagerCount: 7 }));
    const v = of(l, 'mini-villager');
    expect(v).toHaveLength(7);
    for (const m of v) expect(isPathTile(m.startTile)).toBe(true);
    // defensive cap even if an unvalidated state slips through
    expect(of(buildIslandLayout(stateWith({ miniVillagerCount: 50 })), 'mini-villager')).toHaveLength(20);
    expect(of(buildIslandLayout(stateWith({ miniVillagerCount: 0 })), 'mini-villager')).toEqual([]);
  });

  it('a brand-new community (no houses, all locked, no projects) still draws', () => {
    const l = buildIslandLayout(
      stateWith({
        islandSize: 8,
        houses: [],
        projects: [],
        miniVillagerCount: 0,
        buildings: {
          playground: { unlocked: false, remaining: { streakDays: 3, residents: 0 } },
          'community-centre': { unlocked: false, remaining: { streakDays: 7, residents: 5 } },
          park: { unlocked: false, remaining: { streakDays: 30, residents: 0 } },
        },
      }),
    );
    expect(of(l, 'silhouette')).toHaveLength(3);
    expect(of(l, 'sign')).toHaveLength(1);
  });

  it('only produces known asset keys', () => {
    const l = buildIslandLayout(stateWith({ islandSize: 32, houses: residents(30) }));
    for (const o of l.objects) expect(ASSET_KEYS).toContain(o.assetKey);
  });

  it('is deterministic', () => {
    const s = baseState();
    expect(buildIslandLayout(s)).toEqual(buildIslandLayout(s));
  });
});
