/** Instanced drawing of low-poly placements (M23): one InstancedMesh per model and mirroring. */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedBufferAttribute, type InstancedMesh } from 'three';
import { LP_MODELS } from './catalogue';
import { useLpModels } from './loadModel';
import { MATERIALS, useLpUniforms } from './material';
import type { LpModel } from './normalise';
import { groupPlacements, placementMatrix, type LpPlacement } from './placement';

const colour = new Color();
function writePaint(target: Float32Array, i: number, hex: string | undefined): void {
  if (!hex) return; // w stays 0: keep the model's colour
  colour.set(hex);
  target.set([colour.r, colour.g, colour.b, 1], i * 4);
}

export function Instanced({ model, placements, sway, mirror }: { model: LpModel; placements: LpPlacement[]; sway: boolean; mirror: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  // one geometry per mesh (per-instance attributes live on it); memoised so the mesh is not rebuilt each render
  const geometry = useMemo(() => model.geometry.clone(), [model]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const lit = new Float32Array(placements.length);
    const roof = new Float32Array(placements.length * 4);
    const wall = new Float32Array(placements.length * 4);
    placements.forEach((p, i) => {
      mesh.setMatrixAt(i, placementMatrix(p));
      lit[i] = p.lit ?? 0;
      writePaint(roof, i, p.roof);
      writePaint(wall, i, p.wall);
    });
    mesh.instanceMatrix.needsUpdate = true;
    geometry.setAttribute('aLit', new InstancedBufferAttribute(lit, 1));
    geometry.setAttribute('aRoofColor', new InstancedBufferAttribute(roof, 4));
    geometry.setAttribute('aWallColor', new InstancedBufferAttribute(wall, 4));
    mesh.count = placements.length;
  }, [placements, geometry]);
  const mat = sway ? (mirror ? MATERIALS.swayMirror : MATERIALS.sway) : mirror ? MATERIALS.solidMirror : MATERIALS.solid;
  return <instancedMesh key={placements.length} ref={ref} args={[geometry, mat, Math.max(1, placements.length)]} castShadow receiveShadow frustumCulled={false} />;
}

/** Placements drawn as they are, outside an island (asset gallery). */
export function LowpolyMeshes({ placements, snow, lightsOn }: { placements: LpPlacement[]; snow: boolean; lightsOn: boolean }) {
  useLpUniforms(snow, lightsOn);
  const names = useMemo(() => [...new Set(placements.map((p) => p.model))].sort(), [placements]);
  const models = useLpModels(names);
  const groups = useMemo(() => groupPlacements(placements), [placements]);
  if (!models) return null;
  return (
    <>
      {[...groups].map(([key, g]) => {
        const model = models.get(g.model);
        return model ? <Instanced key={key} model={model} placements={g.list} sway={LP_MODELS[g.model].cat === 'tree'} mirror={g.mirror} /> : null;
      })}
    </>
  );
}
