/**
 * Community view state: everything the island needs to draw one community, together with
 * its stored island plan (plan/islandPlan.ts). The island renders purely from these two;
 * no game rules are computed here (requirement.md §7.6, §7.8).
 */

/** Visible mini villagers are capped at 20 (requirement.md §7.3, §20.3a). */
export const MAX_MINI_VILLAGERS = 20;

export interface ResidentHouse {
  /** Stable resident id (never a real address). */
  id: string;
  nickname: string;
  /** Lights on + chimney smoke when the resident acted today (requirement.md §7.2). */
  activeToday: boolean;
}

export const BUILDING_STATUSES = ['locked', 'opened', 'building', 'built'] as const;
/** locked: conditions not met · opened: can be built, waiting for a free construction slot · building · built */
export type BuildingStatus = (typeof BUILDING_STATUSES)[number];

export interface Remaining {
  residents: number;
  streakDays: number;
  /** Buildings that must be built first (keys). */
  requires: string[];
}

export interface BuildingView {
  /** Building key from the tree, or an unknown key (drawn as a placeholder on a spare lot). */
  key: string;
  status: BuildingStatus;
  /** Upgrade level (1 = first build). */
  level: number;
  /** 0..1 while building (progress applied by the server, shows the next day). */
  progress: number;
  /** Display name (unknown buildings need one). */
  title: string;
  /** What is still missing while locked; null when unknown (shown without conditions). */
  remaining: Remaining | null;
}

export type SpeechAnchor = { kind: 'house'; id: string } | { kind: 'villager'; index: number };

export interface SpeechBubble {
  anchor: SpeechAnchor;
  text: string;
}

export interface CommunityViewState {
  communityName: string;
  /** Land stage 0–5 from cumulative Verified Residents (decided by the server). */
  landStage: number;
  /** 0–100 (requirement.md §7.4). Null until the server provides it: drawn as Normal, no HUD chip. */
  vitality: number | null;
  /** Houses currently shown (archived residents already left out by the server). */
  houses: ResidentHouse[];
  buildings: BuildingView[];
  /** Mini villager count decided by the server (resident count + Vitality), max 20. */
  miniVillagerCount: number;
  speechBubbles: SpeechBubble[];
}
