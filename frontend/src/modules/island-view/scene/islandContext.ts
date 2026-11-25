import { createContext, useContext } from 'react';
import { create } from 'zustand';
import type { BuildCtx } from '../assets/models';
import type { Tile } from '../layout';
import type { Crowd } from './crowd';

export interface IslandCtx extends BuildCtx {
  /** Tiles reachable on foot that are currently shown (not still rising after growth). */
  walkable: Tile[];
  /** "x,z" keys of `walkable`. */
  walkableKeys: Set<string>;
  /** Land stage fully shown (rising land excluded). */
  landStage: number;
  /** Speech bubble text per mini villager index. */
  villagerBubbles: Map<number, string>;
  /** Tiles claimed by walkers (avatar, villagers, animals), so nobody walks through anybody. */
  crowd: Crowd;
}

export const IslandContext = createContext<IslandCtx | null>(null);

/** Walkable tiles for characters drawn inside <IslandView> (avatar pathfinding). */
export function useIslandWalkable(): Pick<IslandCtx, 'walkable' | 'walkableKeys' | 'landStage'> {
  const { walkable, walkableKeys, landStage } = useIslandCtx();
  return { walkable, walkableKeys, landStage };
}

/** The island's crowd, for walkers drawn inside <IslandView> by other modules (the avatar). */
export function useIslandCrowd(): Crowd {
  return useIslandCtx().crowd;
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
export const useSceneFx = create<{ celebrateUntil: number; bloomUntil: number }>(() => ({ celebrateUntil: 0, bloomUntil: 0 }));

/** Make the mini villagers cheer for `ms` (e.g. after an action). */
export function celebrateIsland(ms = 1500): void {
  useSceneFx.setState({ celebrateUntil: performance.now() + ms });
}

/** Community Revival (requirement.md v1.31 §7.4): villagers cheer and flowers bloom for `ms`. */
export function reviveIsland(ms = 7000): void {
  const until = performance.now() + ms;
  useSceneFx.setState({ celebrateUntil: until, bloomUntil: until });
}
