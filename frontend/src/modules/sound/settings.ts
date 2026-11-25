/**
 * Sound settings (requirement.md v1.44 §10.5): music, ambience and effects each with an on/off
 * switch and a volume (0..1), remembered on the device.
 */
import { create } from 'zustand';

const KEY = 'mct.sound';
export const CHANNELS = ['music', 'ambience', 'effects'] as const;
export type Channel = (typeof CHANNELS)[number];

export interface SoundSettings {
  on: Record<Channel, boolean>;
  volume: Record<Channel, number>;
}

export const DEFAULT_SETTINGS: SoundSettings = {
  on: { music: true, ambience: true, effects: true },
  volume: { music: 1, ambience: 1, effects: 1 },
};

const clamp01 = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);

/** Reads saved settings; also understands the first version ({music, effects} booleans). */
export function readSettings(storage: Pick<Storage, 'getItem'> | null): SoundSettings {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const o = JSON.parse(raw) as { music?: unknown; effects?: unknown; on?: Partial<Record<Channel, unknown>>; volume?: Partial<Record<Channel, unknown>> };
    const legacyEffects = o.effects !== false;
    const on = {
      music: (o.on?.music ?? o.music) !== false,
      ambience: (o.on?.ambience ?? legacyEffects) !== false,
      effects: (o.on?.effects ?? o.effects) !== false,
    };
    const volume = {
      music: clamp01(o.volume?.music, 1),
      ambience: clamp01(o.volume?.ambience, 1),
      effects: clamp01(o.volume?.effects, 1),
    };
    return { on, volume };
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

interface Store extends SoundSettings {
  setOn: (channel: Channel, on: boolean) => void;
  setVolume: (channel: Channel, volume: number) => void;
}

export const useSoundSettings = create<Store>((set, get) => {
  const save = () => {
    try {
      storage()?.setItem(KEY, JSON.stringify({ on: get().on, volume: get().volume }));
    } catch {
      // per-device convenience only
    }
  };
  return {
    ...readSettings(storage()),
    setOn(channel, on) {
      set({ on: { ...get().on, [channel]: on } });
      save();
    },
    setVolume(channel, volume) {
      set({ volume: { ...get().volume, [channel]: clamp01(volume, 1) } });
      save();
    },
  };
});
