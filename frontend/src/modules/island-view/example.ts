import { BUILDING_TREE, LAND_STAGE_COUNT } from './plan/buildingTree';
import type { CommunityViewState } from './types';

/** Houses in the example: a busy village, still below the plan's house lots. */
const EXAMPLE_HOUSES = 60;

/**
 * "See a finished example" (requirement.md §5.1, §7.6a): this community's own island with the
 * whole tree built and all land grown. Houses carry no names, so nothing pretends to be a real
 * resident; the screen labels it as an example.
 */
export function finishedExampleState(communityName: string): CommunityViewState {
  return {
    communityName,
    landStage: LAND_STAGE_COUNT - 1,
    vitality: 85,
    houses: Array.from({ length: EXAMPLE_HOUSES }, (_, i) => ({ id: `example-${i}`, nickname: '', activeToday: i % 4 !== 3 })),
    buildings: BUILDING_TREE.buildings.map((b) => ({ key: b.key, status: 'built', level: 1, progress: 1, title: b.name, remaining: null })),
    miniVillagerCount: 16,
    speechBubbles: [],
  };
}
