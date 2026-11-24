import { useMemo, type Ref } from 'react';
import type { Group } from 'three';
import { BoxBatch } from '../scene/BoxBatch';
import { PERSON_NECK, personSplit } from './voxel/samples';

/** Avatar and mini villagers share this size (Art Pass, operator request 2026-11-24): about 0.6 tile tall. */
export const PERSON_SCALE = 0.72;

/**
 * A voxel person (the avatar and the mini villagers use the same figure): `seed` picks hair and
 * skin, `shirt` the shirt colour; `headRef` lets the caller tilt the head (sleepy villagers).
 */
export function VoxelPerson({ seed, shirt, headRef }: { seed: number; shirt: string; headRef?: Ref<Group> }) {
  const { body, head } = useMemo(() => personSplit(seed, shirt), [seed, shirt]);
  return (
    <group scale={PERSON_SCALE}>
      <BoxBatch parts={body} receiveShadow={false} />
      <group ref={headRef} position={[0, PERSON_NECK / 12, 0]}>
        <BoxBatch parts={head} receiveShadow={false} />
      </group>
    </group>
  );
}
