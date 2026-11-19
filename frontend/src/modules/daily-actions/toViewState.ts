import { BUILDING_TREE, type BuildingView, type CommunityViewState } from '../island-view';
import type { ServerCommunityState } from './api';

/**
 * Server community state → what the island draws. Until the building tree is on the server
 * (M3 rework), the server's projects are buildings the tree does not know: the island draws
 * them with the placeholder model on spare lots. Tree buildings show as locked silhouettes
 * without conditions; Vitality, land stage and residents arrive with M5 / M8.
 */
export function toViewState(s: ServerCommunityState): CommunityViewState {
  const buildings: BuildingView[] = BUILDING_TREE.buildings.map((b) => ({
    key: b.key,
    status: 'locked',
    level: 1,
    progress: 0,
    title: b.name,
    remaining: null,
  }));
  const seen = new Set(buildings.map((b) => b.key));
  for (const p of s.projects.slice(0, 3)) {
    if (seen.has(p.kind)) continue;
    seen.add(p.kind);
    buildings.push({ key: p.kind, status: 'building', level: p.level, progress: Math.min(1, p.progress / p.required), title: p.title, remaining: null });
  }
  // Completed projects: one built placeholder per kind at its highest level.
  const best = new Map<string, { level: number; title: string }>();
  for (const p of s.completed_projects) if ((best.get(p.kind)?.level ?? 0) < p.level) best.set(p.kind, { level: p.level, title: p.title });
  for (const [kind, v] of best) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    buildings.push({ key: kind, status: 'built', level: v.level, progress: 1, title: v.title, remaining: null });
  }
  return {
    communityName: s.community.name,
    // M5: from cumulative Verified Residents. Stage 2 until then, so the server's projects
    // (unknown buildings until the M3 rework) have spare / Main Street lots to stand on.
    landStage: 2,
    vitality: null, // M5
    houses: [], // M8
    buildings,
    miniVillagerCount: 3, // ambient placeholder until M5 (min 2–3, §7.3)
    speechBubbles: [],
  };
}
