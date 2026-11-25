/** Where and how a low-poly model stands on the island (M23, requirement.md v1.45 §19.1). */
import { Matrix4, Vector3 } from 'three';
import type { BuildCtx } from '../models';
import type { LpName } from './catalogue';

/** One model standing on the island. */
export interface LpPlacement {
  model: LpName;
  /** World position of the model's centre on the ground (tiles). */
  x: number;
  z: number;
  /** Turn around y in radians (0 = front towards +z; cars drive towards +x). */
  turn: number;
  /** Mirror left–right (variety without more files). */
  mirror?: boolean;
  /** Extra uniform scale on top of the catalogue fit. */
  scale?: number;
  /** Windows: 2 = lit, 1 = lit when the island's lights are on, 0 = dark. */
  lit?: 0 | 1 | 2;
  /** Pastel roof and wall colours (sRGB hex); unset keeps the model's own. */
  roof?: string;
  wall?: string;
}

export interface PlaceCtx extends BuildCtx {
  lowQuality: boolean;
}

const UP = new Vector3(0, 1, 0);

/** Instance matrix for a placement (exported for tests). */
export function placementMatrix(p: LpPlacement): Matrix4 {
  const s = p.scale ?? 1;
  return new Matrix4()
    .makeTranslation(p.x, 0, p.z)
    .multiply(new Matrix4().makeRotationAxis(UP, p.turn))
    .multiply(new Matrix4().makeScale(p.mirror ? -s : s, s, s));
}

/** Placements grouped by model and mirroring, one mesh each. */
export function groupPlacements(placements: LpPlacement[]): Map<string, { model: LpName; mirror: boolean; list: LpPlacement[] }> {
  const groups = new Map<string, { model: LpName; mirror: boolean; list: LpPlacement[] }>();
  for (const p of placements) {
    const key = `${p.model}${p.mirror ? ':m' : ''}`;
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { model: p.model, mirror: !!p.mirror, list: [] }));
    g.list.push(p);
  }
  return groups;
}
