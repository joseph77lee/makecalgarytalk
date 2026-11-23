import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildIslandLayout, smoothTrack, tileKey, type RailRoute } from '../layout';
import mock from '../mockCommunityState.json';
import { parseCommunityViewState } from '../parseState';
import { trainPath } from '../scene/trainPath';
import type { CommunityViewState } from '../types';
import { CTRAIN, decodeCtrain, lineColour } from './ctrain';
import { decodePlan, lotTiles, type IslandPlan } from './islandPlan';
import { upcomingIdentity } from './upcoming';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../public/islands');
const planOf = (code: string): IslandPlan => decodePlan(JSON.parse(readFileSync(join(DIR, `${code}.json`), 'utf8')));
const VAR = planOf('VAR');
const MAH = planOf('MAH');
const base = (): CommunityViewState => {
  const r = parseCommunityViewState(mock);
  if (!r.ok) throw new Error(r.errors.join('; '));
  return { ...r.state, speechBubbles: [] };
};
const at = (landStage: number, plan = VAR) => buildIslandLayout(plan, { ...base(), landStage }, []);

describe('CTrain data (supabase/data/calgary_ctrain.json)', () => {
  it('has the Red and Blue lines with their stations in order', () => {
    expect(CTRAIN.lines.map((l) => l.line).sort()).toEqual(['Blue', 'Red']);
    const red = CTRAIN.lines.find((l) => l.line === 'Red')!;
    expect(red.stations).toContain('Dalhousie');
    expect(red.stations.indexOf('Brentwood')).toBe(red.stations.indexOf('Dalhousie') - 1);
    expect(lineColour('Red')).toBe(red.colour);
    expect(lineColour('Green')).toBe('#8a8f99');
  });

  it('decodeCtrain lists every problem', () => {
    expect(() => decodeCtrain({ lines: [{ line: 'Red', colour: '#f00', track: [[1, 2]], stations: ['Nowhere'] }], stations: { Bad: [1] } })).toThrow(
      /station Bad.*unknown station Nowhere/,
    );
    expect(() => decodeCtrain({})).toThrow(/no lines/);
  });
});

describe('CTrain on the island (requirement.md §7.9)', () => {
  it('track appears with its land; tiles stay walkable (level crossings), platforms block', () => {
    const full = at(5);
    const track = full.objects.filter((o) => o.assetKey === 'track');
    expect(track.length).toBeGreaterThan(40);
    const walk = new Set(full.walkable.map(tileKey));
    const railTiles = VAR.rail.flatMap((r) => r.tiles).filter((t) => !VAR.water.some((w) => w.x === t.x && w.z === t.z));
    expect(railTiles.every((t) => walk.has(tileKey(t)))).toBe(true);
    for (const st of VAR.stations) expect(lotTiles(st.rect).some((t) => walk.has(tileKey(t)))).toBe(false);
    expect(full.objects.filter((o) => o.assetKey === 'station').map((o) => 'name' in o && o.name).sort()).toEqual(['Brentwood', 'Dalhousie']);
    expect(full.objects.filter((o) => o.assetKey === 'rail-end').map((o) => 'next' in o && o.next)).toEqual(['Crowfoot']);
    // nothing of the CTrain is on land that has not risen yet
    const early = at(0);
    expect(early.objects.filter((o) => ['track', 'station', 'rail-end'].includes(o.assetKey)).every((o) => o.stage <= 0)).toBe(true);
    expect(early.objects.filter((o) => o.assetKey === 'track').length).toBeLessThan(track.length);
  });

  it('communities without track have none', () => {
    const l = at(5, MAH);
    expect(l.railRoutes).toEqual([]);
    expect(l.objects.some((o) => o.assetKey === 'track' || o.assetKey === 'station')).toBe(false);
  });

  it('stations are stops on the train route', () => {
    const r = at(5).railRoutes[0];
    expect(r.stops.length).toBeGreaterThanOrEqual(2);
  });
});

describe('smoothTrack', () => {
  it('turns a staircase into a straight diagonal, keeping the ends', () => {
    const stairs = Array.from({ length: 12 }, (_, i) => ({ x: Math.floor((i + 1) / 2), z: Math.floor(i / 2) }));
    const s = smoothTrack(stairs);
    expect(s[0]).toEqual({ x: 0.5, z: 0.5 });
    expect(s[s.length - 1]).toEqual({ x: stairs[11].x + 0.5, z: stairs[11].z + 0.5 });
    // interior points lie close to the diagonal x = z (+ the half-step offset)
    for (const p of s.slice(3, -3)) expect(Math.abs(p.x - p.z)).toBeLessThan(0.6);
  });
});

describe('trainPath', () => {
  const route = (stages: number[]): RailRoute => {
    const tiles = stages.map((stage, i) => ({ x: i, z: 0, stage }));
    return { line: 'Red', tiles, points: tiles.map((t) => ({ x: t.x + 0.5, z: 0.5 })), stops: [3] };
  };

  it('uses the longest stretch already on land, extended half a tile at both ends', () => {
    const p = trainPath(route([0, 0, 0, 0, 0, 0, 3, 0, 0]), 0)!;
    expect(p.length).toBeCloseTo(6, 5); // 6 tiles: 5 gaps + 2 half tiles
    expect(p.stops).toEqual([3.5]);
    expect(p.at(0)).toMatchObject({ x: 0, z: 0.5 });
    expect(p.at(1).heading).toBeCloseTo(Math.PI / 2, 5); // moving +x
  });

  it('no train on stretches shorter than 5 tiles', () => {
    expect(trainPath(route([0, 0, 0, 0, 3, 3]), 0)).toBeNull();
  });
});

describe('upcomingIdentity (build map preview)', () => {
  it('lists what arrives with the nearest next land stage', () => {
    const u = upcomingIdentity(VAR, 0, [{ key: 'hill', name: null }])!;
    expect(u.landStage).toBeGreaterThan(0);
    expect(u.labels.length).toBeGreaterThan(0);
    expect(upcomingIdentity(VAR, 5, [{ key: 'hill', name: null }])).toBeNull();
  });

  it('features follow their spare lot: Mahogany shows both at the spare lots\' stage', () => {
    const u = upcomingIdentity(MAH, 0, [{ key: 'big-park', name: null }, { key: 'school', name: null }])!;
    expect(u.labels).toEqual(['🌳 Big park', '🏫 School']);
    expect(u.landStage).toBe(2);
  });
});
