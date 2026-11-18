/**
 * M1 only: the island is fed from a mock JSON file (no backend yet).
 * M4 replaces this store with real community state from the server.
 */
import { create } from 'zustand';
import mock from './mockCommunityState.json';
import { parseCommunityViewState } from './parseState';
import type { CommunityViewState } from './types';

function loadMock(): CommunityViewState {
  const result = parseCommunityViewState(mock);
  if (!result.ok) {
    throw new Error(`mockCommunityState.json is invalid:\n- ${result.errors.join('\n- ')}`);
  }
  return result.state;
}

interface MockCommunityStore {
  state: CommunityViewState;
  update: (fn: (s: CommunityViewState) => CommunityViewState) => void;
  reset: () => void;
}

/** Drops speech bubbles whose house or villager no longer exists. */
function dropDanglingBubbles(s: CommunityViewState): CommunityViewState {
  const houses = new Set(s.houses.map((h) => h.id));
  return {
    ...s,
    speechBubbles: s.speechBubbles.filter((b) =>
      b.anchor.kind === 'house' ? houses.has(b.anchor.id) : b.anchor.index < s.miniVillagerCount,
    ),
  };
}

export const useMockCommunityStore = create<MockCommunityStore>((set) => ({
  state: loadMock(),
  update: (fn) => set((store) => ({ state: dropDanglingBubbles(fn(store.state)) })),
  reset: () => set({ state: loadMock() }),
}));
