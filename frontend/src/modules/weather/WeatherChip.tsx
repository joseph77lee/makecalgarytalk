import { useState } from 'react';
import { formatTemperature, weatherIcon, type CityWeather } from './weather';

const STATE_TEXT: Record<CityWeather['state'], string> = {
  clear: 'Clear',
  partly_cloudy: 'Partly cloudy',
  overcast: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  mix: 'Rain and snow',
  fog: 'Fog',
  thunderstorm: 'Thunderstorm',
};

/**
 * Small chip with Calgary's weather (requirement.md v1.40 §10.4): icon and temperature; tapping
 * shows the condition and the data source (Environment Canada's licence asks for attribution).
 */
export function WeatherChip({ weather, night, className = '' }: { weather: Omit<CityWeather, 'serverNow'>; night: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const temp = formatTemperature(weather.temperatureC);
  const text = weather.condition ?? STATE_TEXT[weather.state];
  return (
    <div className={`pointer-events-auto ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Calgary weather: ${text}${temp ? `, ${temp}` : ''}`}
        className="flex h-9 items-center gap-1 rounded-full bg-white/85 px-2.5 text-xs font-semibold text-slate-700 shadow backdrop-blur"
      >
        <span aria-hidden className="text-base leading-none">
          {weatherIcon(weather.state, night)}
        </span>
        {temp && <span>{temp}</span>}
      </button>
      {open && (
        <div role="status" className="mt-1.5 w-52 rounded-xl bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-md backdrop-blur">
          <div className="font-semibold">
            Calgary now: {text}
            {temp ? ` · ${temp}` : ''}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Data source: Environment and Climate Change Canada</div>
        </div>
      )}
    </div>
  );
}
