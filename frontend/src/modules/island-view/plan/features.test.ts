import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ObjectOf } from '../layout';
import { MOOD_PALETTES } from '../mood';
import { feature } from '../assets/models';
import { BUILDING_TREE } from './buildingTree';
import { FEATURE_INFO, FEATURE_KEYS, MAX_FEATURES, allFeatureCodes, decodeFeatures, featureLabel, featuresFor } from './features';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../public/islands');
const planCodes = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

describe('feature data (supabase/data/community_features.json)', () => {
  it('covers exactly the communities that have island plans', () => {
    expect(allFeatureCodes().sort()).toEqual(planCodes.sort());
  });

  it('every community fits its features on the spare lots, with valid keys and short names', () => {
    const spares = Object.values(BUILDING_TREE.lots).filter((l) => l.kind === 'spare');
    expect(spares.length).toBeGreaterThanOrEqual(MAX_FEATURES);
    for (const s of spares) expect(s.size).toEqual([2, 2]);
    for (const code of allFeatureCodes()) {
      const f = featuresFor(code);
      expect(f.length, code).toBeLessThanOrEqual(MAX_FEATURES);
      expect(new Set(f.map((x) => x.key)).size, code).toBe(f.length);
      for (const x of f) {
        expect(FEATURE_KEYS, code).toContain(x.key);
        if (x.name !== null) expect(x.name.length, `${code} ${x.name}`).toBeLessThanOrEqual(60);
      }
      // stored in priority order
      const idx = f.map((x) => FEATURE_KEYS.indexOf(x.key));
      expect(idx, code).toEqual([...idx].sort((a, b) => a - b));
    }
  });

  it('most communities have at least one feature', () => {
    const withAny = allFeatureCodes().filter((c) => featuresFor(c).length > 0).length;
    expect(withAny / allFeatureCodes().length).toBeGreaterThan(0.85);
  });

  it('decodeFeatures lists every problem', () => {
    expect(() =>
      decodeFeatures({
        communities: {
          AAA: [{ key: 'volcano', name: null }],
          BBB: [{ key: 'pond', name: null }, { key: 'pond', name: null }],
          CCC: [{ key: 'pond', name: null }, { key: 'hill', name: null }, { key: 'creek', name: null }, { key: 'school', name: null }],
        },
      }),
    ).toThrow(/AAA: unknown feature volcano.*BBB: duplicate pond.*CCC: more than 3/);
    expect(() => decodeFeatures({})).toThrow(/communities/);
  });

  it('labels use the place name, or the generic title', () => {
    expect(featureLabel({ key: 'ctrain-station', name: 'Dalhousie' })).toBe('🚉 Dalhousie');
    expect(featureLabel({ key: 'hill', name: null })).toBe(`${FEATURE_INFO.hill.emoji} Hill`);
  });

  it('unknown community codes have no features', () => {
    expect(featuresFor('NOPE')).toEqual([]);
  });
});

describe('feature models', () => {
  const item = (featureKey: (typeof FEATURE_KEYS)[number]): ObjectOf<'feature'> => ({
    assetKey: 'feature', id: 'f', x: 0, z: 0, stage: 0, w: 2, d: 2, featureKey, name: null,
  });

  it.each(FEATURE_KEYS.map((k) => [k]))('%s stays inside its 2×2 lot in every mood', (key) => {
    for (const mood of ['lively', 'normal', 'sleepy'] as const) {
      const parts = feature(item(key), { mood, palette: MOOD_PALETTES[mood] });
      expect(parts.length).toBeGreaterThan(4);
      for (const p of parts) {
        expect(Math.abs(p.p[0]) + p.s[0] / 2, `${key} x`).toBeLessThanOrEqual(1.01);
        expect(Math.abs(p.p[2]) + p.s[2] / 2, `${key} z`).toBeLessThanOrEqual(1.01);
        expect(p.p[1] - p.s[1] / 2, `${key} y`).toBeGreaterThanOrEqual(-0.001);
      }
    }
  });
});
