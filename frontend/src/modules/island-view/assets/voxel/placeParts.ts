/**
 * Small shared pieces for the place library (community-identity build map, 2026-11-26): lamps,
 * benches, fences, flower beds, people-sized props. Voxels (12 per tile), y = 0 at the ground.
 */
import { asSway, type BoxPart } from '../boxes';
import { LAMP } from '../environmentParts';
import { ART } from './samples';
import { pick, rnd, shade, vb } from './voxel';

export { LAMP };
export const WOOD = '#b88a64';
export const WOOD_DARK = '#8a6343';
export const IRON = '#4a5060';
export const STONE = '#b8b0a4';
export const PAVING = '#e2d9c8';
export const ICE = '#dff1fb';
export const WATER = '#8ec5ea';
export const FLOWERS = ['#ef9b7f', '#e9c46a', '#e3a1a6', '#b9a6e2', '#fbf8f2'] as const;

/** A street lamp at (x, z): iron post and a lantern that lights at night. */
export const lamp = (x: number, z: number, h = 9): BoxPart[] => [
  vb(x - 0.3, 0, z - 0.3, x + 0.3, h, z + 0.3, IRON),
  vb(x - 0.8, h, z - 0.8, x + 0.8, h + 1.4, z + 0.8, LAMP, 'glow'),
  vb(x - 1, h + 1.4, z - 1, x + 1, h + 1.8, z + 1, IRON),
];

/** A bench at (x, z), its seat along x (or along z). */
export const bench = (x: number, z: number, alongX = true): BoxPart[] =>
  alongX
    ? [vb(x - 2.4, 1.4, z - 0.7, x + 2.4, 1.8, z + 0.7, ART.wood), vb(x - 2.4, 1.8, z - 0.8, x + 2.4, 3, z - 0.5, ART.wood), vb(x - 2.2, 0, z - 0.5, x - 1.8, 1.4, z + 0.5, IRON), vb(x + 1.8, 0, z - 0.5, x + 2.2, 1.4, z + 0.5, IRON)]
    : [vb(x - 0.7, 1.4, z - 2.4, x + 0.7, 1.8, z + 2.4, ART.wood), vb(x - 0.8, 1.8, z - 2.4, x - 0.5, 3, z + 2.4, ART.wood), vb(x - 0.5, 0, z - 2.2, x + 0.5, 1.4, z - 1.8, IRON), vb(x - 0.5, 0, z + 1.8, x + 0.5, 1.4, z + 2.2, IRON)];

/** A low picket or rail fence from (x0, z0) to (x1, z1) along one axis. */
export function fence(x0: number, z0: number, x1: number, z1: number, c = '#fbf8f2', h = 2.6): BoxPart[] {
  const alongX = z0 === z1;
  const parts: BoxPart[] = [alongX ? vb(x0, h * 0.55, z0 - 0.2, x1, h * 0.55 + 0.4, z0 + 0.2, c) : vb(x0 - 0.2, h * 0.55, z0, x0 + 0.2, h * 0.55 + 0.4, z1, c)];
  const len = alongX ? x1 - x0 : z1 - z0;
  for (let t = 0; t <= len; t += 1.5) {
    const px = alongX ? x0 + t : x0;
    const pz = alongX ? z0 : z0 + t;
    parts.push(vb(px - 0.25, 0, pz - 0.25, px + 0.25, h, pz + 0.25, c));
  }
  return parts;
}

/** A flower bed (w × d voxels) with a wooden edge and a few blooms. */
export function flowerBed(x0: number, z0: number, w: number, d: number, seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(x0, 0, z0, x0 + w, 1, z0 + d, '#a67b55'), vb(x0 + 0.4, 1, z0 + 0.4, x0 + w - 0.4, 1.8, z0 + d - 0.4, '#6fae4f')];
  for (let i = 0; i < Math.max(2, Math.floor((w * d) / 6)); i++) {
    const fx = x0 + 0.8 + rnd(seed, i, 1) * (w - 2);
    const fz = z0 + 0.8 + rnd(seed, i, 2) * (d - 2);
    parts.push(vb(fx, 1.8, fz, fx + 0.7, 2.5, fz + 0.7, pick(FLOWERS, rnd(seed, i, 3))));
  }
  return parts;
}

/** A small round-crowned tree at (x, z) (about a voxel model's young tree). */
export function smallTree(x: number, z: number, seed: number, h = 8): BoxPart[] {
  const leaf = pick(ART.leaf, rnd(seed, 11));
  return [
    vb(x - 0.5, 0, z - 0.5, x + 0.5, h * 0.45, z + 0.5, ART.trunk),
    ...asSway([vb(x - 2.4, h * 0.4, z - 2.4, x + 2.4, h * 0.85, z + 2.4, leaf), vb(x - 1.6, h * 0.85, z - 1.6, x + 1.6, h, z + 1.6, shade(leaf, 0.08))]),
  ];
}

/** A cattail clump at the water's edge. */
export const reeds = (x: number, z: number, seed: number): BoxPart[] =>
  [0, 1, 2].map((i) => {
    const ox = x + (rnd(seed, i, 21) - 0.5) * 1.6;
    const oz = z + (rnd(seed, i, 22) - 0.5) * 1.6;
    const h = 2.6 + rnd(seed, i, 23) * 1.6;
    return vb(ox, 0, oz, ox + 0.3, h, oz + 0.3, i === 1 ? '#7a5638' : '#6f9a4f');
  });
