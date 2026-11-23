import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { box, translate, type BoxPart } from '../assets/boxes';
import type { IslandLayout } from '../layout';
import { bloomTiles } from './bloomTiles';
import { BoxBatch } from './BoxBatch';
import { useSceneFx } from './islandContext';

const GROW_S = 0.9;
const PETALS = ['#ff9ec7', '#ffd166', '#ffffff', '#c9a7ff', '#ff8fa3'];
const SPOTS: [number, number][] = [[-0.25, -0.2], [0.22, -0.26], [0.02, 0.08], [-0.2, 0.28], [0.28, 0.24]];

/** A big, bright flower patch (bigger than the everyday Lively flowers so the moment reads on a phone). */
function bloomPatch(variant: number): BoxPart[] {
  return SPOTS.flatMap(([x, z], i) => [
    box('solid', x, 0, z, 0.05, 0.2, 0.05, '#6fbf73'),
    box('solid', x, 0.2, z, 0.2, 0.12, 0.2, PETALS[(variant + i) % PETALS.length]!),
    box('solid', x, 0.32, z, 0.08, 0.04, 0.08, '#ffe066'),
  ]);
}

/** Community Revival flowers: pop up across the island, stay a while, then fold away. */
export function BloomBurst({ layout }: { layout: IslandLayout }) {
  const bloomUntil = useSceneFx((s) => s.bloomUntil);
  // The bloom whose flowers have folded away again (0 = none yet).
  const [doneFor, setDoneFor] = useState(0);
  const active = bloomUntil > 0 && doneFor !== bloomUntil;
  const group = useRef<Group>(null);
  const k = useRef(0);
  const parts = useMemo(
    () =>
      active
        ? bloomTiles(layout).flatMap((f) => translate(bloomPatch(f.variant), f.x + 0.5, f.z + 0.5))
        : [],
    [active, layout],
  );
  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !active) return;
    const growing = performance.now() < useSceneFx.getState().bloomUntil;
    k.current = Math.max(0, Math.min(1, k.current + (growing ? dt : -dt) / GROW_S));
    const e = growing ? 1 + 2.2 * (k.current - 1) ** 3 + 1.2 * (k.current - 1) ** 2 : k.current; // overshoot when blooming
    g.scale.set(1, Math.max(0.001, e), 1);
    if (!growing && k.current === 0) setDoneFor(bloomUntil);
  });
  if (!active) return null;
  return (
    <group ref={group} scale={[1, 0.001, 1]}>
      <BoxBatch parts={parts} castShadow={false} />
    </group>
  );
}
