/**
 * Dev tool (`?pictures`, `npm run dev` only): prints the build map's static pictures
 * (requirement.md v1.48 §7.6a) so the screen never renders live 3D: one small picture per build
 * map step → public/places/<key>.png (no finished-island pictures since v1.53). The dev server
 * saves them (vite.config.ts `savePictures`). Rerun after a model change.
 */
import { useState } from 'react';
import { AmbientLight, BoxGeometry, Color, DirectionalLight, Euler, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera, Quaternion, Scene, Vector3, WebGLRenderer } from 'three';
import type { BoxPart } from '../assets/boxes';
import { building } from '../assets/models';
import { PERSONA_DESIGNS } from '../assets/voxel/buildings';
import type { BuildingObject } from '../layout';
import { scenePalette } from '../mood';
import { BUILD_STEPS } from '../plan/buildingTree';

const PICTURE = 192;
/** Places with a design per persona (and so a picture per persona). */
const PERSONA_PLACES = ['community-hall', 'neighbourhood-park'];

/** Box parts of a step's model on a small grass plate, front towards the camera. */
function stepParts(key: string, tiles: [number, number], persona: string | null = null): BoxPart[] {
  const [w, d] = tiles[0] === 0 ? [2, 2] : tiles;
  const item = { assetKey: `building.${key}`, id: key, x: 0, z: 0, stage: 0, w, d, facing: 0, variant: 0, persona, buildingKey: key, title: key, level: 1 } as BuildingObject;
  const parts = building(item, { snow: false, palette: scenePalette(false) });
  return [
    { layer: 'solid', p: [0, -0.15, 0], s: [w + 0.4, 0.3, d + 0.4], c: '#9fd47a' },
    { layer: 'solid', p: [0, -0.45, 0], s: [w + 0.4, 0.3, d + 0.4], c: '#c49a6c' },
    ...parts.map((b) => (b.layer === 'sway' ? { ...b, layer: 'solid' as const } : b.layer === 'mist' ? null : b)).filter((b): b is BoxPart => b !== null),
  ];
}

/** Renders box parts to a transparent square PNG (isometric view, fitted to the model). */
function renderParts(renderer: WebGLRenderer, parts: BoxPart[]): string {
  const scene = new Scene();
  scene.add(new AmbientLight('#ffffff', 1.6));
  const sun = new DirectionalLight('#fff4e0', 2.2);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  const geo = new BoxGeometry();
  const mats = { solid: new MeshStandardMaterial({ roughness: 0.95 }), glow: new MeshBasicMaterial({ toneMapped: false }), ghost: new MeshStandardMaterial({ transparent: true, opacity: 0.4 }) };
  const m4 = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const col = new Color();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const layer of ['solid', 'glow', 'ghost'] as const) {
    const list = parts.filter((b) => b.layer === layer);
    if (list.length === 0) continue;
    const mesh = new InstancedMesh(geo, mats[layer], list.length);
    list.forEach((b, i) => {
      e.set(b.r?.[0] ?? 0, b.r?.[1] ?? 0, b.r?.[2] ?? 0);
      q.setFromEuler(e);
      m4.compose(new Vector3(...b.p), q, new Vector3(...b.s));
      mesh.setMatrixAt(i, m4);
      mesh.setColorAt(i, col.set(b.c));
      for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) {
        const v = new Vector3(sx, sy, sz).applyMatrix4(m4);
        min.min(v);
        max.max(v);
      }
    });
    scene.add(mesh);
  }
  // isometric view from the front-right, fitted to the model's bounding box
  const centre = min.clone().add(max).multiplyScalar(0.5);
  const radius = max.clone().sub(min).length() / 2;
  const cam = new OrthographicCamera(-radius, radius, radius, -radius, 0.1, 200);
  cam.position.copy(centre).add(new Vector3(1, 0.9, 1.25).setLength(50));
  cam.lookAt(centre);
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL('image/png');
  geo.dispose();
  Object.values(mats).forEach((m) => m.dispose());
  return url;
}

async function save(path: string, dataUrl: string): Promise<void> {
  const res = await fetch('/__dev/save-picture', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path, dataUrl }) });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
}

export function PicturePrinter() {
  const [log, setLog] = useState<string[]>([]);
  const [thumbs, setThumbs] = useState<{ key: string; url: string }[]>([]);
  const add = (line: string) => setLog((l) => [line, ...l].slice(0, 400));

  const printPlaces = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = PICTURE;
    canvas.height = PICTURE;
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    const keys = [...new Map(BUILD_STEPS.map((s) => [s.key, s])).values()];
    const done: { key: string; url: string }[] = [];
    for (const s of keys) {
      const url = renderParts(renderer, stepParts(s.key, s.tiles));
      await save(`places/${s.key}.png`, url);
      done.push({ key: s.key, url });
      setThumbs([...done]);
    }
    // the Community hall and Neighbourhood park follow the persona (requirement v1.48 §7.6)
    for (const key of PERSONA_PLACES) {
      const tiles = BUILD_STEPS.find((s) => s.key === key)!.tiles;
      for (const persona of Object.keys(PERSONA_DESIGNS.hall)) {
        const url = renderParts(renderer, stepParts(key, tiles, persona));
        await save(`places/${key}.${persona.replaceAll('_', '-')}.png`, url);
        done.push({ key: `${key}.${persona}`, url });
        setThumbs([...done]);
      }
    }
    renderer.dispose();
    add(`saved ${done.length} place pictures`);
  };

  return (
    <main className="flex h-dvh w-full">
      <div className="w-80 shrink-0 overflow-y-auto border-r p-3 text-xs">
        <h1 className="mb-2 font-bold">Build map pictures</h1>
        <div className="mb-3 flex gap-2">
          <button type="button" id="print-places" className="rounded bg-indigo-500 px-2 py-1 text-white" onClick={() => void printPlaces().catch((e) => add(String(e)))}>
            Print places
          </button>
        </div>
        <ul id="picture-log">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-3 gap-1">
          {thumbs.map((t) => (
            <img key={t.key} src={t.url} alt={t.key} title={t.key} className="h-20 w-20 bg-sky-50" />
          ))}
        </div>
      </div>
    </main>
  );
}
