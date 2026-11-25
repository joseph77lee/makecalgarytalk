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

  /** Every tile claimed by someone other than `id`. */
  othersTiles(id: string): Set<string> {
    const out = new Set<string>();
    for (const [who, keys] of this.claims) if (who !== id) for (const k of keys) out.add(k);
    return out;
  }
}
