import { describe, expect, it } from 'vitest';
import { scenePalette } from '../mood';
import { LAMP, SNOW_WHITE, withLights, withSnow } from './environmentParts';
import { building, flowers, lamp, tree } from './models';
import type { BoxPart } from './boxes';
import { BUILDING_VOXELS } from './voxel/buildings';
import { houseParts } from './voxel/houses';

const ctx = { palette: scenePalette(false), snow: false };
const lampHeads = (parts: BoxPart[]) => parts.filter((p) => p.c === LAMP);
const built = (buildingKey: string) =>
  ({ assetKey: `building.${buildingKey}`, id: buildingKey, buildingKey, x: 0, z: 0, stage: 0, w: 3, d: 3, level: 1, status: 'built', facing: 0, variant: 0 }) as unknown as Parameters<typeof building>[0];

describe('withLights (night, storms)', () => {
  it('lamps glow at night with a pool of light, and are off by day (every lamp design)', () => {
    for (let row = 0; row < 30; row++) {
      const item = { assetKey: 'lamp', id: 'l', x: row, z: 0, stage: 0 } as const;
      const night = withLights(lamp(item), true);
      expect(lampHeads(night).every((p) => p.layer === 'glow')).toBe(true);
      expect(night.some((p) => p.layer === 'mist'), `row ${row}`).toBe(true);
      const day = withLights(lamp(item), false);
      expect(lampHeads(day)).toHaveLength(0);
      expect(day.some((p) => p.layer === 'glow')).toBe(false);
    }
  });

  it('every house lights its windows at night, none by day (requirement v1.48 §7.2)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const parts = houseParts('bungalow', seed * 7 + 1, 0);
      expect(withLights(parts, true).some((p) => p.layer === 'glow'), `house ${seed}`).toBe(true);
      expect(withLights(parts, false).some((p) => p.layer === 'glow')).toBe(false);
    }
  });

  it('public buildings light about 70 % of windows at night, none by day', () => {
    let glass = 0;
    let lit = 0;
    for (const key of Object.keys(BUILDING_VOXELS)) for (let variant = 0; variant < 3; variant++) {
      const parts = building({ ...built(key), variant }, ctx);
      const glow = (ps: BoxPart[]) => ps.filter((p) => p.layer === 'glow' && p.c !== LAMP).length;
      glass += parts.filter((p) => p.layer === 'solid' && ['#6aa8cf', '#4c80a8', '#a9d3ea'].includes(p.c)).length;
      lit += glow(withLights(parts, true)) - glow(parts);
      expect(glow(withLights(parts, false))).toBe(glow(parts));
    }
    expect(glass).toBeGreaterThan(15);
    expect(lit / glass).toBeGreaterThan(0.5);
    expect(lit / glass).toBeLessThan(0.9);
  });
});

describe('withSnow', () => {
  it('turns house roofs snowy and leaves walls alone', () => {
    const parts = houseParts('twoStoreyGarage', 3, 1);
    const roofs = parts.filter((p) => p.tag === 'roof');
    expect(roofs.length).toBeGreaterThan(0);
    const snowy = withSnow(parts, true);
    snowy.filter((p) => p.tag === 'roof').forEach((p, i) => {
      expect(p.c).not.toBe(roofs[i].c);
      expect(parseInt(p.c.slice(1, 3), 16)).toBeGreaterThan(200);
    });
    expect(snowy.filter((p) => !p.tag).map((p) => p.c)).toEqual(parts.filter((p) => !p.tag).map((p) => p.c));
    expect(withSnow(parts, false)).toBe(parts);
  });

  it('snow tops trees and hides flower patches under a snow pile', () => {
    const t = { assetKey: 'tree', id: 't', x: 1, z: 2, stage: 0, variant: 0 } as Parameters<typeof tree>[0];
    expect(tree(t, { ...ctx, snow: true }).some((p) => p.c === SNOW_WHITE)).toBe(true);
    expect(tree(t, ctx).some((p) => p.c === SNOW_WHITE)).toBe(false);
    const f = { assetKey: 'flowers', id: 'f', x: 0, z: 0, stage: 0, variant: 1 } as Parameters<typeof flowers>[0];
    expect(flowers(f, { ...ctx, snow: true }).every((p) => p.c === SNOW_WHITE)).toBe(true);
    expect(flowers(f, ctx).some((p) => p.c === SNOW_WHITE)).toBe(false);
  });

  it('tree crowns sway in the wind, trunks stay put', () => {
    const t = { assetKey: 'tree', id: 't', x: 1, z: 2, stage: 0, variant: 1 } as Parameters<typeof tree>[0];
    const parts = tree(t, ctx);
    expect(parts.some((p) => p.layer === 'sway')).toBe(true);
    expect(parts.filter((p) => p.layer === 'solid').every((p) => p.p[1] - p.s[1] / 2 <= 0.3)).toBe(true);
  });
});

describe('water a model draws itself (requirement v1.48 §7.6b)', () => {
  it('takes the island water colour, other parts unchanged', async () => {
    const { withWater } = await import('./environmentParts');
    const parts = [
      { layer: 'solid' as const, p: [0, 0, 0] as [number, number, number], s: [1, 1, 1] as [number, number, number], c: '#8ec5ea', tag: 'water' as const },
      { layer: 'solid' as const, p: [0, 0, 0] as [number, number, number], s: [1, 1, 1] as [number, number, number], c: '#8ec5ea' },
    ];
    const out = withWater(parts, '#a6d2ef');
    expect(out[0]!.c).toBe('#a6d2ef');
    expect(out[1]!.c).toBe('#8ec5ea'); // a pool or fountain keeps its own blue
  });

  it('every lake landmark tags its water', async () => {
    const { LANDMARK_LIBRARY } = await import('./voxel/landmarkLibrary');
    for (const key of ['landmark.mah', 'landmark.lkb', 'landmark.mck', 'landmark.byv', 'landmark.bow'] as const) {
      const parts = LANDMARK_LIBRARY[key].build(3);
      const water = parts.filter((b) => b.tag === 'water');
      expect(water.length, key).toBeGreaterThan(0);
    }
  });
});
