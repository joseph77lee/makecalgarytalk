/**
 * Mock mode (`?mock`): the island fed from a mock JSON file and Mahogany's stored plan,
 * editable in the dev panel. No server needed.
 */
import { create } from 'zustand';
import mock from './mockCommunityState.json';
import { parseCommunityViewState } from './parseState';
import { loadIslandPlan } from './plan/loadPlan';
import type { IslandPlan } from './plan/islandPlan';
import type { CommunityViewState } from './types';

export const MOCK_PLAN_CODE = 'MAH';

function loadMock(): CommunityViewState {
  const result = parseCommunityViewState(mock);
  if (!result.ok) throw new Error(`mockCommunityState.json is invalid:\n- ${result.errors.join('\n- ')}`);
  return result.state;
}

interface MockCommunityStore {
  state: CommunityViewState;
  plan: IslandPlan | null;
  loadPlan: (code?: string) => Promise<void>;
  update: (fn: (s: CommunityViewState) => CommunityViewState) => void;
  reset: () => void;
}

/** Drops speech bubbles whose house or villager no longer exists. */
function dropDanglingBubbles(s: CommunityViewState): CommunityViewState {
  const houses = new Set(s.houses.map((h) => h.id));
  return {
    ...s,
    speechBubbles: s.speechBubbles.filter((b) => (b.anchor.kind === 'house' ? houses.has(b.anchor.id) : b.anchor.index < s.miniVillagerCount)),
  };
}

export const useMockCommunityStore = create<MockCommunityStore>((set) => ({
  state: loadMock(),
  plan: null,
  loadPlan: async (code = MOCK_PLAN_CODE) => set({ plan: await loadIslandPlan(code) }),
  update: (fn) => set((store) => ({ state: dropDanglingBubbles(fn(store.state)) })),
  reset: () => set({ state: loadMock() }),
}));
