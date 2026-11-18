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
