import { describe, expect, it } from 'vitest';
import type { ObjectOf } from '../../layout';
import { MOOD_PALETTES } from '../../mood';
import { HOUSE_TYPES } from '../voxel/houses';
import { LP_HEIGHTS, LP_MODELS, type LpName } from './catalogue';
import { BENCH_MODELS, CAR_MODELS, HOUSE_MODELS, LAMP_MODELS, TREE_MODELS, houseLook, houseModelHeight, placeHouse, placeProp, placeTree } from './islandModels';

const house = (over: Partial<ObjectOf<'house'>> = {}): ObjectOf<'house'> => ({
  assetKey: 'house', id: 'h', houseId: 'h', x: 4.5, z: 2.5, stage: 0, nickname: 'A', activeToday: false, colorIndex: 7,
  founding: false, mine: false, houseType: 'bungalow', facing: 1, height: 1, ...over,
});
const ctx = { palette: MOOD_PALETTES.lively, snow: false, lowQuality: false, lightsOn: false };

describe('island models', () => {
  it('uses every house and tower pick, and every tree and car pick', () => {
    const used = new Set<LpName>([...Object.values(HOUSE_MODELS).flat(), ...TREE_MODELS.leafy, ...TREE_MODELS.evergreen, ...CAR_MODELS, ...BENCH_MODELS, ...LAMP_MODELS, 'mailbox', 'snowman']);
    for (const name of Object.keys(LP_MODELS) as LpName[]) expect(used, name).toContain(name);
  });
  it('gives each house a fixed look and a label height from its model', () => {
    for (const type of HOUSE_TYPES)
      for (let seed = 0; seed < 40; seed++) {
        const a = houseLook(type, seed);
        expect(houseLook(type, seed)).toEqual(a);
        expect(HOUSE_MODELS[type]).toContain(a.model);
        expect(houseModelHeight(type, seed)).toBeCloseTo(LP_HEIGHTS[a.model] * a.scale);
      }
  });
  it('mixes models, mirroring and colours within one type (never patterned)', () => {
    const looks = Array.from({ length: 60 }, (_, s) => houseLook('bungalow', s * 7919));
    expect(new Set(looks.map((l) => l.model)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(looks.map((l) => l.roof)).size).toBeGreaterThanOrEqual(6);
    expect(looks.some((l) => l.mirror) && looks.some((l) => !l.mirror)).toBe(true);
  });
  it('lights windows: active today 2, half the village houses 1, other residents 0', () => {
    expect(placeHouse(house({ activeToday: true }), ctx)[0].lit).toBe(2);
    expect(placeHouse(house(), ctx)[0].lit).toBe(0);
    const village = Array.from({ length: 200 }, (_, i) => placeHouse(house({ village: true, colorIndex: i * 31 }), ctx)[0].lit);
    const share = village.filter((l) => l === 1).length / village.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.65);
  });
  it('stands row units in pairs and drops yard trees in low quality', () => {
    const seeds = Array.from({ length: 400 }, (_, i) => i * 13);
    const row = seeds.find((s) => houseLook('townhouses', s).model === 'townhouse')!;
    const pair = placeHouse(house({ houseType: 'townhouses', colorIndex: row }), ctx).filter((p) => p.model === 'townhouse');
    expect(pair).toHaveLength(2);
    expect(pair[0].mirror).not.toBe(pair[1].mirror);
    const withYard = seeds.find((s) => placeHouse(house({ colorIndex: s }), ctx).length > 1)!;
    expect(withYard).toBeDefined();
    expect(placeHouse(house({ colorIndex: withYard }), { ...ctx, lowQuality: true })).toHaveLength(1);
  });
  it('keeps yard trees inside the house tile', () => {
    for (let s = 0; s < 300; s++)
      for (const p of placeHouse(house({ colorIndex: s, facing: s % 4 }), ctx)) {
        expect(Math.abs(p.x - 4.5)).toBeLessThan(0.5);
        expect(Math.abs(p.z - 2.5)).toBeLessThan(0.5);
      }
  });
  it('picks leafy or evergreen trees by variant, and cars only for car props', () => {
    const tree = (variant: number, x: number) => placeTree({ assetKey: 'tree', id: 't', x, z: 1.5, stage: 0, variant })[0].model;
    for (let x = 0; x < 30; x++) {
      expect(TREE_MODELS.evergreen).toContain(tree(2, x + 0.5));
      expect(TREE_MODELS.leafy).toContain(tree(x % 2, x + 0.5));
    }
    const prop = (kind: ObjectOf<'prop'>['kind']) => placeProp({ assetKey: 'prop', id: 'p', x: 1, z: 1, stage: 0, kind, facing: 0, seed: 5 });
    expect(CAR_MODELS).toContain(prop('car')![0].model);
    expect(BENCH_MODELS).toContain(prop('bench')![0].model);
    expect(prop('mailbox')![0].model).toBe('mailbox');
    expect(prop('flowers')).toBeNull();
  });
});
