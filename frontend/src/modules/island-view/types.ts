/**
 * Community view state: everything the island needs to draw one community, together with
 * its stored island plan (plan/islandPlan.ts). The island renders purely from these two;
 * no game rules are computed here (requirement.md §7.6, §7.8).
 */

/** Visible mini villagers are capped at 20 (requirement.md §7.3, §20.3a). */
export const MAX_MINI_VILLAGERS = 20;

/**
 * The real world around the island (requirement.md v1.40 §10.4): the sun over Calgary and the
 * city's weather. The scene only shows it; it never changes game state.
 */
export interface IslandEnvironment {
  sun: { azimuthDeg: number; elevationDeg: number };
  weather: 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'snow' | 'mix' | 'fog' | 'thunderstorm';
  wind: 'calm' | 'breezy' | 'windy';
  /** Direction the wind blows from (degrees clockwise from north); null = unknown. */
  windFromDeg: number | null;
  /** Snow lies on roofs, trees and ground. */
  snowCover: boolean;
}

/** A clear winter noon: for previews without live weather. */
export const NOON_CLEAR: IslandEnvironment = {
  sun: { azimuthDeg: 180, elevationDeg: 15.5 },
  weather: 'clear',
  wind: 'calm',
  windFromDeg: null,
  snowCover: false,
};

export interface ResidentHouse {
  /** Stable house id (never a real address or user id). */
  id: string;
  /** Empty for my own house (houses carry no names, requirement v1.48 §7.2); mock and test data may name them. */
  nickname: string;
  /** I helped today (kept for the client's own feedback; lights no longer follow activity). */
  activeToday: boolean;
  /** Fixed house lot from the server (slot order: `houseLotOrder`); mock/example data fills in order. */
  slot?: number;
  /** The community's first Verified Resident. */
  founding?: boolean;
  /** My own house (always marked). */
  mine?: boolean;
}

/** One of today's real actions, replayed by a mini villager (requirement.md §7.3). */
export interface ReplayAction {
  nickname: string;
  title: string;
}

export const BUILDING_STATUSES = ['locked', 'opened', 'building', 'built'] as const;
/** locked: conditions not met · opened: can be built, waiting for a free construction slot · building · built */
export type BuildingStatus = (typeof BUILDING_STATUSES)[number];

export interface Remaining {
  residents: number;
  streakDays: number;
  /** Buildings that must be built first (keys). */
  requires: string[];
  /** Neighbours still needed until the place's lot rises (requirement v1.48 §7.6). */
  landResidents?: number;
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
  /** Today's real actions, newest first (the villagers replay them one by one). */
  replay?: ReplayAction[];
  /** Residents whose houses cannot be drawn (all lots taken by active residents). */
  extraResidents?: number;
}
