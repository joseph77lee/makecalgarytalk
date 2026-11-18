/**
 * Typed wrappers for the gamecore RPC (docs/api.md). Responses are checked so a
 * server/client mismatch fails loudly instead of drawing a half-broken island.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { PROJECT_KINDS, type ProjectKind } from '../island-view';

export interface CommunityListItem {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  population: number | null;
}

export interface ServerProject {
  id: string;
  seq: number;
  kind: ProjectKind;
  title: string;
  level: number;
  required: number;
  progress: number;
  stage: 'scaffolding' | 'frame';
}

export interface ServerCompletedProject {
  id: string;
  seq: number;
  kind: ProjectKind;
  title: string;
  level: number;
  completed_on: string;
}

export interface ServerCommunityState {
  calgary_day: string;
  next_day_start: string;
  community: CommunityListItem;
  projects: ServerProject[];
  completed_projects: ServerCompletedProject[];
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
  check(Array.isArray(v.projects) && Array.isArray(v.completed_projects), 'state.projects');
  for (const p of [...(v.projects as unknown[]), ...(v.completed_projects as unknown[])]) {
    check(isObj(p) && typeof p.id === 'string', 'project id');
    check(PROJECT_KINDS.includes(p.kind as ProjectKind), `unknown project kind '${String(p.kind)}'`);
  }
  for (const p of v.projects as Obj[]) {
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
