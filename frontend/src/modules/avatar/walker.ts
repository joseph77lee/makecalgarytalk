/**
 * Avatar walking state, kept outside React so it can run in useFrame (refs, no
 * re-renders) and be simulated in tests. The avatar always stands on or moves
 * between walkable tiles; it finishes the current step before following a new path.
 */
import type { Tile } from '../island-view';
import { canStep, findPath, nearestWalkable } from './pathfinding';

const key = (t: Tile) => `${t.x},${t.z}`;

export interface WalkFrame {
  /** World position of the avatar's feet. */
  x: number;
  z: number;
  moving: boolean;
  /** Direction of the current step (for facing). */
  dx: number;
  dz: number;
  /** Event seq whose destination was just reached this frame, if any. */
  arrivedSeq: number | null;
}

export class AvatarWalker {
  from: Tile;
  to: Tile;
  /** Progress of the current step, 0..1 (1 = standing on `to`). */
  t = 1;
  path: Tile[] = [];
  destination: Tile | null = null;
  private seq = 0;
  private arrivalPending = false;
  private walkable: ReadonlySet<string> = new Set();
  private walkableList: readonly Tile[] = [];

  constructor(start: Tile) {
    this.from = start;
    this.to = start;
  }

  /** Seq of the destination event currently being followed. */
  get currentSeq(): number {
    return this.seq;
  }

  /** The tile the avatar stands on, or is stepping onto. */
  get tile(): Tile {
    return this.to;
  }

  /** Update the walkable tiles (island changed). Re-plans or rescues the avatar if needed. */
  setWalkable(keys: ReadonlySet<string>, list: readonly Tile[]): void {
    this.walkable = keys;
    this.walkableList = list;
    if (!keys.has(key(this.to))) {
      // Standing on a tile that became blocked (e.g. a new house): move to the nearest free tile.
      const rescue = nearestWalkable(list, this.to, this.to);
      if (rescue) {
        this.from = this.to = rescue;
        this.t = 1;
      }
    }
    if (this.path.some((t) => !keys.has(key(t))) && this.destination) {
      this.planTo(this.destination);
    }
  }

  /** Handle a destination event. Returns the resolved goal, or null if nothing is reachable. */
  plan(target: Tile, seq: number): Tile | null {
    this.seq = seq;
    return this.planTo(target);
  }

  private planTo(target: Tile): Tile | null {
    const goal = this.walkable.has(key(target)) ? target : nearestWalkable(this.walkableList, target, this.to);
    if (!goal) return null;
    const path = findPath(this.walkable, this.to, goal);
    if (path === null) return null;
    this.path = path;
    this.destination = goal;
    this.arrivalPending = true;
    return goal;
  }

  /** Try one keyboard step: the first candidate direction that is allowed. Only when idle. */
  tryStep(candidates: readonly Tile[], seq: number): Tile | null {
    if (this.t < 1 || this.path.length > 0) return null;
    const d = candidates.find((c) => canStep(this.walkable, this.to, c));
    if (!d) return null;
    const next = { x: this.to.x + d.x, z: this.to.z + d.z };
    this.seq = seq;
    this.path = [next];
    this.destination = next;
    this.arrivalPending = true;
    return next;
  }

  /** Advance by dt seconds at `speed` tiles per second. */
  update(dt: number, speed: number): WalkFrame {
    let arrivedSeq: number | null = null;
    let budget = dt * speed;
    while (budget > 0) {
      if (this.t >= 1) {
        const next = this.path.shift();
        if (!next) break;
        if (!canStep(this.walkable, this.to, { x: next.x - this.to.x, z: next.z - this.to.z })) {
          // The world changed under the path: re-plan from here.
          this.path = [];
          if (this.destination) this.planTo(this.destination);
          break;
        }
        this.from = this.to;
        this.to = next;
        this.t = 0;
      }
      const len = Math.hypot(this.to.x - this.from.x, this.to.z - this.from.z) || 1;
      const need = (1 - this.t) * len;
      if (budget >= need) {
        budget -= need;
        this.t = 1;
      } else {
        this.t += budget / len;
        budget = 0;
      }
    }
    if (this.t >= 1 && this.path.length === 0 && this.arrivalPending) {
      this.arrivalPending = false;
      this.destination = null;
      arrivedSeq = this.seq;
    }
    return {
      x: this.from.x + (this.to.x - this.from.x) * this.t + 0.5,
      z: this.from.z + (this.to.z - this.from.z) * this.t + 0.5,
      moving: this.t < 1,
      dx: this.to.x - this.from.x,
      dz: this.to.z - this.from.z,
      arrivedSeq,
    };
  }
}
