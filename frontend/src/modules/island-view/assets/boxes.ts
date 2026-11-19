/**
 * Box parts: every MVP model is a list of coloured boxes (requirement.md §19.0).
 * Parts are drawn in batches with one InstancedMesh per material layer, so the
 * draw-call count stays flat however many houses or trees an island has.
 */

/** solid = lit and shadowed, glow = unlit bright (lit windows, lamps), ghost = translucent silhouette, mist = faint future land. */
export type Layer = 'solid' | 'glow' | 'ghost' | 'mist';

export interface BoxPart {
  layer: Layer;
  /** Centre position. */
  p: [number, number, number];
  /** Size. */
  s: [number, number, number];
  c: string;
  /** Euler rotation (radians). */
  r?: [number, number, number];
}

/** Box helper with the BOTTOM at y (easier to stack than centres). */
export function box(
  layer: Layer,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  c: string,
  r?: [number, number, number],
): BoxPart {
  return { layer, p: [x, y + h / 2, z], s: [w, h, d], c, ...(r ? { r } : {}) };
}

export const translate = (parts: BoxPart[], x: number, z: number): BoxPart[] =>
  parts.map((b) => ({ ...b, p: [b.p[0] + x, b.p[1], b.p[2] + z] }));

export const asGhost = (parts: BoxPart[], c: string): BoxPart[] =>
  parts.map((b) => ({ ...b, layer: 'ghost', c }));
