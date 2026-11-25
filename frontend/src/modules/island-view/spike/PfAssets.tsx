/**
 * SPIKE (spike/polyfork, not for main): houses, trees and cars drawn with Polyfork models,
 * switched by `?pf=voxel` (option A: voxelised into our box style) or `?pf=lowpoly` (option B:
 * pastel low-poly meshes with shader snow, lit windows and swaying crowns). Weather and time come
 * from the island like every other model.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, InstancedBufferAttribute, Matrix4, MeshStandardMaterial, type InstancedMesh, type WebGLProgramParametersWithUniforms } from 'three';
import { translate, type BoxPart } from '../assets/boxes';
import type { ItemsProps } from '../assets/BoxAsset';
import { withLights, withSnow } from '../assets/environmentParts';
import { house, prop, tree } from '../assets/models';
import { rnd, shade, vturn } from '../assets/voxel/voxel';
import { ART } from '../assets/voxel/samples';
import type { HouseType } from '../assets/voxel/houses';
import type { ObjectOf, PlacedObject } from '../layout';
import { BoxBatch } from '../scene/BoxBatch';
import { useIslandCtx } from '../scene/islandContext';
import { swayCompile } from '../scene/wind';
import { loadPfModel, PF_MODELS, ROOF_MARK, ROOF_MARK_2, voxelize, WALL_MARK, type PfModel, type PfName } from './pfModels';

export type PfMode = 'off' | 'voxel' | 'lowpoly';

export const PF_MODE: PfMode = (() => {
  if (typeof window === 'undefined') return 'off';
  const v = new URLSearchParams(window.location.search).get('pf');
  return v === 'voxel' || v === 'lowpoly' ? v : 'off';
})();

// Our house types → Polyfork houses (downtown apartments and lofts stay ours: no match).
const HOUSES: Record<HouseType, PfName[] | null> = {
  bungalow: ['cottage', 'ranch'],
  twoStoreyGarage: ['twoStorey', 'splitLevel'],
  semiDetached: ['splitLevel', 'cottage'],
  townhouses: ['townhouse'],
  infill: ['twoStorey', 'townhouse'],
  apartment: null,
  loft: null,
};
const TREES: PfName[] = ['shadeTree', 'ornamentalTree', 'evergreen'];
const CARS: PfName[] = ['suv', 'minivan', 'pickup'];
const ALL = Object.keys(PF_MODELS) as PfName[];

const houseModel = (item: ObjectOf<'house'>): PfName | null => {
  const options = HOUSES[item.houseType];
  return options ? options[item.colorIndex % options.length] : null;
};
const treeModel = (item: ObjectOf<'tree'>): PfName => TREES[item.variant % TREES.length];
const carModel = (item: ObjectOf<'prop'>): PfName => CARS[item.seed % CARS.length];

/** All Polyfork models, once loaded (null while loading: the island keeps its own models meanwhile). */
function usePfModels(): Map<PfName, PfModel> | null {
  const [models, setModels] = useState<Map<PfName, PfModel> | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.all(ALL.map(async (n) => [n, await loadPfModel(n)] as const)).then((pairs) => alive && setModels(new Map(pairs)));
    return () => {
      alive = false;
    };
  }, []);
  return models;
}

// --- Option A: voxelised ---------------------------------------------------------------------

const voxCache = new Map<string, BoxPart[]>();
function voxels(name: PfName, model: PfModel): BoxPart[] {
  const cat = PF_MODELS[name].cat;
  const perTile = cat === 'car' ? 24 : 12;
  const key = `${name}@${perTile}`;
  let parts = voxCache.get(key);
  if (!parts) {
    parts = voxelize(model, perTile, cat);
    voxCache.set(key, parts);
  }
  return parts;
}

/** Windows like our houses: active residents glow, about half of the village houses light at night. */
function houseWindows(parts: BoxPart[], item: ObjectOf<'house'>): BoxPart[] {
  const nightTag = item.village && rnd(item.colorIndex, 91) < 0.5 ? 'village-window' : 'house-window';
  const { roof, wall } = houseColours(item.colorIndex);
  return parts.map((b) => {
    if (b.c === ROOF_MARK) return { ...b, c: roof, tag: b.tag ?? 'roof' };
    if (b.c === ROOF_MARK_2) return { ...b, c: shade(roof, -0.08), tag: b.tag ?? 'roof' };
    if (b.c === WALL_MARK) return { ...b, c: wall };
    if (b.c !== '#6aa8cf') return b;
    return item.activeToday ? { ...b, layer: 'glow', c: '#ffd98a' } : { ...b, tag: nightTag };
  });
}

/** Our pastel roof and wall for this house (same picks for options A and B). */
function houseColours(seed: number): { roof: string; wall: string } {
  return { roof: ART.roofs[Math.floor(rnd(seed, 2) * ART.roofs.length)], wall: ART.walls[Math.floor(rnd(seed, 1) * ART.walls.length)] };
}

function VoxelLayer({ items, kind }: { items: PlacedObject[]; kind: 'house' | 'tree' | 'prop' }) {
  const { palette, snow, lightsOn } = useIslandCtx();
  const models = usePfModels();
  const parts = useMemo(() => {
    const ctx = { palette, snow };
    const all = items.flatMap((o): BoxPart[] => {
      if (kind === 'house' && o.assetKey === 'house') {
        const name = houseModel(o);
        const m = name && models?.get(name);
        if (!name || !m) return translate(house(o), o.x, o.z);
        return translate(vturn(houseWindows(voxels(name, m), o), o.facing), o.x, o.z);
      }
      if (kind === 'tree' && o.assetKey === 'tree') {
        const m = models?.get(treeModel(o));
        if (!m) return translate(tree(o, ctx), o.x, o.z);
        return translate(vturn(voxels(treeModel(o), m), o.variant), o.x, o.z);
      }
      if (kind === 'prop' && o.assetKey === 'prop') {
        const m = o.kind === 'car' ? models?.get(carModel(o)) : undefined;
        if (!m) return translate(prop(o), o.x, o.z);
        return translate(vturn(voxels(carModel(o), m), o.facing), o.x, o.z);
      }
      return [];
    });
    return withLights(withSnow(all, snow), lightsOn);
  }, [items, kind, models, palette, snow, lightsOn]);
  return <BoxBatch parts={parts} />;
}

// --- Option B: pastel low-poly meshes ------------------------------------------------------------

/** Shared by every option-B material, written from the island context. */
const PF_UNIFORMS = { uSnow: { value: 0 }, uLights: { value: 0 } };

function pfCompile(sway: boolean) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    if (sway) swayCompile(shader);
    Object.assign(shader.uniforms, PF_UNIFORMS);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlass;\nattribute float aLit;\nattribute float aRoof;\nattribute float aWall;\nattribute vec3 aRoofColor;\nattribute vec3 aWallColor;\nvarying float vGlass;\nvarying float vLit;\nvarying float vUp;\nvarying vec3 vPaint;\nvarying float vPainted;')
      .replace(
        '#include <defaultnormal_vertex>',
        '#include <defaultnormal_vertex>\n  vUp = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal).y;\n  vGlass = aGlass;\n  vLit = aLit;\n  vPainted = max(aRoof, aWall);\n  vPaint = aRoof > 0.5 ? aRoofColor : aWallColor;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSnow;\nuniform float uLights;\nvarying float vGlass;\nvarying float vLit;\nvarying float vUp;\nvarying vec3 vPaint;\nvarying float vPainted;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
  // each house wears its own pastel roof and wall
  diffuseColor.rgb = mix(diffuseColor.rgb, vPaint, step(0.5, vPainted));
  // snow settles on faces that look up; windows: 2 = lit (active resident), 1 = lit at night
  float snowK = uSnow * smoothstep(0.45, 0.8, vUp) * (1.0 - vGlass);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.97), snowK);
  float litK = vGlass * (step(1.5, vLit) + step(0.5, vLit) * (1.0 - step(1.5, vLit)) * uLights);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.72, 0.32), litK);`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.7, 0.3) * litK * 0.9;');
  };
}

const materials = {
  solid: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }),
  sway: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }),
};
materials.solid.onBeforeCompile = pfCompile(false);
materials.solid.customProgramCacheKey = () => 'pf-solid';
materials.sway.onBeforeCompile = pfCompile(true);
materials.sway.customProgramCacheKey = () => 'pf-sway';

interface Placement {
  name: PfName;
  matrix: Matrix4;
  lit: number;
  /** House colour seed (roof and wall), null for trees and cars. */
  colours: number | null;
}

function Instanced({ model, placements, sway }: { model: PfModel; placements: Placement[]; sway: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  // one geometry per mesh: a new one on every render would rebuild the mesh with all instances at the origin
  const geometry = useMemo(() => model.geometry.clone(), [model]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    placements.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute('aLit', new InstancedBufferAttribute(new Float32Array(placements.map((p) => p.lit)), 1));
    const roof = new Float32Array(placements.length * 3);
    const wall = new Float32Array(placements.length * 3);
    const c = new Color();
    placements.forEach((p, i) => {
      const hc = p.colours === null ? null : houseColours(p.colours);
      c.set(hc?.roof ?? '#ffffff').toArray(roof, i * 3);
      c.set(hc?.wall ?? '#ffffff').toArray(wall, i * 3);
    });
    mesh.geometry.setAttribute('aRoofColor', new InstancedBufferAttribute(roof, 3));
    mesh.geometry.setAttribute('aWallColor', new InstancedBufferAttribute(wall, 3));
    mesh.count = placements.length;
  }, [placements, geometry]);
  return (
    <instancedMesh
      key={placements.length}
      ref={ref}
      args={[geometry, sway ? materials.sway : materials.solid, Math.max(1, placements.length)]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
}

function LowpolyLayer({ items, kind }: { items: PlacedObject[]; kind: 'house' | 'tree' | 'prop' }) {
  const { palette, snow, lightsOn } = useIslandCtx();
  const models = usePfModels();
  useEffect(() => {
    PF_UNIFORMS.uSnow.value = snow ? 1 : 0;
    PF_UNIFORMS.uLights.value = lightsOn ? 1 : 0;
  }, [snow, lightsOn]);
  const { placements, rest } = useMemo(() => {
    const placements: Placement[] = [];
    const rest: BoxPart[] = [];
    const place = (name: PfName, o: PlacedObject, turns: number, lit: number, colours: number | null = null) =>
      placements.push({ name, lit, colours, matrix: new Matrix4().makeTranslation(o.x, 0, o.z).multiply(new Matrix4().makeRotationY((turns * Math.PI) / 2)) });
    for (const o of items) {
      if (o.assetKey === 'house') {
        const name = houseModel(o);
        if (name && models?.has(name)) place(name, o, o.facing, o.activeToday ? 2 : o.village && rnd(o.colorIndex, 91) < 0.5 ? 1 : 0, o.colorIndex);
        else rest.push(...translate(house(o), o.x, o.z));
      } else if (o.assetKey === 'tree') {
        if (models?.has(treeModel(o))) place(treeModel(o), o, o.variant, 0);
        else rest.push(...translate(tree(o, { palette, snow }), o.x, o.z));
      } else if (o.assetKey === 'prop') {
        if (o.kind === 'car' && models?.has(carModel(o))) place(carModel(o), o, o.facing, 0);
        else rest.push(...translate(prop(o), o.x, o.z));
      }
    }
    return { placements, rest: withLights(withSnow(rest, snow), lightsOn) };
  }, [items, models, palette, snow, lightsOn]);
  const byModel = useMemo(() => {
    const m = new Map<PfName, Placement[]>();
    for (const p of placements) m.set(p.name, [...(m.get(p.name) ?? []), p]);
    return m;
  }, [placements]);
  return (
    <>
      {[...byModel].map(([name, ps]) => (
        <Instanced key={name} model={models!.get(name)!} placements={ps} sway={kind === 'tree'} />
      ))}
      {rest.length > 0 && <BoxBatch parts={rest} />}
    </>
  );
}

// --- Hook into the island ------------------------------------------------------------------------

const voxelAssets = {
  house: (p: ItemsProps<PlacedObject>) => <VoxelLayer items={p.items} kind="house" />,
  tree: (p: ItemsProps<PlacedObject>) => <VoxelLayer items={p.items} kind="tree" />,
  prop: (p: ItemsProps<PlacedObject>) => <VoxelLayer items={p.items} kind="prop" />,
};
const lowpolyAssets = {
  house: (p: ItemsProps<PlacedObject>) => <LowpolyLayer items={p.items} kind="house" />,
  tree: (p: ItemsProps<PlacedObject>) => <LowpolyLayer items={p.items} kind="tree" />,
  prop: (p: ItemsProps<PlacedObject>) => <LowpolyLayer items={p.items} kind="prop" />,
};

/** The spike's replacement for an asset key, or null to use the game's own model. */
export function pfAssetFor(key: string): ComponentType<ItemsProps<PlacedObject>> | null {
  if (PF_MODE === 'off' || (key !== 'house' && key !== 'tree' && key !== 'prop')) return null;
  return (PF_MODE === 'voxel' ? voxelAssets : lowpolyAssets)[key];
}

/** Floating switch between the three looks (reloads with ?pf=…). */
export function PfSwitch() {
  const go = (mode: PfMode) => {
    const u = new URL(window.location.href);
    if (mode === 'off') u.searchParams.delete('pf');
    else u.searchParams.set('pf', mode);
    window.location.href = u.toString();
  };
  const label: Record<PfMode, string> = { off: 'Now (our voxels)', voxel: 'A · Polyfork → voxels', lowpoly: 'B · Polyfork low-poly' };
  // frames per second and triangles, refreshed every second (for checking on a real phone)
  const meter = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frames = 0;
    let start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames++;
      if (t - start >= 1000) {
        const info = (window as unknown as { __pfInfo?: { render: { triangles: number } } }).__pfInfo;
        if (meter.current) meter.current.textContent = `${Math.round((frames * 1000) / (t - start))} fps · ${info ? Math.round(info.render.triangles / 1000) : '?'}k triangles`;
        frames = 0;
        start = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="absolute bottom-56 right-3 z-30 flex flex-col gap-1 rounded-2xl bg-white/90 p-1.5 text-xs shadow">
      <div className="px-1 font-bold text-slate-600">Spike: houses, trees, cars</div>
      <div ref={meter} className="px-1 font-mono text-[11px] text-emerald-700">…</div>
      {(['off', 'voxel', 'lowpoly'] as PfMode[]).map((m) => (
        <button key={m} type="button" onClick={() => go(m)} className={`rounded-full px-2.5 py-1 text-left font-semibold ${m === PF_MODE ? 'bg-indigo-500 text-white' : 'text-slate-700'}`}>
          {label[m]}
        </button>
      ))}
    </div>
  );
}

/** SPIKE: exposes the renderer's counters for measuring (dev builds only). */
export function PfStats() {
  const gl = useThree((st) => st.gl);
  useEffect(() => {
    (window as unknown as { __pfInfo?: unknown }).__pfInfo = gl.info;
  }, [gl]);
  return null;
}
