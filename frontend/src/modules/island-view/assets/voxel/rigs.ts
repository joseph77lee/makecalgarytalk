/**
 * Rigs: a voxel model split into a body and moving parts (legs, arms, head, tail), each part
 * moved so it turns around its own joint. Poses for each gait live in `gaits.ts`; the 3D side
 * (`VoxelPerson`, `VoxelAnimal`) only turns the groups.
 */
import type { BoxPart } from '../boxes';
import { cougar, deer, gooseStanding, jackrabbit, person, type PersonLook } from './samples';
import { V } from './voxel';

/** A moving part: its boxes relative to the joint, and the joint position (tile units). */
export interface Limb {
  parts: BoxPart[];
  pivot: [number, number, number];
}

export interface Rig {
  body: BoxPart[];
  limbs: Record<string, Limb>;
}

interface LimbSpec {
  name: string;
  /** Joint in voxels. */
  pivot: [number, number, number];
  /** Whether a box (centre in voxels) belongs to this part. */
  has: (x: number, y: number, z: number) => boolean;
}

/** Splits boxes into parts: each box goes to the first part that claims it, else the body. */
export function splitRig(parts: BoxPart[], specs: LimbSpec[]): Rig {
  const rig: Rig = { body: [], limbs: {} };
  for (const s of specs) rig.limbs[s.name] = { parts: [], pivot: [s.pivot[0] / V, s.pivot[1] / V, s.pivot[2] / V] };
  for (const b of parts) {
    const [x, y, z] = [b.p[0] * V, b.p[1] * V, b.p[2] * V];
    const spec = specs.find((s) => s.has(x, y, z));
    if (!spec) {
      rig.body.push(b);
      continue;
    }
    const limb = rig.limbs[spec.name];
    limb.parts.push({ ...b, p: [b.p[0] - limb.pivot[0], b.p[1] - limb.pivot[1], b.p[2] - limb.pivot[2]] });
  }
  return rig;
}

/** Neck height of the voxel person, in voxels. */
const NECK = 6.6;
const SHOULDER = 6.2;
const HIP = 3.4;

/** The voxel person (faces +z): head, two arms (sleeve and hand), two legs (trouser and shoe). */
export function personRig(seed: number, shirt?: string, look?: PersonLook): Rig {
  return splitRig(person(seed, shirt, look), [
    { name: 'head', pivot: [0, NECK, 0], has: (x, y) => y >= NECK && Math.abs(x) < 1.7 },
    { name: 'armL', pivot: [-2, SHOULDER, 0], has: (x) => x < -1.55 },
    { name: 'armR', pivot: [2, SHOULDER, 0], has: (x) => x > 1.55 },
    { name: 'legL', pivot: [-0.8, HIP, 0], has: (x, y) => y < HIP && x < 0 },
    { name: 'legR', pivot: [0.8, HIP, 0], has: (x, y) => y < HIP && x > 0 },
  ]);
}

export type AnimalKind = 'deer' | 'buck' | 'jackrabbit' | 'cougar' | 'goose';

/**
 * Animals (face +x). Four-legged animals name their legs by side and end: `fl` front-left,
 * `fr` front-right, `bl`, `br`; left is −z.
 */
export function animalRig(kind: AnimalKind): Rig {
  switch (kind) {
    case 'deer':
    case 'buck':
      return splitRig(deer(kind === 'buck'), [
        { name: 'head', pivot: [1.9, 5, 0], has: (x, y) => x >= 1.6 && y >= 4.6 },
        { name: 'tail', pivot: [-2.5, 5.4, 0], has: (x) => x < -2.5 },
        ...legs(3, -1.75, 1.65, -0.55, 0.65),
      ]);
    case 'cougar':
      return splitRig(cougar(), [
        { name: 'head', pivot: [2.1, 3.4, 0], has: (x, y) => x >= 2 && y >= 2.8 },
        { name: 'tail', pivot: [-3, 2.1, 0], has: (x) => x < -3 },
        ...legs(2.2, -2.3, 1.8, -0.55, 0.55),
      ]);
    case 'jackrabbit':
      return splitRig(jackrabbit(false), [
        { name: 'head', pivot: [0.7, 1.6, 0], has: (x, y) => x >= 0.6 && y >= 1.4 },
        { name: 'hind', pivot: [-0.7, 0.6, 0], has: (x, y) => y < 0.6 && x < 0 },
        { name: 'front', pivot: [0.6, 0.6, 0], has: (x, y) => y < 0.6 && x > 0 },
      ]);
    case 'goose':
      return splitRig(gooseStanding(), [
        { name: 'head', pivot: [1.2, 3, 0], has: (x, y) => x >= 0.9 && y >= 3 },
        { name: 'legL', pivot: [-0.25, 1.4, -0.35], has: (_x, y, z) => y < 1.4 && z < 0 },
        { name: 'legR', pivot: [-0.25, 1.4, 0.35], has: (_x, y, z) => y < 1.4 && z > 0 },
      ]);
  }
}

/** Four legs whose tops sit at `top` (voxels); back legs at x = `bx`, front at `fx`; left at `lz`. */
function legs(top: number, bx: number, fx: number, lz: number, rz: number): LimbSpec[] {
  const near = (x: number, z: number, cx: number, cz: number) => Math.abs(x - cx) < 0.8 && Math.abs(z - cz) < 0.5;
  return [
    { name: 'fl', pivot: [fx, top, lz], has: (x, y, z) => y < top && near(x, z, fx, lz) },
    { name: 'fr', pivot: [fx, top, rz], has: (x, y, z) => y < top && near(x, z, fx, rz) },
    { name: 'bl', pivot: [bx, top, lz], has: (x, y, z) => y < top && near(x, z, bx, lz) },
    { name: 'br', pivot: [bx, top, rz], has: (x, y, z) => y < top && near(x, z, bx, rz) },
  ];
}
