import { BUILDING_TREE, LAND_STAGE_COUNT } from './plan/buildingTree';
import type { CommunityViewState } from './types';

/** No residents' houses in the example: every house lot shows an ordinary house (houses are scenery, v1.48 §7.2). */
const EXAMPLE_HOUSES = 0;

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
