/**
 * Gallery camera moves (M23 review): pan left/right/forward/back along the ground and zoom in close,
 * with on-screen buttons (hold to repeat) or the keyboard (arrows / WASD to pan, + / − to zoom).
 * Mouse and touch still work as before: drag to rotate, right-drag or two fingers to pan, scroll or
 * pinch to zoom. `CameraPadBridge` (inside the canvas) hands the camera and controls to the pad.
 */
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3, type OrthographicCamera } from 'three';

interface Orbit {
  target: Vector3;
  update: () => void;
  minZoom: number;
  maxZoom: number;
}

const rig: { camera: OrthographicCamera | null; controls: Orbit | null } = { camera: null, controls: null };

/** Inside the <Canvas>: shares the camera and orbit controls with the pad. */
export function CameraPadBridge() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    rig.camera = camera as OrthographicCamera;
    rig.controls = controls as unknown as Orbit | null;
  }, [camera, controls]);
  return null;
}

const forward = new Vector3();
const right = new Vector3();
const UP = new Vector3(0, 1, 0);

/** Pans along the ground: `ahead` towards where the camera looks, `side` to its right (screen units). */
function pan(side: number, ahead: number): void {
  const { camera, controls } = rig;
  if (!camera || !controls) return;
  forward.subVectors(controls.target, camera.position).setY(0).normalize();
  right.crossVectors(forward, UP).normalize();
  const step = 90 / camera.zoom; // about the same distance on screen at any zoom
  const move = right.multiplyScalar(side * step).add(forward.multiplyScalar(ahead * step));
  camera.position.add(move);
  controls.target.add(move);
  controls.update();
}

function zoom(factor: number): void {
  const { camera, controls } = rig;
  if (!camera || !controls) return;
  camera.zoom = Math.min(controls.maxZoom, Math.max(controls.minZoom, camera.zoom * factor));
  camera.updateProjectionMatrix();
  controls.update();
}

const KEYS: Record<string, () => void> = {
  ArrowLeft: () => pan(-1, 0),
  a: () => pan(-1, 0),
  ArrowRight: () => pan(1, 0),
  d: () => pan(1, 0),
  ArrowUp: () => pan(0, 1),
  w: () => pan(0, 1),
  ArrowDown: () => pan(0, -1),
  s: () => pan(0, -1),
  '+': () => zoom(1.25),
  '=': () => zoom(1.25),
  '-': () => zoom(0.8),
};

/** A button that repeats its action while held. */
function HoldButton({ label, title, onStep }: { label: string; title: string; onStep: () => void }) {
  const timer = useRef<number | null>(null);
  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onPointerDown={(e) => {
        e.preventDefault();
        onStep();
        stop();
        timer.current = window.setInterval(onStep, 90);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className="flex h-9 w-9 select-none items-center justify-center rounded-full bg-white/90 text-sm font-bold text-slate-700 shadow active:bg-indigo-500 active:text-white"
    >
      {label}
    </button>
  );
}

/** The on-screen pad (right edge) and the keyboard shortcuts. */
export function CameraPad() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      const act = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!act) return;
      e.preventDefault();
      act();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="absolute right-3 top-44 z-10 grid grid-cols-3 gap-1 rounded-2xl bg-white/60 p-1.5 shadow backdrop-blur">
      <span />
      <HoldButton label="▲" title="Move forward (W / ↑)" onStep={() => pan(0, 1)} />
      <span />
      <HoldButton label="◀" title="Move left (A / ←)" onStep={() => pan(-1, 0)} />
      <span className="flex items-center justify-center text-[10px] font-semibold text-slate-500">move</span>
      <HoldButton label="▶" title="Move right (D / →)" onStep={() => pan(1, 0)} />
      <span />
      <HoldButton label="▼" title="Move back (S / ↓)" onStep={() => pan(0, -1)} />
      <span />
      <HoldButton label="＋" title="Zoom in (+)" onStep={() => zoom(1.15)} />
      <span className="flex items-center justify-center text-[10px] font-semibold text-slate-500">zoom</span>
      <HoldButton label="－" title="Zoom out (−)" onStep={() => zoom(0.87)} />
    </div>
  );
}
