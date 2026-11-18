import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { Group, OrthographicCamera as OrthoCam } from 'three';
import type { AssetProps } from '../assets/BoxAsset';
import { ASSET_REGISTRY } from '../assets/registry';
import { ASSET_KEYS, buildIslandLayout, tileKey, type IslandLayout, type PlacedObject } from '../layout';
import { MOOD_PALETTES, type MoodPalette } from '../mood';
import type { CommunityViewState } from '../types';
import { BoxBatch } from './BoxBatch';
import { CAMERA_POSITION, CAMERA_TARGET, fitZoom } from './camera';
import { IslandContext, useSceneFx, type IslandCtx } from './islandContext';
import { IslandLabels } from './Labels';
import { terrainParts } from './terrainParts';

const GROWTH_SECONDS = 1.4;
const CHEER_MS = 2500;

/** The 3D voxel island for one community, rendered purely from `state`. */
export function IslandView({ state }: { state: CommunityViewState }) {
  const layout = useMemo(() => buildIslandLayout(state), [state]);
  const palette = MOOD_PALETTES[layout.mood];

  return (
    <div className="absolute inset-0 transition-[background] duration-700" style={{ background: palette.sky }}>
      <Canvas flat shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <IslandScene layout={layout} palette={palette} state={state} />
      </Canvas>
    </div>
  );
}

function IslandScene({ layout, palette, state }: { layout: IslandLayout; palette: MoodPalette; state: CommunityViewState }) {
  // Size whose rings are fully shown. When the island grows, the new rings rise first.
  const [settledSize, setSettledSize] = useState<number>(layout.size);
  if (layout.size < settledSize) setSettledSize(layout.size); // shrinking only happens in dev tools
  const growing = layout.size > settledSize;
  const settledHalf = settledSize / 2;

  const ctx: IslandCtx = useMemo(() => {
    const villagerBubbles = new Map<number, string>();
    for (const b of state.speechBubbles) if (b.anchor.kind === 'villager') villagerBubbles.set(b.anchor.index, b.text);
    return { palette, mood: layout.mood, walkableKeys: new Set(layout.walkable.map(tileKey)), villagerBubbles };
  }, [palette, layout, state.speechBubbles]);

  const houseBubbles = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of state.speechBubbles) if (b.anchor.kind === 'house') m.set(b.anchor.id, b.text);
    return m;
  }, [state.speechBubbles]);

  const shown = useMemo(() => layout.objects.filter((o) => o.ring < settledHalf), [layout, settledHalf]);
  const settledTiles = useMemo(() => layout.tiles.filter((t) => t.ring < settledHalf), [layout, settledHalf]);
  const risingTiles = useMemo(() => layout.tiles.filter((t) => t.ring >= settledHalf), [layout, settledHalf]);
  const settledTerrain = useMemo(
    () => terrainParts(settledTiles, palette, settledHalf - 1),
    [settledTiles, palette, settledHalf],
  );
  const risingTerrain = useMemo(() => terrainParts(risingTiles, palette, 0), [risingTiles, palette]);

  const finishGrowth = () => {
    setSettledSize(layout.size);
    useSceneFx.setState({ celebrateUntil: performance.now() + CHEER_MS });
  };

  return (
    <IslandContext.Provider value={ctx}>
      <OrthographicCamera makeDefault position={CAMERA_POSITION} near={0.1} far={300} />
      <CameraRig size={layout.size} />
      <Lights palette={palette} size={layout.size} />

      <BoxBatch parts={settledTerrain} castShadow={false} />
      {growing && (
        <RisingGroup key={layout.size} onDone={finishGrowth}>
          <BoxBatch parts={risingTerrain} castShadow={false} />
        </RisingGroup>
      )}

      <ObjectsLayer objects={shown} />
      <IslandLabels objects={shown} houseBubbles={houseBubbles} />
    </IslandContext.Provider>
  );
}

function ObjectsLayer({ objects }: { objects: PlacedObject[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, PlacedObject[]>();
    for (const o of objects) m.set(o.assetKey, [...(m.get(o.assetKey) ?? []), o]);
    return m;
  }, [objects]);
  return (
    <>
      {ASSET_KEYS.map((key) => {
        const items = groups.get(key);
        if (!items) return null;
        const Asset = ASSET_REGISTRY[key] as ComponentType<AssetProps<typeof key>>;
        return <Asset key={key} items={items as AssetProps<typeof key>['items']} />;
      })}
    </>
  );
}

/** New edge rings rise from below with a soft overshoot (requirement.md §7.8, §19.3). */
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

/** Fits the island on screen and eases the zoom when the island or viewport changes. */
function CameraRig({ size }: { size: number }) {
  const get = useThree((s) => s.get);
  const viewport = useThree((s) => s.size);
  const fit = fitZoom(size, viewport.width, viewport.height);
  const target = useRef(fit);
  const first = useRef(true);

  useEffect(() => {
    target.current = fit;
    if (first.current) {
      first.current = false;
      const camera = get().camera as OrthoCam;
      camera.zoom = fit;
      camera.updateProjectionMatrix();
    }
  }, [fit, get]);

  useFrame(({ camera: cam }, dt) => {
    const camera = cam as OrthoCam;
    const diff = target.current - camera.zoom;
    if (Math.abs(diff) < 0.01) return;
    camera.zoom += diff * Math.min(1, dt * 4);
    camera.updateProjectionMatrix();
  });

  // Rotate around the island within limits; no panning; zoom between 0.7× and 3.5× of fit.
  return (
    <OrbitControls
      makeDefault
      target={CAMERA_TARGET}
      enablePan={false}
      enableDamping
      dampingFactor={0.12}
      minPolarAngle={0.65}
      maxPolarAngle={1.15}
      minAzimuthAngle={Math.PI / 4 - 1.0}
      maxAzimuthAngle={Math.PI / 4 + 1.0}
      minZoom={fit * 0.7}
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
function Lights({ palette, size }: { palette: MoodPalette; size: number }) {
  const extent = size * 0.8 + 2;
  return (
    <>
      <hemisphereLight args={['#ffffff', '#d9d2ea', palette.ambientIntensity]} />
      <directionalLight
        position={[-14, 26, 18]}
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
        shadow-camera-far={90}
      />
    </>
  );
}
