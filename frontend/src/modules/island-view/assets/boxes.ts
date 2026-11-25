/**
 * Box parts: every MVP model is a list of coloured boxes (requirement.md §19.0).
 * Parts are drawn in batches with one InstancedMesh per material layer, so the
 * draw-call count stays flat however many houses or trees an island has.
 */

/**
 * solid = lit and shadowed, glow = unlit bright (lit windows, lamps), ghost = translucent silhouette,
 * mist = faint future land, sway = solid that moves with the wind (leaves, flags; §10.4).
 */
export type Layer = 'solid' | 'glow' | 'ghost' | 'mist' | 'sway';

export interface BoxPart {
  layer: Layer;
  /** Centre position. */
  p: [number, number, number];
  /** Size. */
  s: [number, number, number];
  c: string;
  /** Euler rotation (radians). */
  r?: [number, number, number];
  /**
   * What the part is, for weather and time of day (requirement.md v1.40 §10.4): `roof` gets snow
   * when snow lies; `house-window` is a resident's window, lit only when they were active today
   * (never by the night lights).
   */
  tag?: 'roof' | 'house-window';
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

/** Parts that move with the wind (solid ones only). */
export const asSway = (parts: BoxPart[]): BoxPart[] => parts.map((b) => (b.layer === 'solid' ? { ...b, layer: 'sway' } : b));

export const asGhost = (parts: BoxPart[], c: string): BoxPart[] =>
  parts.map((b) => ({ ...b, layer: 'ghost', c }));
