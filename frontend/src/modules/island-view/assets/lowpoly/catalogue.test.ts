// @vitest-environment node
/**
 * Loads every catalogue GLB from public/models/pf/ (the files the game serves) and checks what
 * the island relies on: it normalises, faces the right way, fits its tile, stays within the
 * triangle budget, and houses expose roof, wall and window colours for the shader.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Bone, Object3D, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { LP_HEIGHTS, LP_MODELS, type LpName } from './catalogue';
import { sourceMeshes } from './loadModel';
import { normalise, type LpModel } from './normalise';
import { RIGGED, type RiggedName } from './rigged';

const PUBLIC = resolve(__dirname, '../../../../../public/models/pf');

function parse(name: LpName): Promise<{ model: LpModel; door: boolean }> {
  const buf = readFileSync(`${PUBLIC}/${LP_MODELS[name].file}.glb`);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Promise((ok, fail) =>
    new GLTFLoader().parse(
      ab,
      '',
      (gltf) => {
        const meshes = sourceMeshes(gltf.scene);
        const spec = LP_MODELS[name];
        ok({ model: normalise(meshes, spec.cat, spec.fit, spec), door: meshes.some((m) => m.door) });
      },
      fail,
    ),
  );
}

const names = Object.keys(LP_MODELS) as LpName[];
/** Their roof is the same colour as their walls or an A-frame's sides: they keep it (wall paint still varies them). */
/** Windows in a warm dark colour the glass rule cannot tell from trim: they stay dark at night. */
const NO_GLASS = new Set<LpName>(['crossingCottage']);
const OWN_ROOF = new Set<LpName>(['aFrame', 'apartmentBlock', 'monolithTower']);
const sum = (a: ArrayLike<number>) => Array.from(a).reduce((x, y) => x + y, 0);

describe('Polyfork catalogue', () => {
  it.each(names)('%s loads, fits and matches its recorded height', async (name) => {
    const { model, door } = await parse(name);
    const spec = LP_MODELS[name];
    const box = model.geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(Math.abs(box.max.x + box.min.x)).toBeLessThan(0.01);
    expect(Math.abs(box.max.z + box.min.z)).toBeLessThan(0.01);
    if ('footprint' in spec.fit) expect(Math.max(model.size.x, model.size.z)).toBeCloseTo(spec.fit.footprint, 3);
    if (spec.cat === 'car') {
      expect(model.size.x).toBeGreaterThan(model.size.z); // drives along x
      expect(model.size.x).toBeGreaterThan(0.3);
      expect(model.size.x).toBeLessThan(0.7);
    }
    expect(model.triangles).toBeLessThan(12000);
    // label and tap heights come from this table (layout is pure and cannot load files)
    expect(LP_HEIGHTS[name], `LP_HEIGHTS.${name} should be ${model.size.y.toFixed(2)}`).toBeCloseTo(model.size.y, 1);
    if ('lamp' in spec && spec.lamp) expect(sum(model.geometry.getAttribute('aGlass').array), 'bulbs found (they light at night)').toBeGreaterThan(0);
    if (spec.cat === 'house' || spec.cat === 'tower') {
      const g = model.geometry;
      if (!OWN_ROOF.has(name)) expect(sum(g.getAttribute('aRoof').array), 'roof colour found').toBeGreaterThan(0);
      expect(sum(g.getAttribute('aWall').array), 'wall colour found').toBeGreaterThan(0);
      if (!NO_GLASS.has(name)) expect(sum(g.getAttribute('aGlass').array), 'windows found (they light at night)').toBeGreaterThan(0);
      if (spec.cat === 'house') expect(door, 'door tells the front').toBe(true);
    }
  });
});

describe('Polyfork rigged figures', () => {
  const PERSON = ['LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm', 'Head', 'Spine'];
  const ANIMAL = ['LeftFrontUpLeg', 'RightFrontUpLeg', 'LeftHindUpLeg', 'RightHindUpLeg', 'Neck', 'Tail'];
  it.each(Object.keys(RIGGED) as RiggedName[])('%s has the bones our gaits pose and vertex colours', async (name) => {
    const buf = readFileSync(`${PUBLIC}/${RIGGED[name].file}.glb`);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const scene = await new Promise<Object3D>((ok, fail) => new GLTFLoader().parse(ab, '', (g) => ok(g.scene), fail));
    const bones = new Set<string>();
    let coloured = true;
    scene.traverse((o) => {
      if ((o as Bone).isBone) bones.add(o.name);
      const m = o as SkinnedMesh;
      if (m.isSkinnedMesh && !m.geometry.getAttribute('color')) coloured = false;
    });
    for (const b of RIGGED[name].kind === 'person' ? PERSON : ANIMAL) expect(bones, b).toContain(b);
    expect(coloured).toBe(true);
  });
});
