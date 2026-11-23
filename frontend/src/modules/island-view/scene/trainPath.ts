import type { RailRoute } from '../layout';

export interface TrainPath {
  /** Path length in tiles. */
  length: number;
  /** Distances along the path (from its start) of station stops. */
  stops: number[];
  /** Point and heading (rotation about y; 0 = facing +z) at a distance along the path. */
  at: (d: number) => { x: number; z: number; heading: number };
}

/**
 * The part of a track run a train can use on this land stage: the longest stretch of tiles that
 * are already land, along the smoothed track line, extended half a tile past each end
 * so the train enters and leaves at the tile edge. Null when the stretch is too short (< 5 tiles).
 */
export function trainPath(route: RailRoute, landStage: number): TrainPath | null {
  let best: [number, number] = [0, -1];
  let start = -1;
  route.tiles.forEach((t, i) => {
    if (t.stage <= landStage) {
      if (start < 0) start = i;
      if (i - start > best[1] - best[0]) best = [start, i];
    } else start = -1;
  });
  const [a, b] = best;
  if (b - a + 1 < 5) return null;
  const pts = route.points.slice(a, b + 1).map((p) => ({ ...p }));
  const ext = (p: { x: number; z: number }, q: { x: number; z: number }) => ({ x: p.x + (p.x - q.x) * 0.5, z: p.z + (p.z - q.z) * 0.5 });
  pts.unshift(ext(pts[0], pts[1]));
  pts.push(ext(pts[pts.length - 1], pts[pts.length - 2]));
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const length = cum[cum.length - 1];
  // tile i of the stretch is point i + 1 (after the extension point)
  const stops = route.stops.filter((i) => i >= a && i <= b).map((i) => cum[i - a + 1]);
  const at = (d: number) => {
    const dd = Math.max(0, Math.min(length, d));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < dd) i++;
    const p = pts[i - 1];
    const q = pts[i];
    const seg = cum[i] - cum[i - 1] || 1;
    const k = (dd - cum[i - 1]) / seg;
    return { x: p.x + (q.x - p.x) * k, z: p.z + (q.z - p.z) * k, heading: Math.atan2(q.x - p.x, q.z - p.z) };
  };
  return { length, stops, at };
}
