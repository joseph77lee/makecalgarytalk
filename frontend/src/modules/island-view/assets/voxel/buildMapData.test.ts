/**
 * The build map data (`supabase/data/build_map.json`, seeded into gamecore and read by the island
 * plan generator) and the models must agree (requirement v1.48 §7.6, §7.6b): every step has a model
 * with the same footprint and site, and every library model is on the map.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILDING_VOXELS } from './buildings';
import { LANDMARK_LIBRARY, type LandmarkKey } from './landmarkLibrary';
import { extent } from './designFit';
import { PLACE_LIBRARY, type PlaceKey } from './placeLibrary';
import { decorationGarden } from './placeParts';

interface Step {
  key: string;
  label: string;
  track: 'root' | 'community' | 'persona' | 'nature';
  step: number;
  tiles: [number, number];
  site: string;
  persona?: string;
  community?: string;
  landmarkOrder?: number;
}

const MAP = JSON.parse(readFileSync(resolve(__dirname, '../../../../../../supabase/data/build_map.json'), 'utf8')) as { steps: Step[] };
const STEPS = MAP.steps;
/** Steps drawn without a model of their own: pathway lights (along the paths), decoration and the generic landmark slots (placeholder until a model exists). */
const NO_MODEL = (s: Step) => s.key === 'pathway-lights' || s.key.startsWith('decoration-') || /^landmark-\d$/.test(s.key);

describe('build map data', () => {
  it('has one root, the Welcome sign', () => {
    expect(STEPS.filter((s) => s.track === 'root').map((s) => s.key)).toEqual(['welcome-sign']);
  });

  it('matches every persona place to its model (persona, step, footprint, site)', () => {
    for (const s of STEPS.filter((x) => x.key.startsWith('place.'))) {
      const m = PLACE_LIBRARY[s.key as PlaceKey];
      expect(m, s.key).toBeDefined();
      expect([m.persona, m.step, m.tiles, m.site], s.key).toEqual([s.persona, s.step, s.tiles, s.site]);
    }
  });

  it('matches every unique landmark to its model (community, order, footprint, site)', () => {
    for (const s of STEPS.filter((x) => x.community)) {
      const m = LANDMARK_LIBRARY[s.key as LandmarkKey];
      expect(m, s.key).toBeDefined();
      expect([m.code, m.order ?? 1, m.tiles, m.site], s.key).toEqual([s.community, s.landmarkOrder, s.tiles, s.site]);
      expect(s.step, s.key).toBe(3 + (s.landmarkOrder ?? 1));
    }
  });

  it('has a model for every community and nature step', () => {
    for (const s of STEPS.filter((x) => (x.track === 'root' || x.track === 'community' || x.track === 'nature') && !NO_MODEL(x))) expect(BUILDING_VOXELS[s.key], s.key).toBeDefined();
  });

  it('puts every library model on the map', () => {
    const keys = new Set(STEPS.map((s) => s.key));
    for (const k of [...Object.keys(PLACE_LIBRARY), ...Object.keys(LANDMARK_LIBRARY)]) expect(keys.has(k), k).toBe(true);
  });

  it('never has the same place twice on a build map: persona places differ from community and nature places', () => {
    const common = new Set(STEPS.filter((s) => s.track !== 'persona' && !NO_MODEL(s)).map((s) => s.label.toLowerCase()));
    const clash = STEPS.filter((s) => s.track === 'persona' && common.has(s.label.toLowerCase())).map((s) => s.key);
    expect(clash).toEqual([]);
  });

  it('numbers each track 1, 2, 3, … for every persona', () => {
    const personas = [...new Set(STEPS.filter((s) => s.persona).map((s) => s.persona))];
    expect(personas).toHaveLength(10);
    for (const p of personas) expect(STEPS.filter((s) => s.persona === p).map((s) => s.step).sort()).toEqual([1, 2, 3, 4]);
    for (const t of ['community', 'nature'] as const) {
      const steps = STEPS.filter((s) => s.track === t).map((s) => s.step);
      expect(steps, t).toEqual(steps.map((_, i) => i + 1));
    }
  });

  it('draws decoration steps as small gardens that stay on their 2 × 2 lot', () => {
    for (const seed of [1, 2, 3, 7, 11, 23]) {
      const e = extent(decorationGarden(seed));
      expect(e.w).toBeLessThanOrEqual(24.25);
      expect(e.d).toBeLessThanOrEqual(24.25);
    }
  });
});
