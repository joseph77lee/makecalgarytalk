import { createContext, useContext } from 'react';
import { create } from 'zustand';
import type { BuildCtx } from '../assets/models';

export interface IslandCtx extends BuildCtx {
  /** "x,z" keys of tiles reachable on foot. */
  walkableKeys: Set<string>;
  /** Speech bubble text per mini villager index. */
  villagerBubbles: Map<number, string>;
}

export const IslandContext = createContext<IslandCtx | null>(null);

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
