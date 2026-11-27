import { describe, expect, it } from 'vitest';
import { detailSides, finishAllSides } from './allSides';
import type { BoxPart } from './boxes';
import { MOOD_PALETTES } from '../mood';
import { BUILDING_VARIANTS, BUILDING_VOXELS } from './voxel/buildings';
import { FEATURE_VOXELS } from './voxel/features';
import { HOUSE_TYPES, houseParts } from './voxel/houses';
import { LANDMARK_LIBRARY } from './voxel/landmarkLibrary';
import { PLACE_LIBRARY } from './voxel/placeLibrary';
import { ART } from './voxel/samples';
import { vb } from './voxel/voxel';

const CTX = { palette: MOOD_PALETTES.lively, snow: false };
const wallWithFrontWindow = (): BoxPart[] => [vb(-6, 0, -6, 6, 10, 6, '#eeeeee'), vb(-2, 3, 6, 2, 6, 6.6, ART.glass), vb(-1, 0, 6, 1, 4, 6.3, ART.door)];

/** Front windows/doors have partners on the back, side ones on the other side. */
function expectAllSides(name: string, parts: BoxPart[]) {
  const s = detailSides(parts);
  if (s.pz > 0) expect(s.nz, `${name}: back (−z) has no windows`).toBeGreaterThan(0);
  if (s.px > 0) expect(s.nx, `${name}: side (−x) has no windows`).toBeGreaterThan(0);
}

describe('every model finished on all sides (requirement v1.48 §10.1, §19.1)', () => {
  it('mirrors front windows and doors onto a bare back wall, with a frame', () => {
    const out = finishAllSides(wallWithFrontWindow());
    expect(detailSides(out)).toMatchObject({ pz: 2, nz: 2 });
    expect(out.length).toBe(3 + 3); // window + frame + door
    expect(out.some((b) => b.c === ART.glass && b.p[2] < -0.5)).toBe(true);
  });

  it('leaves a wall that already has back windows as it is', () => {
    const parts = [...wallWithFrontWindow(), vb(-2, 3, -6.6, 2, 6, -6, ART.glass)];
    expect(finishAllSides(parts)).toEqual(parts);
  });

  it('houses of every type', () => {
    for (const type of HOUSE_TYPES) for (let seed = 0; seed < 12; seed++) expectAllSides(`${type} ${seed}`, houseParts(type, seed, 0));
  });

  it('community and nature buildings in every design', () => {
    for (const [key, make] of Object.entries(BUILDING_VOXELS))
      for (let variant = 0; variant < (BUILDING_VARIANTS[key] ?? 1); variant++) expectAllSides(`${key} v${variant}`, finishAllSides(make({ w: 3, d: 3, level: 1, variant }, CTX)));
  });

  it('persona places, unique landmarks and features', () => {
    for (const [key, m] of Object.entries(PLACE_LIBRARY)) expectAllSides(key, finishAllSides(m.build(7)));
    for (const [key, m] of Object.entries(LANDMARK_LIBRARY)) expectAllSides(key, finishAllSides(m.build(7)));
    for (const [key, make] of Object.entries(FEATURE_VOXELS)) for (const v of [0, 1, 2]) expectAllSides(`${key} v${v}`, finishAllSides(make(v, CTX)));
  });
});
