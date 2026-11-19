/**
 * Validates every STORED island plan (frontend/public/islands/*.json), i.e. exactly what
 * players get. Uses the same walkableTiles() the game uses for villagers and the avatar.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILDING_TREE, LAND_STAGE_COUNT, chainOnLot, landStageForResidents } from './buildingTree';
import { PLAZA, activeLots, decodePlan, lotTiles, stageMap, tileKey, walkableTiles, type IslandPlan, type Tile } from './islandPlan';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../public/islands');
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const plans: IslandPlan[] = files.map((f) => decodePlan(JSON.parse(readFileSync(join(DIR, f), 'utf8'))));
const STAGES = [...Array(LAND_STAGE_COUNT).keys()];
/** Most residents a stage can have (requirement.md §7.8) → houses it must hold. */
const HOUSES_NEEDED = [2, 5, 10, 25, 50, 80];

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

    // Cumulative land per stage follows the tiers; every stage is one connected island.
    const tiers = BUILDING_TREE.landTiers.map((t) => t.tiles ?? p.tiles.length);
    for (const k of STAGES) {
      const land = p.tiles.filter((t) => t.stage <= k);
      expect(land.length).toBe(tiers[k]);
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
    PLAZA.forEach((t) => claim(t, 'plaza'));
    p.paths.forEach((t) => claim(t, 'path'));
    for (const [key, spec] of Object.entries(BUILDING_TREE.lots)) {
      const r = p.lots[key];
      const size = [r.w, r.d].sort().join('x');
      expect(size, `${key} size`).toBe([...spec.size].sort().join('x'));
      if (spec.kind === 'entrance') {
        expect(owner.get(tileKey(r)), 'entrance is on a path').toBe('path');
        expect(N4(r).some((n) => owner.get(tileKey(n)) === 'plaza'), 'entrance next to the plaza').toBe(true);
        continue;
      }
      for (const t of lotTiles(r)) {
        expect(stages.get(tileKey(t))!, `${key} land stage`).toBeLessThanOrEqual(spec.landStage);
        claim(t, key);
      }
    }
    p.houses.forEach((t) => claim(t, 'house'));
    p.trees.forEach((t) => claim(t, 'tree'));

    // Walking: on every stage, with every house lot taken, all open land is reachable and
    // every active lot and house has a reachable door.
    for (const k of STAGES) {
      const houses = p.houses.filter((t) => stages.get(tileKey(t))! <= k);
      expect(houses.length, `houses on stage ${k}`).toBeGreaterThanOrEqual(HOUSES_NEEDED[k]);
      const walk = new Set(walkableTiles(p, k, houses.length).map(tileKey));
      const blocked = new Set<string>();
      for (const [key, r] of Object.entries(p.lots)) {
        if (BUILDING_TREE.lots[key].kind !== 'entrance') lotTiles(r).filter((t) => stages.get(tileKey(t))! <= k).forEach((t) => blocked.add(tileKey(t)));
      }
      houses.forEach((t) => blocked.add(tileKey(t)));
      p.trees.filter((t) => stages.get(tileKey(t))! <= k).forEach((t) => blocked.add(tileKey(t)));
      const open = p.tiles.filter((t) => t.stage <= k && !blocked.has(tileKey(t)));
      expect(walk.size, `stage ${k}: ${open.length - walk.size} open tiles unreachable`).toBe(open.length);
      for (const key of activeLots(p, k)) {
        if (BUILDING_TREE.lots[key].kind === 'entrance') continue;
        expect(lotTiles(p.lots[key]).some((t) => N4(t).some((n) => walk.has(tileKey(n)))), `stage ${k}: lot ${key} unreachable`).toBe(true);
      }
      for (const h of houses) expect(N4(h).some((n) => walk.has(tileKey(n))), `stage ${k}: house ${tileKey(h)} unreachable`).toBe(true);
    }
  });
});

describe('building tree data', () => {
  it('every building lot exists and growth chains share one lot', () => {
    for (const b of BUILDING_TREE.buildings) {
      if (b.lot) expect(BUILDING_TREE.lots[b.lot], b.key).toBeDefined();
      if (b.growsFrom) {
        const parent = BUILDING_TREE.buildings.find((x) => x.key === b.growsFrom);
        expect(parent?.lot, `${b.key} grows on its parent's lot`).toBe(b.lot);
        expect(b.requires).toContain(b.growsFrom);
      }
      for (const r of b.requires) expect(BUILDING_TREE.buildings.some((x) => x.key === r), `${b.key} requires ${r}`).toBe(true);
    }
    expect(chainOnLot('lot-a').map((b) => b.key)).toEqual(['fire-pit', 'warming-hut', 'community-hall']);
  });

  it('a building\'s lot exists by the time its resident condition can be met (§7.8)', () => {
    for (const b of BUILDING_TREE.buildings) {
      if (!b.lot) continue;
      expect(BUILDING_TREE.lots[b.lot].landStage, b.key).toBeLessThanOrEqual(landStageForResidents(b.residents));
    }
  });

  it('stage-1 buildings need no residents or streak (a first resident builds one on day one)', () => {
    const first = BUILDING_TREE.buildings.filter((b) => b.stage === 1);
    expect(first.map((b) => b.key)).toEqual(['welcome-sign', 'fire-pit', 'frozen-pond']);
    for (const b of first) expect([b.requires.length, b.residents, b.streakDays]).toEqual([0, 0, 0]);
  });

  it('land stage follows cumulative residents (§7.8)', () => {
    expect([1, 2, 3, 5, 6, 10, 11, 25, 26, 50, 51, 500].map(landStageForResidents)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});
