import { useState } from 'react';
import { projectIcon, type ServerCommunityState } from '../daily-actions';
import { BUILDING_TREE, type UpcomingIdentity } from '../island-view';
import { InviteChip } from './InviteChip';
import {
  LANES,
  SITE_TEXT,
  buildSkillTree,
  conditionLines,
  finishedIslandPicture,
  laneTitle,
  missingChips,
  nodePicture,
  type Band,
  type Lane,
  type ServerBuilding,
  type TreeNode,
} from './skillTree';

interface Props {
  community: ServerCommunityState['community'];
  streakDays: number;
  buildings: ServerBuilding[];
  onClose: () => void;
  onShowExample: () => void;
  /** Opens the invite where more neighbours are needed (residents only). */
  onInvite?: () => void;
  /** "Help build it today": picks that construction in the action bar (residents only). */
  onHelp?: (key: string) => void;
  /** "See it on the island": closes the map and turns the camera to the place. */
  onSeeOnIsland?: (key: string) => void;
  /** Signature features and CTrain stations that appear with the next land (§7.9). */
  upcoming?: UpcomingIdentity | null;
}

/**
 * Village build map (requirement.md v1.48 §7.6a), drawn like a skill tree: the Welcome sign as
 * the root, three lanes read top to bottom and bands for the neighbours that open steps.
 * Read-only: every state comes from the server.
 */
export function BuildMap({ community, streakDays, buildings, onClose, onShowExample, onInvite, onHelp, onSeeOnIsland, upcoming = null }: Props) {
  const tree = buildSkillTree(buildings, community.residents);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [enlarged, setEnlarged] = useState(false);
  const titleOf = (key: string) => buildings.find((b) => b.key === key)?.name ?? key;
  const lastNatureBand = [...tree.bands].reverse().find((b) => b.lanes.nature.length > 0);

  return (
    <div className="absolute inset-0 z-40 flex justify-center bg-slate-900/25" onClick={onClose}>
      <section
        aria-label="Community build map"
        className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-gradient-to-b from-sky-50 to-white shadow-xl sm:my-4 sm:h-auto sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 bg-white/80 p-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-800">{community.name}</h2>
            <p className="text-xs text-slate-500">
              {community.residents} {community.residents === 1 ? 'neighbour' : 'neighbours'} · 🔥 {streakDays}-day streak
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Hero code={community.code} percent={tree.percent} onEnlarge={() => setEnlarged(true)} onShowExample={onShowExample} upcoming={upcoming} />

          <div className="sticky top-0 z-10 grid grid-cols-3 gap-1 border-b border-slate-100 bg-white/90 px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 backdrop-blur">
            {LANES.map((l) => (
              <span key={l} className={l === 'persona' ? 'text-amber-600' : ''}>
                {laneTitle(l, community.persona)}
              </span>
            ))}
          </div>

          {tree.root && (
            <div className="flex flex-col items-center pt-4">
              <Node n={tree.root} onTap={setSelected} />
              <div className="mt-1 h-4 w-0.5 bg-slate-200" aria-hidden />
            </div>
          )}

          {tree.bands.map((band) => (
            <BandRow
              key={band.residents}
              band={band}
              next={tree.nextBand?.residents === band.residents ? tree.nextBand.more : null}
              onInvite={onInvite}
              onTap={setSelected}
              more={band === lastNatureBand ? tree.moreDecorations : 0}
            />
          ))}
        </div>

        {selected && (
          <NodeDetail
            n={selected}
            now={{ residents: community.residents, streakDays }}
            titleOf={titleOf}
            onClose={() => setSelected(null)}
            onHelp={onHelp}
            onSeeOnIsland={onSeeOnIsland}
            onInvite={onInvite}
          />
        )}
        {enlarged && (
          <button type="button" aria-label="Close picture" onClick={() => setEnlarged(false)} className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 p-3">
            <img src={finishedIslandPicture(community.code)} alt={`${community.name}, finished`} className="max-h-full max-w-full object-contain" />
          </button>
        )}
      </section>
    </div>
  );
}

function Hero({ code, percent, onEnlarge, onShowExample, upcoming }: { code: string; percent: number; onEnlarge: () => void; onShowExample: () => void; upcoming: UpcomingIdentity | null }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className="p-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-sky-100">
        {missing ? (
          <div className="flex h-36 items-center justify-center text-5xl" aria-hidden>
            🏝
          </div>
        ) : (
          <button type="button" onClick={onEnlarge} aria-label="Enlarge the finished island" className="block w-full">
            <img src={finishedIslandPicture(code)} alt="The finished island" onError={() => setMissing(true)} className="mx-auto h-40 w-full object-contain" />
          </button>
        )}
        <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-600">When it is finished</div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-indigo-900">Community complete</span>
        <span className="text-xl font-bold text-indigo-700">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-indigo-50">
        <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-700" style={{ width: `${percent}%` }} />
      </div>
      {upcoming && (
        <p className="mt-1.5 text-xs text-sky-800">
          Coming at {upcomingThreshold(upcoming.landStage)} neighbours: <span className="font-semibold">{upcoming.labels.join(', ')}</span>
        </p>
      )}
      <button type="button" onClick={onShowExample} className="mt-2 w-full rounded-xl bg-indigo-50 py-1.5 text-xs font-semibold text-indigo-700 active:scale-[0.98]">
        See a finished example
      </button>
    </div>
  );
}

function BandRow({ band, next, onInvite, onTap, more }: { band: Band; next: number | null; onInvite?: () => void; onTap: (n: TreeNode) => void; more: number }) {
  return (
    <div className={band.reached ? '' : 'bg-slate-50/70'}>
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${band.reached ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
          👥 {band.residents} {band.residents === 1 ? 'neighbour' : 'neighbours'}
        </span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden />
        {band.reached ? (
          <span className="text-[11px] font-semibold text-emerald-700">✓</span>
        ) : next !== null ? (
          <span className="flex items-center text-[11px] font-semibold text-slate-600">
            {next} more {next === 1 ? 'neighbour' : 'neighbours'}
            {onInvite && <InviteChip onClick={onInvite} />}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-1 px-1 pb-3">
        {LANES.map((lane) => (
          <LaneColumn key={lane} lane={lane} nodes={band.lanes[lane]} onTap={onTap} more={lane === 'nature' ? more : 0} />
        ))}
      </div>
    </div>
  );
}

function LaneColumn({ lane, nodes, onTap, more }: { lane: Lane; nodes: TreeNode[]; onTap: (n: TreeNode) => void; more: number }) {
  return (
    <div className="relative flex flex-col items-center gap-3" data-lane={lane}>
      {/* the lane's line, behind the nodes */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-slate-200" aria-hidden />
      {nodes.map((n) => (
        <Node key={n.key} n={n} onTap={onTap} />
      ))}
      {more > 0 && (
        <div className="relative rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200" title={`${more} more decorations`}>
          … +{more}
        </div>
      )}
    </div>
  );
}

const STATE_BADGE: Record<TreeNode['state'], string> = { built: '✅', building: '🔨', ready: '✨', locked: '🔒' };
const STATE_TEXT: Record<TreeNode['state'], string> = { built: 'Built', building: 'Under construction', ready: 'Ready to build', locked: 'Locked' };

function Picture({ n, size }: { n: TreeNode; size: number }) {
  const [missing, setMissing] = useState(false);
  const dim = n.state === 'locked' ? 'opacity-45 grayscale' : '';
  return missing ? (
    <span className={`flex items-center justify-center ${dim}`} style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden>
      {projectIcon(n.key)}
    </span>
  ) : (
    <img src={nodePicture(n.key)} alt="" onError={() => setMissing(true)} className={`object-contain ${dim}`} style={{ width: size, height: size }} draggable={false} />
  );
}

/** One place of the tree: picture in a ring by state, its name, and what it is missing while locked. */
function Node({ n, onTap }: { n: TreeNode; onTap: (n: TreeNode) => void }) {
  const size = n.landmark ? 76 : 56;
  const ring =
    n.landmark && n.state !== 'locked'
      ? 'bg-gradient-to-b from-amber-200 to-amber-400 ring-2 ring-amber-500'
      : n.landmark
        ? 'bg-amber-50 ring-2 ring-amber-300/70'
        : n.state === 'built'
          ? 'bg-emerald-50 ring-2 ring-emerald-400'
          : n.state === 'building'
            ? 'bg-amber-50'
            : n.state === 'ready'
              ? 'bg-emerald-50 ring-2 ring-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.8)] animate-pulse'
              : 'bg-slate-100 ring-1 ring-slate-200';
  const chips = missingChips(n);
  return (
    <button type="button" onClick={() => onTap(n)} className="relative flex w-full flex-col items-center px-0.5 active:scale-95" aria-label={`${n.title}: ${STATE_TEXT[n.state]}`} data-state={n.state}>
      <span className={`relative flex items-center justify-center rounded-full p-1 ${ring}`}>
        <Picture n={n} size={size} />
        {n.state === 'building' && <ProgressRing progress={n.progress} size={size + 8} />}
        <span className="absolute -right-1 -top-1 text-sm" aria-hidden>
          {STATE_BADGE[n.state]}
        </span>
      </span>
      <span className={`mt-1 line-clamp-2 rounded bg-white/80 px-1 text-center text-[10px] font-semibold leading-tight ${n.state === 'locked' ? 'text-slate-500' : n.landmark ? 'text-amber-800' : 'text-slate-700'}`}>
        {n.landmark && '★ '}
        {n.title}
      </span>
      {chips.length > 0 && (
        <span className="mt-0.5 flex flex-wrap justify-center gap-0.5">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-white px-1 text-[9px] text-slate-500 ring-1 ring-slate-200">
              {c}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

function ProgressRing({ progress, size }: { progress: number; size: number }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="absolute -rotate-90" width={size} height={size} aria-hidden viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fde68a" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))} />
    </svg>
  );
}

function NodeDetail({
  n,
  now,
  titleOf,
  onClose,
  onHelp,
  onSeeOnIsland,
  onInvite,
}: {
  n: TreeNode;
  now: { residents: number; streakDays: number };
  titleOf: (key: string) => string;
  onClose: () => void;
  onHelp?: (key: string) => void;
  onSeeOnIsland?: (key: string) => void;
  onInvite?: () => void;
}) {
  const lines = conditionLines(n, now, titleOf);
  const where = SITE_TEXT[n.site];
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-slate-900/30" onClick={onClose}>
      <div role="dialog" aria-label={n.title} className="w-full rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className={`flex shrink-0 items-center justify-center rounded-2xl p-1 ${n.landmark ? 'bg-amber-100' : 'bg-slate-50'}`}>
            <Picture n={n} size={88} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className={`text-base font-bold ${n.landmark ? 'text-amber-800' : 'text-slate-800'}`}>
              {n.landmark && '★ '}
              {n.title}
            </h3>
            <p className="text-xs text-slate-500">
              {STATE_BADGE[n.state]} {STATE_TEXT[n.state]}
              {n.state === 'building' && ` · ${Math.round(n.progress * 100)}%`}
            </p>
            {where && <p className="mt-0.5 text-xs text-slate-500">{n.landmark ? 'A landmark' : 'A place'} {where}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-600">
            ✕
          </button>
        </div>
        {n.state === 'building' && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.round(n.progress * 100)}%` }} />
          </div>
        )}
        {n.state === 'ready' && <p className="mt-3 text-xs text-emerald-700">Starts when one of the 3 constructions finishes.</p>}
        {lines.length > 0 && (
          <ul className="mt-3 space-y-1">
            {lines.map((l) => (
              <li key={l.text} className={`flex items-center gap-2 text-sm ${l.met ? 'text-emerald-700' : 'text-slate-600'}`}>
                <span aria-hidden>{l.icon}</span>
                <span className="flex-1">{l.text}</span>
                <span aria-label={l.met ? 'done' : 'not yet'}>{l.met ? '✓' : '·'}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-2">
          {n.state !== 'locked' && onSeeOnIsland && (
            <button type="button" onClick={() => onSeeOnIsland(n.key)} className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-700 active:scale-[0.98]">
              See it on the island
            </button>
          )}
          {n.state === 'building' && onHelp && (
            <button type="button" onClick={() => onHelp(n.key)} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white shadow-sm active:scale-[0.98]">
              Help build it today
            </button>
          )}
          {n.state === 'locked' && onInvite && (n.missing?.residents ?? 0) + (n.missing?.landResidents ?? 0) > 0 && (
            <button type="button" onClick={onInvite} className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white shadow-sm active:scale-[0.98]">
              👋 Invite neighbours
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** "11" for the land stage that opens at 11 cumulative residents. */
function upcomingThreshold(landStage: number): string {
  const t = BUILDING_TREE.landTiers[landStage];
  return t ? String(Math.max(1, t.minResidents)) : '';
}
