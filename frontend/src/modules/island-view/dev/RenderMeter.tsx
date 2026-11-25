/**
 * Frame rate and render load for phone checks (M23 DoD; successor of the spike meter). Shown only
 * with `?meter` in the address: frames per second, triangles, draw calls and quality, refreshed
 * every second. The counter inside the canvas writes into a shared object; nothing re-renders.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

const stats = { frames: 0, triangles: 0, calls: 0 };

/** Inside the <Canvas>: counts frames and reads the renderer's counters. */
export function MeterProbe() {
  const gl = useThree((s) => s.gl);
  useFrame(() => {
    stats.frames++;
    stats.triangles = gl.info.render.triangles;
    stats.calls = gl.info.render.calls;
  });
  return null;
}

/** Outside the canvas: the readout. */
export function MeterReadout({ lowQuality }: { lowQuality: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const fps = Math.round((stats.frames * 1000) / (now - last));
      stats.frames = 0;
      last = now;
      if (el.current) el.current.textContent = `${fps} fps · ${Math.round(stats.triangles / 1000)}k tris · ${stats.calls} calls${lowQuality ? ' · low' : ''}`;
    }, 1000);
    return () => window.clearInterval(id);
  }, [lowQuality]);
  return <div ref={el} className="pointer-events-none absolute right-3 top-16 z-30 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[11px] text-emerald-300" />;
}
