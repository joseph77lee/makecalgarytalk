import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Vector3, type Group, type OrthographicCamera as OrthoCam } from 'three';
import type { AssetProps } from '../assets/BoxAsset';
import { ASSET_REGISTRY } from '../assets/registry';
import { ASSET_KEYS, buildIslandLayout, ringOf, tileKey, type IslandLayout, type PlacedObject, type Tile } from '../layout';
import { MOOD_PALETTES, type MoodPalette } from '../mood';
import type { CommunityViewState } from '../types';
import { BoxBatch } from './BoxBatch';
import { CAMERA_POSITION, CAMERA_TARGET, fitZoom } from './camera';
import { cameraFocus, followStrength } from './cameraFocus';
import { IslandContext, useSceneFx, type IslandCtx } from './islandContext';
import { IslandLabels } from './Labels';
import { terrainParts } from './terrainParts';

const GROWTH_SECONDS = 1.4;
const CHEER_MS = 2500;

interface IslandViewProps {
  state: CommunityViewState;
  /** Called when the player taps/clicks a tile (not when dragging to rotate). */
  onTileTap?: (tile: Tile) => void;
  /** Extra scene content (e.g. the avatar), rendered inside the island scene. */
  children?: ReactNode;
}

/** Max pointer travel (px) for a press to count as a tap rather than a camera drag. */
const TAP_MAX_DRAG_PX = 8;

/** The 3D voxel island for one community, rendered purely from `state`. */
export function IslandView({ state, onTileTap, children }: IslandViewProps) {
  const layout = useMemo(() => buildIslandLayout(state), [state]);
  const palette = MOOD_PALETTES[layout.mood];

  return (
    <div className="absolute inset-0 transition-[background] duration-700" style={{ background: palette.sky }}>
      <Canvas flat shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <IslandScene layout={layout} palette={palette} state={state} onTileTap={onTileTap}>
          {children}
        </IslandScene>
      </Canvas>
    </div>
  );
}

function IslandScene({
  layout,
  palette,
  state,
  onTileTap,
  children,
}: {
  layout: IslandLayout;
  palette: MoodPalette;
  state: CommunityViewState;
  onTileTap?: (tile: Tile) => void;
  children?: ReactNode;
}) {
  // Size whose rings are fully shown. When the island grows, the new rings rise first.
  const [settledSize, setSettledSize] = useState<number>(layout.size);
  if (layout.size < settledSize) setSettledSize(layout.size); // shrinking only happens in dev tools
  const growing = layout.size > settledSize;
  const settledHalf = settledSize / 2;

  const ctx: IslandCtx = useMemo(() => {
    const villagerBubbles = new Map<number, string>();
    for (const b of state.speechBubbles) if (b.anchor.kind === 'villager') villagerBubbles.set(b.anchor.index, b.text);
    const walkable = layout.walkable.filter((t) => ringOf(t) < settledHalf);
    return {
      palette,
      mood: layout.mood,
      walkable,
      walkableKeys: new Set(walkable.map(tileKey)),
      islandSize: settledHalf * 2,
      villagerBubbles,
    };
  }, [palette, layout, state.speechBubbles, settledHalf]);

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

      {onTileTap && <TapPlane size={settledSize} onTileTap={onTileTap} />}
      <ObjectsLayer objects={shown} />
      <IslandLabels objects={shown} houseBubbles={houseBubbles} />
      {children}
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

/** Invisible ground plane that turns taps into tile coordinates. */
function TapPlane({ size, onTileTap }: { size: number; onTileTap: (tile: Tile) => void }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onClick={(e) => {
        if (e.delta > TAP_MAX_DRAG_PX) return; // it was a camera drag
        e.stopPropagation();
        const half = size / 2;
        const tile = { x: Math.floor(e.point.x), z: Math.floor(e.point.z) };
        if (tile.x >= -half && tile.x < half && tile.z >= -half && tile.z < half) onTileTap(tile);
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
    </mesh>
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

/** The part of drei's OrbitControls the follow logic needs (avoids importing three-stdlib directly). */
interface OrbitLike {
  target: Vector3;
  update: () => void;
}

const desired = new Vector3();
const step = new Vector3();

/** Fits the island on screen, eases the zoom when the island or viewport changes, and follows the focus. */
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

  useFrame(({ camera: cam, controls }, dt) => {
    const camera = cam as OrthoCam;
    const diff = target.current - camera.zoom;
    if (Math.abs(diff) >= 0.01) {
      camera.zoom += diff * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
    }

    // Gently follow the focus (avatar); move camera and orbit target together.
    const orbit = controls as unknown as OrbitLike | null;
    if (!orbit) return;
    const k = cameraFocus.active ? followStrength(camera.zoom, fit) : 0;
    desired.set(CAMERA_TARGET[0] + cameraFocus.x * k, CAMERA_TARGET[1], CAMERA_TARGET[2] + cameraFocus.z * k);
    step.copy(desired).sub(orbit.target);
    if (step.lengthSq() < 1e-6) return;
    step.multiplyScalar(Math.min(1, dt * 3));
    orbit.target.add(step);
    camera.position.add(step);
    orbit.update();
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
