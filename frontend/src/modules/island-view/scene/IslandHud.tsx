import { vitalityMood, type VitalityMood } from '../mood';
import type { CommunityViewState } from '../types';

const MOOD_LABEL: Record<VitalityMood, { text: string; className: string }> = {
  lively: { text: 'Lively', className: 'bg-emerald-100 text-emerald-700' },
  normal: { text: 'Normal', className: 'bg-sky-100 text-sky-700' },
  gloomy: { text: 'Gloomy', className: 'bg-slate-200 text-slate-600' },
};

/** Top bar: community name and Vitality mood. M5 adds the streak bar and goals. */
export function IslandHud({ state }: { state: CommunityViewState }) {
  const mood = MOOD_LABEL[vitalityMood(state.vitality)];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-3">
      <div className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 shadow-sm backdrop-blur">
        <span className="text-sm font-bold text-slate-800">{state.communityName}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${mood.className}`}>
          {mood.text} · {Math.round(state.vitality)}
        </span>
      </div>
    </div>
  );
}
