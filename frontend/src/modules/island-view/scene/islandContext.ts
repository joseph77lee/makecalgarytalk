import { createContext, useContext } from 'react';
import { create } from 'zustand';
import { playSound } from '../../sound';
import type { BuildCtx } from '../assets/models';
import type { Tile } from '../layout';
import type { VitalityMood } from '../mood';
import type { Crowd } from './crowd';

/** Whether snow lies on the island (footsteps sound different, §10.5). */
export function useIslandSnow(): boolean {
  return useIslandCtx().snow;
}

export interface IslandCtx extends BuildCtx {
  /** Vitality mood: drives only the mini villagers now (requirement.md v1.40 §7.4). */
  mood: VitalityMood;
  /** The mood's base villager walking speed (tiles per second). */
  villagerSpeed: number;
  /** Lamps and public windows on (night, storms; §10.4). */
  lightsOn: boolean;
  /** Tiles reachable on foot that are currently shown (not still rising after growth). */
  walkable: Tile[];
  /** "x,z" keys of `walkable`. */
  walkableKeys: Set<string>;
  /** Land stage fully shown (rising land excluded). */
  landStage: number;
  /** Speech bubble text per mini villager index. */
  villagerBubbles: Map<number, string>;
  /** Tap handlers for villager bubbles that open something (today's posts). */
  villagerBubbleTaps: Map<number, () => void>;
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

/** A new building (requirement.md v1.41 §7.4, §12.2): villagers cheer and flowers bloom for `ms`. */
export function celebrateNewBuilding(ms = 7000): void {
  playSound('celebrate-built');
  playSound('crowd-cheer', { delay: 0.6 });
  const until = performance.now() + ms;
  useSceneFx.setState({ celebrateUntil: until, bloomUntil: until });
}

// Tapping a villager or an animal makes it hop (requirement.md v1.44 §10.5). Read in useFrame.
const pokes = new Map<string, number>();
const HOP_MS = 450;

export function pokeWalker(id: string): void {
  pokes.set(id, performance.now());
}

/** Extra height of a poked walker right now (a quick hop), 0 when not poked. */
export function pokeHop(id: string, now: number = performance.now()): number {
  const at = pokes.get(id);
  if (at === undefined) return 0;
  const k = (now - at) / HOP_MS;
  if (k >= 1) {
    pokes.delete(id);
    return 0;
  }
  return Math.sin(k * Math.PI) * 0.28;
}

/** The sound a walker makes when tapped, from its crowd id (`villager:3`, `animal:deer:7`). */
export function walkerSound(id: string): 'villager-hello' | 'geese-honk' | 'deer-call' | 'cougar-growl' | 'rabbit-hop' | null {
  if (id.startsWith('villager:')) return 'villager-hello';
  const kind = id.startsWith('animal:') ? id.split(':')[1] : null;
  if (kind === 'goose') return 'geese-honk';
  if (kind === 'deer') return 'deer-call';
  if (kind === 'cougar') return 'cougar-growl';
  if (kind === 'jackrabbit') return 'rabbit-hop';
  return null;
}
