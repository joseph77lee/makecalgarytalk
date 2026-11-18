/**
 * Camera follow target (world x/z). Written every frame by whoever the camera
 * should follow (the avatar) and read in the camera rig's useFrame. A plain
 * mutable object on purpose: no React state, no re-renders.
 */
export const cameraFocus = { active: false, x: 0, z: 0 };

export function setCameraFocus(x: number, z: number): void {
  cameraFocus.active = true;
  cameraFocus.x = x;
  cameraFocus.z = z;
}

export function clearCameraFocus(): void {
  cameraFocus.active = false;
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
