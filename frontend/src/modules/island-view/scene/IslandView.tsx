import { OrbitControls, OrthographicCamera, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Box3, Vector3, type Group, type OrthographicCamera as OrthoCam, type Ray } from 'three';
import type { ItemsProps } from '../assets/BoxAsset';
import { ASSET_REGISTRY, BuildingAsset } from '../assets/registry';
import { FIXED_ASSET_KEYS, buildIslandLayout, tileKey, type BuildingObject, type IslandLayout, type PlacedObject, type Tile } from '../layout';
import { MOOD_PALETTES, type MoodPalette } from '../mood';
import { stageMap, type IslandPlan } from '../plan/islandPlan';
import type { CommunityViewState } from '../types';
import { BloomBurst } from './BloomBurst';
import { BoxBatch } from './BoxBatch';
import { ISLAND_AZIMUTH, northScreenAngle, viewFrame, zoomForFrame, type ViewFrame } from './camera';
import { cameraFocus, followStrength } from './cameraFocus';
import { opaqueBox, setIslandCapturer } from './capture';
import { IslandContext, useSceneFx, type IslandCtx } from './islandContext';
import { IslandLabels } from './Labels';
import { futureLandParts, terrainParts } from './terrainParts';
import { Trains } from './Trains';
import { IslandLife } from './IslandLife';
import { featuresFor } from '../plan/features';

const GROWTH_SECONDS = 1.4;
/** A tapped house's bubble closes by itself after this. */
const HOUSE_INFO_MS = 5000;
/** Each of today's actions is replayed by a villager for this long (requirement.md §7.3). */
const REPLAY_MS = 6000;
const CHEER_MS = 2500;
/** Max pointer travel (px) for a press to count as a tap rather than a camera drag. */
const TAP_MAX_DRAG_PX = 8;
const CAMERA_HEIGHT = 40;
const CAMERA_FLAT = 40 * Math.SQRT2;

interface IslandViewProps {
  /** The community's stored island plan (real shape, lots). */
  plan: IslandPlan;
  state: CommunityViewState;
  /** Called when the player taps/clicks a tile of the current land (not when dragging). */
  onTileTap?: (tile: Tile) => void;
  /** Called when the player taps a building (built, under construction or locked), by key. */
  onBuildingTap?: (buildingKey: string) => void;
  /** Buildings that hold the newspaper; the first one shown gets a "📰 News" chip that opens it. */
  newsBuildingKeys?: string[];
  /** Extra scene content (e.g. the avatar), rendered inside the island scene. */
  children?: ReactNode;
}

/** The 3D voxel island for one community, rendered purely from its plan and `state`. */
export function IslandView({ plan, state, onTileTap, onBuildingTap, newsBuildingKeys = [], children }: IslandViewProps) {
  const layout = useMemo(() => buildIslandLayout(plan, state), [plan, state]);
  const palette = MOOD_PALETTES[layout.mood];
  const north = useMemo(() => createAngleChannel(), []);
  // Low-end phones (§20.3a): if the frame rate stays low, drop to 1x pixel ratio and no shadows.
  // One way only (no flip-flopping between qualities while playing).
  const [lowQuality, setLowQuality] = useState(false);

  return (
    <div className="absolute inset-0 transition-[background] duration-700" style={{ background: palette.sky }}>
      <Canvas flat shadows={!lowQuality} dpr={lowQuality ? 1 : [1, 2]} gl={{ antialias: true, alpha: true }}>
        <PerformanceMonitor flipflops={2} onDecline={() => setLowQuality(true)} onFallback={() => setLowQuality(true)} />
        {/* A new community (plan) starts a fresh scene: camera angle, growth state. */}
        <IslandScene
          key={plan.code}
          plan={plan}
          layout={layout}
          palette={palette}
          state={state}
          onTileTap={onTileTap}
          onBuildingTap={onBuildingTap}
          newsBuildingKeys={newsBuildingKeys}
        >
          {children}
        </IslandScene>
        <CompassTracker channel={north} />
      </Canvas>
      <NorthArrow channel={north} />
    </div>
  );
}

function IslandScene({
  plan,
  layout,
  palette,
  state,
  onTileTap,
  onBuildingTap,
  newsBuildingKeys,
  children,
}: {
  plan: IslandPlan;
  layout: IslandLayout;
  palette: MoodPalette;
  state: CommunityViewState;
  onTileTap?: (tile: Tile) => void;
  onBuildingTap?: (buildingKey: string) => void;
  newsBuildingKeys: string[];
  children?: ReactNode;
}) {
  // Land stage whose tiles are fully shown. When the land grows, the new tiles rise first.
  const [settled, setSettled] = useState<number>(layout.landStage);
  if (layout.landStage < settled) setSettled(layout.landStage); // shrinking only happens in dev tools
  const growing = layout.landStage > settled;
  const stages = useMemo(() => stageMap(plan), [plan]);
  const stageOf = (t: Tile) => stages.get(tileKey(t)) ?? 99;

  // Action replay: today's real actions, one at a time, over the villagers (§7.3).
  const replay = state.replay ?? [];
  const villagerCount = layout.objects.filter((o) => o.assetKey === 'mini-villager').length;
  const [replayTick, setReplayTick] = useState(0);
  useEffect(() => {
    if (replay.length === 0 || villagerCount === 0) return;
    const t = setInterval(() => setReplayTick((n) => n + 1), REPLAY_MS);
    return () => clearInterval(t);
  }, [replay.length, villagerCount]);
  const replayIndex = replay.length > 0 && villagerCount > 0 ? replayTick % villagerCount : -1;
  const replayText = replayIndex >= 0 ? `${replay[replayTick % replay.length].nickname} helped the ${replay[replayTick % replay.length].title}` : '';

  // Tapping a house shows whose it is (§7.2).
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedHouse) return;
    const t = setTimeout(() => setSelectedHouse(null), HOUSE_INFO_MS);
    return () => clearTimeout(t);
  }, [selectedHouse]);

  const ctx: IslandCtx = useMemo(() => {
    const villagerBubbles = new Map<number, string>();
    for (const b of state.speechBubbles) if (b.anchor.kind === 'villager') villagerBubbles.set(b.anchor.index, b.text);
    if (replayIndex >= 0 && !villagerBubbles.has(replayIndex)) villagerBubbles.set(replayIndex, replayText);
    const walkable = layout.walkable.filter((t) => (stages.get(tileKey(t)) ?? 99) <= settled);
    return { palette, mood: layout.mood, walkable, walkableKeys: new Set(walkable.map(tileKey)), landStage: settled, villagerBubbles };
  }, [palette, layout, state.speechBubbles, settled, stages, replayIndex, replayText]);

  const houseBubbles = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of state.speechBubbles) if (b.anchor.kind === 'house') m.set(b.anchor.id, b.text);
    return m;
  }, [state.speechBubbles]);

  const shown = useMemo(() => layout.objects.filter((o) => o.stage <= settled), [layout, settled]);
  // Houses are tapped on their body, not on the ground behind them: test the tap ray against
  // each house's box and take the nearest hit.
  // Buildings (by footprint) can be tapped the same way.
  const houseBoxes = useMemo(
    () =>
      shown.flatMap((o): { kind: 'house' | 'building'; id: string; box: Box3 }[] => {
        if (o.assetKey === 'house' && o.nickname)
          return [{ kind: 'house', id: o.houseId, box: new Box3(new Vector3(o.x - 0.45, 0, o.z - 0.45), new Vector3(o.x + 0.45, o.height, o.z + 0.45)) }];
        if (onBuildingTap && 'buildingKey' in o && 'w' in o)
          return [{ kind: 'building', id: o.buildingKey, box: new Box3(new Vector3(o.x - o.w / 2, 0, o.z - o.d / 2), new Vector3(o.x + o.w / 2, 1.6, o.z + o.d / 2)) }];
        return [];
      }),
    [shown, onBuildingTap],
  );
  const tap = (tile: Tile, ray: Ray, onLand: boolean) => {
    let target: (typeof houseBoxes)[number] | null = null;
    let best = Infinity;
    const hit = new Vector3();
    for (const h of houseBoxes) {
      if (ray.intersectBox(h.box, hit)) {
        const d = hit.distanceTo(ray.origin);
        if (d < best) {
          best = d;
          target = h;
        }
      }
    }
    const house = target?.kind === 'house' ? target.id : null;
    setSelectedHouse(house && house !== selectedHouse ? house : null);
    if (target?.kind === 'building') onBuildingTap?.(target.id);
    else if (!house && onLand) onTileTap?.(tile);
  };
  const settledTerrain = useMemo(() => {
    const tiles = layout.tiles.filter((t) => t.stage <= settled);
    return terrainParts(tiles, new Set(tiles.map(tileKey)), palette);
  }, [layout, settled, palette]);
  const risingTerrain = useMemo(() => {
    const tiles = layout.tiles.filter((t) => t.stage > settled);
    return terrainParts(tiles, null, palette);
  }, [layout, settled, palette]);
  const future = useMemo(() => futureLandParts(layout.futureTiles), [layout.futureTiles]);
  const outlineRadius = useMemo(() => Math.max(4, ...plan.tiles.map((t) => Math.hypot(t.x + 0.5, t.z + 0.5))), [plan]);
  // Same angle for every community and screen, so the island matches the World Map's orientation.
  const az = ISLAND_AZIMUTH;
  const landFrame = useMemo(() => viewFrame(layout.tiles, az), [layout.tiles, az]);
  const wholeFrame = useMemo(() => viewFrame(plan.tiles, az), [plan, az]);

  const finishGrowth = () => {
    setSettled(layout.landStage);
    useSceneFx.setState({ celebrateUntil: performance.now() + CHEER_MS });
  };

  return (
    <IslandContext.Provider value={ctx}>
      <OrthographicCamera
        makeDefault
        position={[landFrame.cx + CAMERA_FLAT * Math.sin(az), CAMERA_HEIGHT, landFrame.cz + CAMERA_FLAT * Math.cos(az)]}
        near={0.1}
        far={300}
      />
      <CameraRig frame={landFrame} whole={wholeFrame} azimuth={az} />
      <CaptureRegistrar />
      <Lights palette={palette} radius={layout.landRadius} azimuth={az} />

      <BoxBatch parts={future} castShadow={false} receiveShadow={false} />
      <BoxBatch parts={settledTerrain} castShadow={false} />
      {growing && (
        <RisingGroup key={layout.landStage} onDone={finishGrowth}>
          <BoxBatch parts={risingTerrain} castShadow={false} />
        </RisingGroup>
      )}

      {(onTileTap || houseBoxes.length > 0) && <TapPlane radius={outlineRadius} isLand={(t) => stageOf(t) <= settled} onTileTap={tap} />}
      <ObjectsLayer objects={shown} />
      <Trains routes={layout.railRoutes} landStage={settled} />
      <IslandLife code={plan.code} features={featuresFor(plan.code).map((f) => f.key)} hasWater={plan.water.length > 0} radius={layout.landRadius} />
      <BloomBurst layout={layout} />
      <IslandLabels
        objects={shown}
        houseBubbles={houseBubbles}
        communityName={state.communityName}
        selectedHouseId={selectedHouse}
        newsBuildingKeys={newsBuildingKeys}
        onNewsTap={onBuildingTap && newsBuildingKeys.length > 0 ? () => onBuildingTap(newsBuildingKeys[0]) : undefined}
      />
      {children}
    </IslandContext.Provider>
  );
}

function ObjectsLayer({ objects }: { objects: PlacedObject[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, PlacedObject[]>();
    for (const o of objects) {
      const k = o.assetKey.startsWith('building.') ? 'building' : o.assetKey;
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return m;
  }, [objects]);
  const buildings = groups.get('building') as BuildingObject[] | undefined;
  return (
    <>
      {FIXED_ASSET_KEYS.map((key) => {
        const items = groups.get(key);
        if (!items) return null;
        const Asset = ASSET_REGISTRY[key] as ComponentType<ItemsProps<PlacedObject>>;
        return <Asset key={key} items={items} />;
      })}
      {buildings && <BuildingAsset items={buildings} />}
    </>
  );
}

/** Invisible ground plane that turns taps on the current land into tile coordinates. */
function TapPlane({ radius, isLand, onTileTap }: { radius: number; isLand: (t: Tile) => boolean; onTileTap: (tile: Tile, ray: Ray, onLand: boolean) => void }) {
  const size = radius * 2 + 4;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={(e) => {
        if (e.delta > TAP_MAX_DRAG_PX) return; // it was a camera drag
        e.stopPropagation();
        const tile = { x: Math.floor(e.point.x), z: Math.floor(e.point.z) };
        onTileTap(tile, e.ray, isLand(tile));
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
  );
}

/** New land rises from below with a soft overshoot (requirement.md §7.8, §19.3). */
function RisingGroup({ onDone, children }: { onDone: () => void; children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  const t = useRef(0);
  const done = useRef(false);
  useFrame((_, dt) => {
    if (done.current || !ref.current) return;
    t.current = Math.min(1, t.current + dt / GROWTH_SECONDS);
    const k = t.current;
    const c1 = 1.4;
    const ease = 1 + (c1 + 1) * (k - 1) ** 3 + c1 * (k - 1) ** 2; // easeOutBack
    ref.current.position.y = -6 * (1 - ease);
    if (k >= 1) {
      done.current = true;
      onDone();
    }
  });
  return (
    <group ref={ref} position={[0, -6, 0]}>
      {children}
    </group>
  );
}

/** The part of drei's OrbitControls the follow logic needs (avoids importing three-stdlib directly). */
interface OrbitLike {
  target: Vector3;
  update: () => void;
}

const desired = new Vector3();
const step = new Vector3();

/**
 * Fits the current land on screen (zoom out to see the whole outline), aims at its centre,
 * eases the zoom when the land or viewport changes, and gently follows the focus (avatar).
 */
function CameraRig({ frame, whole, azimuth }: { frame: ViewFrame; whole: ViewFrame; azimuth: number }) {
  const get = useThree((s) => s.get);
  const viewport = useThree((s) => s.size);
  const fit = zoomForFrame(frame, viewport.width, viewport.height);
  const wholeZoom = zoomForFrame(whole, viewport.width, viewport.height);
  const target = useRef(fit);
  const first = useRef(true);
  const base = useMemo<[number, number, number]>(() => [frame.cx, -0.6, frame.cz], [frame.cx, frame.cz]);

  useEffect(() => {
    target.current = fit;
    if (first.current) {
      first.current = false;
      const camera = get().camera as OrthoCam;
      camera.zoom = fit;
      camera.updateProjectionMatrix();
    }
  }, [fit, get]);

  useFrame(({ camera: cam, controls }, dt) => {
    const camera = cam as OrthoCam;
    const diff = target.current - camera.zoom;
    if (Math.abs(diff) >= 0.01) {
      camera.zoom += diff * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }
    const orbit = controls as unknown as OrbitLike | null;
    if (!orbit) return;
    const k = cameraFocus.active ? followStrength(camera.zoom, fit) : 0;
    // Aim between the land's centre and the focus (stronger when zoomed in).
    desired.set(base[0] + (cameraFocus.x - base[0]) * k, base[1], base[2] + (cameraFocus.z - base[2]) * k);
    step.copy(desired).sub(orbit.target);
    if (step.lengthSq() < 1e-6) return;
    step.multiplyScalar(Math.min(1, dt * 3));
    orbit.target.add(step);
    camera.position.add(step);
    orbit.update();
  });

  // Rotate within limits around the community's default angle; no panning.
  return (
    <OrbitControls
      makeDefault
      target={base}
      enablePan={false}
      enableDamping
      dampingFactor={0.12}
      minPolarAngle={0.65}
      maxPolarAngle={1.15}
      minAzimuthAngle={azimuth - 1.0}
      maxAzimuthAngle={azimuth + 1.0}
      minZoom={Math.min(wholeZoom, fit) * 0.9}
      maxZoom={fit * 3.5}
      onStart={() => {
        target.current = get().camera.zoom; // the user takes over the zoom
      }}
      onEnd={() => {
        target.current = get().camera.zoom;
      }}
    />
  );
}

/** Soft pastel light from the viewer's top-left with modest shadows (§19.1, §20.3a). */
function Lights({ palette, radius, azimuth }: { palette: MoodPalette; radius: number; azimuth: number }) {
  const extent = radius * 1.2 + 3;
  // (-14, 26, 18) is top-left for the default view (azimuth π/4); rotate it with the camera.
  const a = azimuth - Math.PI / 4;
  const lx = -14 * Math.cos(a) + 18 * Math.sin(a);
  const lz = 14 * Math.sin(a) + 18 * Math.cos(a);
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9d2ea', palette.ambientIntensity]} />
      <directionalLight
        position={[lx, 26, lz]}
        intensity={palette.sunIntensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
    </>
  );
}

const forward = new Vector3();

/** Hands the camera's north angle from the 3D scene to the DOM arrow without React state. */
interface AngleChannel {
  emit: (angle: number) => void;
  listen: (fn: (angle: number) => void) => () => void;
}

function createAngleChannel(): AngleChannel {
  const listeners = new Set<(angle: number) => void>();
  return {
    emit: (angle) => listeners.forEach((fn) => fn(angle)),
    listen: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Reports where north is on screen whenever the camera turns. */
function CompassTracker({ channel }: { channel: AngleChannel }) {
  const last = useRef<number | null>(null);
  useFrame(({ camera }) => {
    camera.getWorldDirection(forward);
    const a = northScreenAngle(forward.x, forward.z);
    if (last.current !== null && Math.abs(a - last.current) < 0.002) return;
    last.current = a;
    channel.emit(a);
  });
  return null;
}

/** Small compass in the lower-left corner: the red needle points north (as on the World Map). */
function NorthArrow({ channel }: { channel: AngleChannel }) {
  const needle = useRef<SVGGElement>(null);
  const letter = useRef<SVGTextElement>(null);
  const start = (ISLAND_AZIMUTH * 180) / Math.PI;
  useEffect(
    () =>
      channel.listen((a) => {
        const deg = (a * 180) / Math.PI;
        needle.current?.setAttribute('transform', `rotate(${deg})`);
        letter.current?.setAttribute('transform', `rotate(${-deg} 0 -10)`);
      }),
    [channel],
  );
  return (
    <div className="pointer-events-none absolute bottom-40 left-3 h-11 w-11 rounded-full bg-white/85 shadow" role="img" aria-label="Compass: the red needle points north">
      <svg viewBox="-22 -22 44 44" className="h-full w-full">
        <g ref={needle} transform={`rotate(${start})`}>
          <path d="M0 -5 L4 3 L0 1 L-4 3 Z" transform="translate(0 4)" fill="#94a3b8" />
          <path d="M0 -4 L3.5 4 L-3.5 4 Z" transform="translate(0 0)" fill="#f43f5e" />
          <text ref={letter} x="0" y="-10" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="#f43f5e" transform={`rotate(${-start} 0 -10)`}>
            N
          </text>
        </g>
      </svg>
    </div>
  );
}

/** Lets share cards take a picture of the island: render once, copy the canvas, crop to the island. */
function CaptureRegistrar() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    setIslandCapturer(() => {
      gl.render(scene, camera);
      const src = gl.domElement;
      const full = document.createElement('canvas');
      full.width = src.width;
      full.height = src.height;
      const fctx = full.getContext('2d', { willReadFrequently: true });
      if (!fctx || !full.width || !full.height) return null;
      fctx.drawImage(src, 0, 0); // same task as the render, so the drawing buffer is still there
      const box = opaqueBox(fctx.getImageData(0, 0, full.width, full.height).data, full.width, full.height);
      if (!box) return null;
      const pad = Math.round(Math.max(box.w, box.h) * 0.03);
      const out = document.createElement('canvas');
      out.width = box.w + pad * 2;
      out.height = box.h + pad * 2;
      out.getContext('2d')?.drawImage(full, box.x, box.y, box.w, box.h, pad, pad, box.w, box.h);
      return out;
    });
    return () => setIslandCapturer(null);
  }, [gl, scene, camera]);
  return null;
}
