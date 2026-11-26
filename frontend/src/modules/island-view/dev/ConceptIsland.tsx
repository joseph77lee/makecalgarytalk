/** Gallery: the "Concept: Mahogany" island (community-identity build map concept, 2026-11-25). */
import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { withLights, withSnow } from '../assets/environmentParts';
import { VoxelPerson, type PersonMotion } from '../assets/VoxelPerson';
import { ART } from '../assets/voxel/samples';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';
import { buildMahoganyConcept } from './conceptMahogany';

const SCENE = buildMahoganyConcept();

export function ConceptIsland({ snow, lightsOn, showLabels }: { snow: boolean; lightsOn: boolean; showLabels: boolean }) {
  const portal = useHtmlPortal();
  const still = useRef<PersonMotion>({ speed: 0 });
  const parts = useMemo(() => withLights(withSnow(SCENE.parts, snow), lightsOn), [snow, lightsOn]);
  return (
    <>
      <BoxBatch parts={parts} />
      {SCENE.people.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 1.3, 0]}>
          <VoxelPerson seed={i * 53 + 7} shirt={ART.shirts[i % ART.shirts.length]} motion={still} />
        </group>
      ))}
      {showLabels &&
        SCENE.labels.map((l) => (
          <Html key={`${l.text}@${l.at.join(',')}`} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${l.landmark ? 'bg-amber-400 text-slate-900' : 'bg-white/90 text-slate-700'}`}>{l.text}</span>
          </Html>
        ))}
    </>
  );
}
