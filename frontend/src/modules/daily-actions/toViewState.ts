import { BUILDING_TREE, MAX_MINI_VILLAGERS, type BuildingView, type CommunityViewState } from '../island-view';
import type { ServerCommunityState } from './api';

const MAX_LAND_STAGE = BUILDING_TREE.landTiers.length - 1;

/**
 * Server community state → what the island draws. The server owns the building tree:
 * every status, level, progress and land stage comes from it unchanged (the client never
 * decides what is unlocked). Resident houses arrive with M8.
 */
export function toViewState(s: ServerCommunityState): CommunityViewState {
  const buildings: BuildingView[] = s.buildings.map((b) => ({
    key: b.key,
    status: b.status,
    level: b.level,
    progress: b.progress,
    title: b.name,
    remaining: b.remaining && { residents: b.remaining.residents, streakDays: b.remaining.streak_days, requires: b.remaining.requires },
  }));
  return {
    communityName: s.community.name,
    // Clamped so a server with more tiers than this build's plan files still draws.
    landStage: Math.min(s.community.land_stage, MAX_LAND_STAGE),
    vitality: s.community.vitality,
    houses: [], // M8
    buildings,
    miniVillagerCount: Math.min(MAX_MINI_VILLAGERS, s.community.mini_villagers),
    speechBubbles: [],
  };
}
