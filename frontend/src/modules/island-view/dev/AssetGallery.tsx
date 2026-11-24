import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import type { OrthographicCamera as OrthoCam } from 'three';
import { translate, type BoxPart } from '../assets/boxes';
import { house } from '../assets/models';
import {
  ART,
  bench,
  brickMidrise,
  bungalow,
  car,
  communityHall,
  condoTower,
  fence,
  infill,
  lampPost,
  leafyTree,
  mailbox,
  officeTower,
  person,
  semiDetached,
  spruce,
  townhouses,
  twoStoreyGarage,
} from '../assets/voxel/samples';
import { rnd, shade, vb } from '../assets/voxel/voxel';
import { BoxBatch } from '../scene/BoxBatch';

interface Item {
  label: string;
  /** World position of the model's footprint centre. */
  at: [number, number];
  parts: BoxPart[];
}

/** Camera presets: target (x, z) and zoom. */
const VIEWS = {
  All: { target: [0, 0.5], zoom: 42 },
  Houses: { target: [-3, -3.5], zoom: 120 },
  Downtown: { target: [-1.5, 3], zoom: 70 },
  'Community hall': { target: [6, -3.5], zoom: 150 },
  'Street & people': { target: [1, 5.5], zoom: 110 },
} as const;
type ViewName = keyof typeof VIEWS;

/** Moves the orbit target and zoom when a preset is chosen (keeps the viewing angle). */
function ViewRig({ view }: { view: ViewName }) {
  const get = useThree((st) => st.get);
  useEffect(() => {
    const { camera, controls } = get();
    const orbit = controls as unknown as { target: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number }; update: () => void } | null;
    if (!orbit) return;
    const cam = camera as OrthoCam;
    const v = VIEWS[view];
    const d = [cam.position.x - orbit.target.x, cam.position.y - orbit.target.y, cam.position.z - orbit.target.z];
    orbit.target.set(v.target[0], 0.5, v.target[1]);
    cam.position.set(v.target[0] + d[0], 0.5 + d[1], v.target[1] + d[2]);
    cam.zoom = v.zoom;
    cam.updateProjectionMatrix();
    orbit.update();
  }, [view, get]);
  return null;
}

/** Art Pass step 1 (M19): voxel style samples for review, at `?gallery`. Not part of the game. */
export function AssetGallery() {
  const [view, setView] = useState<ViewName>('All');
  const { ground, items } = useMemo(() => {
    const items: Item[] = [
      { label: 'Bungalow', at: [-7.5, -4.5], parts: bungalow(1) },
      { label: '2-storey + garage', at: [-5.5, -4.5], parts: twoStoreyGarage(2) },
      { label: 'Semi-detached', at: [-3.5, -4.5], parts: semiDetached(3) },
      { label: 'Townhouses', at: [-1.5, -4.5], parts: townhouses(4) },
      { label: 'Infill', at: [0.5, -4.5], parts: infill(5) },
      { label: 'Now (M1 box house)', at: [2.5, -4.5], parts: house({ assetKey: 'house', id: 'h', houseId: 'h', x: 0, z: 0, stage: 0, nickname: '', activeToday: true, colorIndex: 2, founding: false, mine: false }) },
      { label: '', at: [-7.5, -2.5], parts: bungalow(11) },
      { label: '', at: [-5.5, -2.5], parts: twoStoreyGarage(13) },
      { label: '', at: [-3.5, -2.5], parts: semiDetached(17) },
      { label: '', at: [-1.5, -2.5], parts: townhouses(19) },
      { label: '', at: [0.5, -2.5], parts: infill(22) },
      { label: 'Community hall', at: [6, -3.5], parts: communityHall(1) },
      { label: 'Office tower', at: [-6, 3], parts: officeTower(1) },
      { label: 'Condo tower', at: [-2, 3], parts: condoTower(1) },
      { label: 'Brick mid-rise', at: [2.5, 3], parts: brickMidrise(1) },
      { label: 'Trees', at: [6.5, 1.5], parts: leafyTree(3) },
      { label: '', at: [7.5, 1.5], parts: spruce(1) },
      { label: '', at: [6.5, 2.5], parts: spruce(2) },
      { label: '', at: [7.5, 2.5], parts: leafyTree(8) },
      { label: 'Street', at: [6.5, 4.5], parts: lampPost() },
      { label: '', at: [7.5, 4.5], parts: bench() },
      { label: '', at: [6.5, 5.5], parts: car(1) },
      { label: '', at: [7.5, 5.5], parts: car(2, true) },
      { label: '', at: [5.5, 5.5], parts: mailbox() },
      { label: '', at: [5.5, 4.5], parts: fence() },
      { label: 'People', at: [-7.5, 6.5], parts: person(1) },
      { label: '', at: [-6.5, 6.5], parts: person(2) },
      { label: '', at: [-5.5, 6.5], parts: person(3) },
      { label: '', at: [-4.5, 6.5], parts: person(4) },
      { label: '', at: [-3.5, 6.5], parts: person(5, ART.shirts[1]) },
    ];
    return { ground: groundParts(), items };
  }, []);

  const parts = useMemo(() => [...ground, ...items.flatMap((i) => translate(i.parts, i.at[0], i.at[1]))], [ground, items]);

  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #c9e0f7 0%, #e6f0fb 60%, #f1eefb 100%)' }}>
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-2xl bg-white/85 px-3 py-2 text-xs text-slate-700 shadow">
        <div className="font-bold">Art Pass · style samples (M19)</div>
        <div>Drag to rotate, scroll/pinch to zoom. Not in the game yet.</div>
      </div>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-wrap justify-center gap-1.5">
        {(Object.keys(VIEWS) as ViewName[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow ${v === view ? 'bg-indigo-500 text-white' : 'bg-white/90 text-slate-700'}`}
          >
            {v}
          </button>
        ))}
      </div>
      <Canvas flat shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault position={[22, 24, 22]} zoom={42} near={0.1} far={400} />
        <OrbitControls makeDefault target={[0, 0, 0.5]} enablePan minZoom={15} maxZoom={200} />
        <hemisphereLight args={['#ffffff', '#d9d2ea', 1.2]} />
        <directionalLight
          position={[-14, 30, 20]}
          intensity={2.3}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-near={1}
          shadow-camera-far={120}
        />
        <ViewRig view={view} />
        <BoxBatch parts={parts} />
        {items
          .filter((i) => i.label)
          .map((i) => (
            <Html key={i.label} position={[i.at[0], topOf(i.parts) + 0.35, i.at[1]]} center style={{ pointerEvents: 'none' }}>
              <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{i.label}</span>
            </Html>
          ))}
      </Canvas>
    </div>
  );
}

/** Height of the model's top (label position). */
const topOf = (parts: BoxPart[]) => Math.max(...parts.map((b) => b.p[1] + b.s[1] / 2));

/** A grass platform with a stone path, slight colour noise per tile, grass tufts and flowers. */
function groundParts(): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = -9; x < 9; x++) {
    for (let z = -6; z < 8; z++) {
      const path = z === 0 || z === -1 ? z === 0 : false;
      const base = path ? ART.path[(x + z) & 1] : ART.grass[(x + z) & 1];
      const c = shade(base, (rnd(x, z, 1) - 0.5) * 0.08);
      parts.push({ layer: 'solid', p: [x + 0.5, -0.25, z + 0.5], s: [1, 0.5, 1], c });
      if (path) {
        // flat stones on the path
        if (rnd(x, z, 2) < 0.7) parts.push(...translate([vb(-3, 0, -2, 1, 0.3, 2, shade(ART.concrete, 0.05))], x + 0.5, z + 0.5));
      } else if (rnd(x, z, 3) < 0.35) {
        const tx = Math.floor(rnd(x, z, 4) * 8) - 4;
        const tz = Math.floor(rnd(x, z, 5) * 8) - 4;
        const flower = rnd(x, z, 6) < 0.3;
        parts.push(...translate([vb(tx, 0, tz, tx + 0.6, flower ? 0.9 : 0.7, tz + 0.6, flower ? ART.shirts[Math.floor(rnd(x, z, 7) * 6)] : shade(base, -0.18))], x + 0.5, z + 0.5));
      }
    }
  }
  // dirt sides of the platform
  for (let x = -9; x < 9; x++) parts.push({ layer: 'solid', p: [x + 0.5, -1.25, 7.5], s: [1, 1.5, 1], c: x % 2 ? '#9b7653' : '#8d6b4b' });
  for (let z = -6; z < 8; z++) parts.push({ layer: 'solid', p: [8.5, -1.25, z + 0.5], s: [1, 1.5, 1], c: z % 2 ? '#8d6b4b' : '#9b7653' });
  return parts;
}
