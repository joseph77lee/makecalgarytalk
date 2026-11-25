import { describe, expect, it } from 'vitest';
import { vb } from './voxel';
import { extent, fitTo, VOXEL_DESIGNS } from './designFit';
import { bungalow, twoStoreyGarage } from './samples';

describe('fitting new designs to the current voxel volumes', () => {
  it('stretches parts to a target box around their footprint centre, on the ground', () => {
    const parts = [vb(2, 0, 2, 6, 4, 4, '#fff'), vb(3, 4, 2, 5, 6, 4, '#000')];
    const fitted = fitTo(parts, { w: 8, d: 4, h: 12 });
    const e = extent(fitted);
    expect(e.w).toBeCloseTo(8);
    expect(e.d).toBeCloseTo(4);
    expect(e.h).toBeCloseTo(12);
    expect(e.cx).toBeCloseTo(4);
    expect(e.cz).toBeCloseTo(3);
  });
  it.each(Object.keys(VOXEL_DESIGNS) as (keyof typeof VOXEL_DESIGNS)[])('%s matches its target size', (name) => {
    const design = VOXEL_DESIGNS[name];
    for (const seed of [1, 7, 23]) {
      const e = extent(design.build(seed));
      expect(e.w).toBeCloseTo(design.target.w, 3);
      expect(e.d).toBeCloseTo(design.target.d, 3);
      expect(e.h).toBeCloseTo(design.target.h, 3);
    }
  });
  it('houses take the size of the houses the game draws now', () => {
    const low = extent(bungalow(3));
    const tall = extent(twoStoreyGarage(9));
    expect(extent(VOXEL_DESIGNS.aFrameCabin.build(1)).w).toBeCloseTo(low.w, 3);
    expect(extent(VOXEL_DESIGNS.familyHouse.build(1)).h).toBeCloseTo(tall.h, 3);
  });
});
