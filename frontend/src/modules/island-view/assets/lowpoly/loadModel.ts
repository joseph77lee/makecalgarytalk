/**
 * Loads Polyfork models on demand (requirement.md v1.45 §19.2, §20.3: static files, only what an
 * island needs). Each file is fetched and normalised once per page; a file that fails to load
 * resolves to null so the island keeps its own box model for it.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Mesh, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LP_MODELS, lpUrl, type LpName } from './catalogue';
import { normalise, type LpModel, type SourceMesh } from './normalise';

const cache = new Map<LpName, Promise<LpModel | null>>();
/** Results of finished loads, so a remounted island draws its models at once. */
const settled = new Map<LpName, LpModel | null>();
let loader: GLTFLoader | null = null;

const isDoor = (o: Object3D) => /door/i.test(o.name) || /door/i.test(o.parent?.name ?? '');
const isGlass = (o: Object3D) => /glass|glazing|window/i.test(o.name);

/** The meshes of a loaded file, with door and glass hints from their names. */
export function sourceMeshes(scene: Object3D): SourceMesh[] {
  scene.updateMatrixWorld(true);
  const meshes: SourceMesh[] = [];
  scene.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh) meshes.push({ geometry: m.geometry, matrix: m.matrixWorld, door: isDoor(o), glass: isGlass(o) });
  });
  return meshes;
}

export function loadLpModel(name: LpName): Promise<LpModel | null> {
  let p = cache.get(name);
  if (!p) {
    loader ??= new GLTFLoader();
    const spec = LP_MODELS[name];
    p = loader
      .loadAsync(lpUrl(name))
      .then((gltf) => {
        return normalise(sourceMeshes(gltf.scene), spec.cat, spec.fit);
      })
      .then((m): LpModel | null => m)
      .catch((err: unknown) => {
        console.warn(`Polyfork model ${name} not loaded; keeping the box model`, err);
        return null;
      })
      .then((m) => {
        settled.set(name, m);
        return m;
      });
    cache.set(name, p);
  }
  return p;
}

function fromSettled(list: readonly LpName[]): Map<LpName, LpModel> | null {
  if (!list.every((n) => settled.has(n))) return null;
  const models = new Map<LpName, LpModel>();
  for (const n of list) {
    const m = settled.get(n);
    if (m) models.set(n, m);
  }
  return models;
}

/**
 * The given models once all have settled (a failed one is simply missing from the map). Null
 * while loading: callers draw their box models meanwhile. `names` should be stable (sorted, memoised).
 */
export function useLpModels(names: readonly LpName[]): Map<LpName, LpModel> | null {
  const key = names.join(',');
  // bumped when this hook's loads finish, so the settled results are read again
  const [loads, setLoads] = useState(0);
  const models = useMemo(() => (loads >= 0 ? fromSettled(key ? (key.split(',') as LpName[]) : []) : null), [key, loads]);
  useEffect(() => {
    if (models) return;
    let alive = true;
    void Promise.all((key.split(',') as LpName[]).map(loadLpModel)).then(() => alive && setLoads((n) => n + 1));
    return () => {
      alive = false;
    };
  }, [key, models]);
  return models;
}
