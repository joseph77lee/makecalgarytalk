/**
 * Rigged Polyfork people and animals (M23, requirement.md v1.45 §19.2: "animation is our own code
 * using the models' rigs"). The files' own clips are never played: our gaits (`voxel/gaits.ts`)
 * pose the bones. Each bone is turned around axes of the figure (not the bone's own, which differ
 * per rig): new local = parentRest⁻¹ · R · parentRest · restLocal, where parentRest is the parent
 * bone's rest rotation in the figure's frame and R a rotation in that frame.
 *
 * Figures: people face +z (left is +x, T-pose arms along x); animals face +z in their files and
 * are turned to face +x like our box animals (left is −z).
 */
import { BufferAttribute, Color, Euler, Matrix4, Quaternion, Vector3, type Bone, type Object3D, type SkinnedMesh } from 'three';
import type { AnimalKind } from '../voxel/rigs';
import { pastelize } from './normalise';

export type RiggedName =
  | 'resident'
  | 'child'
  | 'student'
  | 'commuter'
  | 'ranger'
  | 'wavingChild'
  | 'scooterKid'
  | 'deer'
  | 'reindeer'
  | 'rabbit'
  | 'hare'
  | 'dog';

export interface RiggedSpec {
  file: string;
  kind: 'person' | 'animal';
  /** Tiles per metre: people share one scale so children stay smaller; animals per kind. */
  scale: number;
  /** Rides a scooter: glides without swinging its legs. */
  glide?: boolean;
}

/** Adults are about 0.6 tile tall like our box people (1.73 m × 0.347). */
export const PERSON_TILES_PER_METRE = 0.347;

export const RIGGED: Record<RiggedName, RiggedSpec> = {
  resident: { file: 'suburban-resident-a9db9c', kind: 'person', scale: PERSON_TILES_PER_METRE },
  child: { file: 'neighborhood-child-8cc5ac', kind: 'person', scale: PERSON_TILES_PER_METRE },
  student: { file: 'student-with-backpack-65d2b4', kind: 'person', scale: PERSON_TILES_PER_METRE },
  commuter: { file: 'city-commuter-52a53f', kind: 'person', scale: PERSON_TILES_PER_METRE },
  ranger: { file: 'park-ranger-c1697e', kind: 'person', scale: PERSON_TILES_PER_METRE },
  wavingChild: { file: 'waving-child-dfada0', kind: 'person', scale: PERSON_TILES_PER_METRE },
  scooterKid: { file: 'scooter-kid-28cff9', kind: 'person', scale: PERSON_TILES_PER_METRE, glide: true },
  deer: { file: 'forest-deer-fe648d', kind: 'animal', scale: 0.26 },
  reindeer: { file: 'reindeer-base', kind: 'animal', scale: 0.27 },
  rabbit: { file: 'forest-rabbit-ea2da0', kind: 'animal', scale: 0.45 },
  hare: { file: 'mountain-hare-base', kind: 'animal', scale: 0.4 },
  dog: { file: 'farm-dog-723730', kind: 'animal', scale: 0.32 },
};

/** Our animal kinds drawn with Polyfork figures (cougars and geese stay box animals). */
export function animalModel(kind: AnimalKind, seed: number): RiggedName | null {
  if (kind === 'deer') return 'deer';
  if (kind === 'buck') return 'reindeer';
  if (kind === 'jackrabbit') return seed % 2 === 0 ? 'rabbit' : 'hare';
  return null;
}

/** People the villagers are drawn with, spread by villager index. */
/** `commuter` (Polyfork city-commuter) is left out: its mushroom-shaped head does not read as a person (operator, 2026-11-25). */
export const VILLAGER_MODELS: RiggedName[] = ['resident', 'child', 'student', 'ranger', 'wavingChild', 'scooterKid'];
/** Grown-up figures for the avatar (its shirt is the player's colour). */
export const AVATAR_MODELS: RiggedName[] = ['resident', 'ranger', 'student'];

export const villagerModel = (index: number): RiggedName => VILLAGER_MODELS[(index * 5) % VILLAGER_MODELS.length];
export const avatarModel = (seed: number): RiggedName => AVATAR_MODELS[Math.abs(seed) % AVATAR_MODELS.length];

export const riggedUrl = (name: RiggedName): string => `/models/pf/${RIGGED[name].file}.glb`;

/** A bone's rest frame, so poses can be given in the figure's axes. */
export interface BoneRest {
  bone: Bone;
  restLocal: Quaternion;
  /** Parent's rest rotation in the figure's frame. */
  parentRest: Quaternion;
}

/** Rest frames of the named bones, measured in the frame of `figure` (an ancestor). */
export function boneRests(figure: Object3D, names: readonly string[]): Map<string, BoneRest> {
  figure.updateMatrixWorld(true);
  const toFigure = new Matrix4().copy(figure.matrixWorld).invert();
  const out = new Map<string, BoneRest>();
  const m = new Matrix4();
  const pos = new Vector3();
  const scl = new Vector3();
  figure.traverse((o) => {
    if (!(o as Bone).isBone || !names.includes(o.name) || out.has(o.name) || !o.parent) return;
    const parentRest = new Quaternion();
    m.multiplyMatrices(toFigure, o.parent.matrixWorld).decompose(pos, parentRest, scl);
    out.set(o.name, { bone: o as Bone, restLocal: o.quaternion.clone(), parentRest });
  });
  return out;
}

const qa = new Quaternion();
const qb = new Quaternion();
const e = new Euler();

/**
 * Poses a bone: its rest rotation followed by a rotation in the figure's frame, made of `pre`
 * around z first (e.g. lowering T-pose arms) and then x, y, z angles (radians, XYZ order).
 */
export function poseBone(rest: BoneRest, x: number, y = 0, z = 0, preZ = 0): void {
  qb.setFromEuler(e.set(x, y, z, 'XYZ'));
  if (preZ) qb.multiply(qa.setFromEuler(e.set(0, 0, preZ, 'XYZ')));
  // parentRest⁻¹ · r · parentRest · restLocal
  qa.copy(rest.parentRest).invert().multiply(qb).multiply(rest.parentRest).multiply(rest.restLocal);
  rest.bone.quaternion.copy(qa);
}

// --- Colours ---------------------------------------------------------------------------------

const linearToSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const byte = (v: number) => Math.min(255, Math.max(0, Math.round(linearToSrgb(v) * 255)));
const hexAt = (c: BufferAttribute, i: number) => `#${((byte(c.getX(i)) << 16) | (byte(c.getY(i)) << 8) | byte(c.getZ(i))).toString(16).padStart(6, '0')}`;

/**
 * The shirt: the commonest colour, over the whole figure, on vertices that follow the chest bones
 * (people only), so the avatar and villagers can wear their own shirt colour.
 */
export function shirtColour(meshes: SkinnedMesh[]): string | null {
  const counts = new Map<string, number>();
  for (const mesh of meshes) countChest(mesh, counts);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/** Adds the colours of a mesh's chest-following vertices (bones named Spine…) to `counts`. */
function countChest(mesh: SkinnedMesh, counts: Map<string, number>): void {
  const col = mesh.geometry.getAttribute('color') as BufferAttribute | undefined;
  const idx = mesh.geometry.getAttribute('skinIndex') as BufferAttribute | undefined;
  const wt = mesh.geometry.getAttribute('skinWeight') as BufferAttribute | undefined;
  if (!col || !idx || !wt) return;
  const chestBones = new Set<number>();
  mesh.skeleton.bones.forEach((b, i) => /^Spine/.test(b.name) && chestBones.add(i));
  for (let i = 0; i < col.count; i++) {
    let best = 0;
    let bone = -1;
    for (let k = 0; k < 4; k++) {
      const w = wt.getComponent(i, k);
      if (w > best) {
        best = w;
        bone = idx.getComponent(i, k);
      }
    }
    if (!chestBones.has(bone)) continue;
    const h = hexAt(col, i);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
}

/** Pastel vertex colours, with `from` (a model colour) replaced by `to` (the shirt). */
export function repaintRigged(mesh: SkinnedMesh, from: string | null, to: string | null): void {
  const col = mesh.geometry.getAttribute('color') as BufferAttribute | undefined;
  if (!col) return;
  const out = new Float32Array(col.count * 3);
  const c = new Color();
  const cache = new Map<string, string>();
  for (let i = 0; i < col.count; i++) {
    const h = hexAt(col, i);
    let p = cache.get(h);
    if (!p) cache.set(h, (p = from && to && h === from ? to : pastelize(h)));
    c.set(p);
    out[i * 3] = c.r;
    out[i * 3 + 1] = c.g;
    out[i * 3 + 2] = c.b;
  }
  mesh.geometry.setAttribute('color', new BufferAttribute(out, 3));
}
