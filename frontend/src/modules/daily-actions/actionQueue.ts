/**
 * Optimistic daily actions (requirement.md §20.3 #3): the screen updates at once, the
 * server decides. Pure functions, so every rule is unit-tested without React or network.
 *
 * - Energy shown = server energy left − actions not confirmed yet.
 * - Each tap gets one id (crypto.randomUUID) that is reused on every retry (idempotent).
 * - Accepted (or duplicate = accepted earlier) → counted in "today"; rejected → rolled back.
 */
import type { ActionStatus, ServerSubmitResult } from './api';

export interface PendingAction {
  id: string;
  projectId: string;
  sending: boolean;
}

export interface QueueState {
  /** Energy left according to the server's last answer. */
  serverEnergyLeft: number;
  energyMax: number;
  pending: PendingAction[];
  /** My confirmed actions today per project (shown as "+N today"; progress counts them tomorrow). */
  today: Record<string, number>;
  /** Calgary day `today` belongs to (from the server). */
  day: string;
}

export type RejectReason = Extract<ActionStatus, { status: 'rejected' }>['reason'];

export interface Feedback {
  accepted: string[];
  rejected: { id: string; projectId: string; reason: RejectReason }[];
}

export const MAX_BATCH = 10;

export function initialQueue(energyLeft: number, energyMax: number, day: string): QueueState {
  return { serverEnergyLeft: energyLeft, energyMax, pending: [], today: {}, day };
}

export function energyShown(q: QueueState): number {
  return Math.max(0, q.serverEnergyLeft - q.pending.length);
}

export function canAct(q: QueueState): boolean {
  return energyShown(q) > 0;
}

export function enqueue(q: QueueState, id: string, projectId: string): QueueState {
  if (!canAct(q)) return q;
  return { ...q, pending: [...q.pending, { id, projectId, sending: false }] };
}

/** Marks up to MAX_BATCH waiting actions as sending and returns them. */
export function takeBatch(q: QueueState): { q: QueueState; batch: PendingAction[] } {
  const batch = q.pending.filter((p) => !p.sending).slice(0, MAX_BATCH);
  const ids = new Set(batch.map((b) => b.id));
  return { q: { ...q, pending: q.pending.map((p) => (ids.has(p.id) ? { ...p, sending: true } : p)) }, batch };
}

/** Network failure: the batch goes back to waiting and is retried with the same ids. */
export function batchFailed(q: QueueState, batch: PendingAction[]): QueueState {
  const ids = new Set(batch.map((b) => b.id));
  return { ...q, pending: q.pending.map((p) => (ids.has(p.id) ? { ...p, sending: false } : p)) };
}

/** Applies the server's answer for a batch. */
export function applyResult(q: QueueState, batch: PendingAction[], r: ServerSubmitResult): { q: QueueState; feedback: Feedback } {
  const byId = new Map(batch.map((b) => [b.id, b]));
  const feedback: Feedback = { accepted: [], rejected: [] };
  // A new Calgary day started: yesterday's "today" counts no longer apply.
  const today = r.calgary_day === q.day ? { ...q.today } : {};
  for (const res of r.results) {
    const action = byId.get(res.id);
    if (!action) continue;
    if (res.status === 'rejected') {
      feedback.rejected.push({ id: res.id, projectId: action.projectId, reason: res.reason });
    } else {
      today[action.projectId] = (today[action.projectId] ?? 0) + 1;
      feedback.accepted.push(res.id);
    }
  }
  const done = new Set(r.results.map((x) => x.id));
  return {
    q: {
      ...q,
      day: r.calgary_day,
      today,
      energyMax: r.energy_max,
      serverEnergyLeft: r.energy_left,
      pending: q.pending.filter((p) => !done.has(p.id)),
    },
    feedback,
  };
}

/** A fresh server state (e.g. after midnight) replaces energy; pending actions stay. */
export function syncEnergy(q: QueueState, energyLeft: number, energyMax: number, day: string): QueueState {
  return { ...q, serverEnergyLeft: energyLeft, energyMax, day, today: day === q.day ? q.today : {} };
}

export const REJECT_MESSAGES: Record<RejectReason, string> = {
  no_energy: "You're out of energy for today.",
  project_not_active: 'That project was just finished!',
  not_member: 'Find your community first.',
  other_community: 'You can only help your own community.',
  project_not_found: 'That project no longer exists.',
  id_conflict: 'Something went wrong. Please try again.',
  invalid: 'Something went wrong. Please try again.',
};
