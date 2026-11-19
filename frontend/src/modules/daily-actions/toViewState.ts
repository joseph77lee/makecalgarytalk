import type { CommunityViewState, ShowcaseItem } from '../island-view';
import type { ServerCommunityState } from './api';

/**
 * Server community state → what the island draws. Fields the server does not provide yet
 * are neutral placeholders (no fake numbers): Vitality, unlock conditions and residents
 * arrive with Community State (M5) and Residents (M8).
 */
export function toViewState(s: ServerCommunityState): CommunityViewState {
  // Showcase: one miniature per kind, at the highest completed level.
  const best = new Map<ShowcaseItem['kind'], number>();
  for (const p of s.completed_projects) best.set(p.kind, Math.max(best.get(p.kind) ?? 0, p.level));

  return {
    communityName: s.community.name,
    islandSize: 8, // M5: from cumulative Verified Residents
    vitality: null, // M5
    houses: [], // M8
    buildings: {
      playground: { unlocked: false, remaining: null }, // M5
      'community-centre': { unlocked: false, remaining: null },
      park: { unlocked: false, remaining: null },
    },
    projects: s.projects.slice(0, 3).map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      stage: p.stage,
      progress: Math.min(1, p.progress / p.required),
      level: p.level,
    })),
    showcase: [...best].map(([kind, level]) => ({ kind, level })),
    miniVillagerCount: 3, // ambient placeholder until M5 (min 2–3, §7.3)
    speechBubbles: [],
  };
}
