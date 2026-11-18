import {
  BUILDING_KINDS,
  ISLAND_SIZES,
  MAX_ACTIVE_PROJECTS,
  MAX_MINI_VILLAGERS,
  PROJECT_KINDS,
  PROJECT_STAGES,
  type BuildingKind,
  type BuildingState,
  type CommunityViewState,
  type IslandSize,
  type ProjectState,
  type ResidentHouse,
  type SpeechBubble,
} from './types';

export type ParseResult = { ok: true; state: CommunityViewState } | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;
const isFiniteIn = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const includes = <T extends string | number>(list: readonly T[], v: unknown): v is T =>
  list.includes(v as T);

/**
 * Validates a community view state (mock JSON now, server snapshot later).
 * Fails loudly with every problem listed, instead of drawing a half-broken island.
 */
export function parseCommunityViewState(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ['state must be an object'] };

  if (!isNonEmptyString(input.communityName)) errors.push('communityName must be a non-empty string');
  if (!includes(ISLAND_SIZES, input.islandSize)) {
    errors.push(`islandSize must be one of ${ISLAND_SIZES.join(', ')}`);
  }
  if (!isFiniteIn(input.vitality, 0, 100)) errors.push('vitality must be a number from 0 to 100');
  if (!isCount(input.miniVillagerCount) || (input.miniVillagerCount as number) > MAX_MINI_VILLAGERS) {
    errors.push(`miniVillagerCount must be an integer from 0 to ${MAX_MINI_VILLAGERS}`);
  }

  const houses: ResidentHouse[] = [];
  if (!Array.isArray(input.houses)) {
    errors.push('houses must be an array');
  } else {
    const ids = new Set<string>();
    input.houses.forEach((h, i) => {
      if (!isObj(h) || !isNonEmptyString(h.id) || !isNonEmptyString(h.nickname) || typeof h.activeToday !== 'boolean') {
        errors.push(`houses[${i}] needs id, nickname and activeToday`);
        return;
      }
      if (ids.has(h.id)) errors.push(`houses[${i}] duplicate id '${h.id}'`);
      ids.add(h.id);
      houses.push({ id: h.id, nickname: h.nickname, activeToday: h.activeToday });
    });
  }

  const buildings = {} as Record<BuildingKind, BuildingState>;
  if (!isObj(input.buildings)) {
    errors.push('buildings must be an object');
  } else {
    const b = input.buildings;
    for (const kind of BUILDING_KINDS) {
      const v = b[kind];
      if (isObj(v) && v.unlocked === true) {
        buildings[kind] = { unlocked: true };
      } else if (isObj(v) && v.unlocked === false && isObj(v.remaining) && isCount(v.remaining.streakDays) && isCount(v.remaining.residents)) {
        buildings[kind] = {
          unlocked: false,
          remaining: { streakDays: v.remaining.streakDays, residents: v.remaining.residents },
        };
      } else {
        errors.push(`buildings.${kind} must be { unlocked: true } or { unlocked: false, remaining: { streakDays, residents } }`);
      }
    }
    for (const key of Object.keys(b)) {
      if (!includes(BUILDING_KINDS, key)) errors.push(`buildings.${key} is not a known building`);
    }
  }

  const projects: ProjectState[] = [];
  if (!Array.isArray(input.projects)) {
    errors.push('projects must be an array');
  } else {
    if (input.projects.length > MAX_ACTIVE_PROJECTS) {
      errors.push(`at most ${MAX_ACTIVE_PROJECTS} active projects`);
    }
    const ids = new Set<string>();
    input.projects.forEach((p, i) => {
      if (
        !isObj(p) ||
        !isNonEmptyString(p.id) ||
        !includes(PROJECT_KINDS, p.kind) ||
        !isNonEmptyString(p.title) ||
        !includes(PROJECT_STAGES, p.stage) ||
        !isFiniteIn(p.progress, 0, 1)
      ) {
        errors.push(`projects[${i}] needs id, kind (${PROJECT_KINDS.join('|')}), title, stage (${PROJECT_STAGES.join('|')}), progress 0..1`);
        return;
      }
      if (ids.has(p.id)) errors.push(`projects[${i}] duplicate id '${p.id}'`);
      ids.add(p.id);
      projects.push({ id: p.id, kind: p.kind, title: p.title, stage: p.stage, progress: p.progress });
    });
  }

  const speechBubbles: SpeechBubble[] = [];
  if (!Array.isArray(input.speechBubbles)) {
    errors.push('speechBubbles must be an array');
  } else {
    const houseIds = new Set(houses.map((h) => h.id));
    const villagers = isCount(input.miniVillagerCount) ? input.miniVillagerCount : 0;
    input.speechBubbles.forEach((s, i) => {
      const a = isObj(s) ? s.anchor : undefined;
      if (!isObj(s) || !isNonEmptyString(s.text) || !isObj(a)) {
        errors.push(`speechBubbles[${i}] needs text and anchor`);
      } else if (a.kind === 'house' && isNonEmptyString(a.id)) {
        if (!houseIds.has(a.id)) errors.push(`speechBubbles[${i}] points to unknown house '${a.id}'`);
        else speechBubbles.push({ anchor: { kind: 'house', id: a.id }, text: s.text });
      } else if (a.kind === 'villager' && isCount(a.index)) {
        if (a.index >= villagers) errors.push(`speechBubbles[${i}] points to villager ${a.index}, but there are only ${villagers}`);
        else speechBubbles.push({ anchor: { kind: 'villager', index: a.index }, text: s.text });
      } else {
        errors.push(`speechBubbles[${i}] anchor must be { kind: 'house', id } or { kind: 'villager', index }`);
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    state: {
      communityName: (input.communityName as string).trim(),
      islandSize: input.islandSize as IslandSize,
      vitality: input.vitality as number,
      houses,
      buildings,
      projects,
      miniVillagerCount: input.miniVillagerCount as number,
      speechBubbles,
    },
  };
}
