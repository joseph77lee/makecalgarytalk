/**
 * Asset gallery: buildings of the tree and signature features as they stand on the island in M23
 * (Polyfork structure on our box-part surroundings), every design of each, facing the camera.
 */
import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { buildingPieces, featurePieces, placePieces } from '../assets/lowpoly/buildingModels';
import { LowpolyMeshes } from '../assets/lowpoly/LowpolyMeshes';
import type { LpPlacement } from '../assets/lowpoly/placement';
import { translate, type BoxPart } from '../assets/boxes';
import { withLights, withSnow } from '../assets/environmentParts';
import { buildingSurroundings, featureSurroundings } from '../assets/models';
import type { BuildingObject, ObjectOf } from '../layout';
import { MOOD_PALETTES } from '../mood';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';

const LOTS_ORIGIN: [number, number] = [70, 0];
const BUILDINGS: [string, number, number][] = [
  ['gateway-arch', 1, 1],
  ['fire-pit', 3, 3],
  ['warming-hut', 3, 3],
  ['community-hall', 3, 3],
  ['playground', 2, 2],
  ['community-garden', 2, 2],
  ['neighbourhood-park', 3, 3],
];
const DESIGNS = 4;

export function LowpolyLots({ snow, lightsOn }: { snow: boolean; lightsOn: boolean }) {
  const portal = useHtmlPortal();
  const { placements, parts, labels } = useMemo(() => {
    const ctx = { palette: MOOD_PALETTES.lively, snow };
    const placements: LpPlacement[] = [];
    const parts: BoxPart[] = [];
    const labels: { text: string; at: [number, number, number] }[] = [];
    let z = LOTS_ORIGIN[1];
    for (const [key, w, d] of BUILDINGS) {
      for (let v = 0; v < DESIGNS; v++) {
        const x = LOTS_ORIGIN[0] + v * 4;
        const item = { assetKey: `building.${key}`, id: key, buildingKey: key, x, z, stage: 0, w, d, facing: 0, variant: v, level: 1, title: key, next: null } as unknown as BuildingObject;
        placements.push(...(placePieces(buildingPieces(key, v), item) ?? []));
        parts.push(...translate(buildingSurroundings(item, ctx), x, z));
      }
      labels.push({ text: key, at: [LOTS_ORIGIN[0] - 2.5, 0.5, z] });
      z += d + 1;
    }
    for (const key of ['school', 'big-park'] as const) {
      for (let v = 0; v < DESIGNS; v++) {
        const x = LOTS_ORIGIN[0] + v * 4;
        const item = { assetKey: 'feature', id: key, featureKey: key, x, z, stage: 0, w: 2, d: 2, facing: 0, variant: v, name: null } as unknown as ObjectOf<'feature'>;
        placements.push(...(placePieces(featurePieces(key, v), item) ?? []));
        parts.push(...translate(featureSurroundings(item, ctx), x, z));
      }
      labels.push({ text: key, at: [LOTS_ORIGIN[0] - 2.5, 0.5, z] });
      z += 3;
    }
    return { placements, parts, labels };
  }, [snow]);
  const lit = useMemo(() => withLights(withSnow(parts, snow), lightsOn), [parts, snow, lightsOn]);
  return (
    <>
      <LowpolyMeshes placements={placements} snow={snow} lightsOn={lightsOn} />
      <BoxBatch parts={lit} />
      {labels.map((l) => (
        <Html key={l.text} portal={portal} position={l.at} center style={{ pointerEvents: 'none' }}>
          <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{l.text}</span>
        </Html>
      ))}
    </>
  );
}
