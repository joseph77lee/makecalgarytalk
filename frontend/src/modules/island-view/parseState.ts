import { LAND_STAGE_COUNT } from './plan/buildingTree';
import {
  BUILDING_STATUSES,
  MAX_MINI_VILLAGERS,
  type BuildingView,
  type CommunityViewState,
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

/**
 * Validates a community view state (mock JSON now, server state later).
 * Fails loudly with every problem listed, instead of drawing a half-broken island.
 */
export function parseCommunityViewState(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ['state must be an object'] };

  if (!isNonEmptyString(input.communityName)) errors.push('communityName must be a non-empty string');
  if (!isCount(input.landStage) || (input.landStage as number) >= LAND_STAGE_COUNT) {
    errors.push(`landStage must be an integer from 0 to ${LAND_STAGE_COUNT - 1}`);
  }
  if (input.vitality !== null && !isFiniteIn(input.vitality, 0, 100)) {
    errors.push('vitality must be a number from 0 to 100, or null');
  }
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

  const buildings: BuildingView[] = [];
  if (!Array.isArray(input.buildings)) {
    errors.push('buildings must be an array');
  } else {
    const keys = new Set<string>();
    input.buildings.forEach((b, i) => {
      const r = isObj(b) ? b.remaining : undefined;
      const remainingOk =
        r === null ||
        (isObj(r) && isCount(r.residents) && isCount(r.streakDays) && Array.isArray(r.requires) && r.requires.every(isNonEmptyString));
      if (
        !isObj(b) ||
        !isNonEmptyString(b.key) ||
        !BUILDING_STATUSES.includes(b.status as BuildingView['status']) ||
        !(Number.isInteger(b.level) && (b.level as number) >= 1) ||
        !isFiniteIn(b.progress, 0, 1) ||
        !isNonEmptyString(b.title) ||
        !remainingOk
      ) {
        errors.push(`buildings[${i}] needs key, status (${BUILDING_STATUSES.join('|')}), level >= 1, progress 0..1, title, remaining`);
        return;
      }
      if (keys.has(b.key)) errors.push(`buildings[${i}] duplicate key '${b.key}'`);
      keys.add(b.key);
      buildings.push({
        key: b.key,
        status: b.status as BuildingView['status'],
        level: b.level as number,
        progress: b.progress as number,
        title: b.title,
        remaining: r === null ? null : { residents: (r as Obj).residents as number, streakDays: (r as Obj).streakDays as number, requires: (r as Obj).requires as string[] },
      });
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
      landStage: input.landStage as number,
      vitality: input.vitality as number | null,
      houses,
      buildings,
      miniVillagerCount: input.miniVillagerCount as number,
      speechBubbles,
    },
  };
}
