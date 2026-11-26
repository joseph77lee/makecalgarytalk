/**
 * Gallery: the place library (community-identity build map, 2026-11-26). One row per persona, its
 * track steps left to right (the last one is the pattern landmark), each on a grass plate.
 */
import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { withLights, withSnow } from '../assets/environmentParts';
import { PLACE_SCENE as SCENE } from './placeLayout';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';

export function PlaceGallery({ snow, lightsOn, showLabels }: { snow: boolean; lightsOn: boolean; showLabels: boolean }) {
  const portal = useHtmlPortal();
  const parts = useMemo(() => withLights(withSnow(SCENE.parts, snow), lightsOn), [snow, lightsOn]);
  return (
    <>
      <BoxBatch parts={parts} />
      {showLabels &&
        SCENE.labels.map((l) => (
          <Html key={`${l.text}@${l.at.join(',')}`} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${l.landmark ? 'bg-amber-400 text-slate-900' : 'bg-white/90 text-slate-700'}`}>{l.text}</span>
          </Html>
        ))}
    </>
  );
}
