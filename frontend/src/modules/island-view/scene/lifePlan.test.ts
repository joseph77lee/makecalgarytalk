import { describe, expect, it } from 'vitest';
import { islandSize, lifePlan, wildnessOf } from './lifePlan';

const always = () => 0; // every chance succeeds
const never = () => 0.999;
const BIG = 400;

/** Average animals per visit over many seeded visits. */
function averageAnimals(code: string, landTiles: number, hasWater = true, features: ('hill' | 'school')[] = ['hill']) {
  let s = 12345;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let n = 0;
  const runs = 4000;
  for (let i = 0; i < runs; i++) {
    const p = lifePlan(code, features, hasWater, landTiles, rand);
    n += p.rabbits + p.deer + p.geeseOnGround + (p.cougar ? 1 : 0);
  }
  return n / runs;
}

describe('island life visitors', () => {
  it('planes pass far more often over NE communities (near the airport)', () => {
    expect(lifePlan('SAD', [], false, BIG, never).planeEvery).toBeLessThan(lifePlan('MAH', [], false, BIG, never).planeEvery); // Saddle Ridge is NE
  });

  it('deer only with a park, hill, creek or water; cougars only with a park, hill or creek, near the edge', () => {
    expect(lifePlan('MAH', ['school'], false, BIG, always).deer).toBe(0);
    expect(lifePlan('MAH', ['school'], true, BIG, always).deer).toBe(2);
    expect(lifePlan('MAH', ['hill'], false, BIG, always).deer).toBe(2);
    expect(lifePlan('MAH', ['school'], true, BIG, always).cougar).toBe(false);
    expect(lifePlan('MAH', ['big-park'], false, BIG, always).cougar).toBe(true);
    expect(lifePlan('BLN', ['big-park'], false, BIG, always).cougar).toBe(false); // Beltline: downtown
  });

  it('geese on the ground only by water; nothing visits when every chance fails', () => {
    expect(lifePlan('MAH', [], false, BIG, always).geeseOnGround).toBe(0);
    expect(lifePlan('MAH', [], true, BIG, always).geeseOnGround).toBe(2);
    expect(lifePlan('MAH', ['hill'], true, BIG, never)).toMatchObject({ balloon: false, rabbits: 0, deer: 0, cougar: false, geeseOnGround: 0 });
  });

  it('wildness: downtown 0, edge communities high (operator feedback 2026-11-24)', () => {
    expect(wildnessOf('DNC')).toBe(0);
    expect(wildnessOf('BLN')).toBe(0);
    expect(wildnessOf('MAH')).toBeGreaterThan(0.8);
    expect(wildnessOf('XXX')).toBe(0.4);
  });

  it('downtown sees far fewer animals than the city edge', () => {
    const downtown = averageAnimals('BLN', BIG);
    const edge = averageAnimals('MAH', BIG);
    expect(downtown).toBeLessThan(0.25);
    expect(edge).toBeGreaterThan(downtown * 4);
  });

  it('a small island sees fewer animals than a big one, and never a crowd', () => {
    expect(averageAnimals('MAH', 40)).toBeLessThan(averageAnimals('MAH', BIG) * 0.6);
    expect(averageAnimals('MAH', 40)).toBeLessThan(1.2);
    let s = 1;
    const rand = () => ((s = (s * 16807) % 2147483647), s / 2147483647);
    for (let i = 0; i < 500; i++) {
      const p = lifePlan('MAH', ['hill'], true, 40, rand);
      expect(p.rabbits + p.deer + p.geeseOnGround).toBeLessThanOrEqual(3);
    }
  });

  it('islandSize grows from 0 to 1 with the land', () => {
    expect(islandSize(10)).toBe(0);
    expect(islandSize(170)).toBeCloseTo(0.5);
    expect(islandSize(1000)).toBe(1);
  });
});
