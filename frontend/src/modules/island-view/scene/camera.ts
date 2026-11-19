/** Isometric camera helpers (orthographic; zoom = screen pixels per world unit). */

/** Camera direction: from +x/+z, true isometric elevation (≈35.26°). */
export const CAMERA_POSITION: [number, number, number] = [40, 40, 40];
/** Looking slightly below the ground so the dirt underneath is framed too. */
export const CAMERA_TARGET: [number, number, number] = [0, -0.6, 0];

/**
 * Zoom that fits the whole island (width = diagonal, height = top diamond +
 * dirt + label headroom) into the viewport with some margin.
 */
export function fitZoom(islandSize: number, width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  const diagonal = islandSize * Math.SQRT2;
  const byWidth = (width * 0.9) / diagonal;
  const byHeight = (height * 0.8) / (islandSize * 0.82 + 3.5);
  return Math.min(byWidth, byHeight);
}

/** Screen-space frame of a set of tiles for a camera orbit angle (orthographic, isometric tilt). */
export interface ViewFrame {
  /** World point to aim at (centre of the tiles on screen). */
  cx: number;
  cz: number;
  /** Extent in world units across the screen and up the screen. */
  width: number;
  height: number;
}

const TILT = Math.sin(Math.atan(1 / Math.SQRT2)); // ≈ 0.577 for the isometric elevation

export function viewFrame(tiles: { x: number; z: number }[], azimuth: number): ViewFrame {
  const rx = Math.cos(azimuth);
  const rz = -Math.sin(azimuth);
  const ux = -Math.sin(azimuth);
  const uz = -Math.cos(azimuth);
  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;
  for (const t of tiles) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x = t.x + dx;
      const z = t.z + dz;
      const r = x * rx + z * rz;
      const u = x * ux + z * uz;
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
    }
  }
  if (!Number.isFinite(minR)) return { cx: 0, cz: 0, width: 8, height: 8 };
  const r0 = (minR + maxR) / 2;
  const u0 = (minU + maxU) / 2;
  return { cx: r0 * rx + u0 * ux, cz: r0 * rz + u0 * uz, width: maxR - minR, height: (maxU - minU) * TILT + 2.5 };
}

/** Zoom (px per world unit) that fits a frame into the viewport with margins. */
export function zoomForFrame(frame: ViewFrame, width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  return Math.min((width * 0.88) / Math.max(frame.width, 4), (height * 0.62) / Math.max(frame.height, 4));
}

/** Camera angle for the screen orientation (the stored angle is for portrait). */
export function screenAzimuth(planAzimuth: number, landscape: boolean): number {
  const DEFAULT = Math.PI / 4;
  if (!landscape || Math.abs(planAzimuth - DEFAULT) < 1e-3) return planAzimuth;
  const options = [planAzimuth + Math.PI / 2, planAzimuth - Math.PI / 2];
  const dist = (a: number) => Math.abs(Math.atan2(Math.sin(a - DEFAULT), Math.cos(a - DEFAULT)));
  return dist(options[0]) <= dist(options[1]) ? options[0] : options[1];
}

