import type { ServerStreak } from '../daily-actions';
import type { ReactNode } from 'react';
import { landGoalText, sleepyText, streakText } from './streakText';

interface Props {
  streak: ServerStreak;
  nextLandResidents: number | null;
  onOpenMap: () => void;
  /** Community name while it is Sleepy (adds the wake-up line), otherwise null. */
  sleepyName?: string | null;
  /** Shown under the bar (e.g. the residency chip), so it never overlaps however tall the bar is. */
  children?: ReactNode;
}

/** Under the top bar: community streak with today's progress, the island goal and the build map button. */
export function StreakBar({ streak, nextLandResidents, onOpenMap, sleepyName = null, children }: Props) {
  const t = streakText(streak);
  const goal = landGoalText(nextLandResidents);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-30 flex flex-col items-center gap-2 px-3">
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl bg-white/85 py-1.5 pl-3 pr-1.5 shadow-sm backdrop-blur">
        <div className="min-w-0 text-[11px] leading-tight text-slate-600">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`font-bold ${streak.days > 0 ? 'text-orange-600' : 'text-slate-500'}`}>🔥 {t.title}</span>
            <span className={`rounded-full px-1.5 font-semibold ${streak.today.attended ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {t.today}
            </span>
          </div>
          <div className="truncate">{t.hint}</div>
          {goal && <div className="truncate text-sky-700">🏝 {goal}</div>}
          {sleepyName && <div className="truncate font-semibold text-indigo-600">{sleepyText(sleepyName)}</div>}
        </div>
        <button
          type="button"
          onClick={onOpenMap}
          className="flex shrink-0 flex-col items-center rounded-xl bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 active:scale-95"
        >
          <span className="text-base leading-none" aria-hidden>
            🗺️
          </span>
          Village
        </button>
      </div>
      {children}
    </div>
  );
}
