/**
 * Asset gallery: the new voxel designs (M23 rework, operator decision 2026-11-25: stay voxel and
 * take shapes from Polyfork as reference). Layout in `designLayout.ts`; this draws it under the
 * gallery's sun, shadows and weather, plus the varied voxel people. Labels show only for the
 * section being viewed.
 */
import { Html } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { withLights, withSnow } from '../assets/environmentParts';
import { LowpolyMeshes } from '../assets/lowpoly/LowpolyMeshes';
import { VoxelPerson, type PersonMotion } from '../assets/VoxelPerson';
import { ART } from '../assets/voxel/samples';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';
import { DESIGN_SCENE } from './designSections';
import { PEOPLE_COLS, PEOPLE_ROWS } from './designLayout';
import type { DesignSection } from './designSections';

/** Varied voxel people: every seed has its own age, skin, hair and clothes; half of them walk. */
function People({ showLabels }: { showLabels: boolean }) {
  const portal = useHtmlPortal();
  const still = useRef<PersonMotion>({ speed: 0 });
  const walk = useRef<PersonMotion>({ speed: 0.5 });
  const s = DESIGN_SCENE.plates['New people'];
  const seeds = Array.from({ length: PEOPLE_COLS * PEOPLE_ROWS }, (_, i) => i * 37 + 5);
  return (
    <>
      {seeds.map((seed, i) => (
        <group key={seed} position={[s.x0 + 1.5 + (i % PEOPLE_COLS), 0, s.z0 + 1.2 + Math.floor(i / PEOPLE_COLS) * 2.2]}>
          <VoxelPerson seed={seed} shirt={ART.shirts[i % ART.shirts.length]} motion={i % 2 ? walk : still} />
        </group>
      ))}
      {showLabels && (
        <Html portal={portal} position={[s.x0 + s.w / 2, 1.2, s.z0 + 0.6]} center style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">36 villagers: ages, skin tones, hair, clothes (odd ones walk)</span>
        </Html>
      )}
    </>
  );
}

export function DesignGallery({ snow, lightsOn, section }: { snow: boolean; lightsOn: boolean; section: DesignSection | null }) {
  const portal = useHtmlPortal();
  const scene = DESIGN_SCENE;
  const parts = useMemo(() => withLights(withSnow(scene.parts, snow), lightsOn), [scene, snow, lightsOn]);
  return (
    <>
      <BoxBatch parts={parts} />
      <LowpolyMeshes placements={scene.placements} snow={snow} lightsOn={lightsOn} />
      <People showLabels={section === 'New people'} />
      {scene.labels
        .filter((l) => l.section === section)
        .map((l) => (
          <Html key={`${l.text}@${l.at.join(',')}`} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${l.ref ? 'bg-slate-600/70 text-white' : 'bg-indigo-500 text-white'}`}>{l.text}</span>
          </Html>
        ))}
    </>
  );
}
