import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { BoxBatch } from '../scene/BoxBatch';
import type { Rig } from './voxel/rigs';

/** The groups of a drawn rig, for turning parts every frame (through refs, never React state). */
export interface RigGroups {
  body: Group | null;
  limbs: Record<string, Group | null>;
}

/**
 * Draws a rig (the body and each part in its own group placed at the part's joint) and calls
 * `onFrame` every frame with those groups so the caller can pose them.
 */
export function RigView({ rig, onFrame, castShadow = true }: { rig: Rig; onFrame: (groups: RigGroups, time: number, dt: number) => void; castShadow?: boolean }) {
  const groups = useRef<RigGroups>({ body: null, limbs: {} });
  useFrame(({ clock }, rawDt) => onFrame(groups.current, clock.elapsedTime, Math.min(rawDt, 0.1)));
  return (
    <group
      ref={(g) => {
        groups.current.body = g;
      }}
    >
      <BoxBatch parts={rig.body} castShadow={castShadow} receiveShadow={false} />
      {Object.entries(rig.limbs).map(([name, limb]) =>
        limb.parts.length === 0 ? null : (
          <group
            key={name}
            ref={(g) => {
              groups.current.limbs[name] = g;
            }}
            position={limb.pivot}
          >
            <BoxBatch parts={limb.parts} castShadow={castShadow} receiveShadow={false} />
          </group>
        ),
      )}
    </group>
  );
}
