/** Calgary weather as sent by `public.weather_current()` (requirement.md v1.40 §10.4). */

export const WEATHER_STATES = ['clear', 'partly_cloudy', 'overcast', 'rain', 'snow', 'mix', 'fog', 'thunderstorm'] as const;
export type WeatherState = (typeof WEATHER_STATES)[number];
export const WIND_LEVELS = ['calm', 'breezy', 'windy'] as const;
export type WindLevel = (typeof WIND_LEVELS)[number];

export interface CityWeather {
  state: WeatherState;
  wind: WindLevel;
  /** Direction the wind blows FROM, degrees clockwise from north; null when unknown. */
  windFromDeg: number | null;
  temperatureC: number | null;
  /** Environment Canada's condition text (e.g. "Light Snow"), for the chip's label. */
  condition: string | null;
  snowCover: boolean;
  /** The server's instant when the answer was made (the client clock is offset by it). */
  serverNow: Date;
}

export const CLEAR_WEATHER: Omit<CityWeather, 'serverNow'> = {
  state: 'clear',
  wind: 'calm',
  windFromDeg: null,
  temperatureC: null,
  condition: null,
  snowCover: false,
};

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const numOrNull = (v: unknown): number | null => (isNum(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

/** Validates the RPC answer; throws on anything unexpected. */
export function parseWeather(v: unknown): CityWeather {
  if (typeof v !== 'object' || v === null) throw new Error('Unexpected server response: weather');
  const o = v as Record<string, unknown>;
  const serverNow = typeof o.now === 'string' ? new Date(o.now) : new Date(NaN);
  if (Number.isNaN(serverNow.getTime())) throw new Error('Weather: missing server instant');
  if (!WEATHER_STATES.includes(o.state as WeatherState)) throw new Error(`Weather: unknown state ${String(o.state)}`);
  if (!WIND_LEVELS.includes(o.wind as WindLevel)) throw new Error(`Weather: unknown wind ${String(o.wind)}`);
  if (typeof o.snow_cover !== 'boolean') throw new Error('Weather: missing snow cover');
  return {
    state: o.state as WeatherState,
    wind: o.wind as WindLevel,
    windFromDeg: numOrNull(o.wind_bearing),
    temperatureC: numOrNull(o.temperature_c),
    condition: typeof o.condition === 'string' ? o.condition : null,
    snowCover: o.snow_cover,
    serverNow,
  };
}

/** Falling snow (snow or rain and snow). */
export const isSnowing = (s: WeatherState): boolean => s === 'snow' || s === 'mix';

/** Chip icon per state; night swaps the sun for a moon. */
export function weatherIcon(state: WeatherState, night: boolean): string {
  switch (state) {
    case 'clear':
      return night ? '🌙' : '☀️';
    case 'partly_cloudy':
      return night ? '☁️' : '⛅';
    case 'overcast':
      return '☁️';
    case 'rain':
      return '🌧️';
    case 'snow':
      return '❄️';
    case 'mix':
      return '🌨️';
    case 'fog':
      return '🌫️';
    case 'thunderstorm':
      return '⛈️';
  }
}

/** "−3°C" (rounded, true minus sign); null temperature → null. */
export function formatTemperature(c: number | null): string | null {
  if (c === null) return null;
  const r = Math.round(c);
  return `${r < 0 ? '−' : ''}${Math.abs(r)}°C`;
}
