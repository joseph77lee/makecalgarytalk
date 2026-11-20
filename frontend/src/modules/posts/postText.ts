/** Community post texts (pure functions, tested). */
import type { CanPost, PostKind, PostProblem } from './api';

export const KIND_LABEL: Record<PostKind, { icon: string; label: string; hint: string }> = {
  event: { icon: '🎉', label: 'Event', hint: 'A get-together, a game, a market…' },
  deal: { icon: '🏷️', label: 'Local deal', hint: 'A local shop’s sale or special (no links)' },
  lost_found: { icon: '🔎', label: 'Lost & found', hint: 'Something lost or found nearby' },
  other: { icon: '💬', label: 'Other', hint: 'Anything neighbours should know' },
};

export function ageText(daysAgo: number): string {
  return daysAgo <= 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
}

export const PROBLEM_TEXT: Record<PostProblem, string> = {
  not_verified: 'Only Verified Residents can post.',
  locked: 'Posts open once the Welcome sign is built.',
  daily_limit: 'You already posted today. Come back tomorrow!',
  kind: 'Pick what kind of post this is.',
  length: 'Write 1 to 300 characters.',
  link: 'Links are not allowed. Describe it in words instead.',
  phone: 'Please do not share phone numbers.',
  address: 'Please do not share street addresses. A landmark is fine (e.g. "by the lake").',
  blocked: 'Please keep it friendly.',
};

/** Why the write button is not offered, or null when it is. */
export function cannotPostText(c: CanPost): string | null {
  if (c.allowed) return null;
  switch (c.reason) {
    case 'not_signed_in':
    case 'not_verified':
      return 'Become a Verified Resident to post local news here.';
    case 'locked':
      return 'Posts open once the Welcome sign is built.';
    case 'daily_limit':
      return 'You posted today. You can post again tomorrow.';
    case 'other_community':
      return 'You can post in your own community.';
  }
}

export const MAX_CHARS = 300;
