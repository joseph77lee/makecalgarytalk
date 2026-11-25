/**
 * Vitality moods and the pastel palette for each mood (requirement.md §7.4, §19.1).
 * The palette is a placeholder until the Art Pass; only this file needs to change.
 */

export type VitalityMood = 'lively' | 'normal' | 'sleepy';

/** 60–100 Lively, 30–59 Normal, 0–29 Sleepy (was "Gloomy" before requirement v1.24). Fractional scores use the same cut-offs. */
export function vitalityMood(vitality: number): VitalityMood {
  if (vitality >= 60) return 'lively';
  if (vitality >= 30) return 'normal';
  return 'sleepy';
}

export interface MoodPalette {
  /** Two grass shades for a faint checkered look (kept subtle so it never reads as a grid). */
  grass: [string, string];
  path: [string, string];
  /** Real water (lakes, ponds, creeks). */
  water: string;
  dirtTop: string;
  dirtBottom: string;
  leaves: [string, string];
  trunk: string;
  /** CSS background for the sky behind the canvas. */
  sky: string;
  sunIntensity: number;
  ambientIntensity: number;
  /** Base mini villager walking speed in tiles per second (each villager varies it). */
  villagerSpeed: number;
  /** Lamps along the road glow only when lively ("lights", §7.4). */
  lampsLit: boolean;
}

export const MOOD_PALETTES: Record<VitalityMood, MoodPalette> = {
  lively: {
    grass: ['#a8dc7c', '#a2d876'],
    path: ['#ecd9b0', '#e9d4a9'],
    water: '#8ec5ea',
    dirtTop: '#9b7653',
    dirtBottom: '#7d5f45',
    leaves: ['#7cc46a', '#8fd27a'],
    trunk: '#8a6343',
    sky: 'linear-gradient(to bottom, #c9e4ff 0%, #e8f1ff 60%, #f3eefe 100%)',
    sunIntensity: 2.4,
    ambientIntensity: 1.25,
    villagerSpeed: 0.75,
    lampsLit: true,
  },
  normal: {
    grass: ['#a3cf86', '#9ecb81'],
    path: ['#e3d3b4', '#dfceae'],
    water: '#9cc7e3',
    dirtTop: '#94735a',
    dirtBottom: '#78604c',
    leaves: ['#79b46c', '#86bf78'],
    trunk: '#86634a',
    sky: 'linear-gradient(to bottom, #cfe0f3 0%, #e6edf6 60%, #efecf5 100%)',
    sunIntensity: 2.0,
    ambientIntensity: 1.15,
    villagerSpeed: 0.55,
    lampsLit: false,
  },
  sleepy: {
    // "Cute sleepy" (requirement §7.4): a quiet snowy winter evening, pastel and soft, never
    // grey or dark. Fresh snow on the ground and trees, icy water, a lavender-pink dusk sky.
    grass: ['#eef3f9', '#e9eff7'],
    path: ['#e8dcc8', '#e4d7c2'],
    water: '#a6d2ef',
    dirtTop: '#9a7a62',
    dirtBottom: '#7f6550',
    leaves: ['#6fae8f', '#7cbb9b'],
    trunk: '#86634a',
    sky: 'linear-gradient(to bottom, #b8c4ee 0%, #d8d4f2 55%, #f7e1e8 100%)',
    sunIntensity: 1.8,
    ambientIntensity: 1.3,
    villagerSpeed: 0.3,
    lampsLit: false,
  },
};

/**
 * Island scenery colours (requirement.md v1.40 §7.4, §10.4): every island has the same full look
 * (the former "lively" colours), changed only by the weather: snow on the ground turns grass
 * white and water icy. The mood no longer changes scenery (only mini villagers, `villagerSpeed`);
 * sky and light come from the real sun and weather (scene/sky.ts).
 */
export function scenePalette(snow: boolean): MoodPalette {
  const green = MOOD_PALETTES.lively;
  if (!snow) return green;
  const winter = MOOD_PALETTES.sleepy;
  return { ...green, grass: winter.grass, path: winter.path, water: winter.water, leaves: winter.leaves };
}

/** Fixed pastel accent colours used for roofs and villager clothes. */
export const ACCENTS = ['#f4978e', '#b8a9e8', '#8ec5ea', '#9ad9c2', '#f6d37a', '#f2a6c8'] as const;
