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
  it('lamps glow at night with a pool of light, and are off by day', () => {
    const night = withLights(lamp(), true);
    expect(lampHeads(night).every((p) => p.layer === 'glow')).toBe(true);
    expect(night.some((p) => p.layer === 'mist')).toBe(true);
    const day = withLights(lamp(), false);
    expect(lampHeads(day)).toHaveLength(0);
    expect(day.some((p) => p.layer === 'glow')).toBe(false);
  });

  it("a resident's windows never light by night: only being active today lights them (§7.2)", () => {
    for (let seed = 0; seed < 12; seed++) {
      const idle = houseParts('bungalow', seed, 0, false);
      expect(idle.some((p) => p.tag === 'house-window')).toBe(true);
      expect(withLights(idle, true).some((p) => p.layer === 'glow')).toBe(false);
      const active = houseParts('bungalow', seed, 0, true);
      expect(withLights(active, true).filter((p) => p.layer === 'glow').length).toBe(active.filter((p) => p.layer === 'glow').length);
      expect(withLights(active, false).some((p) => p.layer === 'glow')).toBe(true);
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
    const parts = houseParts('twoStoreyGarage', 3, 1, false);
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
