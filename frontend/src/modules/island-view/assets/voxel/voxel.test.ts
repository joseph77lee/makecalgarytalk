import { describe, expect, it } from 'vitest';
import type { BoxPart } from '../boxes';
import * as S from './samples';
import { V, rnd, shade, vb, vmirrorX, vturn } from './voxel';

const extent = (parts: BoxPart[]) => ({
  x: Math.max(...parts.map((p) => Math.abs(p.p[0]) + p.s[0] / 2)),
  z: Math.max(...parts.map((p) => Math.abs(p.p[2]) + p.s[2] / 2)),
  bottom: Math.min(...parts.map((p) => p.p[1] - p.s[1] / 2)),
});

describe('voxel helpers', () => {
  it('vb turns voxel coordinates into a box with its bottom on y0', () => {
    expect(vb(0, 0, 0, V, V, V, '#fff')).toEqual({ layer: 'solid', p: [0.5, 0.5, 0.5], s: [1, 1, 1], c: '#fff' });
    expect(vb(2, 1, 2, -2, 3, -2, '#000').s).toEqual([4 / V, 2 / V, 4 / V]); // corners in any order
  });

  it('shade lightens and darkens, and rnd is deterministic in [0, 1)', () => {
    expect(shade('#808080', 0.5)).toBe('#c0c0c0');
    expect(shade('#808080', -0.5)).toBe('#404040');
    expect(rnd(3, 4, 5)).toBe(rnd(3, 4, 5));
    for (let i = 0; i < 50; i++) expect(rnd(i, 7)).toBeLessThan(1);
  });

  it('vturn rotates a quarter turn; four turns are the identity; mirror flips x', () => {
    const b = [vb(1, 0, 3, 4, 2, 5, '#fff')];
    const t = vturn(b, 1)[0];
    expect(t.p[0]).toBeCloseTo(b[0].p[2]);
    expect(t.p[2]).toBeCloseTo(-b[0].p[0]);
    expect(t.s).toEqual([b[0].s[2], b[0].s[1], b[0].s[0]]);
    const back = vturn(b, 4)[0];
    expect(back.p.map((v) => +v.toFixed(9))).toEqual(b[0].p.map((v) => +v.toFixed(9)));
    expect(vmirrorX(b)[0].p[0]).toBeCloseTo(-b[0].p[0]);
  });
});

describe('Art Pass samples stay inside their footprint and on the ground', () => {
  const oneTile: [string, (s: number) => BoxPart[]][] = [
    ['bungalow', S.bungalow],
    ['twoStoreyGarage', S.twoStoreyGarage],
    ['semiDetached', S.semiDetached],
    ['townhouses', S.townhouses],
    ['infill', S.infill],
    ['leafyTree', S.leafyTree],
    ['spruce', S.spruce],
    ['person', (s) => S.person(s)],
    ['car', (s) => S.car(s)],
    ['flowerBed', S.flowerBed],
    ['wildFlowers', S.wildFlowers],
    ['partyBalloons', S.partyBalloons],
    ['deer', (s) => S.deer(s % 2 === 0)],
    ['jackrabbit', (s) => S.jackrabbit(s % 2 === 0)],
    ['cougar', () => S.cougar()],
  ];
  it.each(oneTile)('%s fits one tile for many seeds', (_name, make) => {
    for (let seed = 0; seed < 30; seed++) {
      const e = extent(make(seed));
      expect(e.x).toBeLessThanOrEqual(0.55);
      expect(e.z).toBeLessThanOrEqual(0.55);
      expect(e.bottom).toBeGreaterThanOrEqual(-0.001);
    }
  });

  it.each([
    ['officeTower', S.officeTower],
    ['condoTower', S.condoTower],
    ['brickMidrise', S.brickMidrise],
    ['communityHall', S.communityHall],
  ] as const)('%s fits two by two tiles', (_name, make) => {
    const e = extent(make(1));
    expect(e.x).toBeLessThanOrEqual(1.05);
    expect(e.z).toBeLessThanOrEqual(1.05);
    expect(e.bottom).toBeGreaterThanOrEqual(-0.001);
  });

  it('houses vary with the seed (different colours across seeds)', () => {
    const roofs = new Set(Array.from({ length: 20 }, (_, s) => S.bungalow(s * 7 + 1)[2].c));
    expect(roofs.size).toBeGreaterThan(3);
  });
});

describe('sky samples', () => {
  it('clouds, balloon and plane are built and vary or stay generic', () => {
    expect(S.cloud(1).length).toBeGreaterThan(4);
    expect(S.cloud(1)).not.toEqual(S.cloud(2));
    expect(S.hotAirBalloon(1).length).toBeGreaterThan(50);
    // the plane carries no text or logo parts: only a few livery colours
    expect(new Set(S.airplane().map((p) => p.c)).size).toBeLessThanOrEqual(8);
    expect(S.birdBody().length + S.birdWing().length).toBeGreaterThan(2);
  });
});
