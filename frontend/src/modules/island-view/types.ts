/**
 * Community view state: everything the island needs to draw one community.
 * M1 feeds it from a mock JSON file; M4/M5 will feed it from the server snapshot.
 * The island renders purely from this object (no game rules are computed here).
 */

/** Island size tiers (requirement.md §7.8). The server decides the tier. */
export const ISLAND_SIZES = [8, 12, 16, 20, 26, 32] as const;
export type IslandSize = (typeof ISLAND_SIZES)[number];
export const MAX_ISLAND_SIZE: IslandSize = 32;

/** Community unlock buildings (requirement.md §7.6). */
export const BUILDING_KINDS = ['playground', 'community-centre', 'park'] as const;
export type BuildingKind = (typeof BUILDING_KINDS)[number];

/** Project kinds in catalog order (requirement.md §7.7; same list as gamecore.project_catalog). */
export const PROJECT_KINDS = [
  'ice-rink',
  'flower-path',
  'holiday-decorations',
  'snowman-garden',
  'lantern-street',
  'bird-feeders',
] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

/** Construction visuals of an active project; completed projects move to the showcase (§7.7). */
export const PROJECT_STAGES = ['scaffolding', 'frame'] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

/** A community has 2–3 active projects at a time (requirement.md §7.7). */
export const MAX_ACTIVE_PROJECTS = 3;

/** Visible mini villagers are capped at 20 (requirement.md §7.3, §20.3a). */
export const MAX_MINI_VILLAGERS = 20;

export interface ResidentHouse {
  /** Stable resident id (never a real address). */
  id: string;
  nickname: string;
  /** Lights on + chimney smoke when the resident acted today (requirement.md §7.2). */
  activeToday: boolean;
}

export type BuildingState =
  | { unlocked: true }
  | {
      unlocked: false;
      /** What is still missing; shown on the silhouette (§7.6). Null until the server provides it (M5). */
      remaining: { streakDays: number; residents: number } | null;
    };

export interface ProjectState {
  id: string;
  kind: ProjectKind;
  title: string;
  stage: ProjectStage;
  /** Catalog cycle (1, 2, ...); shown as "Lv 2" from level 2. */
  level: number;
  /** 0..1, already applied by the server (progress shows the next day). */
  progress: number;
}

export interface ShowcaseItem {
  kind: ProjectKind;
  level: number;
}

export type SpeechAnchor = { kind: 'house'; id: string } | { kind: 'villager'; index: number };

export interface SpeechBubble {
  anchor: SpeechAnchor;
  text: string;
}

export interface CommunityViewState {
  communityName: string;
  islandSize: IslandSize;
  /** 0–100 (requirement.md §7.4). Null until the server provides it (M5): drawn as Normal, not shown in the HUD. */
  vitality: number | null;
  /** Houses currently shown (archived residents are already left out by the server). */
  houses: ResidentHouse[];
  buildings: Record<BuildingKind, BuildingState>;
  /** Active projects (up to 3), drawn as construction sites. */
  projects: ProjectState[];
  /** Completed projects: one miniature per kind at its highest completed level. */
  showcase: ShowcaseItem[];
  /** Mini villager count decided by the server (resident count + Vitality), max 20. */
  miniVillagerCount: number;
  speechBubbles: SpeechBubble[];
}
