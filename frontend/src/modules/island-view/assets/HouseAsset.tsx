import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Vector3, Quaternion } from 'three';
import type { ObjectOf } from '../layout';
import type { ItemsProps } from './BoxAsset';
import { boxAsset } from './BoxAsset';
import { CHIMNEY_TOP, house } from './models';

const HouseBoxes = boxAsset<ObjectOf<'house'>>(house);
const PUFFS_PER_HOUSE = 3;

/** Resident houses; active-today houses also puff chimney smoke (requirement.md §7.2). */
export function HouseAsset({ items }: ItemsProps<ObjectOf<'house'>>) {
  const chimneys = useMemo(
    () => items.filter((h) => h.activeToday).map((h) => [h.x + CHIMNEY_TOP[0], CHIMNEY_TOP[1], h.z + CHIMNEY_TOP[2]] as const),
    [items],
  );
  return (
    <>
      <HouseBoxes items={items} />
      {chimneys.length > 0 && <ChimneySmoke chimneys={chimneys} />}
    </>
  );
}

const m4 = new Matrix4();
const v = new Vector3();
const s = new Vector3();
const q = new Quaternion();

function ChimneySmoke({ chimneys }: { chimneys: (readonly [number, number, number])[] }) {
  const ref = useRef<InstancedMesh>(null);
  const count = chimneys.length * PUFFS_PER_HOUSE;

  useLayoutEffect(() => {
    if (ref.current) ref.current.count = count;
  }, [count]);

  // Per-frame animation via refs only (no React state).
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    chimneys.forEach(([x, y, z], h) => {
      for (let k = 0; k < PUFFS_PER_HOUSE; k++) {
        const phase = (t * 0.35 + k / PUFFS_PER_HOUSE + h * 0.137) % 1;
        const size = Math.sin(phase * Math.PI) * 0.15;
        v.set(x + Math.sin(phase * 4 + h) * 0.05 + phase * 0.12, y + phase * 0.75, z);
        m4.compose(v, q, s.set(size, size, size));
        mesh.setMatrixAt(h * PUFFS_PER_HOUSE + k, m4);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#f3f4f6" transparent opacity={0.85} roughness={1} />
    </instancedMesh>
  );
}
