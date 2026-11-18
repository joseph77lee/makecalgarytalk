/**
 * Avatar movement as destination events (requirement.md §10.2, §20.3 #6):
 * "avatar X moves to tile (x, z)". The path is computed on the client from the
 * island's walkable tiles. Events stay local in the MVP; the same events can be
 * broadcast for real-time presence later (§22.3). Never per-frame positions.
 */
import { create } from 'zustand';
import type { Tile } from '../island-view';

export interface DestinationEvent {
  avatarId: string;
  to: Tile;
  /** Increments per event; lets listeners tell repeated taps on one tile apart. */
  seq: number;
  /** Client time (ms since epoch). */
  at: number;
}

interface AvatarStore {
  avatarId: string;
  lastEvent: DestinationEvent | null;
  /** Set when the avatar reaches the end of the path for event `seq` (M4: act after arriving). */
  arrival: { seq: number; tile: Tile } | null;
  /** Called by the avatar renderer; not part of the movement API. */
  reportArrival: (seq: number, tile: Tile) => void;
  /** Ask the avatar to walk to a tile (blocked tiles resolve to the nearest reachable one). */
  moveTo: (to: Tile) => DestinationEvent;
}

export const useAvatarStore = create<AvatarStore>((set, get) => ({
  // Local dev avatar until Identity (M6) provides the real user id.
  avatarId: 'local',
  lastEvent: null,
  arrival: null,
  reportArrival: (seq, tile) => set({ arrival: { seq, tile } }),
  moveTo: (to) => {
    const event: DestinationEvent = {
      avatarId: get().avatarId,
      to: { x: Math.trunc(to.x), z: Math.trunc(to.z) },
      seq: (get().lastEvent?.seq ?? 0) + 1,
      at: Date.now(),
    };
    set({ lastEvent: event });
    return event;
  },
}));

/** Public movement API: `moveTo({ x, z })`. Usable from anywhere (M4 actions use it). */
export const moveTo = (to: Tile): DestinationEvent => useAvatarStore.getState().moveTo(to);
