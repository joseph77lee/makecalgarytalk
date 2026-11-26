/**
 * Camera follow target (world x/z) and the free camera (requirement v1.48 §10.1). Written every
 * frame by whoever the camera should follow (the avatar) and read in the camera rig's useFrame.
 * A plain mutable object on purpose: no React state, no re-renders.
 *
 * `manual`: the player panned the view, so the camera stops following until the avatar moves
 * again (`mx`, `mz`: where the focus was when the player took over).
 */
export const cameraFocus = { active: false, x: 0, z: 0, manual: false, mx: 0, mz: 0 };

/** How far (world units) the focus must move before following resumes after a pan. */
const RESUME_AFTER = 0.05;

export function setCameraFocus(x: number, z: number): void {
  if (cameraFocus.manual && Math.hypot(x - cameraFocus.mx, z - cameraFocus.mz) > RESUME_AFTER) cameraFocus.manual = false;
  cameraFocus.active = true;
  cameraFocus.x = x;
  cameraFocus.z = z;
}

export function clearCameraFocus(): void {
  cameraFocus.active = false;
}

/** The player panned: stop following until the avatar moves. */
export function startManualView(): void {
  cameraFocus.manual = true;
  cameraFocus.mx = cameraFocus.x;
  cameraFocus.mz = cameraFocus.z;
}

/**
 * How strongly the camera follows, from the zoom relative to "fit the whole
 * island": zoomed out it stays mostly centred (gentle, §10.2), zoomed in it follows fully.
 */
export function followStrength(zoom: number, fit: number): number {
  if (fit <= 0) return 0;
  const k = (zoom / fit - 0.9) / 1.2;
  return Math.min(1, Math.max(0.2, k));
}

/** World rectangle the view centre may move within (the risen land). */
export interface ViewBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function landBounds(tiles: { x: number; z: number }[]): ViewBounds {
  if (tiles.length === 0) return { minX: -1, maxX: 1, minZ: -1, maxZ: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const t of tiles) {
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x + 1);
    minZ = Math.min(minZ, t.z);
    maxZ = Math.max(maxZ, t.z + 1);
  }
  return { minX, maxX, minZ, maxZ };
}

/** Keeps a view centre on the island (panning never leaves it). */
export function clampToBounds(x: number, z: number, b: ViewBounds): [number, number] {
  return [Math.min(b.maxX, Math.max(b.minX, x)), Math.min(b.maxZ, Math.max(b.minZ, z))];
}

/** Compass tap: a request the camera rig picks up on its next frame (back to the start view). */
export const viewReset = { requested: false };

export function requestViewReset(): void {
  viewReset.requested = true;
  cameraFocus.manual = false;
}
