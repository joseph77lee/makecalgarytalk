import { useEffect } from 'react';
import type { RankEntry, WeekBoard } from './api';
import { useRanking } from './liveStore';
import { dayLabel, mineInTop, mineText, scoreText } from './rankingText';

interface Props {
  /** Show a community on the map. */
  onPick: (code: string) => void;
  /** Share my community's fixed result of last week (a share card). */
  onShareLastWeek?: (entry: RankEntry) => void;
  onClose: () => void;
}

/** 🏆 Weekly ranking on the World Map (requirement.md v1.31 §12.1): last week, then this week so far. */
export function RankingSheet({ onPick, onShareLastWeek, onClose }: Props) {
  const data = useRanking((s) => s.data);
  const loading = useRanking((s) => s.loading);
  const error = useRanking((s) => s.error);
  useEffect(() => {
    void useRanking.getState().load();
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-slate-900/20" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Weekly ranking"
        className="flex max-h-[80%] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-lg font-bold text-slate-800">🏆 Calgary ranking</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
            ✕
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!data && (loading || !error) && <p className="py-8 text-center text-sm text-slate-500">Loading…</p>}
          {!data && error && <p className="py-8 text-center text-sm text-rose-600">Could not load the ranking.</p>}
          {data && (
            <>
              <Week
                title={`Last week · from ${dayLabel(data.last_week.week_start)}`}
                week={data.last_week}
                home={data.home?.code ?? null}
                onPick={onPick}
                empty="No community was ranked last week."
                share={onShareLastWeek && data.last_week.mine?.rank != null ? () => onShareLastWeek(data.last_week.mine!) : undefined}
                crown
              />
              <Week title="This week so far" week={data.this_week} home={data.home?.code ?? null} onPick={onPick} empty="Nobody is ranked yet this week. Help today!" />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Score = daily active residents per 1,000 people, averaged over the week. A community needs {data.min_residents} residents who help during the
                week to be ranked. New week every Monday.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Week({
  title,
  week,
  home,
  onPick,
  empty,
  share,
  crown = false,
}: {
  title: string;
  week: WeekBoard;
  home: string | null;
  onPick: (code: string) => void;
  empty: string;
  share?: () => void;
  /** Last week's #1 wears the crown (as on the map); this week's leader shows "#1". */
  crown?: boolean;
}) {
  return (
    <section className="mb-3">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {week.top.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <ol className="space-y-1">
          {week.top.map((e) => (
            <Row key={e.code} e={e} mine={e.code === home} onPick={onPick} crown={crown} />
          ))}
        </ol>
      )}
      {week.mine && !mineInTop(week) && (
        <div className="mt-1.5">
          <Row e={week.mine} mine onPick={onPick} note={mineText(week.mine, week.ranked)} crown={crown} />
        </div>
      )}
      {share && (
        <button type="button" onClick={share} className="mt-2 w-full rounded-2xl bg-indigo-500 py-2 text-sm font-semibold text-white active:scale-[0.98]">
          📣 Share our result
        </button>
      )}
    </section>
  );
}

function Row({ e, mine, onPick, note, crown }: { e: RankEntry; mine: boolean; onPick: (code: string) => void; note?: string; crown: boolean }) {
  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onPick(e.code)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left ${mine ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-slate-50'}`}
      >
        <span className="w-8 shrink-0 text-center text-sm font-bold text-slate-700">{e.rank === null ? '–' : e.rank === 1 && crown ? '👑' : `#${e.rank}`}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800">
            {e.name}
            {mine && <span className="ml-1 text-xs font-normal text-orange-500">· my community</span>}
          </span>
          {note && <span className="block text-xs text-slate-500">{note}</span>}
        </span>
        <span className="shrink-0 text-right text-xs text-slate-500">
          <span className="block text-sm font-semibold text-slate-800">{scoreText(e.score)}</span>
          per 1,000
        </span>
      </button>
    </li>
  );
}
