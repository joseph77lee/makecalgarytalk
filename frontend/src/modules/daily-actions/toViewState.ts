import { BUILDING_TREE, type BuildingView, type CommunityViewState } from '../island-view';
import type { ServerCommunityState } from './api';

const MAX_LAND_STAGE = BUILDING_TREE.landTiers.length - 1;

/**
 * Server community state → what the island draws. The server owns the building tree:
 * every status, level, progress and land stage comes from it unchanged (the client never
 * decides what is unlocked). Vitality arrives with M5 and resident houses with M8.
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
    vitality: null, // M5
    houses: [], // M8
    buildings,
    miniVillagerCount: 3, // ambient placeholder until M5 (min 2–3, §7.3)
    speechBubbles: [],
  };
}
