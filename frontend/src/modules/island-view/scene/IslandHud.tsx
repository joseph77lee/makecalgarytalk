import type { ReactNode } from 'react';
import { developmentLevel } from '../development';
import type { CommunityViewState } from '../types';
import { useIslandUi } from '../uiStore';
import { SoundToggle } from '../../sound';

/** Top bar: optional left slot (e.g. my profile), community name with its development level (§7.4), labels toggle. */
export function IslandHud({ state, left, right }: { state: CommunityViewState; left?: ReactNode; right?: ReactNode }) {
  const level = developmentLevel(state.buildings);
  const showLabels = useIslandUi((u) => u.showLabels);
  const setShowLabels = useIslandUi((u) => u.setShowLabels);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3">
      <div className="pointer-events-auto flex w-10 shrink-0 justify-start">{left}</div>
      <div className="flex min-w-0 items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 shadow-sm backdrop-blur">
        <span className="truncate text-sm font-bold text-slate-800">{state.communityName}</span>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700" title="Development level: grows with every new building">
          Lv {level}
        </span>
      </div>
      <div className="pointer-events-auto flex shrink-0 items-start gap-2">
      {right}
      <SoundToggle />
      <button
        type="button"
        onClick={() => setShowLabels(!showLabels)}
        aria-pressed={showLabels}
        aria-label={showLabels ? 'Hide labels' : 'Show labels'}
        title={showLabels ? 'Hide labels' : 'Show labels'}
        className={`pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors ${
          showLabels ? 'bg-white/85 text-slate-700' : 'bg-slate-800/75 text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.4A8 8 0 1 1 21 12Z" />
          {!showLabels && <path d="M4 4l16 16" />}
        </svg>
      </button>
      </div>
    </div>
  );
}
