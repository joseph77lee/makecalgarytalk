/**
 * Vitality moods and the pastel palette for each mood (requirement.md §7.4, §19.1).
 * The palette is a placeholder until the Art Pass; only this file needs to change.
 */

export type VitalityMood = 'lively' | 'normal' | 'gloomy';

/** 60–100 Lively, 30–59 Normal, 0–29 Gloomy. Fractional scores use the same cut-offs. */
export function vitalityMood(vitality: number): VitalityMood {
  if (vitality >= 60) return 'lively';
  if (vitality >= 30) return 'normal';
  return 'gloomy';
}

export interface MoodPalette {
  /** Two grass shades for the checkered look. */
  grass: [string, string];
  path: [string, string];
  dirtTop: string;
  dirtBottom: string;
  leaves: [string, string];
  trunk: string;
  /** CSS background for the sky behind the canvas. */
  sky: string;
  sunIntensity: number;
  ambientIntensity: number;
  /** Mini villager walking speed in tiles per second. */
  villagerSpeed: number;
  /** Lamps along the road glow only when lively ("lights", §7.4). */
  lampsLit: boolean;
}

export const MOOD_PALETTES: Record<VitalityMood, MoodPalette> = {
  lively: {
    grass: ['#a8dc7c', '#9bd36f'],
    path: ['#ecd9b0', '#e5cfa2'],
    dirtTop: '#9b7653',
    dirtBottom: '#7d5f45',
    leaves: ['#7cc46a', '#8fd27a'],
    trunk: '#8a6343',
    sky: 'linear-gradient(to bottom, #c9e4ff 0%, #e8f1ff 60%, #f3eefe 100%)',
    sunIntensity: 2.4,
    ambientIntensity: 1.25,
    villagerSpeed: 1.6,
    lampsLit: true,
  },
  normal: {
    grass: ['#a3cf86', '#97c57a'],
    path: ['#e3d3b4', '#dccaa8'],
    dirtTop: '#94735a',
    dirtBottom: '#78604c',
    leaves: ['#79b46c', '#86bf78'],
    trunk: '#86634a',
    sky: 'linear-gradient(to bottom, #cfe0f3 0%, #e6edf6 60%, #efecf5 100%)',
    sunIntensity: 2.0,
    ambientIntensity: 1.15,
    villagerSpeed: 1.0,
    lampsLit: false,
  },
  gloomy: {
    // "Cute gloomy": greyish and snowy, never dark or depressing.
    grass: ['#b4bfae', '#aab6a4'],
    path: ['#d6d1c8', '#cec9bf'],
    dirtTop: '#8a7a6d',
    dirtBottom: '#716559',
    leaves: ['#9aa892', '#a5b09c'],
    trunk: '#7d6a5c',
    sky: 'linear-gradient(to bottom, #c3c9d6 0%, #d9dde5 60%, #e3e1e8 100%)',
    sunIntensity: 1.3,
    ambientIntensity: 1.2,
    villagerSpeed: 0.45,
    lampsLit: false,
  },
};

/** Fixed pastel accent colours used for roofs and villager clothes. */
export const ACCENTS = ['#f4978e', '#b8a9e8', '#8ec5ea', '#9ad9c2', '#f6d37a', '#f2a6c8'] as const;
