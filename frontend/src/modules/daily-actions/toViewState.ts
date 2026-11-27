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
    remaining: b.remaining && { residents: b.remaining.residents, streakDays: b.remaining.streak_days, landResidents: b.remaining.land_residents, requires: b.remaining.requires },
  }));
  return {
    communityName: s.community.name,
    // Clamped so a server with more tiers than this build's plan files still draws.
    landStage: Math.min(s.community.land_stage, MAX_LAND_STAGE),
    vitality: s.community.vitality,
    // Houses are scenery (requirement v1.48 §7.2): the island fills every house lot; only my own
    // house is marked, on my fixed slot. Nobody else's house is listed.
    houses: mySlot === null ? [] : [{ id: 'my-house', slot: mySlot, nickname: '', activeToday: actedToday, founding: false, mine: true }],
    extraResidents: 0,
    replay: s.today_actions.map((a) => ({ nickname: a.nickname, title: a.title })),
    buildings,
    miniVillagerCount: Math.min(MAX_MINI_VILLAGERS, s.community.mini_villagers),
    speechBubbles: [],
  };
}
