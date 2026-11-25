import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyWeather, parseOverride, serverNow, TIME_PRESETS, useWeatherStore } from './store';
import { formatTemperature, isSnowing, parseWeather, weatherIcon, WEATHER_STATES } from './weather';

// The real answer of public.weather_current() on 2026-11-25 (local stack, Environment Canada data).
const ANSWER = {
  now: '2026-11-25T03:44:25.212465+00:00',
  wind: 'calm',
  state: 'overcast',
  wind_kmh: 8,
  condition: 'Mostly Cloudy',
  snow_cover: false,
  observed_at: '2026-11-25T03:00:00+00:00',
  wind_bearing: 234.0,
  temperature_c: 0.4,
};

describe('parseWeather', () => {
  it('reads the server answer', () => {
    const w = parseWeather(ANSWER);
    expect(w).toMatchObject({ state: 'overcast', wind: 'calm', windFromDeg: 234, temperatureC: 0.4, condition: 'Mostly Cloudy', snowCover: false });
    expect(w.serverNow.toISOString()).toBe('2026-11-25T03:44:25.212Z');
  });

  it('accepts the "no recent reading" answer (nulls)', () => {
    const w = parseWeather({ ...ANSWER, state: 'clear', wind_bearing: null, temperature_c: null, condition: null, observed_at: null });
    expect(w).toMatchObject({ state: 'clear', windFromDeg: null, temperatureC: null, condition: null });
  });

  it('rejects unknown states, missing instant or snow cover', () => {
    expect(() => parseWeather({ ...ANSWER, state: 'hail' })).toThrow();
    expect(() => parseWeather({ ...ANSWER, wind: 'gale' })).toThrow();
    expect(() => parseWeather({ ...ANSWER, now: undefined })).toThrow();
    expect(() => parseWeather({ ...ANSWER, now: 'yesterday' })).toThrow();
    expect(() => parseWeather({ ...ANSWER, snow_cover: undefined })).toThrow();
    expect(() => parseWeather(null)).toThrow();
  });
});

describe('server clock', () => {
  afterEach(() => vi.useRealTimers());

  it('offsets the client clock by the server instant (a wrong device clock does not move the sun)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T01:44:25.000Z')); // device two hours behind
    applyWeather(parseWeather({ ...ANSWER, now: '2026-11-25T03:44:25.000Z' }));
    expect(serverNow().toISOString()).toBe('2026-11-25T03:44:25.000Z');
    vi.advanceTimersByTime(60_000);
    expect(serverNow().toISOString()).toBe('2026-11-25T03:45:25.000Z');
    expect(useWeatherStore.getState().weather.state).toBe('overcast');
  });
});

describe('dev overrides', () => {
  it('reads weather, wind, snow and time presets; ignores junk', () => {
    expect(parseOverride('?weather=snow&wind=windy&snow=1&time=night')).toEqual({
      weather: { state: 'snow', condition: null, wind: 'windy', snowCover: true },
      sun: TIME_PRESETS.night,
    });
    expect(parseOverride('?snow=0')).toEqual({ weather: { snowCover: false } });
    expect(parseOverride('?weather=hail&time=teatime')).toBeNull();
    expect(parseOverride('')).toBeNull();
  });
});

describe('display helpers', () => {
  it('formats temperature with a true minus sign', () => {
    expect(formatTemperature(-3.4)).toBe('−3°C');
    expect(formatTemperature(0.4)).toBe('0°C');
    expect(formatTemperature(12.6)).toBe('13°C');
    expect(formatTemperature(null)).toBeNull();
  });

  it('has an icon for every state, a moon at night when clear', () => {
    for (const s of WEATHER_STATES) expect(weatherIcon(s, false)).toBeTruthy();
    expect(weatherIcon('clear', true)).toBe('🌙');
  });

  it('snow and rain-and-snow are falling snow', () => {
    expect(isSnowing('snow')).toBe(true);
    expect(isSnowing('mix')).toBe(true);
    expect(isSnowing('rain')).toBe(false);
  });
});
