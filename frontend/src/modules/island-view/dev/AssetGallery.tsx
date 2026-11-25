import { Html, OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import type { OrthographicCamera as OrthoCam } from 'three';
import { translate, type BoxPart } from '../assets/boxes';
import { boxHouse, rail, track } from '../assets/models';
import { FEATURE_VOXELS, ctrainCarParts, stationPlatformParts } from '../assets/voxel/features';
import { MOOD_PALETTES } from '../mood';
import { withLights, withSnow } from '../assets/environmentParts';
import { Precipitation } from '../scene/Precipitation';
import { precipitation, skyBackground, skyLook, STARS, STARS_TILE, windVector } from '../scene/sky';
import { setWind } from '../scene/wind';
import type { IslandEnvironment } from '../types';
import { SoundBoard } from './SoundBoard';
import {
  ART,
  apartment,
  artDecoTower,
  bench,
  brickMidrise,
  bungalow,
  car,
  cloud,
  communityHall,
  condoTower,
  crescentTower,
  fence,
  flowerBed,
  hotel,
  observationTower,
  partyBalloons,
  wildFlowers,
  infill,
  lampPost,
  leafyTree,
  loft,
  mailbox,
  officeTower,
  person,
  semiDetached,
  spruce,
  townhouses,
  twoStoreyGarage,
} from '../assets/voxel/samples';
import { rnd, shade, vb, vmove, vturn } from '../assets/voxel/voxel';
import { BoxBatch } from '../scene/BoxBatch';
import { useHtmlPortal } from '../scene/htmlPortal';
import { GalleryLife } from './GalleryLife';
import { LowpolyLots } from './LowpolyLots';
import { LowpolyShowcase } from './LowpolyShowcase';

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
  Downtown: { target: [-0.5, 5.5], zoom: 48 },
  'Community hall': { target: [6, -3.5], zoom: 150 },
  'Street & people': { target: [1, 5.5], zoom: 110 },
  'Sky & wildlife': { target: [-3, -2], zoom: 24 },
  Wildlife: { target: [1.5, 6.3], zoom: 150 },
  Balloon: { target: [-9, -8], zoom: 75, y: 9 },
  Clouds: { target: [3, -0.5], zoom: 70, y: 4 },
  Features: { target: [12, -1], zoom: 85 },
  CTrain: { target: [12.5, 6.5], zoom: 120 },
  'Polyfork houses': { target: [34, 0], zoom: 110 },
  'Polyfork towers': { target: [40, 3.5], zoom: 46 },
  'Polyfork trees & cars': { target: [40, 8], zoom: 60 },
  'Polyfork props': { target: [40, 10.5], zoom: 150 },
  'Polyfork lots A': { target: [76, 5], zoom: 55 },
  'Polyfork lots B': { target: [76, 19], zoom: 55 },
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
    const ty = 'y' in v ? v.y : 0.5;
    const d = [cam.position.x - orbit.target.x, cam.position.y - orbit.target.y, cam.position.z - orbit.target.z];
    orbit.target.set(v.target[0], ty, v.target[1]);
    cam.position.set(v.target[0] + d[0], ty + d[1], v.target[1] + d[2]);
    cam.zoom = v.zoom;
    cam.updateProjectionMatrix();
    orbit.update();
  }, [view, get]);
  return null;
}

/** Times of day as sun positions; the light, sky and lamps come from the game's sky (scene/sky.ts). */
const TIMES = {
  Dawn: { azimuthDeg: 120, elevationDeg: 2 },
  Morning: { azimuthDeg: 140, elevationDeg: 12 },
  Noon: { azimuthDeg: 180, elevationDeg: 35 },
  Sunset: { azimuthDeg: 240, elevationDeg: 2 },
  Night: { azimuthDeg: 0, elevationDeg: -40 },
} as const;
type TimeName = keyof typeof TIMES;

const WEATHERS: [IslandEnvironment['weather'], string][] = [
  ['clear', '☀️'],
  ['partly_cloudy', '⛅'],
  ['overcast', '☁️'],
  ['rain', '🌧️'],
  ['snow', '❄️'],
  ['mix', '🌨️'],
  ['fog', '🌫️'],
  ['thunderstorm', '⛈️'],
];
const WINDS: IslandEnvironment['wind'][] = ['calm', 'breezy', 'windy'];

/** Wind for the swaying trees and flags, written once per frame. */
function GalleryWind({ wind }: { wind: { x: number; z: number; strength: number } }) {
  useFrame(({ clock }) => setWind(clock.elapsedTime, wind.x, wind.z, wind.strength));
  return null;
}

/** Art Pass step 1 (M19): voxel style samples for review, at `?gallery`. Not part of the game. */
export function AssetGallery() {
  const [view, setView] = useState<ViewName>('All');
  const [time, setTime] = useState<TimeName>('Noon');
  const [weather, setWeather] = useState<IslandEnvironment['weather']>('clear');
  const [windLevel, setWindLevel] = useState<IslandEnvironment['wind']>('calm');
  const [snow, setSnow] = useState(false);
  const env: IslandEnvironment = { sun: TIMES[time], weather, wind: windLevel, windFromDeg: 270, snowCover: snow };
  const look = skyLook(env);
  const wind = windVector(env);
  const precip = precipitation(weather, false);
  const [dx, dy, dz] = look.lightDir;
  const { ground, items } = useMemo(() => {
    const items: Item[] = [
      { label: 'Bungalow', at: [-7.5, -4.5], parts: bungalow(1) },
      { label: '2-storey + garage', at: [-5.5, -4.5], parts: twoStoreyGarage(2) },
      { label: 'Semi-detached', at: [-3.5, -4.5], parts: semiDetached(3) },
      { label: 'Townhouses', at: [-1.5, -4.5], parts: townhouses(4) },
      { label: 'Infill', at: [0.5, -4.5], parts: infill(5) },
      { label: 'Now (M1 box house)', at: [2.5, -4.5], parts: boxHouse({ activeToday: true, colorIndex: 2 }) },
      { label: '', at: [-7.5, -2.5], parts: bungalow(11) },
      { label: '', at: [-5.5, -2.5], parts: twoStoreyGarage(13) },
      { label: '', at: [-3.5, -2.5], parts: semiDetached(17) },
      { label: '', at: [-1.5, -2.5], parts: townhouses(19) },
      { label: '', at: [0.5, -2.5], parts: infill(22) },
      { label: 'Apartment (downtown lot)', at: [2.5, -2.5], parts: apartment(3) },
      { label: 'Loft (downtown lot)', at: [3.5, -4.5], parts: loft(2) },
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
      { label: 'Flowers', at: [-1.5, 3.5], parts: flowerBed(1) },
      { label: '', at: [5.5, 6.5], parts: flowerBed(4) },
      { label: '', at: [4.5, 3.5], parts: wildFlowers(2) },
      { label: '', at: [5.5, -1.5], parts: wildFlowers(5) },
      { label: 'Party balloons', at: [-6.9, -3.9], parts: partyBalloons(3) },
      { label: 'Wildlife →', at: [-2.5, 5.5], parts: [] },
      { label: 'Clouds (still copy)', at: [4.5, -1.5], parts: vmove(cloud(5), 0, 40, 0) },
      { label: '', at: [1.5, 0.5], parts: vmove(cloud(8), 0, 46, 0) },
      { label: 'Observation tower', at: [-6, 9.5], parts: observationTower() },
      { label: 'Crescent tower', at: [-2, 9.5], parts: crescentTower() },
      { label: 'Art-deco tower', at: [2, 9.5], parts: artDecoTower() },
      { label: 'Hotel', at: [6, 9.5], parts: hotel() },
      { label: '', at: [0, 7.5], parts: lampPost() },
      { label: '', at: [-4, 7.5], parts: lampPost() },
      { label: '', at: [4, 7.5], parts: lampPost() },
      ...featureSamples(),
      ...ctrainSamples(),
    ];
    return { ground: groundParts(), items };
  }, []);

  const parts = useMemo(
    () => withLights(withSnow([...ground, ...items.flatMap((i) => translate(i.parts, i.at[0], i.at[1]))], snow), look.lightsOn),
    [ground, items, snow, look.lightsOn],
  );

  return (
    <div className="absolute inset-0" style={{ background: skyBackground(look) }}>
      {look.starsOpacity > 0 && <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: STARS, backgroundSize: STARS_TILE, opacity: look.starsOpacity }} />}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-2xl bg-white/85 px-3 py-2 text-xs text-slate-700 shadow">
        <div className="font-bold">Asset gallery · M19 art, M20 weather, M22 sound</div>
        <div>Drag to rotate, scroll/pinch to zoom. Tap animals and people to hear them.</div>
      </div>
      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full bg-white/85 p-1 shadow">
        {(Object.keys(TIMES) as TimeName[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTime(n)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${n === time ? 'bg-amber-400 text-white' : 'text-slate-700'}`}
          >
            {{ Dawn: '🌅', Morning: '🌤️', Noon: '☀️', Sunset: '🌇', Night: '🌙' }[n]} {n}
          </button>
        ))}
      </div>
      <div className="absolute right-3 top-14 z-10 flex flex-wrap justify-end gap-1 rounded-2xl bg-white/85 p-1 shadow">
        {WEATHERS.map(([w, icon]) => (
          <button key={w} type="button" onClick={() => setWeather(w)} title={w} className={`rounded-full px-2 py-1 text-xs font-semibold ${w === weather ? 'bg-sky-500 text-white' : 'text-slate-700'}`}>
            {icon} {w.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="absolute right-3 top-[6.5rem] z-10 flex gap-1 rounded-full bg-white/85 p-1 shadow">
        {WINDS.map((w) => (
          <button key={w} type="button" onClick={() => setWindLevel(w)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${w === windLevel ? 'bg-teal-500 text-white' : 'text-slate-700'}`}>
            💨 {w}
          </button>
        ))}
        <button type="button" onClick={() => setSnow(!snow)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${snow ? 'bg-slate-600 text-white' : 'text-slate-700'}`}>
          ⛄ snow on ground
        </button>
      </div>
      <SoundBoard scene={{ weather, wind: windLevel, nightness: look.nightness > 0.5 ? 1 : 0, hasWater: true, campfire: true, construction: true }} />
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
        <hemisphereLight color={look.hemiSky} groundColor={look.hemiGround} intensity={look.ambientIntensity} />
        <directionalLight
          position={[dx * 40, dy * 40, dz * 40]}
          color={look.sunColor}
          intensity={look.sunIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-camera-near={1}
          shadow-camera-far={120}
        />
        {look.fog > 0 && <fog attach="fog" args={[look.bg[2], 30 - 12 * look.fog, 75 - 30 * look.fog]} />}
        <GalleryWind wind={wind} />
        {precip && <Precipitation kind={precip.kind} count={precip.count} radius={14} wind={wind} />}
        <ViewRig view={view} />
        <GalleryLife />
        <BoxBatch parts={parts} />
        <LowpolyShowcase snow={snow} lightsOn={look.lightsOn} />
        <LowpolyLots snow={snow} lightsOn={look.lightsOn} />
        {items
          .filter((i) => i.label)
          .map((i) => (
            <GalleryLabel key={`${i.label}@${i.at.join(',')}`} text={i.label} position={[i.at[0], topOf(i.parts) + 0.35, i.at[1]]} />
          ))}
      </Canvas>
    </div>
  );
}

/**
 * A sample's name above it. Uses the fixed overlay container like the game's labels; without it
 * drei rebuilds each label's React root right after mounting ("synchronously unmount a root").
 */
function GalleryLabel({ text, position }: { text: string; position: [number, number, number] }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center style={{ pointerEvents: 'none' }}>
      <span className="whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm">{text}</span>
    </Html>
  );
}

const CTX = { snow: false, palette: MOOD_PALETTES.lively };

/** All signature feature blocks, two designs each (variant 0 and 1), on 2×2 lots. */
function featureSamples(): Item[] {
  const keys = ['pond', 'hill', 'creek', 'big-park', 'school', 'ctrain-station'] as const;
  const names: Record<(typeof keys)[number], string> = { pond: 'Pond', hill: 'Hill', creek: 'Creek', 'big-park': 'Big park', school: 'School', 'ctrain-station': 'Station (symbolic)' };
  return keys.flatMap((k, i) =>
    [0, 1].map((v) => ({ label: v === 0 ? names[k] : '', at: [10 + v * 3, -5 + i * 2.2] as [number, number], parts: FEATURE_VOXELS[k](v, CTX) })),
  );
}

/** CTrain set: a straight track with poles and a level crossing, a station platform and a 3-car train. */
function ctrainSamples(): Item[] {
  const items: Item[] = [];
  for (let i = 0; i < 6; i++) items.push({ label: '', at: [9.5 + i, 8.5], parts: track({ assetKey: 'track', id: 't', x: 0, z: 0, stage: 0, dx: 1, dz: 0, pole: i % 3 === 1 }) });
  items.push({ label: 'Level crossing', at: [12.5, 8.5], parts: rail({ assetKey: 'rail', id: 'r', x: 0, z: 0, stage: 0, links: { px: true, nx: true, pz: false, nz: false }, overWater: false, crossing: true }) });
  items.push({ label: 'Station platform', at: [11, 7.5], parts: stationPlatformParts(['Red'], 2, 0) });
  items.push({ label: '', at: [14, 7.5], parts: stationPlatformParts(['Blue'], 2, 1) });
  items.push({ label: 'CTrain', at: [10.5, 8.5], parts: vmove(vturn(ctrainCarParts(true, false), 1), 0, 1.1, 0) });
  items.push({ label: '', at: [11.4, 8.5], parts: vmove(vturn(ctrainCarParts(false, false), 1), 0, 1.1, 0) });
  items.push({ label: '', at: [12.3, 8.5], parts: vmove(vturn(ctrainCarParts(false, true), 1), 0, 1.1, 0) });
  return items;
}

/** Height of the model's top (label position). */
const topOf = (parts: BoxPart[]) => (parts.length === 0 ? 0.6 : Math.max(...parts.map((b) => b.p[1] + b.s[1] / 2)));

/** A grass platform with a stone path, slight colour noise per tile, grass tufts and flowers. */
function groundParts(): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = -9; x < 16; x++) {
    for (let z = -6; z < 12; z++) {
      const path = z === 0 || z === 7;
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
  for (let x = -9; x < 16; x++) parts.push({ layer: 'solid', p: [x + 0.5, -1.25, 11.5], s: [1, 1.5, 1], c: x % 2 ? '#9b7653' : '#8d6b4b' });
  for (let z = -6; z < 12; z++) parts.push({ layer: 'solid', p: [15.5, -1.25, z + 0.5], s: [1, 1.5, 1], c: z % 2 ? '#8d6b4b' : '#9b7653' });
  return parts;
}
