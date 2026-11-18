/**
 * Island view preferences for this viewer (not game state).
 * showLabels: speech bubbles, name tags, construction progress and lock hints.
 * Remembered in localStorage as a convenience; the app works without it.
 */
import { create } from 'zustand';

const KEY = 'mct.island.showLabels';

function readShowLabels(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) !== 'false';
  } catch {
    return true;
  }
}

interface IslandUi {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
}

export const useIslandUi = create<IslandUi>((set) => ({
  showLabels: readShowLabels(),
  setShowLabels: (show) => {
    try {
      globalThis.localStorage?.setItem(KEY, String(show));
    } catch {
      // Private mode or blocked storage: keep the choice for this session only.
    }
    set({ showLabels: show });
  },
}));

/** Whether island overlays (labels, bubbles) are shown; for overlays drawn by other modules. */
export const useShowIslandLabels = (): boolean => useIslandUi((u) => u.showLabels);
