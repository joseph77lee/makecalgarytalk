import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { AvatarLook } from '../common';
import { PERSON_SCALE, VoxelPerson, personLookFrom } from '../island-view';

function Turning({ look, shirt }: { look: AvatarLook; shirt: string }) {
  const group = useRef<Group>(null);
  const person = useMemo(() => personLookFrom(look, shirt), [look, shirt]);
  // a slow half-turn back and forth, so the sides and back show too
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.9;
  });
  return (
    <group ref={group}>
      <VoxelPerson seed={1} shirt={shirt} look={person} />
    </group>
  );
}

/** A small turning preview of a villager look (first visit and profile, requirement.md v1.52 §10.2). */
export function AvatarPreview({ look, shirt, className = '' }: { look: AvatarLook; shirt: string; className?: string }) {
  // the figure is about 10 voxels tall at PERSON_SCALE; frame an adult with a little room
  const h = PERSON_SCALE * 0.95;
  return (
    <div className={className} data-testid="avatar-preview">
      <Canvas flat dpr={[1, 2]} orthographic camera={{ position: [3, 2.2, 5], zoom: 175, near: 0.1, far: 50 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 8, 6]} intensity={2.2} />
        <group position={[0, -h * 0.45, 0]}>
          <Turning look={look} shirt={shirt} />
        </group>
      </Canvas>
    </div>
  );
}
