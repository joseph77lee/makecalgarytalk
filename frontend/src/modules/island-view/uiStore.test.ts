import { afterEach, describe, expect, it, vi } from 'vitest';

describe('island labels toggle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('defaults to showing labels and remembers the choice', async () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    const { useIslandUi } = await import('./uiStore');
    expect(useIslandUi.getState().showLabels).toBe(true);
    useIslandUi.getState().setShowLabels(false);
    expect(useIslandUi.getState().showLabels).toBe(false);
    vi.resetModules();
    const again = await import('./uiStore');
    expect(again.useIslandUi.getState().showLabels).toBe(false);
  });

  it('still works when storage throws (private mode)', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const { useIslandUi } = await import('./uiStore');
    expect(useIslandUi.getState().showLabels).toBe(true);
    useIslandUi.getState().setShowLabels(false);
    expect(useIslandUi.getState().showLabels).toBe(false);
  });
});
