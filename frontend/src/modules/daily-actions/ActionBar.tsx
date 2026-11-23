import { formatCountdown, msUntil, useNow } from '../common';
import { energyShown } from './actionQueue';
import { useDailyActions } from './liveStore';
import { projectIcon } from './projectIcons';

/** Bottom action bar: energy, the 3 active projects, tap to help (requirement.md §8, §10.2). */
export function ActionBar() {
  const server = useDailyActions((s) => s.server);
  const queue = useDailyActions((s) => s.queue);
  const act = useDailyActions((s) => s.act);
  const now = useNow(30_000);
  if (!server || !queue) return null;

  const energy = energyShown(queue);
  const viewOnly = !server.me?.member;
  const pending = server.me?.pending === true;
  const resetIn = formatCountdown(msUntil(new Date(server.next_day_start), now));

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-xl rounded-3xl bg-white/90 p-2.5 shadow-lg backdrop-blur">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1" aria-label={`Energy ${energy} of ${queue.energyMax}`}>
            {Array.from({ length: queue.energyMax }, (_, i) => (
              <span
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all duration-300 ${
                  i < energy ? 'scale-100 bg-amber-300' : 'scale-90 bg-slate-200 grayscale'
                }`}
              >
                ⚡
              </span>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {viewOnly ? 'Looking around (view only)' : energy > 0 ? 'Tap a project to help' : `New energy in ${resetIn}`}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {server.projects.slice(0, 3).map((p, i) => {
            const mine = queue.today[p.id] ?? 0;
            const waiting = queue.pending.filter((x) => x.projectId === p.id).length;
            const pct = Math.round((Math.min(p.progress, p.required) / p.required) * 100);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => act(i)}
                aria-disabled={energy === 0 || viewOnly}
                className={`group flex min-w-0 flex-col gap-1 rounded-2xl bg-slate-50 p-2 text-left transition active:scale-95 ${
                  energy === 0 || viewOnly ? 'opacity-60' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-1 text-xs font-semibold text-slate-700">
                  <span aria-hidden>{projectIcon(p.building_key)}</span>
                  <span className="truncate">{p.title}</span>
                  {p.level > 1 && <span className="shrink-0 text-[10px] text-amber-600">Lv {p.level}</span>}
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full rounded-full bg-emerald-400 transition-[width] duration-700" style={{ width: `${pct}%` }} />
                </span>
                <span className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>
                    {p.progress}/{p.required}
                  </span>
                  {mine + waiting > 0 && (
                    <span
                      className={`rounded-full px-1.5 font-semibold ${pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                      title={pending ? 'Saved: counts once you are a Verified Resident' : 'Shows on the bar tomorrow'}
                    >
                      +{mine + waiting} {pending ? 'saved' : 'today'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {pending ? (
          <p className="mt-1.5 px-1 text-center text-[10px] text-amber-700">Your help is saved and counts once you are a Verified Resident here.</p>
        ) : (
          <p className="mt-1.5 px-1 text-center text-[10px] text-slate-400">Today's help shows in the community tomorrow.</p>
        )}
      </div>
    </div>
  );
}
