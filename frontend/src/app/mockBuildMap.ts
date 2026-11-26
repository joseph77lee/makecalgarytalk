/**
 * Mock mode only (`?mock`): the mock island's build map in the server's shape, so the build map
 * screen can be checked without a server. Statuses come from the dev panel; what is missing is
 * worked out here from the step's conditions (the real game gets it from the server).
 */
import type { ServerCommunityState } from '../modules/daily-actions';
import { BUILDING_TREE, communitySteps, type CommunityViewState, type IslandPlan } from '../modules/island-view';

type ServerBuilding = ServerCommunityState['buildings'][number];

/** Cumulative residents shown for a mock land stage (the stage's lowest count, at least 1). */
export function mockResidents(landStage: number): number {
  return Math.max(1, BUILDING_TREE.landTiers[landStage]?.minResidents ?? 1);
}

export function mockServerBuildings(plan: IslandPlan, state: CommunityViewState, streakDays: number): ServerBuilding[] {
  const residents = mockResidents(state.landStage);
  const steps = communitySteps(plan.code, plan.persona);
  const statusOf = (key: string) => state.buildings.find((b) => b.key === key);
  const built = (key: string) => statusOf(key)?.status === 'built';
  return steps.map((s) => {
    const v = statusOf(s.key);
    const status = v?.status ?? 'locked';
    const prev = steps.find((p) => p.track === s.track && p.step === s.step - 1) ?? (s.track !== 'root' && s.step === 1 ? steps.find((p) => p.track === 'root') : undefined);
    return {
      key: s.key,
      name: s.name,
      track: s.track,
      step: s.step,
      stage: s.stage,
      landmark_order: s.landmarkOrder ?? null,
      tiles: s.tiles,
      site: s.site,
      status,
      level: v?.level ?? 1,
      progress: status === 'built' ? 1 : (v?.progress ?? 0),
      remaining:
        status === 'locked'
          ? { residents: Math.max(0, s.residents - residents), streak_days: Math.max(0, s.streakDays - streakDays), land_residents: 0, requires: prev && !built(prev.key) ? [prev.key] : [] }
          : null,
    };
  });
}
