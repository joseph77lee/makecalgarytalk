/** Sound switches (requirement.md v1.43 §10.5): music and effects separately, remembered on the device. */
import { create } from 'zustand';

const KEY = 'mct.sound';

export interface SoundSettings {
  music: boolean;
  effects: boolean;
}

export const DEFAULT_SETTINGS: SoundSettings = { music: true, effects: true };

export function readSettings(storage: Pick<Storage, 'getItem'> | null): SoundSettings {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const o = JSON.parse(raw) as Partial<SoundSettings>;
    return { music: o.music !== false, effects: o.effects !== false };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export const useSoundSettings = create<SoundSettings & { set: (patch: Partial<SoundSettings>) => void }>((set, get) => ({
  ...readSettings(storage()),
  set(patch) {
    set(patch);
    try {
      storage()?.setItem(KEY, JSON.stringify({ music: get().music, effects: get().effects }));
    } catch {
      // per-device convenience only
    }
  },
}));
