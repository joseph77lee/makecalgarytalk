/**
 * The build map screen drawn as a skill tree (requirement.md v1.48 §7.6a): the Welcome sign as the
 * root, three lanes (community, persona, nature & leisure) and horizontal bands for the resident
 * counts that open steps. Pure functions over the server's build map: every status, progress and
 * missing condition comes from the server unchanged; the bands only place nodes on the screen.
 */
import type { ServerCommunityState } from '../daily-actions';
import { buildingSpec } from '../island-view';

export type ServerBuilding = ServerCommunityState['buildings'][number];
export type Lane = 'community' | 'persona' | 'nature';
export type NodeState = 'built' | 'building' | 'ready' | 'locked';

/** Resident counts that open steps; they match the land stages (§7.8). */
export const BANDS = [1, 3, 6, 11, 26, 51] as const;
export const LANES: Lane[] = ['community', 'persona', 'nature'];

/** Endless decoration steps show only the next ones (§7.6a). */
const DECORATIONS_SHOWN = 2;

export interface TreeNode {
  key: string;
  title: string;
  lane: Lane | 'root';
  step: number;
  state: NodeState;
  /** 0..1 while building. */
  progress: number;
  /** Gold node at the end of the persona lane. */
  landmark: boolean;
  /** Neighbours this step asks for (the band it sits in). */
  residents: number;
  /** Community streak days this step asks for. */
  streakDays: number;
  site: string;
  /** What is still missing while locked (from the server); null otherwise. */
  missing: { residents: number; streakDays: number; landResidents: number; requires: string[] } | null;
}

export interface Band {
  /** Neighbours that open this band. */
  residents: number;
  reached: boolean;
  lanes: Record<Lane, TreeNode[]>;
}

export interface SkillTree {
  root: TreeNode | null;
  bands: Band[];
  /** Decoration steps after the shown ones ("…"). */
  moreDecorations: number;
  /** Built share of the tree, decorations left out (they never end). */
  percent: number;
  /** Neighbours still needed for the next band; null when every band is reached. */
  nextBand: { residents: number; more: number } | null;
}

export const isDecoration = (key: string): boolean => key.startsWith('decoration-');

export function nodeState(status: ServerBuilding['status']): NodeState {
  return status === 'opened' ? 'ready' : status;
}

/** Largest band at or below a resident count (steps with no resident condition sit in the first band). */
export function bandFor(residents: number): number {
  let band: number = BANDS[0];
  for (const b of BANDS) if (residents >= b) band = b;
  return band;
}

function toNode(b: ServerBuilding): TreeNode {
  const spec = buildingSpec(b.key);
  const lane = b.track === 'root' ? 'root' : b.track;
  return {
    key: b.key,
    title: b.name,
    lane,
    step: b.step,
    state: nodeState(b.status),
    progress: b.status === 'built' ? 1 : b.progress,
    // unique landmarks carry their order; a persona's own last places are its pattern landmarks
    landmark: b.landmark_order !== null || (b.track === 'persona' && b.step >= 4),
    residents: spec?.residents ?? 0,
    streakDays: spec?.streakDays ?? 0,
    site: b.site,
    missing: b.status === 'locked' && b.remaining ? { residents: b.remaining.residents, streakDays: b.remaining.streak_days, landResidents: b.remaining.land_residents, requires: b.remaining.requires } : null,
  };
}

/** The community's build map as a skill tree. `residents`: cumulative residents (from the server). */
export function buildSkillTree(buildings: ServerBuilding[], residents: number): SkillTree {
  const nodes = buildings.map(toNode).sort((a, b) => a.step - b.step);
  const root = nodes.find((n) => n.lane === 'root') ?? null;

  // decorations: every built one, then the next few; the rest is "…"
  const decorations = nodes.filter((n) => isDecoration(n.key));
  const firstUnbuilt = decorations.findIndex((n) => n.state !== 'built');
  const shownCount = firstUnbuilt < 0 ? decorations.length : firstUnbuilt + DECORATIONS_SHOWN;
  const hidden = new Set(decorations.slice(shownCount).map((n) => n.key));

  const bands: Band[] = BANDS.map((r) => ({ residents: r, reached: residents >= r, lanes: { community: [], persona: [], nature: [] } }));
  for (const n of nodes) {
    if (n.lane === 'root' || hidden.has(n.key)) continue;
    // a band never sits above the previous step's band in its lane (the lane reads top to bottom)
    const band = bands.find((b) => b.residents === bandFor(n.residents))!;
    const laneBands = bands.filter((b) => b.lanes[n.lane as Lane].length > 0);
    const last = laneBands[laneBands.length - 1];
    const target = last && last.residents > band.residents ? last : band;
    target.lanes[n.lane as Lane].push(n);
  }

  const counted = nodes.filter((n) => !isDecoration(n.key));
  const percent = counted.length === 0 ? 0 : Math.round((counted.filter((n) => n.state === 'built').length / counted.length) * 100);
  const next = BANDS.find((b) => b > residents);
  return {
    root,
    bands: bands.filter((b) => LANES.some((l) => b.lanes[l].length > 0)),
    moreDecorations: hidden.size,
    percent,
    nextBand: next === undefined ? null : { residents: next, more: next - residents },
  };
}

/** Names of the ten persona patterns (§7.9) for the persona lane's heading. */
export const PERSONA_NAMES: Record<string, string> = {
  lake: 'Lake life',
  mature_suburb: 'Leafy streets',
  new_suburb: 'New streets',
  river: 'Riverside',
  hill_view: 'Hilltop views',
  historic_main_street: 'Main street',
  downtown: 'Downtown',
  golf: 'Fairways',
  food_street: 'Food street',
  special_district: 'Ranch & rail',
};

export function laneTitle(lane: Lane, persona: string | null): string {
  if (lane === 'community') return 'Community';
  if (lane === 'nature') return 'Nature & leisure';
  return (persona && PERSONA_NAMES[persona]) || 'Our signature';
}

/** Where a place belongs, for the node detail ("A place by the shore"). */
export const SITE_TEXT: Record<string, string> = {
  shore: 'by the lake shore',
  riverbank: 'on the riverbank',
  hilltop: 'on the hilltop',
  slope: 'on the slope',
  street: 'on the street',
  park: 'in the park',
  plaza: 'on the plaza',
  entrance: 'at the island entrance',
  path: 'along the paths',
};

/** One line per condition for the node detail, with progress (current / needed). */
export interface ConditionLine {
  icon: string;
  text: string;
  met: boolean;
}

export function conditionLines(n: TreeNode, now: { residents: number; streakDays: number }, titleOf: (key: string) => string): ConditionLine[] {
  const lines: ConditionLine[] = [];
  const m = n.missing;
  const done = n.state !== 'locked';
  for (const key of m?.requires ?? []) lines.push({ icon: '🔒', text: `Build the ${titleOf(key)} first`, met: false });
  if (n.residents > 0) {
    const met = done || (m ? m.residents === 0 : now.residents >= n.residents);
    lines.push({ icon: '👥', text: `${Math.min(now.residents, n.residents)} / ${n.residents} neighbours`, met });
  }
  if (n.streakDays > 0) {
    const met = done || (m ? m.streakDays === 0 : now.streakDays >= n.streakDays);
    lines.push({ icon: '🔥', text: `${Math.min(now.streakDays, n.streakDays)} / ${n.streakDays} streak days`, met });
  }
  if (m && m.landResidents > 0) lines.push({ icon: '🗺️', text: `Its land rises with ${m.landResidents} more ${m.landResidents === 1 ? 'neighbour' : 'neighbours'}`, met: false });
  return lines;
}

/** Short chips on a locked node: what is missing, most important first. */
export function missingChips(n: TreeNode): string[] {
  const m = n.missing;
  if (!m) return [];
  const chips: string[] = [];
  if (m.requires.length > 0) chips.push('🔒 previous step');
  if (m.residents > 0) chips.push(`👥 ${m.residents}`);
  if (m.streakDays > 0) chips.push(`🔥 ${m.streakDays}`);
  if (m.landResidents > 0) chips.push(`🗺️ ${m.landResidents}`);
  return chips;
}

/** Places drawn in the community's persona design (requirement v1.48 §7.6), with a picture per persona. */
const PERSONA_PICTURES = new Set(['community-hall', 'neighbourhood-park']);

/** Static picture of a place (pre-rendered, §7.6a); the hall and park in the community's persona design. */
export const nodePicture = (key: string, persona: string | null = null): string =>
  persona && PERSONA_PICTURES.has(key) ? `/places/${key}.${persona.replaceAll('_', '-')}.png` : `/places/${key}.png`;
/** Static picture of the community's finished island. */
export const finishedIslandPicture = (code: string): string => `/islands/finished/${code}.webp`;
