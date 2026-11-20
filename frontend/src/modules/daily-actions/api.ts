/**
 * Typed wrappers for the gamecore RPC (docs/api.md). Responses are checked so a
 * server/client mismatch fails loudly instead of drawing a half-broken island.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunityListItem {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  population: number | null;
}

/** An active project: one level of one building under construction. */
export interface ServerProject {
  id: string;
  building_key: string;
  title: string;
  level: number;
  required: number;
  progress: number;
  stage: 'scaffolding' | 'frame';
}

export const SERVER_BUILDING_STATUSES = ['locked', 'opened', 'building', 'built'] as const;

/** One building of the tree with its status for this community (requirement.md §7.6b). */
export interface ServerBuilding {
  key: string;
  name: string;
  /** Tree stage 1–5. */
  stage: number;
  status: (typeof SERVER_BUILDING_STATUSES)[number];
  /** Highest built level, or the level under construction. */
  level: number;
  /** 0..1 while building; 1 when built. */
  progress: number;
  /** What is still missing while locked; null otherwise. */
  remaining: { residents: number; streak_days: number; requires: string[] } | null;
}

export interface ServerCommunity extends CommunityListItem {
  /** Cumulative residents (players until M7 brings Verified Residents). */
  residents: number;
  land_stage: number;
  /** True once the first building is built. */
  settled: boolean;
}

export interface ServerCommunityState {
  calgary_day: string;
  next_day_start: string;
  community: ServerCommunity;
  buildings: ServerBuilding[];
  projects: ServerProject[];
  me: { member: boolean; energy_max: number; energy_left: number } | null;
}

export interface ServerMe {
  calgary_day: string;
  next_day_start: string;
  community_id: string | null;
  energy_max: number;
  energy_left: number;
}

export type ActionStatus =
  | { status: 'accepted' | 'duplicate' }
  | {
      status: 'rejected';
      reason:
        | 'no_energy'
        | 'not_member'
        | 'other_community'
        | 'project_not_active'
        | 'project_not_found'
        | 'id_conflict'
        | 'invalid';
    };

export interface ServerSubmitResult {
  calgary_day: string;
  next_day_start: string;
  energy_max: number;
  energy_left: number;
  results: (ActionStatus & { id: string })[];
}

export class ApiError extends Error {
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
function check(cond: boolean, what: string): asserts cond {
  if (!cond) throw new ApiError(`Unexpected server response: ${what}`);
}

export function assertCommunityState(v: unknown): asserts v is ServerCommunityState {
  check(isObj(v), 'state is not an object');
  check(typeof v.calgary_day === 'string' && typeof v.next_day_start === 'string', 'state day info');
  check(isObj(v.community) && typeof v.community.id === 'string', 'state.community');
  check(Number.isInteger(v.community.land_stage) && (v.community.land_stage as number) >= 0, 'community.land_stage');
  check(Number.isInteger(v.community.residents) && (v.community.residents as number) >= 0, 'community.residents');
  check(Array.isArray(v.buildings), 'state.buildings');
  for (const b of v.buildings as unknown[]) {
    // Unknown keys are fine: the island draws them with a placeholder model (§7.6b).
    check(isObj(b) && typeof b.key === 'string' && b.key.length > 0, 'building key');
    check((SERVER_BUILDING_STATUSES as readonly unknown[]).includes(b.status), 'building.status');
    check(Number.isInteger(b.level) && (b.level as number) >= 1, 'building.level');
    check(typeof b.progress === 'number' && b.progress >= 0 && b.progress <= 1, 'building.progress');
    const r = b.remaining;
    check(
      r === null ||
        (isObj(r) && Number.isInteger(r.residents) && Number.isInteger(r.streak_days) && Array.isArray(r.requires) && r.requires.every((k) => typeof k === 'string')),
      'building.remaining',
    );
  }
  check(Array.isArray(v.projects), 'state.projects');
  for (const p of v.projects as unknown[]) {
    check(isObj(p) && typeof p.id === 'string', 'project id');
    check(typeof p.building_key === 'string' && p.building_key.length > 0, 'project building_key');
    check(Number.isInteger(p.required) && (p.required as number) > 0, 'project.required');
    check(Number.isInteger(p.progress) && (p.progress as number) >= 0, 'project.progress');
    check(p.stage === 'scaffolding' || p.stage === 'frame', 'project.stage');
  }
}

async function call<T>(client: SupabaseClient, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args ?? {});
  if (error) throw new ApiError(error.message, error.code);
  return data as T;
}

export const api = {
  listCommunities: (c: SupabaseClient) => call<CommunityListItem[]>(c, 'gamecore_list_communities'),
  getMe: (c: SupabaseClient) => call<ServerMe>(c, 'gamecore_get_me'),
  chooseCommunity: (c: SupabaseClient, communityId: string) =>
    call<ServerMe>(c, 'gamecore_choose_community', { p_community_id: communityId }),
  async getCommunityState(c: SupabaseClient, communityId: string): Promise<ServerCommunityState> {
    const data = await call<unknown>(c, 'gamecore_get_community_state', { p_community_id: communityId });
    assertCommunityState(data);
    return data;
  },
  submitActions: (c: SupabaseClient, actions: { id: string; project_id: string }[]) =>
    call<ServerSubmitResult>(c, 'gamecore_submit_actions', { p_actions: actions }),
};
