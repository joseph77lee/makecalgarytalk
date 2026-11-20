/** Player-facing texts for residency (pure functions, tested). */
import type { CanMove, CheckResponse, ServerResidency } from './api';
import type { LocationProblem } from './geolocation';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-07" → "Dec 7". Calgary days come from the server; no time zone math here. */
export function formatDay(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d}`;
}

export type Tone = 'ok' | 'warn';
export interface Message {
  tone: Tone;
  text: string;
}

export const PHONE_HINT = 'Please verify residency on your phone. Computers locate by Wi-Fi and are often wrong.';

export function locationProblemMessage(problem: LocationProblem): Message {
  const text = {
    denied: 'Location is blocked for this site. Allow it in your browser settings, then try again.',
    unavailable: 'Your location could not be found. Try again outside or on your phone.',
    timeout: 'Finding your location took too long. Please try again.',
    unsupported: 'This browser cannot share a location. Please try on your phone.',
    insecure: 'Location only works on a secure (https) page.',
  }[problem];
  return { tone: 'warn', text };
}

function daysLeft(c: NonNullable<ServerResidency['candidate']>): number {
  return Math.max(0, c.needed - c.days);
}

/** "Day 1 of 3" style progress line for the candidate community. */
export function progressText(s: ServerResidency): string | null {
  const c = s.candidate;
  if (!c) return null;
  const left = daysLeft(c);
  const more = left === 1 ? '1 more day' : `${left} more days`;
  if (s.status === 'moving' && s.move) return `${c.name}: day ${c.days} of ${c.needed}. Check in on ${more} by ${formatDay(s.move.last_day)}.`;
  return `${c.name}: day ${c.days} of ${c.needed}. Open the app there on ${more} within a week.`;
}

export function checkResultMessage(r: CheckResponse): Message {
  const name = r.checked_community?.name ?? '';
  switch (r.result) {
    case 'verified':
      return { tone: 'ok', text: `You are now a Verified Resident of ${r.community?.name ?? name}! Your saved help now counts.` };
    case 'counted': {
      const c = r.candidate;
      if (c && c.id === r.checked_community?.id) {
        const left = daysLeft(c);
        return {
          tone: 'ok',
          text: `Checked in from ${name}: day ${c.days} of ${c.needed}. ${left === 1 ? 'One more day' : `${left} more days`} to become a Verified Resident.`,
        };
      }
      return { tone: 'ok', text: `Checked in from ${name}. ${c ? `${c.name} has more days, so you keep playing there.` : ''}`.trim() };
    }
    case 'not_needed':
      return { tone: 'ok', text: 'You are already a Verified Resident. No more location checks needed.' };
    case 'limit':
      return { tone: 'warn', text: 'That is enough checks for today. Try again tomorrow.' };
    case 'inaccurate':
      return { tone: 'warn', text: `Your location is not precise enough. ${PHONE_HINT}` };
    case 'no_community':
      return { tone: 'warn', text: 'You are not inside a Calgary residential community right now. Try again from home.' };
    case 'current_community':
      return { tone: 'warn', text: 'This is the community you are moving from. Check in from your new home.' };
  }
}

/** Why "I moved" is not available, or what kind of move it will be. */
export function moveAvailability(can: CanMove): string {
  if (can.allowed) {
    return can.free_correction
      ? `Free correction: you can move once without waiting, until ${formatDay(can.correction_until ?? '')}.`
      : 'You can move to another community.';
  }
  switch (can.reason) {
    case 'cooldown':
      return `You can move again on ${formatDay(can.available_on ?? '')}.`;
    case 'moving':
      return 'You are already moving.';
    case 'not_verified':
      return 'Become a Verified Resident first.';
  }
}

export const MOVE_EXPLAINER =
  'You stay in your current community until you check in from your new one on 3 different days within 7 days. ' +
  'Nothing is lost: your current community keeps what you built, and your badges come with you. ' +
  'If you do not finish within 7 days, the move is cancelled.';

/** Short chip label: verification progress, or the find/move state. */
export function chipLabel(s: ServerResidency): string | null {
  const c = s.candidate;
  if (s.status === 'verifying' && c) return `Verifying ${c.days}/${c.needed}`;
  if (s.status === 'moving') return c ? `Moving ${c.days}/${c.needed}` : 'Moving';
  if (s.status === 'new') return 'Find my community';
  return null;
}
