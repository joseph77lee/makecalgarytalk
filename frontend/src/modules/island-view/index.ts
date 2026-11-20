// Public API of the `island-view` module (M1). Other modules import ONLY from here.
export { IslandView } from './scene/IslandView';
export { celebrateIsland, useIslandWalkable } from './scene/islandContext';
export { useShowIslandLabels } from './uiStore';
export { useHtmlPortal } from './scene/htmlPortal';
export { setCameraFocus, clearCameraFocus } from './scene/cameraFocus';
export { IslandHud } from './scene/IslandHud';
export { IslandDevPanel } from './dev/IslandDevPanel';
export { useMockCommunityStore } from './mockStore';
export { parseCommunityViewState, type ParseResult } from './parseState';
export { vitalityMood, type VitalityMood } from './mood';
export { buildIslandLayout, buildingSiteTile, tileKey, type IslandLayout, type Tile } from './layout';
export { loadIslandPlan } from './plan/loadPlan';
export { decodePlan, walkableTiles, type IslandPlan } from './plan/islandPlan';
export { BUILDING_TREE, buildingSpec, landStageForResidents, type BuildingSpec } from './plan/buildingTree';
export type { BuildingStatus, BuildingView, CommunityViewState, Remaining, ResidentHouse, SpeechBubble } from './types';
