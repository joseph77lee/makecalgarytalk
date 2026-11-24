import { useMemo, useRef, type RefObject } from 'react';
import { RigView, type RigGroups } from './RigView';
import { ANIMAL_STYLE, advancePhase, animalPose } from './voxel/gaits';
import { animalRig, type AnimalKind } from './voxel/rigs';

/** What an animal is doing this frame: speed in tiles per second (0 = resting), running or not. */
export interface AnimalMotion {
  speed: number;
  running: boolean;
}

/**
 * A voxel animal (faces +x) whose legs, head and tail move with its own gait: deer walk and
 * sometimes bound, cougars stalk low and sometimes dash, jackrabbits hop, geese waddle. The
 * caller writes the motion every frame; resting animals graze, watch or twitch their ears.
 */
export function VoxelAnimal({ kind, motion, seed = 0 }: { kind: AnimalKind; motion: RefObject<AnimalMotion>; seed?: number }) {
  const rig = useMemo(() => animalRig(kind), [kind]);
  const style = ANIMAL_STYLE[kind];
  const phase = useRef(seed % 5);

  const pose = ({ body, limbs }: RigGroups, time: number, dt: number) => {
    const m = motion.current;
    const moving = m.speed > 0;
    const run = moving && m.running ? style.run : undefined;
    if (moving) phase.current = advancePhase(phase.current, m.speed * dt, run ? style.runStride ?? style.stride : style.stride);
    const target = animalPose(kind, run ? run.gait : style.gait, phase.current, moving, time, seed);
    const ease = Math.min(1, dt * (run ? 20 : 12));
    for (const [name, g] of Object.entries(limbs)) {
      if (!g) continue;
      const p = target.limbs[name] ?? {};
      g.rotation.x += ((p.x ?? 0) - g.rotation.x) * ease;
      g.rotation.y += ((p.y ?? 0) - g.rotation.y) * ease;
      g.rotation.z += ((p.z ?? 0) - g.rotation.z) * ease;
    }
    if (body) {
      body.position.y += (target.lift - body.position.y) * ease;
      body.rotation.z += (target.pitch - body.rotation.z) * ease;
      body.rotation.x += (target.roll - body.rotation.x) * ease;
    }
  };

  return <RigView rig={rig} onFrame={pose} />;
}
