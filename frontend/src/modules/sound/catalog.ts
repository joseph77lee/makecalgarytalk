/**
 * Every sound file the game uses (requirement.md v1.43 §10.5), in `public/sfx/<name>.mp3`.
 * Volumes are relative (0..1) inside each bus; a missing file is skipped silently.
 */

export const EFFECTS = {
  'ui-click': { volume: 0.5 },
  'ui-select': { volume: 0.5 },
  'ui-confirm': { volume: 0.55 },
  'ui-error': { volume: 0.45 },
  'ui-place': { volume: 0.45 },
  'ui-back': { volume: 0.45 },
  'ui-close': { volume: 0.45 },
  footsteps: { volume: 0.75, gap: 0.2 },
  'footsteps-snow': { volume: 0.8, gap: 0.2 },
  'action-shovel': { volume: 0.55 },
  'action-sweep': { volume: 0.5 },
  'construction-hammer-roof': { volume: 0.5 },
  'celebrate-built': { volume: 0.6, gap: 2 },
  'crowd-cheer': { volume: 0.45, gap: 2 },
  'land-rise': { volume: 0.55, gap: 2 },
  'house-knock': { volume: 0.6 },
  'paper-open': { volume: 0.6 },
  'bubble-pop': { volume: 0.25, gap: 1 },
  'map-whoosh': { volume: 0.45 },
  thunder: { volume: 0.55, gap: 3 },
  'geese-honk': { volume: 0.3, gap: 10 },
  owl: { volume: 0.3, gap: 20 },
  'plane-flyby': { volume: 0.22, gap: 10 },
  'tram-passing': { volume: 0.25, gap: 8 },
  // tapping animals and villagers (§10.5); a soft pop stands in until a file exists
  'deer-call': { volume: 0.5, gap: 0.5, fallback: 'bubble-pop' },
  'cougar-growl': { volume: 0.5, gap: 0.8, fallback: 'bubble-pop' },
  'rabbit-hop': { volume: 0.5, gap: 0.4, fallback: 'bubble-pop' },
  'villager-hello': { volume: 0.5, gap: 0.4, fallback: 'bubble-pop' },
} as const satisfies Record<string, { volume: number; gap?: number; fallback?: string }>;
export type EffectName = keyof typeof EFFECTS;

export const LOOPS = ['ambient-birds', 'ambient-water', 'ambient-wind', 'ambient-rain', 'ambient-night', 'campfire', 'construction-site'] as const;
export type LoopName = (typeof LOOPS)[number];

export const TRACKS = ['music-day', 'music-night', 'music-snow'] as const;
export type TrackName = (typeof TRACKS)[number];

/** Music stays quiet under everything else (§10.5). */
export const MUSIC_VOLUME = 0.22;
export const AMBIENCE_VOLUME = 0.8;
export const EFFECTS_VOLUME = 0.9;

export const soundUrl = (name: string): string => `/sfx/${name}.mp3`;
