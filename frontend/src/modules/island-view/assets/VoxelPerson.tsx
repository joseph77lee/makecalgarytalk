import { useMemo, useRef, type RefObject } from 'react';
import { RigView, type RigGroups } from './RigView';
import { advancePhase, personPose, personStride, type PersonMotion } from './voxel/gaits';
import { personRig } from './voxel/rigs';

export type { PersonMotion } from './voxel/gaits';

/** Avatar and mini villagers share this size (Art Pass, operator request 2026-11-24): about 0.6 tile tall. */
export const PERSON_SCALE = 0.72;

const IDLE: PersonMotion = { speed: 0 };

/**
 * A voxel person (the avatar and the mini villagers use the same figure): `seed` picks hair and
 * skin, `shirt` the shirt colour. The caller writes what the person is doing into `motion`
 * every frame (walking speed, sitting, cheering, hammering) and the arms and legs follow; the
 * caller may also tilt the head through `headTilt` (sleepy villagers look down).
 */
export function VoxelPerson({ seed, shirt, motion, headTilt }: { seed: number; shirt: string; motion?: RefObject<PersonMotion>; headTilt?: RefObject<number> }) {
  const rig = useMemo(() => personRig(seed, shirt), [seed, shirt]);
  const phase = useRef(seed % 7);

  const pose = ({ limbs }: RigGroups, time: number, dt: number) => {
    const m = motion?.current ?? IDLE;
    if (m.speed > 0) phase.current = advancePhase(phase.current, m.speed * dt, personStride(m.speed));
    const target = personPose(phase.current, m, time);
    // eased, so stopping or sitting down settles the limbs instead of snapping them
    const ease = Math.min(1, dt * 14);
    for (const name of ['legL', 'legR', 'armL', 'armR'] as const) {
      const g = limbs[name];
      if (g) g.rotation.x += (target[name] - g.rotation.x) * ease;
    }
    if (limbs.head) limbs.head.rotation.x = headTilt?.current ?? 0;
  };

  return (
    <group scale={PERSON_SCALE}>
      <RigView rig={rig} onFrame={pose} />
    </group>
  );
}
