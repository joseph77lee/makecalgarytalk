/**
 * Voxel modelling helpers for the Art Pass (requirement.md v1.38 §19). Models are written in
 * integer voxel coordinates, V voxels per tile, centred on the footprint (x, z ∈ [-V/2, V/2) for
 * a one-tile model), y = 0 at the ground. Each voxel box becomes a BoxPart, so models are drawn
 * by the existing instanced BoxBatch (one draw call per material layer).
 */
import type { BoxPart, Layer } from '../boxes';

/** Voxels per tile. */
export const V = 12;
const u = (n: number) => n / V;

/** A box of voxels from (x0, y0, z0) to (x1, y1, z1) (max exclusive). */
export function vb(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: string, layer: Layer = 'solid'): BoxPart {
  const [ax, bx] = x0 < x1 ? [x0, x1] : [x1, x0];
  const [ay, by] = y0 < y1 ? [y0, y1] : [y1, y0];
  const [az, bz] = z0 < z1 ? [z0, z1] : [z1, z0];
  return { layer, p: [u((ax + bx) / 2), u((ay + by) / 2), u((az + bz) / 2)], s: [u(bx - ax), u(by - ay), u(bz - az)], c };
}

/** Deterministic hash → [0, 1). */
export function rnd(a: number, b = 0, c = 0): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Lighter (k > 0) or darker (k < 0) version of a hex colour. */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => {
    const v = (n >> s) & 255;
    const t = k >= 0 ? v + (255 - v) * k : v * (1 + k);
    return Math.max(0, Math.min(255, Math.round(t)));
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

export const pick = <T>(list: readonly T[], r: number): T => list[Math.floor(r * list.length) % list.length];

/** Move parts by whole voxels. */
export const vmove = (parts: BoxPart[], dx: number, dy: number, dz: number): BoxPart[] =>
  parts.map((p) => ({ ...p, p: [p.p[0] + u(dx), p.p[1] + u(dy), p.p[2] + u(dz)] }));

/** Mirror parts across the x = 0 plane. */
export const vmirrorX = (parts: BoxPart[]): BoxPart[] => parts.map((p) => ({ ...p, p: [-p.p[0], p.p[1], p.p[2]] }));

/** Rotate parts a quarter turn (n times) around the y axis (models face +z; 1 = face +x). */
export function vturn(parts: BoxPart[], n: number): BoxPart[] {
  const k = ((n % 4) + 4) % 4;
  return parts.map((p) => {
    let [x, y, z] = p.p;
    let [sx, sy, sz] = p.s;
    for (let i = 0; i < k; i++) {
      [x, z] = [z, -x];
      [sx, sz] = [sz, sx];
    }
    return { ...p, p: [x, y, z], s: [sx, sy, sz] };
  });
}

/**
 * Stepped gable roof over x0..x1 × z0..z1 starting at height y, ridge along x: each voxel step up
 * the slope narrows by one voxel on both sides; a darker eave line under the first step; gable
 * end walls filled with `wall`.
 */
export function gableRoof(x0: number, x1: number, z0: number, z1: number, y: number, roof: string, wall: string, overhang = 1): BoxPart[] {
  const parts: BoxPart[] = [];
  const depth = z1 - z0;
  const steps = Math.ceil(depth / 2);
  for (let i = 0; i < steps; i++) {
    const a = z0 - overhang + i;
    const b = z1 + overhang - i;
    if (b - a <= 0) break;
    const c = i % 2 === 0 ? roof : shade(roof, -0.08);
    parts.push({ ...vb(x0 - overhang, y + i, a, x1 + overhang, y + i + 1, b, c), tag: 'roof' });
    // gable end infill (inside the walls)
    const ia = z0 + i;
    const ib = z1 - i;
    if (ib - ia > 0 && i > 0) parts.push(vb(x0, y + i - 1, ia, x1, y + i, ib, wall));
  }
  parts.push(vb(x0 - overhang, y - 1, z0 - overhang, x1 + overhang, y, z1 + overhang, shade(roof, -0.3)));
  return parts;
}

/** Stepped hip roof: narrows on all four sides each step. */
export function hipRoof(x0: number, x1: number, z0: number, z1: number, y: number, roof: string, overhang = 1, maxSteps = 99): BoxPart[] {
  const parts: BoxPart[] = [vb(x0 - overhang, y - 1, z0 - overhang, x1 + overhang, y, z1 + overhang, shade(roof, -0.3))];
  for (let i = 0; i < maxSteps; i++) {
    const ax = x0 - overhang + i;
    const bx = x1 + overhang - i;
    const az = z0 - overhang + i;
    const bz = z1 + overhang - i;
    if (bx - ax <= 0 || bz - az <= 0) break;
    parts.push({ ...vb(ax, y + i, az, bx, y + i + 1, bz, i % 2 === 0 ? roof : shade(roof, -0.08)), tag: 'roof' });
  }
  return parts;
}

/** A window on the front (+z) face at z, with a white frame and a sill. */
export function windowZ(x0: number, x1: number, y0: number, y1: number, z: number, glass: string, frame = '#f7f3ea'): BoxPart[] {
  return [
    vb(x0 - 0.5, y0 - 0.5, z - 0.4, x1 + 0.5, y1 + 0.5, z + 0.25, frame),
    vb(x0, y0, z - 0.3, x1, y1, z + 0.35, glass),
    vb(x0 - 0.5, y0 - 1, z - 0.2, x1 + 0.5, y0 - 0.5, z + 0.8, frame),
  ];
}

/** A window on the side (+x) face at x. */
export function windowX(z0: number, z1: number, y0: number, y1: number, x: number, glass: string, frame = '#f7f3ea'): BoxPart[] {
  return [
    vb(x - 0.4, y0 - 0.5, z0 - 0.5, x + 0.25, y1 + 0.5, z1 + 0.5, frame),
    vb(x - 0.3, y0, z0, x + 0.35, y1, z1, glass),
  ];
}
