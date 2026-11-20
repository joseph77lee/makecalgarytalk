import { BUILDING_TREE, buildingSpec, type BuildingView } from '../island-view';

export const STAGE_NAMES: Record<number, string> = {
  1: 'First day',
  2: 'First week',
  3: 'Together',
  4: 'Community',
  5: 'Pride',
};

/** A building counts as built once its first level is done (an upgrade keeps it built). */
export const isBuilt = (b: BuildingView): boolean => b.status === 'built' || (b.status === 'building' && b.level > 1);

/** Community completion % (§7.6a): built buildings of the tree. */
export function completionPercent(buildings: BuildingView[]): number {
  const tree = buildings.filter((b) => buildingSpec(b.key));
  if (tree.length === 0) return 0;
  return Math.round((tree.filter(isBuilt).length / tree.length) * 100);
}

/** Buildings grouped by tree stage, in tree order; unknown buildings last. */
export function groupByStage(buildings: BuildingView[]): { stage: number | null; name: string; buildings: BuildingView[] }[] {
  const order = new Map(BUILDING_TREE.buildings.map((b, i) => [b.key, i]));
  const sorted = [...buildings].sort((a, b) => (order.get(a.key) ?? 1e9) - (order.get(b.key) ?? 1e9));
  const groups = new Map<number | null, BuildingView[]>();
  for (const b of sorted) {
    const stage = buildingSpec(b.key)?.stage ?? null;
    groups.set(stage, [...(groups.get(stage) ?? []), b]);
  }
  return [...groups.entries()].map(([stage, list]) => ({ stage, name: stage === null ? 'New buildings' : `${stage}. ${STAGE_NAMES[stage] ?? `Stage ${stage}`}`, buildings: list }));
}
