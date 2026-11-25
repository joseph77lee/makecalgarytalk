import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { create } from 'zustand';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { sunPosition, type SunPosition } from './sun';
import { CLEAR_WEATHER, parseWeather, WEATHER_STATES, WIND_LEVELS, type CityWeather, type WeatherState, type WindLevel } from './weather';

/** The server stores a new reading every 15 minutes; the island asks again as often while open. */
export const REFRESH_MS = 15 * 60_000;
/** The sun moves about 0.25° a minute; the light is updated this often. */
const SUN_TICK_MS = 30_000;

export async function fetchWeather(c: SupabaseClient): Promise<CityWeather> {
  const { data, error } = await c.rpc('weather_current');
  if (error) throw new Error(error.message);
  return parseWeather(data);
}

interface WeatherStore {
  weather: Omit<CityWeather, 'serverNow'>;
  /** server clock − client clock (ms), from the last answer. */
  offsetMs: number;
  loadedAt: number;
  /** The sun at the last tick, on the server's clock. */
  sun: SunPosition;
}

export const useWeatherStore = create<WeatherStore>(() => ({ weather: CLEAR_WEATHER, offsetMs: 0, loadedAt: 0, sun: sunPosition(new Date()) }));

/** Stores an answer and the clock offset it implies (the sun is recomputed on that clock). */
export function applyWeather(w: CityWeather, clientNow: number = Date.now()): void {
  const { serverNow, ...weather } = w;
  useWeatherStore.setState({ weather, offsetMs: serverNow.getTime() - clientNow, loadedAt: clientNow, sun: sunPosition(serverNow) });
}

/** Moves the sun to the current server instant. */
export function tickSun(): void {
  useWeatherStore.setState({ sun: sunPosition(serverNow()) });
}

/** The current instant on the server's clock (the client clock may be wrong). */
export function serverNow(): Date {
  return new Date(Date.now() + useWeatherStore.getState().offsetMs);
}

let inflight: Promise<void> | null = null;
export function refreshWeather(): Promise<void> {
  const cfg = readSupabaseConfig();
  if (!cfg.ok) return Promise.resolve();
  inflight ??= fetchWeather(getSupabaseClient(cfg.config))
    .then((w) => applyWeather(w))
    .catch((e: unknown) => console.warn('[weather] not loaded, showing clear weather:', e instanceof Error ? e.message : e))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Dev-only overrides for screen checks: `?weather=snow&wind=windy&time=night&snow=1`. */
export interface WeatherOverride {
  weather?: Partial<Omit<CityWeather, 'serverNow'>>;
  sun?: SunPosition;
}

/** Fixed sun positions for `?time=` (day = Calgary's real winter noon height). */
export const TIME_PRESETS: Record<string, SunPosition> = {
  night: { azimuthDeg: 0, elevationDeg: -40 },
  dawn: { azimuthDeg: 125, elevationDeg: 1 },
  morning: { azimuthDeg: 150, elevationDeg: 9 },
  day: { azimuthDeg: 180, elevationDeg: 15.5 },
  summer: { azimuthDeg: 180, elevationDeg: 62 },
  dusk: { azimuthDeg: 235, elevationDeg: 1 },
};

export function parseOverride(search: string): WeatherOverride | null {
  const q = new URLSearchParams(search);
  const out: WeatherOverride = {};
  const w: Partial<Omit<CityWeather, 'serverNow'>> = {};
  const state = q.get('weather');
  if (state && WEATHER_STATES.includes(state as WeatherState)) {
    w.state = state as WeatherState;
    w.condition = null; // the real condition text would contradict the forced state
  }
  const wind = q.get('wind');
  if (wind && WIND_LEVELS.includes(wind as WindLevel)) w.wind = wind as WindLevel;
  if (q.has('snow')) w.snowCover = q.get('snow') !== '0';
  if (q.has('temp') && Number.isFinite(Number(q.get('temp')))) w.temperatureC = Number(q.get('temp'));
  if (Object.keys(w).length > 0) out.weather = w;
  const time = q.get('time');
  if (time && TIME_PRESETS[time]) out.sun = TIME_PRESETS[time];
  return out.weather || out.sun ? out : null;
}

const devOverride: WeatherOverride | null =
  import.meta.env.DEV && typeof window !== 'undefined' ? parseOverride(window.location.search) : null;

export interface LiveWeather {
  weather: Omit<CityWeather, 'serverNow'>;
  sun: SunPosition;
}

/**
 * Calgary's weather and the sun right now, kept fresh while mounted: the weather every
 * 15 minutes (and when the tab comes back), the sun every 30 seconds.
 */
export function useLiveWeather(): LiveWeather {
  const stored = useWeatherStore((s) => s.weather);
  const sun = useWeatherStore((s) => s.sun);

  useEffect(() => {
    const stale = () => Date.now() - useWeatherStore.getState().loadedAt > REFRESH_MS - 30_000;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (stale()) void refreshWeather();
      tickSun();
    };
    if (stale()) void refreshWeather();
    const id = setInterval(tick, SUN_TICK_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return {
    weather: devOverride?.weather ? { ...stored, ...devOverride.weather } : stored,
    sun: devOverride?.sun ?? sun,
  };
}
