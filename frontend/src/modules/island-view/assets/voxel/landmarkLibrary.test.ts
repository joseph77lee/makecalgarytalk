import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extent } from './designFit';
import { LANDMARK_LIBRARY, type LandmarkKey } from './landmarkLibrary';
import { V } from './voxel';

const KEYS = Object.keys(LANDMARK_LIBRARY) as LandmarkKey[];
const SLACK = 0.25;

/** The operator's persona data (code → row). */
const PERSONAS = (() => {
  const text = readFileSync(resolve(__dirname, '../../../../../../supabase/data/community_personas.csv'), 'utf8').trim().split('\n');
  const head = text[0].split(',');
  return new Map(text.slice(1).map((line) => {
    const cells = line.split(',');
    return [cells[0], Object.fromEntries(head.map((h, i) => [h, cells[i]]))] as const;
  }));
})();

describe('unique landmarks', () => {
  it.each(KEYS)('%s stays inside its footprint, centred, and fills most of it', (key) => {
    const lm = LANDMARK_LIBRARY[key];
    for (const seed of [1, 7, 23]) {
      const e = extent(lm.build(seed));
      expect(e.w).toBeLessThanOrEqual(lm.tiles[0] * V + SLACK);
      expect(e.d).toBeLessThanOrEqual(lm.tiles[1] * V + SLACK);
      expect(Math.abs(e.cx)).toBeLessThan(1e-6);
      expect(Math.abs(e.cz)).toBeLessThan(1e-6);
      expect((e.w * e.d) / (lm.tiles[0] * lm.tiles[1] * V * V)).toBeGreaterThanOrEqual(0.7);
    }
  });

  it.each(KEYS)('%s lights up at night and is deterministic', (key) => {
    const parts = LANDMARK_LIBRARY[key].build(3);
    expect(parts.some((b) => b.layer === 'glow')).toBe(true);
    expect(LANDMARK_LIBRARY[key].build(3)).toEqual(parts);
  });

  it.each(KEYS)('%s belongs to a priority community with the same persona', (key) => {
    const lm = LANDMARK_LIBRARY[key];
    const order = lm.order ?? 1;
    expect(key).toBe(order === 1 ? `landmark.${lm.code.toLowerCase()}` : `landmark.${lm.code.toLowerCase()}.${order}`);
    const row = PERSONAS.get(lm.code);
    expect(row).toBeDefined();
    expect(row?.priority).toBe('1');
    expect(row?.landmark_tier).toBe('unique');
    expect(row?.persona).toBe(lm.persona);
  });

  it('gives each community one signature landmark and numbers the rest 2, 3, … in order', () => {
    const orders = new Map<string, number[]>();
    for (const key of KEYS) {
      const lm = LANDMARK_LIBRARY[key];
      orders.set(lm.code, [...(orders.get(lm.code) ?? []), lm.order ?? 1]);
    }
    for (const list of orders.values()) expect([...list].sort()).toEqual(list.map((_, i) => i + 1));
  });
});
