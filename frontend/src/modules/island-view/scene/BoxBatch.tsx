import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import type { BoxPart, Layer } from '../assets/boxes';
import { swayCompile } from './wind';

const swayKey = () => 'island-sway';

interface Props {
  parts: BoxPart[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Opacity of the faint `mist` layer (future land; dimmed at night so it does not glow). */
  mistOpacity?: number;
}

/**
 * Draws box parts with one InstancedMesh per layer. A raw InstancedMesh is used
 * (instead of drei <Instances>) because drei re-uploads every instance matrix on
 * every frame; these boxes are static, so they are uploaded only when parts change.
 */
export function BoxBatch({ parts, castShadow = true, receiveShadow = true, mistOpacity = 0.16 }: Props) {
  const byLayer = useMemo(() => {
    const m: Record<Layer, BoxPart[]> = { solid: [], glow: [], ghost: [], mist: [], sway: [] };
    for (const p of parts) m[p.layer].push(p);
    return m;
  }, [parts]);

  return (
    <>
      {byLayer.solid.length > 0 && (
        <LayerMesh parts={byLayer.solid} castShadow={castShadow} receiveShadow={receiveShadow}>
          <meshStandardMaterial roughness={0.95} metalness={0} />
        </LayerMesh>
      )}
      {byLayer.sway.length > 0 && (
        <LayerMesh parts={byLayer.sway} castShadow={castShadow} receiveShadow={receiveShadow}>
          <meshStandardMaterial roughness={0.95} metalness={0} onBeforeCompile={swayCompile} customProgramCacheKey={swayKey} />
        </LayerMesh>
      )}
      {byLayer.glow.length > 0 && (
        <LayerMesh parts={byLayer.glow} castShadow={false} receiveShadow={false}>
          <meshBasicMaterial toneMapped={false} />
        </LayerMesh>
      )}
      {byLayer.mist.length > 0 && (
        <LayerMesh parts={byLayer.mist} castShadow={false} receiveShadow={false}>
          <meshBasicMaterial transparent opacity={mistOpacity} depthWrite={false} toneMapped={false} />
        </LayerMesh>
      )}
      {byLayer.ghost.length > 0 && (
        <LayerMesh parts={byLayer.ghost} castShadow={false} receiveShadow={false}>
          <meshStandardMaterial transparent opacity={0.4} depthWrite={false} roughness={1} />
        </LayerMesh>
      )}
    </>
  );
}

const m4 = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const pos = new Vector3();
const scl = new Vector3();
const col = new Color();

function LayerMesh({
  parts,
  castShadow,
  receiveShadow,
  children,
}: {
  parts: BoxPart[];
  castShadow: boolean;
  receiveShadow: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<InstancedMesh>(null);
  // Capacity grows in powers of two so the mesh is rebuilt rarely.
  const capacity = 2 ** Math.ceil(Math.log2(Math.max(16, parts.length)));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const hadColors = mesh.instanceColor !== null;
    parts.forEach((b, i) => {
      e.set(b.r?.[0] ?? 0, b.r?.[1] ?? 0, b.r?.[2] ?? 0);
      q.setFromEuler(e);
      m4.compose(pos.set(...b.p), q, scl.set(...b.s));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(b.c));
    });
    mesh.count = parts.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (!hadColors) {
      // The shader must be recompiled once instance colours exist.
      const mat = mesh.material as { needsUpdate: boolean };
      mat.needsUpdate = true;
    }
  }, [parts, capacity]);

  return (
    <instancedMesh
      key={capacity}
      ref={ref}
      args={[undefined, undefined, capacity]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    >
      <boxGeometry />
      {children}
    </instancedMesh>
  );
}
