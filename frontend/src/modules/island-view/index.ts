// Public API of the `island-view` module (M1). Other modules import ONLY from here.
export { IslandView } from './scene/IslandView';
export { IslandHud } from './scene/IslandHud';
export { IslandDevPanel } from './dev/IslandDevPanel';
export { useMockCommunityStore } from './mockStore';
export { parseCommunityViewState, type ParseResult } from './parseState';
export { vitalityMood, type VitalityMood } from './mood';
export { buildIslandLayout, type IslandLayout, type Tile } from './layout';
export type { CommunityViewState, IslandSize, ResidentHouse, ProjectState, SpeechBubble } from './types';
