import { createContext, useContext } from 'react';
import { create } from 'zustand';
import type { BuildCtx } from '../assets/models';
import type { Tile } from '../layout';

export interface IslandCtx extends BuildCtx {
  /** Tiles reachable on foot that are currently shown (not still rising after growth). */
  walkable: Tile[];
  /** "x,z" keys of `walkable`. */
  walkableKeys: Set<string>;
  islandSize: number;
  /** Speech bubble text per mini villager index. */
  villagerBubbles: Map<number, string>;
}

export const IslandContext = createContext<IslandCtx | null>(null);

/** Walkable tiles for characters drawn inside <IslandView> (avatar pathfinding). */
export function useIslandWalkable(): Pick<IslandCtx, 'walkable' | 'walkableKeys' | 'islandSize'> {
  const { walkable, walkableKeys, islandSize } = useIslandCtx();
  return { walkable, walkableKeys, islandSize };
}

export function useIslandCtx(): IslandCtx {
  const ctx = useContext(IslandContext);
  if (!ctx) throw new Error('useIslandCtx must be used inside <IslandView>');
  return ctx;
}

/**
 * Short-lived scene effects. Read with getState() inside useFrame (no re-render).
 * celebrateUntil: performance.now() timestamp until which villagers cheer.
 */
export const useSceneFx = create<{ celebrateUntil: number }>(() => ({ celebrateUntil: 0 }));
