import { createContext, useContext, useState, type ReactNode } from 'react';
import { projectIcon, type ServerCommunityState } from '../daily-actions';
import { InviteChip } from './InviteChip';
import {
  LANES,
  SITE_TEXT,
  buildSkillTree,
  PERSONA_ICONS,
  conditionLines,
  laneTitle,
  missingChips,
  nextBandPlaces,
  nodePicture,
  type Band,
  type Lane,
  type ServerBuilding,
  type TreeNode,
} from './skillTree';

/** The community's persona: the hall and park pictures follow it (requirement v1.48 §7.6). */
const PersonaContext = createContext<string | null>(null);

interface Props {
  community: ServerCommunityState['community'];
  streakDays: number;
  buildings: ServerBuilding[];
  onClose: () => void;
  /** Opens the invite where more neighbours are needed (residents only). */
  onInvite?: () => void;
  /** "Help build it today": picks that construction in the action bar (residents only). */
  onHelp?: (key: string) => void;
  /** "See it on the island": closes the map and turns the camera to the place. */
  onSeeOnIsland?: (key: string) => void;
}

/**
 * Village build map (requirement.md v1.48 §7.6a), drawn like a skill tree: the Welcome sign as
 * the root, three lanes read top to bottom and bands for the neighbours that open steps.
 * Read-only: every state comes from the server.
 */
export function BuildMap({ community, streakDays, buildings, onClose, onInvite, onHelp, onSeeOnIsland }: Props) {
  const tree = buildSkillTree(buildings, community.residents);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const titleOf = (key: string) => buildings.find((b) => b.key === key)?.name ?? key;
  const next = nextBandPlaces(tree);

  return (
    <PersonaContext.Provider value={community.persona}>
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
          <div className="p-3">
            <TogetherBanner
              title={`Let's build ${community.name} together`}
              tag={community.persona ? `${PERSONA_ICONS[community.persona] ?? '⭐'} ${laneTitle('persona', community.persona)}` : null}
            >
              {next && (
                <p className="mt-2 text-xs text-sky-900">
                  Next at {next.residents} {next.residents === 1 ? 'neighbour' : 'neighbours'}: <span className="font-semibold">{next.names.join(' · ')}</span>
                </p>
              )}
            </TogetherBanner>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xs font-semibold text-indigo-900">Community complete</span>
              <span className="text-sm font-bold text-indigo-700">{tree.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-indigo-100">
              <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-700" style={{ width: `${tree.percent}%` }} />
            </div>
          </div>

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
      </section>
    </div>
    </PersonaContext.Provider>
  );
}

/**
 * A designed banner instead of a finished-island picture (requirement.md v1.53 §5.1, §7.6a): players
 * imagine the final look. The first visit uses it for Calgary, the build map for the community.
 */
export function TogetherBanner({ title, tag, children }: { title: string; tag?: string | null; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 via-sky-100 to-amber-100 p-4 shadow-inner" data-testid="together-banner">
      {/* soft voxel clouds and hills, drawn with boxes */}
      <span className="absolute right-6 top-3 h-3 w-10 rounded-sm bg-white/80" aria-hidden />
      <span className="absolute right-3 top-5 h-3 w-6 rounded-sm bg-white/70" aria-hidden />
      <span className="absolute -bottom-3 -right-4 h-12 w-28 rounded-t-lg bg-emerald-300/60" aria-hidden />
      <span className="absolute -bottom-4 right-16 h-9 w-20 rounded-t-lg bg-emerald-400/50" aria-hidden />
      <span className="absolute -bottom-2 left-6 h-6 w-16 rounded-t-md bg-emerald-300/40" aria-hidden />
      <div className="relative pb-5">
        {tag && <span className="inline-block rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-sky-800">{tag}</span>}
        <h3 className="mt-1 text-xl font-extrabold leading-tight text-sky-950">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function BandRow({ band, next, onInvite, onTap }: { band: Band; next: number | null; onInvite?: () => void; onTap: (n: TreeNode) => void }) {
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
          <LaneColumn key={lane} lane={lane} nodes={band.lanes[lane]} onTap={onTap} />
        ))}
      </div>
    </div>
  );
}

function LaneColumn({ lane, nodes, onTap }: { lane: Lane; nodes: TreeNode[]; onTap: (n: TreeNode) => void }) {
  return (
    <div className="relative flex flex-col items-center gap-3" data-lane={lane}>
      {/* the lane's line, behind the nodes */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-slate-200" aria-hidden />
      {nodes.map((n) => (
        <Node key={n.key} n={n} onTap={onTap} />
      ))}
    </div>
  );
}

const STATE_BADGE: Record<TreeNode['state'], string> = { built: '✅', building: '🔨', ready: '✨', locked: '🔒' };
const STATE_TEXT: Record<TreeNode['state'], string> = { built: 'Built', building: 'Under construction', ready: 'Ready to build', locked: 'Locked' };

function Picture({ n, size }: { n: TreeNode; size: number }) {
  const [missing, setMissing] = useState(false);
  const persona = useContext(PersonaContext);
  const dim = n.state === 'locked' ? 'opacity-45 grayscale' : '';
  if (n.secret)
    return (
      <span className="flex items-center justify-center rounded-full bg-amber-100/70 font-black text-amber-400" style={{ width: size, height: size, fontSize: size * 0.55 }} aria-hidden>
        ?
      </span>
    );
  return missing ? (
    <span className={`flex items-center justify-center ${dim}`} style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden>
      {projectIcon(n.key)}
    </span>
  ) : (
    <img src={nodePicture(n.key, persona)} alt="" onError={() => setMissing(true)} className={`object-contain ${dim}`} style={{ width: size, height: size }} draggable={false} />
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
      {n.group && <span className="text-[9px] font-semibold text-emerald-700">{n.group.built} / {n.group.total} built</span>}
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
            {where && !n.secret && !n.group && <p className="mt-0.5 text-xs text-slate-500">{n.landmark ? 'A landmark' : 'A place'} {where}</p>}
            {n.secret && <p className="mt-0.5 text-xs text-slate-500">Revealed when it is ready to build.</p>}
            {n.group && (
              <p className="mt-0.5 text-xs text-slate-500">
                {n.group.built} of {n.group.total} built · the next one {n.state === 'built' ? 'is done' : 'needs:'}
              </p>
            )}
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
