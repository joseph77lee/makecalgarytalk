import { describe, expect, it } from 'vitest';
import { houseFacing } from '../../layout';
import { HOUSE_MIX, HOUSE_TYPES, houseHeight, houseParts, houseStyleFor, houseTypeFor, houseTypeGrown } from './houses';

describe('house generator (M19, requirement.md §7.2)', () => {
  it('picks the community style: downtown buildings, inner-city, suburbs', () => {
    expect(['DNC', 'BLN', 'EAU'].map(houseStyleFor)).toEqual(['downtown', 'downtown', 'downtown']);
    expect(houseStyleFor('HIL')).toBe('inner'); // Hillhurst, Centre sector
    expect(houseStyleFor('MAH')).toBe('suburb');
    expect(houseStyleFor('NOPE')).toBe('suburb');
  });

  it('follows the mix of each style and is the same for the same house', () => {
    for (const [style, mix] of Object.entries(HOUSE_MIX) as [keyof typeof HOUSE_MIX, [string, number][]][]) {
      const counts = new Map<string, number>();
      const n = 4000;
      for (let s = 0; s < n; s++) {
        const t = houseTypeFor(style, s * 2654435761);
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      for (const [type, share] of mix) expect(Math.abs((counts.get(type) ?? 0) / n - share), `${style} ${type}`).toBeLessThan(0.04);
      expect([...counts.keys()].every((t) => mix.some(([m]) => m === t))).toBe(true);
    }
    expect(houseTypeFor('suburb', 12345)).toBe(houseTypeFor('suburb', 12345));
    expect(Object.values(HOUSE_MIX).every((mix) => Math.abs(mix.reduce((a, [, w]) => a + w, 0) - 1) < 1e-9)).toBe(true);
  });

  it.each(HOUSE_TYPES.map((t) => [t]))('%s stays inside its one-tile lot in every facing', (type) => {
    for (let facing = 0; facing < 4; facing++) {
      for (let seed = 0; seed < 8; seed++) {
        for (const b of houseParts(type, seed, facing)) {
          expect(Math.abs(b.p[0]) + b.s[0] / 2).toBeLessThanOrEqual(0.55);
          expect(Math.abs(b.p[2]) + b.s[2] / 2).toBeLessThanOrEqual(0.55);
          expect(b.p[1] - b.s[1] / 2).toBeGreaterThanOrEqual(-0.001);
          expect(b.p[1] + b.s[1] / 2).toBeLessThanOrEqual(houseHeight(type) + 1e-9);
        }
      }
    }
  });

  it('no house glows by day; every window is a night window (lights do not follow activity, v1.48 §7.2)', () => {
    for (const type of HOUSE_TYPES) {
      expect(houseParts(type, 3, 0).some((b) => b.layer === 'glow'), type).toBe(false);
      expect(houseParts(type, 3, 0).some((b) => b.tag === 'village-window'), type).toBe(true);
    }
  });

  it('turning the house rotates its front: the door side moves from +z to +x', () => {
    const front = (facing: number) => {
      const door = houseParts('bungalow', 1, facing).find((b) => b.c === '#8b5a3c')!;
      return [Math.sign(Math.round(door.p[0] * 10)) || 0, Math.sign(Math.round(door.p[2] * 10)) || 0];
    };
    expect(front(0)).toEqual([0, 1]);
    expect(front(1)).toEqual([1, 0]);
    expect(front(2)).toEqual([0, -1]);
    expect(front(3)).toEqual([-1, 0]);
  });

  it('houses face a path next to them, else open land, else the plaza', () => {
    const t = { x: 4, z: 4 };
    expect(houseFacing(t, new Set(['3,4']), () => true)).toBe(3); // path on −x
    expect(houseFacing(t, new Set(), (k) => k === '4,3')).toBe(2); // open land on −z
    expect(houseFacing(t, new Set(), () => false)).toBe(2); // towards the plaza (origin): −z wins the tie
    expect(houseFacing({ x: -6, z: 1 }, new Set(), () => false)).toBe(1); // plaza is to the +x
  });

  it('taller types are taller (labels and taps follow the height)', () => {
    expect(houseHeight('apartment')).toBeGreaterThan(houseHeight('twoStoreyGarage'));
    expect(houseHeight('twoStoreyGarage')).toBeGreaterThan(houseHeight('bungalow'));
  });
});

describe('snow on every house design', () => {
  it('every house model has a roof that takes snow (flat roofs included)', () => {
    for (const type of HOUSE_TYPES)
      for (let seed = 0; seed < 60; seed++) expect(houseParts(type, seed, 0).some((b) => b.tag === 'roof'), `${type} ${seed}`).toBe(true);
  });

  it('houses grow up as the community grows: more townhouses and apartments on later land stages (v1.48 §7.2)', () => {
    const tall = (style: 'suburb' | 'inner', stage: number) => {
      let n = 0;
      for (let seed = 0; seed < 400; seed++) if (['townhouses', 'apartment'].includes(houseTypeGrown(style, seed, stage))) n++;
      return n / 400;
    };
    expect(tall('suburb', 5)).toBeGreaterThan(tall('suburb', 0) + 0.25);
    expect(tall('inner', 5)).toBeGreaterThan(tall('inner', 0) + 0.25);
    for (let seed = 0; seed < 50; seed++) expect(houseTypeGrown('suburb', seed, 0)).toBe(houseTypeFor('suburb', seed));
  });
});
