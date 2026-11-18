/**
 * PC keyboard movement (WASD / arrows, requirement.md §10.2). Keys mean screen
 * directions ("up" = away from the camera), converted to grid steps using the
 * current camera rotation, so controls stay intuitive while the island is rotated.
 */
import type { Tile } from '../island-view';

export type MoveKey = 'up' | 'down' | 'left' | 'right';

const KEY_MAP: Record<string, MoveKey> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export function moveKeyOf(code: string): MoveKey | null {
  return KEY_MAP[code] ?? null;
}

/** 8 grid directions in counter-clockwise order of their angle atan2(z, x). */
const RING: Tile[] = [
  { x: 1, z: 0 },
  { x: 1, z: 1 },
  { x: 0, z: 1 },
  { x: -1, z: 1 },
  { x: -1, z: 0 },
  { x: -1, z: -1 },
  { x: 0, z: -1 },
  { x: 1, z: -1 },
];

/**
 * Grid steps to try for the pressed keys, best first: the direction closest to
 * the screen direction, then its two 45° neighbours (to slide along walls).
 * `azimuth` is the camera's orbit angle: atan2(camera.x - target.x, camera.z - target.z).
 */
export function stepCandidates(keys: ReadonlySet<MoveKey>, azimuth: number): Tile[] {
  const sy = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
  const sx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
  if (sx === 0 && sy === 0) return [];
  // Ground vectors for screen-up (away from camera) and screen-right.
  const fx = -Math.sin(azimuth);
  const fz = -Math.cos(azimuth);
  const rx = Math.cos(azimuth);
  const rz = -Math.sin(azimuth);
  const wx = fx * sy + rx * sx;
  const wz = fz * sy + rz * sx;
  const angle = Math.atan2(wz, wx);
  const i = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  // Prefer the neighbour on the side the exact angle leans towards.
  const lean = angle / (Math.PI / 4) - Math.round(angle / (Math.PI / 4));
  const first = lean >= 0 ? (i + 1) % 8 : (i + 7) % 8;
  const second = lean >= 0 ? (i + 7) % 8 : (i + 1) % 8;
  return [RING[i], RING[first], RING[second]];
}
