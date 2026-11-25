/**
 * People and animals drawn with rigged Polyfork models, posed every frame by our own gaits (M23).
 * While a file loads (or if it fails) the box figure is drawn instead, so callers never wait.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Group, Object3D, SkinnedMesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { VoxelAnimal, type AnimalMotion } from '../VoxelAnimal';
import { VoxelPerson, type PersonMotion } from '../VoxelPerson';
import { ANIMAL_STYLE, advancePhase, animalPose, personPose, personStride } from '../voxel/gaits';
import type { AnimalKind } from '../voxel/rigs';
import { RIGGED, boneRests, poseBone, repaintRigged, riggedUrl, shirtColour, animalModel, type RiggedName } from './rigged';

// --- Loading ---------------------------------------------------------------------------------

const cache = new Map<RiggedName, Promise<Object3D | null>>();
const settled = new Map<RiggedName, Object3D | null>();
let loader: GLTFLoader | null = null;

function loadRigged(name: RiggedName): Promise<Object3D | null> {
  let p = cache.get(name);
  if (!p) {
    loader ??= new GLTFLoader();
    p = loader
      .loadAsync(riggedUrl(name))
      .then((g): Object3D | null => g.scene)
      .catch((err: unknown) => {
        console.warn(`Polyfork figure ${name} not loaded; keeping the box figure`, err);
        return null;
      })
      .then((s) => {
        settled.set(name, s);
        return s;
      });
    cache.set(name, p);
  }
  return p;
}

/** The file's scene once loaded (a template: clone it per figure), else null. */
function useRiggedTemplate(name: RiggedName | null): Object3D | null {
  const [, setLoads] = useState(0);
  const ready = name ? (settled.get(name) ?? null) : null;
  useEffect(() => {
    if (!name || settled.has(name)) return;
    let alive = true;
    void loadRigged(name).then(() => alive && setLoads((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [name]);
  return ready;
}

/** A posable copy of a template with pastel colours (and the shirt in `shirt`, people only). */
function makeFigure(template: Object3D, shirt: string | null): Object3D {
  const figure = cloneSkinned(template);
  const meshes: SkinnedMesh[] = [];
  figure.traverse((o) => {
    const m = o as SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    m.geometry = m.geometry.clone(); // own colours per figure
    m.castShadow = true;
    m.frustumCulled = false; // bones move the mesh outside its bind-pose bounds
    meshes.push(m);
  });
  const from = shirt ? shirtColour(meshes) : null;
  for (const m of meshes) repaintRigged(m, from, shirt);
  return figure;
}

// --- People ----------------------------------------------------------------------------------

const PERSON_BONES = ['LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm', 'Head'] as const;
/** T-pose arms are lowered by this much (radians) before they swing. */
const ARM_DOWN = 1.3;
const IDLE_PERSON: PersonMotion = { speed: 0 };

/**
 * A person: the Polyfork figure `model` when loaded (else the box person), wearing `shirt`,
 * posed from `motion` (walking, sitting, cheering, hammering) like the box person.
 */
export function Person({ model, seed, shirt, motion, headTilt }: { model: RiggedName; seed: number; shirt: string; motion?: RefObject<PersonMotion>; headTilt?: RefObject<number> }) {
  const template = useRiggedTemplate(model);
  if (!template) return <VoxelPerson seed={seed} shirt={shirt} motion={motion} headTilt={headTilt} />;
  return <RiggedPerson template={template} model={model} seed={seed} shirt={shirt} motion={motion} headTilt={headTilt} />;
}

function RiggedPerson({ template, model, seed, shirt, motion, headTilt }: { template: Object3D; model: RiggedName; seed: number; shirt: string; motion?: RefObject<PersonMotion>; headTilt?: RefObject<number> }) {
  const figure = useMemo(() => makeFigure(template, shirt), [template, shirt]);
  const holder = useRef<Group>(null);
  const rests = useRef<ReturnType<typeof boneRests> | null>(null);
  const phase = useRef(seed % 7);
  const angles = useRef({ legL: 0, legR: 0, armL: 0, armR: 0, knee: 0 });
  const glide = !!RIGGED[model].glide;

  useFrame(({ clock }, dt) => {
    if (!holder.current) return;
    rests.current ??= boneRests(holder.current, PERSON_BONES);
    const r = rests.current;
    const m = motion?.current ?? IDLE_PERSON;
    if (m.speed > 0) phase.current = advancePhase(phase.current, m.speed * dt, personStride(m.speed));
    const target = personPose(phase.current, glide ? { ...m, speed: 0 } : m, clock.elapsedTime);
    const a = angles.current;
    const ease = Math.min(1, dt * 14);
    a.legL += (target.legL - a.legL) * ease;
    a.legR += (target.legR - a.legR) * ease;
    a.armL += (target.armL - a.armL) * ease;
    a.armR += (target.armR - a.armR) * ease;
    a.knee += ((m.sit ? 1.4 : 0) - a.knee) * ease;
    const set = (name: string, x: number, preZ = 0) => {
      const rest = r.get(name);
      if (rest) poseBone(rest, x, 0, 0, preZ);
    };
    set('LeftUpLeg', a.legL);
    set('RightUpLeg', a.legR);
    set('LeftLeg', a.knee);
    set('RightLeg', a.knee);
    // arms: down from the T-pose, then swing forward (negative) and back
    set('LeftArm', a.armL, -ARM_DOWN);
    set('RightArm', a.armR, ARM_DOWN);
    set('Head', headTilt?.current ?? 0);
  });

  return (
    <group ref={holder} scale={RIGGED[model].scale}>
      <primitive object={figure} />
    </group>
  );
}

// --- Animals ---------------------------------------------------------------------------------

/** Our gait limb names → the rig's bones: four legs for walkers, front/hind pairs for hoppers. */
const WALKER_BONES: Record<string, string[]> = {
  fl: ['LeftFrontUpLeg'],
  fr: ['RightFrontUpLeg'],
  bl: ['LeftHindUpLeg'],
  br: ['RightHindUpLeg'],
  head: ['Neck'],
  tail: ['Tail'],
};
const HOPPER_BONES: Record<string, string[]> = {
  front: ['LeftFrontUpLeg', 'RightFrontUpLeg'],
  hind: ['LeftHindUpLeg', 'RightHindUpLeg'],
  head: ['Neck'],
  tail: ['Tail'],
};
const ALL_ANIMAL_BONES = [...new Set([...Object.values(WALKER_BONES), ...Object.values(HOPPER_BONES)].flat())];

/** An animal facing +x like the box animals: Polyfork figure when there is one and it loaded. */
export function Animal({ kind, motion, seed = 0 }: { kind: AnimalKind; motion: RefObject<AnimalMotion>; seed?: number }) {
  const model = animalModel(kind, seed);
  const template = useRiggedTemplate(model);
  if (!model || !template) return <VoxelAnimal kind={kind} motion={motion} seed={seed} />;
  return <RiggedAnimal template={template} model={model} kind={kind} motion={motion} seed={seed} />;
}

function RiggedAnimal({ template, model, kind, motion, seed }: { template: Object3D; model: RiggedName; kind: AnimalKind; motion: RefObject<AnimalMotion>; seed: number }) {
  const figure = useMemo(() => makeFigure(template, null), [template]);
  const frame = useRef<Group>(null);
  const body = useRef<Group>(null);
  const rests = useRef<ReturnType<typeof boneRests> | null>(null);
  const phase = useRef(seed % 5);
  const current = useRef(new Map<string, { x: number; y: number; z: number }>());
  const style = ANIMAL_STYLE[kind];

  useFrame(({ clock }, dt) => {
    if (!frame.current || !body.current) return;
    rests.current ??= boneRests(frame.current, ALL_ANIMAL_BONES);
    const m = motion.current;
    const moving = m.speed > 0;
    const run = moving && m.running ? style.run : undefined;
    if (moving) phase.current = advancePhase(phase.current, m.speed * dt, run ? (style.runStride ?? style.stride) : style.stride);
    const target = animalPose(kind, run ? run.gait : style.gait, phase.current, moving, clock.elapsedTime, seed);
    const ease = Math.min(1, dt * (run ? 20 : 12));
    const map = style.gait === 'hop' ? HOPPER_BONES : WALKER_BONES;
    for (const [limb, bones] of Object.entries(map)) {
      const p = target.limbs[limb] ?? {};
      const c = current.current.get(limb) ?? { x: 0, y: 0, z: 0 };
      c.x += ((p.x ?? 0) - c.x) * ease;
      c.y += ((p.y ?? 0) - c.y) * ease;
      c.z += ((p.z ?? 0) - c.z) * ease;
      current.current.set(limb, c);
      for (const b of bones) {
        const rest = rests.current.get(b);
        if (rest) poseBone(rest, c.x, c.y, c.z);
      }
    }
    const b = body.current;
    b.position.y += (target.lift - b.position.y) * ease;
    b.rotation.z += (target.pitch - b.rotation.z) * ease;
    b.rotation.x += (target.roll - b.rotation.x) * ease;
  });

  return (
    <group ref={body}>
      <group ref={frame}>
        {/* the file faces +z; ours face +x */}
        <group rotation={[0, Math.PI / 2, 0]} scale={RIGGED[model].scale}>
          <primitive object={figure} />
        </group>
      </group>
    </group>
  );
}
