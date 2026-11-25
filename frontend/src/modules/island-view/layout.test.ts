import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MAX_PROPS, buildIslandLayout, buildingSiteTile, tileKey, type BuildingObject, type PlacedObject } from './layout';
import mock from './mockCommunityState.json';
import { parseCommunityViewState } from './parseState';
import { featuresFor, type CommunityFeature } from './plan/features';
import { PLAZA, decodePlan, houseLotOrder, lotTiles, type IslandPlan } from './plan/islandPlan';
import type { BuildingView, CommunityViewState } from './types';
import { prop } from './assets/models';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../public/islands');
const planOf = (code: string): IslandPlan => decodePlan(JSON.parse(readFileSync(join(DIR, `${code}.json`), 'utf8')));
const MAH = planOf('MAH');

function baseState(): CommunityViewState {
  const r = parseCommunityViewState(mock);
  if (!r.ok) throw new Error(r.errors.join('\n'));
  return r.state;
}
const stateWith = (patch: Partial<CommunityViewState>): CommunityViewState => ({ ...baseState(), speechBubbles: [], ...patch });
const view = (key: string, patch: Partial<BuildingView> = {}): BuildingView => ({
  key,
  status: 'locked',
  level: 1,
  progress: 0,
  title: key,
  remaining: null,
  ...patch,
});
const residents = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, nickname: `R${i}`, activeToday: i % 2 === 0 }));
const at = (objects: PlacedObject[], id: string) => objects.find((o) => o.id === id);

describe('land and outline (requirement.md §7.8)', () => {
  it.each([0, 1, 2, 3, 4, 5])('stage %s shows exactly that stage\'s land; the rest is future land', (stage) => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: stage }));
    expect(l.tiles.length + l.futureTiles.length).toBe(MAH.tiles.length);
    expect(l.tiles.every((t) => t.stage <= stage)).toBe(true);
    const dry = l.tiles.filter((t) => t.kind !== 'water' && t.kind !== 'bridge');
    expect(dry.length).toBe(stage < 5 ? MAH.tiers[stage] : MAH.tiles.length - MAH.water.length - MAH.bridges.length);
  });

  it('marks the edge of the current land for the dirt underneath', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 0 }));
    const keys = new Set(l.tiles.map(tileKey));
    for (const t of l.tiles) {
      const outside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !keys.has(tileKey({ x: t.x + dx, z: t.z + dz })));
      expect(t.edge).toBe(outside);
    }
  });

  it('positions never depend on the land stage (stored plan)', () => {
    const small = buildIslandLayout(MAH, stateWith({ landStage: 1, houses: residents(5) }));
    const big = buildIslandLayout(MAH, stateWith({ landStage: 5, houses: residents(5) }));
    const pos = new Map(big.objects.map((o) => [o.id, `${o.x},${o.z}`]));
    for (const o of small.objects) {
      // villagers wander; mood decorations may give way to a lot that opens later (they never move)
      if (o.assetKey === 'mini-villager' || o.assetKey === 'flowers' || o.assetKey === 'snow-pile') continue;
      expect(pos.get(o.id), o.id).toBe(`${o.x},${o.z}`);
    }
  });
});

describe('lots and the building tree (requirement.md §7.6)', () => {
  it('a growth chain shows its most advanced building on the shared lot', () => {
    const lot = (buildings: BuildingView[]) => at(buildIslandLayout(MAH, stateWith({ buildings })).objects, 'lot:lot-a');
    expect(lot([])).toBeUndefined(); // locked: not drawn
    expect(lot([view('fire-pit', { status: 'locked' })])).toBeUndefined();
    expect(lot([view('fire-pit', { status: 'opened' })])).toMatchObject({ assetKey: 'silhouette', buildingKey: 'fire-pit', ready: true });
    expect(lot([view('fire-pit', { status: 'building', progress: 0.4 })])).toMatchObject({ assetKey: 'construction-site', buildingKey: 'fire-pit', progress: 0.4 });
    expect(lot([view('fire-pit', { status: 'built' })])).toMatchObject({ assetKey: 'building.fire-pit', next: { title: 'Warming hut', status: 'locked' } });
    expect(lot([view('fire-pit', { status: 'built' }), view('warming-hut', { status: 'building', progress: 0.1 })])).toMatchObject({
      assetKey: 'construction-site',
      buildingKey: 'warming-hut',
    });
    expect(
      lot([view('fire-pit', { status: 'built' }), view('warming-hut', { status: 'built' }), view('community-hall', { status: 'built', level: 2 })]),
    ).toMatchObject({ assetKey: 'building.community-hall', level: 2, next: null });
  });

  it('an upgrade keeps the built building on its lot with a progress label (§7.6 upgrades in place)', () => {
    const lot = (buildings: BuildingView[]) => at(buildIslandLayout(MAH, stateWith({ buildings })).objects, 'lot:lot-a');
    expect(lot([view('fire-pit', { status: 'building', level: 2, progress: 0.25 })])).toMatchObject({
      assetKey: 'building.fire-pit',
      level: 1,
      upgrade: { level: 2, progress: 0.25 },
      next: { title: 'Warming hut' },
    });
    expect(lot([view('fire-pit', { status: 'built', level: 3 })])).toMatchObject({ assetKey: 'building.fire-pit', level: 3, upgrade: null });
    // a new building growing on the lot is still a construction site
    expect(lot([view('fire-pit', { status: 'built' }), view('warming-hut', { status: 'building', progress: 0.1 })])).toMatchObject({ assetKey: 'construction-site' });
    // an upgrade of the chain's newest building draws that building
    expect(lot([view('fire-pit', { status: 'built' }), view('warming-hut', { status: 'building', level: 2, progress: 0.5 })])).toMatchObject({
      assetKey: 'building.warming-hut',
      level: 1,
      upgrade: { level: 2, progress: 0.5 },
    });
  });

  it('the Welcome sign stays up while it is upgraded, and the avatar still finds it', () => {
    const l = buildIslandLayout(MAH, stateWith({ buildings: [view('welcome-sign', { status: 'building', level: 2, progress: 0 })] }));
    expect(l.objects.find((o) => 'buildingKey' in o && o.buildingKey === 'welcome-sign')).toMatchObject({ assetKey: 'building.welcome-sign', upgrade: { level: 2 } });
    expect(buildingSiteTile(l, 'welcome-sign')).not.toBeNull();
  });

  it('upgraded unknown buildings keep the placeholder model, not a construction site', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5, buildings: [view('future-x', { status: 'building', level: 2, progress: 0.3 })] }));
    expect(l.objects.find((o) => 'buildingKey' in o && o.buildingKey === 'future-x')).toMatchObject({ assetKey: 'building.placeholder', level: 1, upgrade: { level: 2, progress: 0.3 } });
  });

  it('a locked lot is plain walkable land; once shown it blocks walking', () => {
    const walkOf = (buildings: BuildingView[]) => new Set(buildIslandLayout(MAH, stateWith({ buildings })).walkable.map(tileKey));
    const tiles = lotTiles(MAH.lots['lot-a']);
    expect(tiles.every((t) => walkOf([]).has(tileKey(t)))).toBe(true);
    expect(tiles.some((t) => walkOf([view('fire-pit', { status: 'opened' })]).has(tileKey(t)))).toBe(false);
  });

  it('a lot fills its stored rectangle', () => {
    const o = at(buildIslandLayout(MAH, stateWith({ buildings: [view('fire-pit', { status: 'built' })] })).objects, 'lot:lot-a') as BuildingObject;
    const r = MAH.lots['lot-a'];
    expect([o.x, o.z, o.w, o.d]).toEqual([r.x + r.w / 2, r.z + r.d / 2, r.w, r.d]);
  });

  it('lots whose land stage is not reached show nothing and stay walkable', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 0, buildings: [view('dog-park', { status: 'built' })] }));
    expect(at(l.objects, 'lot:dog-park')).toBeUndefined();
  });

  it('Main Street lots have faint markers; empty spare lots show nothing and are walkable', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5 }), []);
    expect(at(l.objects, 'lot:main-street-1')).toMatchObject({ assetKey: 'reserved-plot', lotKind: 'main-street' });
    expect(at(l.objects, 'lot:spare-1')).toBeUndefined();
    const walk = new Set(l.walkable.map(tileKey));
    expect(lotTiles(MAH.lots['spare-1']).every((t) => walk.has(tileKey(t)))).toBe(true);
    expect(lotTiles(MAH.lots['lot-a']).some((t) => walk.has(tileKey(t)))).toBe(false);
  });

  it('unknown buildings use the placeholder on spare lots (§7.6b); extra ones are counted, not overlapped', () => {
    const unknown = Array.from({ length: 8 }, (_, i) => view(`future-${i}`, { status: i % 2 ? 'built' : 'building', progress: 0.3, title: `Future ${i}` }));
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5, buildings: unknown }), []);
    const spares = l.objects.filter((o) => o.id.startsWith('lot:spare-'));
    expect(spares.map((o) => o.assetKey).sort()).toEqual(['building.placeholder', 'building.placeholder', 'building.placeholder', 'construction-site', 'construction-site', 'construction-site']);
    // then Main Street lots, never overlapping; nothing is hidden with 6 spares + 4 Main Street lots
    expect(l.objects.filter((o) => o.id.startsWith('lot:main-street-') && o.assetKey !== 'reserved-plot')).toHaveLength(2);
    expect(l.hiddenHouseCount).toBe(0);
  });

  it('pathway lights add lamps along the paths only once built', () => {
    const lamps = (status: BuildingView['status']) =>
      buildIslandLayout(MAH, stateWith({ landStage: 3, buildings: [view('pathway-lights', { status })] })).objects.filter((o) => o.assetKey === 'lamp');
    expect(lamps('locked')).toEqual([]);
    expect(lamps('built').length).toBeGreaterThan(3);
  });

  it('real water: shown as water tiles, never walkable, never decorated', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5, vitality: 90 }));
    const water = new Set(MAH.water.map(tileKey));
    expect(MAH.water.length).toBeGreaterThan(20); // Mahogany Lake
    expect(l.tiles.filter((t) => t.kind === 'water').length).toBe(MAH.water.length);
    expect(l.walkable.some((t) => water.has(tileKey(t)))).toBe(false);
    expect(l.objects.some((o) => water.has(tileKey({ x: Math.floor(o.x), z: Math.floor(o.z) })) && o.assetKey !== 'mini-villager')).toBe(false);
  });

  it('the avatar\'s site for a building is next to its lot', () => {
    const l = buildIslandLayout(MAH, stateWith({ buildings: [view('warming-hut', { status: 'building', progress: 0.2 })] }));
    const site = buildingSiteTile(l, 'warming-hut');
    const r = MAH.lots['lot-a'];
    expect(lotTiles(r).some((t) => t.x === site?.x && t.z === site?.z)).toBe(true);
    expect(buildingSiteTile(l, 'not-a-building')).toBeNull();
  });
});

describe('houses, villagers, mood', () => {
  it('residents take the plan\'s house lots in order; overflow is counted', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 0, houses: residents(4) }));
    const houses = l.objects.filter((o) => o.assetKey === 'house' && !o.village);
    const stage0 = MAH.houses.filter((h) => MAH.tiles.find((t) => t.x === h.x && t.z === h.z)?.stage === 0);
    expect(houses.length).toBe(Math.min(4, stage0.length));
    expect(l.hiddenHouseCount).toBe(4 - houses.length);
    expect(houses[0]).toMatchObject({ x: stage0[0].x + 0.5, z: stage0[0].z + 0.5 });
  });

  it('a house stands on its fixed lot (slot) and never moves when the island grows (v1.26 §7.2)', () => {
    const order = houseLotOrder(MAH);
    const house = (stage: number) =>
      buildIslandLayout(MAH, stateWith({ landStage: stage, houses: [{ id: 'slot-3', slot: 3, nickname: 'Maple', activeToday: true, mine: true }] })).objects.find(
        (o) => o.assetKey === 'house' && !o.village,
      );
    expect(house(1)).toMatchObject({ x: order[3].x + 0.5, z: order[3].z + 0.5, mine: true, founding: false });
    for (const stage of [2, 3, 4, 5]) expect(house(stage)).toMatchObject({ x: order[3].x + 0.5, z: order[3].z + 0.5 });
  });

  it('slot order: lower land stages first, so the first slots are on the first land', () => {
    const order = houseLotOrder(MAH);
    const stageOfLot = (t: { x: number; z: number }) => MAH.tiles.find((x) => x.x === t.x && x.z === t.z)!.stage;
    for (let i = 1; i < order.length; i++) expect(stageOfLot(order[i])).toBeGreaterThanOrEqual(stageOfLot(order[i - 1]));
    expect(order).toHaveLength(150);
  });

  it('a slot not on the current land, and residents beyond the lots, are counted as hidden', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 0, houses: [{ id: 'slot-149', slot: 149, nickname: 'Far', activeToday: false }], extraResidents: 2 }));
    expect(l.objects.filter((o) => o.assetKey === 'house' && !o.village)).toHaveLength(0);
    expect(l.hiddenHouseCount).toBe(3);
  });

  it('every house lot on the risen land has a house: residents at their lots, village houses on the rest (v1.41 §7.2)', () => {
    const order = houseLotOrder(MAH);
    for (const stage of [0, 2, 5]) {
      const l = buildIslandLayout(MAH, stateWith({ landStage: stage, houses: [{ id: 'slot-0', slot: 0, nickname: 'A', activeToday: false }] }));
      const onLand = order.filter((t) => (MAH.tiles.find((p) => p.x === t.x && p.z === t.z)?.stage ?? 99) <= stage);
      const houses = l.objects.filter((o) => o.assetKey === 'house');
      expect(houses).toHaveLength(onLand.length);
      const walk = new Set(l.walkable.map(tileKey));
      for (const t of onLand) expect(walk.has(tileKey(t))).toBe(false); // houses block walking
      const resident = houses.filter((o) => o.assetKey === 'house' && !o.village);
      expect(resident).toHaveLength(1);
      expect(resident[0]).toMatchObject({ x: order[0].x + 0.5, z: order[0].z + 0.5, nickname: 'A' });
    }
  });

  it('village houses have no name, are never active and are not mine; an archived resident\'s lot shows one', () => {
    const order = houseLotOrder(MAH);
    const withB = buildIslandLayout(MAH, stateWith({ landStage: 2, houses: [{ id: 'b', slot: 1, nickname: 'B', activeToday: true }] }));
    const without = buildIslandLayout(MAH, stateWith({ landStage: 2, houses: [] })); // B archived: not in the state
    const at = (l: typeof withB) => l.objects.find((o) => o.assetKey === 'house' && o.x === order[1].x + 0.5 && o.z === order[1].z + 0.5);
    expect(at(withB)).toMatchObject({ nickname: 'B', activeToday: true });
    expect(at(without)).toMatchObject({ village: true, nickname: '', activeToday: false, mine: false });
    for (const o of without.objects) if (o.assetKey === 'house') expect(o.village).toBe(true);
  });

  it('mini villagers start on walkable path tiles, capped at 20', () => {
    const l = buildIslandLayout(MAH, stateWith({ miniVillagerCount: 50 }));
    const v = l.objects.filter((o) => o.assetKey === 'mini-villager');
    expect(v).toHaveLength(20);
    const walk = new Set(l.walkable.map(tileKey));
    for (const m of v) if (m.assetKey === 'mini-villager') expect(walk.has(tileKey(m.startTile))).toBe(true);
  });

  it('flower patches are the same on every island whatever its Vitality (requirement v1.40 §7.4)', () => {
    const flowerTiles = (vitality: number | null) =>
      buildIslandLayout(MAH, stateWith({ vitality, landStage: 2 }))
        .objects.filter((o) => o.assetKey === 'flowers')
        .map((o) => `${o.x},${o.z}`);
    expect(flowerTiles(80).length).toBeGreaterThan(0);
    for (const v of [10, 45, null]) expect(flowerTiles(v)).toEqual(flowerTiles(80));
    expect(buildIslandLayout(MAH, stateWith({ vitality: 10, landStage: 2 })).objects.map((o) => o.assetKey)).not.toContain('snow-pile');
  });

  it('works for an unusual shape (Diamond Cove) on every stage', () => {
    const plan = planOf('DIA');
    for (let stage = 0; stage <= 5; stage++) {
      const l = buildIslandLayout(plan, stateWith({ landStage: stage, houses: residents(10) }));
      expect(l.walkable.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    expect(buildIslandLayout(MAH, baseState())).toEqual(buildIslandLayout(MAH, baseState()));
  });
});

describe('signature features (feature library, requirement.md §7.9)', () => {
  const three: CommunityFeature[] = [
    { key: 'ctrain-station', name: 'Dalhousie' },
    { key: 'hill', name: null },
    { key: 'school', name: null },
  ];
  const features = (l: ReturnType<typeof buildIslandLayout>) => l.objects.filter((o) => o.assetKey === 'feature');

  it('take the spare lots in plan order, at most one feature per lot', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5 }), three);
    const f = features(l);
    expect(f.map((o) => 'featureKey' in o && o.featureKey)).toEqual(['ctrain-station', 'hill', 'school']);
    const lots = ['spare-1', 'spare-2', 'spare-3'].map((k) => MAH.lots[k]);
    f.forEach((o, i) => expect([o.x, o.z]).toEqual([lots[i].x + lots[i].w / 2, lots[i].z + lots[i].d / 2]));
  });

  it('appear only when their land has risen, keeping their lot meanwhile (requirement.md v1.34)', () => {
    expect(features(buildIslandLayout(MAH, stateWith({ landStage: 0 }), three))).toHaveLength(0);
    const mid = features(buildIslandLayout(MAH, stateWith({ landStage: 2 }), three));
    expect(mid.map((o) => o.id)).toEqual(['feature:ctrain-station', 'feature:hill']); // spare-1, spare-2 (stage 2)
    const late = features(buildIslandLayout(MAH, stateWith({ landStage: 5 }), three));
    expect(late).toHaveLength(3);
    // the third feature stays on spare-3 even though it showed up later
    const lot = MAH.lots['spare-3'];
    expect(late[2]).toMatchObject({ x: lot.x + lot.w / 2, z: lot.z + lot.d / 2 });
  });

  it('a shown feature blocks its lot; a free spare lot stays walkable', () => {
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5 }), three);
    const walk = new Set(l.walkable.map(tileKey));
    expect(lotTiles(MAH.lots['spare-1']).some((t) => walk.has(tileKey(t)))).toBe(false);
    expect(lotTiles(MAH.lots['spare-4']).every((t) => walk.has(tileKey(t)))).toBe(true);
  });

  it('unknown buildings take only the spare lots features left free', () => {
    const unknown = Array.from({ length: 5 }, (_, i) => view(`future-${i}`, { status: 'built', title: `Future ${i}` }));
    const l = buildIslandLayout(MAH, stateWith({ landStage: 5, buildings: unknown }), three);
    const spares = l.objects.filter((o) => o.id.startsWith('lot:spare-')).map((o) => o.id).sort();
    expect(spares).toEqual(['lot:spare-4', 'lot:spare-5', 'lot:spare-6']);
    expect(l.objects.filter((o) => o.id.startsWith('lot:main-street-') && o.assetKey !== 'reserved-plot')).toHaveLength(2);
    expect(l.hiddenHouseCount).toBe(0);
  });

  it('come from the community data by default (Mahogany: big park, school)', () => {
    expect(featuresFor('MAH').map((f) => f.key)).toEqual(['big-park', 'school']);
    expect(features(buildIslandLayout(MAH, stateWith({ landStage: 5 }))).map((o) => 'featureKey' in o && o.featureKey)).toEqual(['big-park', 'school']);
  });
});

describe('street props and decorations (M19 busier communities)', () => {
  const codes = ['MAH', 'BLN', ...readdirSync(DIR).filter((f) => f.endsWith('.json')).slice(0, 10).map((f) => f.replace('.json', ''))];
  const layouts = codes.map((code) => {
    const plan = planOf(code);
    return { code, plan, l: buildIslandLayout(plan, stateWith({ landStage: 5, houses: residents(40), vitality: 90 }), []) };
  });
  const cell = (o: { x: number; z: number }) => tileKey({ x: Math.floor(o.x), z: Math.floor(o.z) });
  const standing = (l: ReturnType<typeof buildIslandLayout>) => l.objects.filter((o) => o.assetKey === 'prop' || o.assetKey === 'flowers' || o.assetKey === 'snow-pile');

  it('stand on free grass (never on paths, the plaza, water, track or houses) and are capped', () => {
    for (const { code, plan, l } of layouts) {
      const props = l.objects.filter((o) => o.assetKey === 'prop');
      expect(props.length, code).toBeLessThanOrEqual(MAX_PROPS);
      const blocked = new Set([...PLAZA, ...plan.paths, ...plan.water, ...plan.houses, ...plan.rail.flatMap((r) => r.tiles)].map(tileKey));
      for (const o of standing(l)) expect(blocked.has(cell(o)), `${code} ${o.id}`).toBe(false);
    }
    expect(layouts[0].l.objects.filter((o) => o.assetKey === 'prop').length).toBeGreaterThan(5);
  });

  it('block walking, yet every walkable tile stays reachable from the plaza', () => {
    for (const { code, l } of layouts) {
      const walk = new Set(l.walkable.map(tileKey));
      for (const o of standing(l)) expect(walk.has(cell(o)), `${code} ${o.id}`).toBe(false);
      // flood fill from the plaza over the walkable tiles reaches all of them
      const seen = new Set(PLAZA.map(tileKey).filter((k) => walk.has(k)));
      const queue = [...seen];
      while (queue.length) {
        const [x, z] = (queue.pop() as string).split(',').map(Number);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = `${x + dx},${z + dz}`;
          if (walk.has(n) && !seen.has(n)) {
            seen.add(n);
            queue.push(n);
          }
        }
      }
      expect(seen.size, code).toBe(walk.size);
    }
  });

  it('park cars only beside the road: nose-in towards the house in a driveway, else along the road', () => {
    let driveways = 0;
    let roadside = 0;
    for (const { code, plan, l } of layouts) {
      const paths = new Set([...PLAZA, ...plan.paths].map(tileKey));
      const houses = new Set(l.objects.filter((o) => o.assetKey === 'house').map(cell));
      for (const o of l.objects) {
        if (o.assetKey !== 'prop' || o.kind !== 'car') continue;
        const [x, z] = cell(o).split(',').map(Number);
        const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const pathDirs = sides.filter(([dx, dz]) => paths.has(`${x + dx},${z + dz}`));
        const houseDirs = sides.filter(([dx, dz]) => houses.has(`${x + dx},${z + dz}`));
        expect(pathDirs.length, `${code} ${o.id} beside a road`).toBeGreaterThan(0);
        // the front of the car is where its headlights are
        const lights = prop(o).filter((p) => p.layer === 'glow');
        const fx = lights.reduce((a, p) => a + p.p[0], 0) / lights.length;
        const fz = lights.reduce((a, p) => a + p.p[2], 0) / lights.length;
        const front = Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz)];
        if (houseDirs.length > 0) {
          driveways++;
          expect(houseDirs.some(([dx, dz]) => dx === front[0] && dz === front[1]), `${code} ${o.id} nose to the house`).toBe(true);
        } else {
          roadside++;
          // along the road: the road is to the car's side, not ahead or behind
          expect(pathDirs.some(([dx, dz]) => dx * front[0] + dz * front[1] === 0), `${code} ${o.id} along the road`).toBe(true);
        }
      }
    }
    expect(driveways).toBeGreaterThan(0);
    expect(roadside).toBeGreaterThan(0);
  });

  it('lively communities get a few wild flower patches, not a scatter of dots', () => {
    for (const { code, l } of layouts) {
      const patches = l.objects.filter((o) => o.assetKey === 'flowers');
      const land = l.tiles.filter((t) => t.kind !== 'water').length;
      expect(patches.length / land, code).toBeLessThan(0.07);
    }
    expect(layouts.some(({ l }) => l.objects.some((o) => o.assetKey === 'flowers'))).toBe(true);
  });
});
