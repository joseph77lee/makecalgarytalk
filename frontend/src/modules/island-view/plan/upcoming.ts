/**
 * What makes the community look like itself and appears with the next land (requirement.md §7.9):
 * signature features on spare lots and CTrain stations, grouped by the land stage they arrive with.
 */
import { BUILDING_TREE } from './buildingTree';
import { featureLabel, featuresFor, type CommunityFeature } from './features';
import { lotTiles, stageMap, tileKey, type IslandPlan } from './islandPlan';

export interface UpcomingIdentity {
  /** Land stage (0–5) at which these appear. */
  landStage: number;
  labels: string[];
}

/** Features and stations still to come, at the nearest land stage after `landStage` that has any. */
export function upcomingIdentity(plan: IslandPlan, landStage: number, features: CommunityFeature[] = featuresFor(plan.code)): UpcomingIdentity | null {
  const stages = stageMap(plan);
  const stageOfTiles = (tiles: { x: number; z: number }[], min = 0) => Math.max(min, ...tiles.map((t) => stages.get(tileKey(t)) ?? 99));
  const items: { stage: number; label: string }[] = [];
  const spares = Object.entries(BUILDING_TREE.lots).filter(([, v]) => v.kind === 'spare');
  features.forEach((f, i) => {
    const spare = spares[i];
    if (!spare) return;
    const [key, spec] = spare;
    items.push({ stage: stageOfTiles(lotTiles(plan.lots[key]), spec.landStage), label: featureLabel(f) });
  });
  for (const st of plan.stations) items.push({ stage: stageOfTiles(lotTiles(st.rect)), label: `🚉 ${st.name}` });
  const later = items.filter((x) => x.stage > landStage);
  if (later.length === 0) return null;
  const next = Math.min(...later.map((x) => x.stage));
  return { landStage: next, labels: later.filter((x) => x.stage === next).map((x) => x.label) };
}
