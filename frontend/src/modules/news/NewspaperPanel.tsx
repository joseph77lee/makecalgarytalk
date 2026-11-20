import { useNews } from './liveStore';
import { yesterdayLabel } from './newsText';

/** The community newspaper (requirement.md v1.27 §11): announcements, yesterday's news, board. */
export function NewspaperPanel() {
  const open = useNews((s) => s.open);
  const loading = useNews((s) => s.loading);
  const error = useNews((s) => s.error);
  const paper = useNews((s) => s.paper);
  const close = useNews((s) => s.close);
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex justify-center bg-slate-900/25" onClick={close}>
      <section
        aria-label="Community newspaper"
        className="flex h-full w-full max-w-xl flex-col bg-[#fbf8f1] shadow-xl sm:my-4 sm:h-auto sm:max-h-[90dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b-2 border-slate-800/80 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Community News</p>
            <h2 className="truncate font-serif text-2xl font-bold text-slate-900">{paper?.community ?? '…'}</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-full bg-slate-200/70 px-3 py-1 text-sm text-slate-700">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading && <p className="text-sm text-slate-500">Fetching today's paper…</p>}
          {error && <p className="text-sm text-amber-700">Could not load the newspaper: {error}</p>}
          {paper && !loading && (
            <>
              {paper.announcements.length > 0 && (
                <div className="mb-4 space-y-2">
                  {paper.announcements.map((a, i) => (
                    <div key={i} className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
                      <p className="text-sm font-bold text-sky-900">📣 {a.title}</p>
                      {a.body && <p className="mt-0.5 text-xs text-sky-800">{a.body}</p>}
                    </div>
                  ))}
                </div>
              )}

              {paper.locked ? (
                <div className="rounded-2xl bg-white p-4 text-center ring-1 ring-slate-200">
                  <p className="text-2xl" aria-hidden>
                    🔒
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Build the Welcome sign to open the community newspaper.</p>
                </div>
              ) : (
                <>
                  <h3 className="mb-2 font-serif text-lg font-bold text-slate-900">Neighbours ({yesterdayLabel(paper.calgary_day)})</h3>
                  {paper.lines.length > 0 ? (
                    <ul className="space-y-2">
                      {paper.lines.map((l, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-snug text-slate-800">
                          <span aria-hidden>{l.icon}</span>
                          <span>{l.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No new neighbours yesterday. Invite someone nearby!</p>
                  )}

                  <h3 className="mb-2 mt-5 font-serif text-lg font-bold text-slate-900">Local news</h3>
                  <p className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                    🗞️ Soon, Verified Residents can post local news here: events, deals, lost &amp; found.
                  </p>
                </>
              )}

              <div className="mt-5 border-t border-slate-300 pt-4">
                <h3 className="mb-2 font-serif text-lg font-bold text-slate-900">Community board</h3>
                {paper.board.open ? (
                  <>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Coming soon</p>
                    <ul className="space-y-1.5">
                      {paper.board.roadmap.map((r, i) => (
                        <li key={i} className="flex gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                          <span aria-hidden>🔒</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-700">{r.title}</span>
                            {r.detail && <span className="block text-[11px] text-slate-500">{r.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="rounded-xl bg-white px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">🔒 Opens with the Warming hut.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
