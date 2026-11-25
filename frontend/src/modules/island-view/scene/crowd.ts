/**
 * Who stands where: every walker (the avatar, mini villagers, visiting animals) claims the tile
 * it stands on and the tile it is stepping onto, so nobody walks through anybody else. Plain
 * mutable data read and written inside useFrame (no React state, no re-render).
 */
export class Crowd {
  private claims = new Map<string, readonly string[]>();

  /** Replace what `id` claims (tile keys "x,z"). */
  claim(id: string, keys: readonly string[]): void {
    this.claims.set(id, keys);
  }

  release(id: string): void {
    this.claims.delete(id);
  }

  /** Whether someone other than `id` has claimed the tile. */
  takenByOther(key: string, id: string): boolean {
    for (const [who, keys] of this.claims) if (who !== id && keys.includes(key)) return true;
    return false;
  }

  /** Who has claimed the tile. */
  whoAt(key: string): string[] {
    const out: string[] = [];
    for (const [who, keys] of this.claims) if (keys.includes(key)) out.push(who);
    return out;
  }

  /** Every walker with the tiles it claims. */
  entries(): [string, readonly string[]][] {
    return [...this.claims];
  }

  /** Every tile claimed by someone other than `id`. */
  othersTiles(id: string): Set<string> {
    const out = new Set<string>();
    for (const [who, keys] of this.claims) if (who !== id) for (const k of keys) out.add(k);
    return out;
  }
}

/**
 * The walker a tap points at (requirement.md v1.44 §10.5): the one whose body (the centre of its
 * tile, raised to body height) lies closest to the tap's ray, within `reach` tiles. Walkers stand
 * above the ground, so the ray meets the ground behind them; testing the body works from any angle.
 */
export function walkerOnRay(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  walkers: [string, readonly string[]][],
  accept: (id: string) => boolean,
  reach = 0.6,
  bodyHeight = 0.4,
): string | null {
  const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
  const d = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
  let best: string | null = null;
  let bestDist = reach;
  for (const [id, keys] of walkers) {
    if (!accept(id)) continue;
    for (const key of keys) {
      const [tx, tz] = key.split(',').map(Number);
      const px = tx + 0.5 - origin.x;
      const py = bodyHeight - origin.y;
      const pz = tz + 0.5 - origin.z;
      const along = px * d.x + py * d.y + pz * d.z;
      if (along < 0) continue;
      const dist = Math.hypot(px - along * d.x, py - along * d.y, pz - along * d.z);
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }
  }
  return best;
}
