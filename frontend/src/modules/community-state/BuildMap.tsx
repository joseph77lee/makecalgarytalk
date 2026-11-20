import { projectIcon, type ServerCommunityState } from '../daily-actions';
import { BUILDING_TREE, remainingText, type BuildingView } from '../island-view';
import { completionPercent, groupByStage, isBuilt } from './buildMapModel';
import { landGoalText } from './streakText';

interface Props {
  community: ServerCommunityState['community'];
  streakDays: number;
  buildings: BuildingView[];
  onClose: () => void;
  onShowExample: () => void;
  /** Opens the invite where more neighbours are needed. */
  onInvite?: () => void;
}

/** Village build map (requirement.md §7.6a): read-only view of the server's tree state. */
export function BuildMap({ community, streakDays, buildings, onClose, onShowExample, onInvite }: Props) {
  const percent = completionPercent(buildings);
  const tiers = BUILDING_TREE.landTiers;
  const goal = landGoalText(community.next_land_residents);
  return (
    <div className="absolute inset-0 z-40 flex justify-center bg-slate-900/25" onClick={onClose}>
      <section
        aria-label="Village build map"
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl sm:my-4 sm:h-auto sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-800">{community.name} village</h2>
            <p className="text-xs text-slate-500">
              {community.residents} {community.residents === 1 ? 'resident' : 'residents'} · 🔥 {streakDays}-day streak
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-4 rounded-2xl bg-indigo-50 p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-indigo-900">Village complete</span>
              <span className="text-xl font-bold text-indigo-700">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-700" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-3 text-xs font-semibold text-indigo-900">Island size</div>
            <div className="mt-1 flex gap-1" aria-label={`Land stage ${community.land_stage + 1} of ${tiers.length}`}>
              {tiers.map((t, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-2 rounded-full ${i <= community.land_stage ? 'bg-sky-500' : 'bg-white'}`} />
                  <div className="mt-0.5 text-[9px] text-indigo-800/70">{t.minResidents === 0 ? '1' : `${t.minResidents}+`}</div>
                </div>
              ))}
            </div>
            {goal && (
              <p className="mt-1 text-xs text-sky-800">
                🏝 {goal}
                {onInvite && (
                  <button type="button" onClick={onInvite} className="ml-1 font-semibold underline">
                    Invite
                  </button>
                )}
              </p>
            )}
            <button
              type="button"
              onClick={onShowExample}
              className="mt-3 w-full rounded-xl bg-white py-1.5 text-xs font-semibold text-indigo-700 shadow-sm active:scale-[0.98]"
            >
              See a finished example
            </button>
          </div>

          {groupByStage(buildings).map((g) => (
            <div key={g.name} className="mb-4">
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{g.name}</h3>
              <ul className="space-y-1.5">
                {g.buildings.map((b) => (
                  <BuildingRow key={b.key} b={b} onInvite={onInvite} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BuildingRow({ b, onInvite }: { b: BuildingView; onInvite?: () => void }) {
  const built = isBuilt(b);
  const upgrading = b.status === 'building' && b.level > 1;
  const builtLevel = upgrading ? b.level - 1 : b.level;
  return (
    <li className={`rounded-2xl p-2.5 ${b.status === 'locked' ? 'bg-slate-50 text-slate-500' : 'bg-white ring-1 ring-slate-100'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-lg ${b.status === 'locked' ? 'opacity-40 grayscale' : ''}`} aria-hidden>
          {projectIcon(b.key)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
          {b.title}
          {built && builtLevel > 1 && <span className="ml-1 text-xs text-amber-600">Lv {builtLevel}</span>}
        </span>
        <StatusChip b={b} />
      </div>
      {b.status === 'building' && (
        <div className="mt-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round(b.progress * 100)}%` }} />
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            {upgrading ? `Upgrading to Lv ${b.level}` : 'Under construction'} · {Math.round(b.progress * 100)}%
          </div>
        </div>
      )}
      {b.status === 'opened' && <p className="mt-1 text-[11px] text-emerald-700">Starts when one of the 3 constructions finishes</p>}
      {b.status === 'locked' && b.remaining && (
        <p className="mt-1 text-[11px]">
          {remainingText(b.remaining)}
          {onInvite && b.remaining.residents > 0 && (
            <button type="button" onClick={onInvite} className="ml-1 font-semibold text-sky-700 underline">
              Invite
            </button>
          )}
        </p>
      )}
    </li>
  );
}

function StatusChip({ b }: { b: BuildingView }) {
  const [text, cls] = isBuilt(b)
    ? b.status === 'building'
      ? ['Built · upgrading', 'bg-emerald-100 text-emerald-700']
      : ['Built', 'bg-emerald-100 text-emerald-700']
    : b.status === 'building'
      ? ['Building', 'bg-amber-100 text-amber-700']
      : b.status === 'opened'
        ? ['✨ Ready', 'bg-emerald-50 text-emerald-700']
        : ['🔒 Locked', 'bg-slate-200 text-slate-500'];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{text}</span>;
}
