/**
 * Validates every STORED island plan (frontend/public/islands/*.json), i.e. exactly what
 * players get. Uses the same walkableTiles() the game uses for villagers and the avatar.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILDING_TREE, LAND_STAGE_COUNT, LOT_SPECS, communitySteps, landStageForResidents, lotKind } from './buildingTree';
import { PLAZA, activeLots, decodePlan, lotStage, lotTiles, stageMap, tileKey, walkableTiles, type IslandPlan, type Tile } from './islandPlan';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../public/islands');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const plans: IslandPlan[] = files.map((f) => decodePlan(JSON.parse(readFileSync(join(DIR, f), 'utf8'))));
const STAGES = [...Array(LAND_STAGE_COUNT).keys()];
/** Houses are scenery (requirement v1.48 §7.2); the first stages still show a few. */
const HOUSES_NEEDED = [2, 5, 10];
const MAX_HOUSES = 150;
const WATER_SITES = ['shore', 'riverbank'];

const N4 = (t: Tile) => [
  { x: t.x + 1, z: t.z },
  { x: t.x - 1, z: t.z },
  { x: t.x, z: t.z + 1 },
  { x: t.x, z: t.z - 1 },
];

describe('stored island plans', () => {
  it('there is one plan per residential community (223)', () => {
    expect(plans).toHaveLength(223);
    expect(new Set(plans.map((p) => p.code)).size).toBe(223);
    files.forEach((f, i) => expect(f).toBe(`${plans[i].code}.json`));
  });

  it.each(plans.map((p) => [p.code, p]))('%s: land, stages, lots, houses and walking are valid', (_code, p) => {
    const stages = stageMap(p);
    expect(stages.size).toBe(p.tiles.length); // no duplicate tiles
    expect(p.tiles.length).toBeGreaterThan(950);
    expect(p.tiles.length).toBeLessThan(1100);

    // Cumulative DRY land per stage follows the tiers (the first two may be slightly larger
    // next to central water); every stage's dry land is one connected island.
    const waterKeys = new Set(p.water.map(tileKey));
    const standard = BUILDING_TREE.landTiers.map((t) => t.tiles);
    expect([64, 80, 96, 112]).toContain(p.tiers[0]);
    expect([144, 160, 176]).toContain(p.tiers[1]);
    expect(p.tiers.slice(2, 5)).toEqual(standard.slice(2, 5));
    for (const w of p.water) expect(stages.has(tileKey(w)), 'water on the island').toBe(true);
    for (const b of p.bridges) {
      expect(waterKeys.has(tileKey(b)), 'a bridge is not water').toBe(false);
      expect(p.paths.some((t) => t.x === b.x && t.z === b.z), 'a bridge is a path').toBe(true);
    }
    const bridgeKeys = new Set(p.bridges.map(tileKey));
    for (const k of STAGES) {
      // Bridges count as water for land size, and as walkable land for connectivity.
      const dry = p.tiles.filter((t) => t.stage <= k && !waterKeys.has(tileKey(t)) && !bridgeKeys.has(tileKey(t)));
      expect(dry.length).toBe(k === STAGES.length - 1 ? p.tiles.length - p.water.length - p.bridges.length : p.tiers[k]);
      const land = p.tiles.filter((t) => t.stage <= k && !waterKeys.has(tileKey(t)));
      const keys = new Set(land.map(tileKey));
      const seen = new Set([tileKey(land[0])]);
      const q: Tile[] = [land[0]];
      while (q.length) {
        for (const n of N4(q.pop() as Tile)) {
          if (keys.has(tileKey(n)) && !seen.has(tileKey(n))) {
            seen.add(tileKey(n));
            q.push(n);
          }
        }
      }
      expect(seen.size, `stage ${k} is not one island`).toBe(land.length);
    }
    for (const t of PLAZA) expect(stages.get(tileKey(t))).toBe(0);

    // Lots: right size, on land that exists at their stage; nothing overlaps.
    const owner = new Map<string, string>();
    const claim = (t: Tile, who: string) => {
      const k = tileKey(t);
      expect(stages.has(k), `${who} off the island`).toBe(true);
      expect(owner.get(k), `${who} overlaps ${owner.get(k)}`).toBeUndefined();
      owner.set(k, who);
    };
    p.water.forEach((t) => claim(t, 'water'));
    PLAZA.forEach((t) => claim(t, 'plaza'));
    p.paths.forEach((t) => claim(t, 'path'));
    // Every step of this community's build map that needs a lot has one, of its size and turned
    // to its facing (an odd facing swaps the footprint); Main Street and spare lots too.
    const steps = communitySteps(p.code, p.persona).filter((st) => st.tiles[0] > 0);
    expect(p.persona, 'plan v4 carries the persona').not.toBeNull();
    for (const st of steps) {
      const r = p.lots[st.key];
      expect(r, `lot for ${st.key}`).toBeDefined();
      const [w, d] = st.tiles;
      const face = r.face ?? 0;
      expect(face % 2 === 1 ? [r.d, r.w] : [r.w, r.d], `${st.key} size for face ${face}`).toEqual(w === d ? [w, d] : [w, d]);
      if (st.track === 'root') {
        expect(owner.get(tileKey(r)), 'entrance is on a path').toBe('path');
        expect(N4(r).some((n) => owner.get(tileKey(n)) === 'plaza'), 'entrance next to the plaza').toBe(true);
        continue;
      }
      for (const t of lotTiles(r)) claim(t, st.key);
    }
    for (const [key, spec] of Object.entries(LOT_SPECS)) {
      const r = p.lots[key];
      expect([r.w, r.d].sort().join('x'), `${key} size`).toBe([...spec.size].sort().join('x'));
      lotTiles(r).forEach((t) => claim(t, key));
    }
    const stepKeys = new Set([...steps.map((st) => st.key), ...Object.keys(LOT_SPECS)]);
    for (const key of Object.keys(p.lots)) expect(stepKeys.has(key), `lot ${key} belongs to this community`).toBe(true);
    p.houses.forEach((t) => claim(t, 'house'));
    p.trees.forEach((t) => claim(t, 'tree'));
    p.stations.forEach((st) => lotTiles(st.rect).forEach((t) => claim(t, `station ${st.name}`)));
    // CTrain track: on the island, 4-connected in order, never under a lot, house, tree or station
    // (it may cross paths and run over water as a rail bridge); stations touch the track.
    const railKeys = new Set(p.rail.flatMap((r) => r.tiles.map(tileKey)));
    for (const r of p.rail) {
      expect(r.tiles.length, `${r.line} run length`).toBeGreaterThanOrEqual(4);
      r.tiles.forEach((t, i) => {
        expect(stages.has(tileKey(t)), 'track off the island').toBe(true);
        expect(['path', 'water', undefined], `track under ${owner.get(tileKey(t))}`).toContain(owner.get(tileKey(t)));
        if (i > 0) expect(Math.abs(t.x - r.tiles[i - 1].x) + Math.abs(t.z - r.tiles[i - 1].z), 'track is 4-connected').toBe(1);
      });
    }
    for (const st of p.stations) {
      expect(lotTiles(st.rect).every((t) => N4(t).some((n) => railKeys.has(tileKey(n)))), `${st.name} beside the track`).toBe(true);
    }
    for (const e of p.railEnds) {
      expect(railKeys.has(tileKey(e.tile)), `end sign for ${e.next} on the track`).toBe(true);
      expect(stages.has(tileKey({ x: e.tile.x + e.dir.x, z: e.tile.z + e.dir.z })), `track to ${e.next} leaves the island`).toBe(false);
    }

    // Walking: on every stage, with every house lot taken, all open land is reachable and
    // every active lot and house has a reachable door.
    for (const k of STAGES) {
      const houses = p.houses.filter((t) => stages.get(tileKey(t))! <= k);
      expect(houses.length, `houses on stage ${k}`).toBeGreaterThanOrEqual(HOUSES_NEEDED[k] ?? 0);
      const walk = new Set(walkableTiles(p, k, houses.length).map(tileKey));
      const blocked = new Set<string>();
      for (const [key, r] of Object.entries(p.lots)) {
        if (lotKind(key) !== 'entrance') lotTiles(r).filter((t) => stages.get(tileKey(t))! <= k).forEach((t) => blocked.add(tileKey(t)));
      }
      houses.forEach((t) => blocked.add(tileKey(t)));
      p.trees.filter((t) => stages.get(tileKey(t))! <= k).forEach((t) => blocked.add(tileKey(t)));
      p.water.forEach((t) => blocked.add(tileKey(t)));
      p.stations.forEach((st) => lotTiles(st.rect).filter((t) => stages.get(tileKey(t))! <= k).forEach((t) => blocked.add(tileKey(t))));
      const open = p.tiles.filter((t) => t.stage <= k && !blocked.has(tileKey(t)));
      expect(walk.size, `stage ${k}: ${open.length - walk.size} open tiles unreachable`).toBe(open.length);
      for (const key of activeLots(p, k)) {
        if (lotKind(key) === 'entrance') continue;
        expect(lotTiles(p.lots[key]).some((t) => N4(t).some((n) => walk.has(tileKey(n)))), `stage ${k}: lot ${key} unreachable`).toBe(true);
      }
      for (const h of houses) expect(N4(h).some((n) => walk.has(tileKey(n))), `stage ${k}: house ${tileKey(h)} unreachable`).toBe(true);
      for (const st of p.stations) {
        if (lotTiles(st.rect).some((t) => stages.get(tileKey(t))! > k)) continue;
        expect(lotTiles(st.rect).some((t) => N4(t).some((n) => walk.has(tileKey(n)))), `stage ${k}: station ${st.name} unreachable`).toBe(true);
      }
    }
  });
});

describe('CTrain on the islands (requirement.md §7.9)', () => {
  it('the communities the lines run through have track, and the main stations are drawn', () => {
    const byCode = new Map(plans.map((p) => [p.code, p]));
    for (const code of ['VAR', 'BRD', 'SSD', 'TUS', 'BLN']) expect(byCode.get(code)!.rail.length, code).toBeGreaterThan(0);
    expect(byCode.get('VAR')!.stations.map((s) => s.name).sort()).toEqual(['Brentwood', 'Dalhousie']);
    expect(byCode.get('MAH')!.rail).toEqual([]);
    expect(plans.filter((p) => p.rail.length > 0).length).toBeGreaterThanOrEqual(40);
  });
});

describe('lot spread (requirement.md §7.8)', () => {
  it.each(plans.map((p) => [p.code, p]))('%s: later lots sit farther out and in different directions', (_code, p) => {
    const centre = (k: string) => ({ x: p.lots[k].x + p.lots[k].w / 2, z: p.lots[k].z + p.lots[k].d / 2 });
    const keys = Object.keys(p.lots).filter((k) => lotKind(k) === 'building' || lotKind(k) === 'spare');
    const first = keys.filter((k) => lotStage(p, k) === 0);
    const later = keys.filter((k) => lotStage(p, k) > 0);
    const mean = (ks: string[]) => ks.reduce((a, k) => a + Math.hypot(centre(k).x, centre(k).z), 0) / ks.length;
    expect(mean(later) / mean(first)).toBeGreaterThan(1.5);
    const angles = later.map((k) => Math.atan2(centre(k).z, centre(k).x)).sort((a, b) => a - b);
    const gaps = angles.map((a, i) => (angles[(i + 1) % angles.length] - a + 2 * Math.PI) % (2 * Math.PI));
    expect(Math.max(...gaps), 'no direction is left without later lots for more than 150°').toBeLessThan((150 * Math.PI) / 180);
  });
});

describe('places by meaning (requirement v1.48 §7.6b, §7.8)', () => {
  const touchesWater = (p: IslandPlan, key: string) => {
    const water = new Set(p.water.map(tileKey));
    return lotTiles(p.lots[key]).some((t) => N4(t).some((n) => water.has(tileKey(n))));
  };

  it('water places stand on the shore (all but a few, listed by the generator)', () => {
    const wet = plans.flatMap((p) => communitySteps(p.code, p.persona).filter((st) => WATER_SITES.includes(st.site)).map((st) => touchesWater(p, st.key)));
    expect(wet.length).toBeGreaterThan(100);
    expect(wet.filter(Boolean).length / wet.length).toBeGreaterThanOrEqual(0.95);
  });

  it('every lake and river community has water for its places (a small lake is added when the boundary has none)', () => {
    for (const p of plans.filter((x) => x.persona === 'lake' || x.persona === 'river')) expect(p.water.length + p.bridges.length, p.code).toBeGreaterThanOrEqual(12); // bridges were water
  });

  it('Mahogany\'s beach club stands on the lake shore, facing the water', () => {
    const p = plans.find((x) => x.code === 'MAH') as IslandPlan;
    expect(touchesWater(p, 'landmark.mah')).toBe(true);
    const r = p.lots['landmark.mah'];
    const water = new Set(p.water.map(tileKey));
    const front = r.face === 0 ? [...Array(r.w).keys()].map((i) => ({ x: r.x + i, z: r.z + r.d })) : r.face === 2 ? [...Array(r.w).keys()].map((i) => ({ x: r.x + i, z: r.z - 1 })) : r.face === 1 ? [...Array(r.d).keys()].map((j) => ({ x: r.x + r.w, z: r.z + j })) : [...Array(r.d).keys()].map((j) => ({ x: r.x - 1, z: r.z + j }));
    expect(front.some((t) => water.has(tileKey(t))), 'its front faces the water').toBe(true);
  });

  it('a founder can start the first places: each track\'s first step stands on the first land on most islands', () => {
    const first = (track: string) => plans.filter((p) => {
      const st = communitySteps(p.code, p.persona).find((x) => x.track === track && x.step === 1);
      return st !== undefined && lotStage(p, st.key) === 0;
    }).length;
    expect(first('community')).toBeGreaterThanOrEqual(220);
    expect(first('nature')).toBeGreaterThanOrEqual(210);
    expect(first('persona')).toBeGreaterThanOrEqual(200);
  });

  it('signature landmarks have their lot by the time 11 neighbours can build them, on almost every island', () => {
    const lm = plans.flatMap((p) => communitySteps(p.code, p.persona).filter((st) => st.landmarkOrder === 1).map((st) => lotStage(p, st.key)));
    expect(lm).toHaveLength(31);
    expect(lm.filter((s) => s <= landStageForResidents(11)).length).toBeGreaterThanOrEqual(28);
  });

  it('houses stand in residential zones: at most 150, never more than a third of the land', () => {
    for (const p of plans) {
      expect(p.houses.length, p.code).toBeLessThanOrEqual(MAX_HOUSES);
      expect(p.houses.length, p.code).toBeLessThan((p.tiles.length - p.water.length) / 3);
    }
  });
});

describe('build map data', () => {
  it('one root opens three tracks; every first step needs no residents', () => {
    expect(BUILDING_TREE.buildings.filter((b) => b.track === 'root').map((b) => b.key)).toEqual(['welcome-sign']);
    for (const b of BUILDING_TREE.buildings.filter((x) => x.step === 1)) expect([b.residents, b.streakDays], b.key).toEqual([0, 0]);
  });

  it('land stage follows cumulative residents (§7.8)', () => {
    expect([1, 2, 3, 5, 6, 10, 11, 25, 26, 50, 51, 500].map(landStageForResidents)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});
