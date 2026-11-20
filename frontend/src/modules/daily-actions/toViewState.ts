import { BUILDING_TREE, MAX_MINI_VILLAGERS, type BuildingView, type CommunityViewState } from '../island-view';
import type { ServerCommunityState } from './api';

const MAX_LAND_STAGE = BUILDING_TREE.landTiers.length - 1;

/**
 * Server community state → what the island draws. The server owns the building tree:
 * every status, level, progress and land stage comes from it unchanged (the client never
 * decides what is unlocked). `actedToday`: I helped today (my window lights up at once, before
 * the next snapshot).
 */
export function toViewState(s: ServerCommunityState, actedToday = false): CommunityViewState {
  const mySlot = s.me?.house_slot ?? null;
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
    houses: s.houses.map((h) => ({
      id: `slot-${h.slot}`,
      slot: h.slot,
      nickname: h.nickname,
      activeToday: h.active_today || (h.slot === mySlot && actedToday),
      founding: h.founding,
      mine: h.slot === mySlot,
    })),
    extraResidents: s.hidden_houses,
    replay: s.today_actions.map((a) => ({ nickname: a.nickname, title: a.title })),
    buildings,
    miniVillagerCount: Math.min(MAX_MINI_VILLAGERS, s.community.mini_villagers),
    speechBubbles: [],
  };
}
