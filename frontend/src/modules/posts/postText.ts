/** Community post texts (pure functions, tested). */
import type { CanPost, NextStep, PostKind, PostProblem } from './api';

/** Kinds of local news: what is really happening in the community (requirement.md v1.28 §14). */
export const KIND_LABEL: Record<PostKind, { icon: string; label: string; hint: string }> = {
  safety: { icon: '🚨', label: 'Safety', hint: 'e.g. Car break-ins reported overnight. Lock your cars!' },
  deal: { icon: '🏷️', label: 'Local deals', hint: 'e.g. The bakery by the lake: 2-for-1 buns this weekend' },
  event: { icon: '🎉', label: 'Events', hint: 'e.g. Skating at the lake, Saturday afternoon' },
  lost_found: { icon: '🔎', label: 'Lost & found', hint: 'e.g. Found a blue mitten by the rink' },
  talk: { icon: '💬', label: 'Free talk', hint: 'Anything neighbours should know' },
};

/** Shown while writing a Safety post, and under Safety posts. */
export const SAFETY_NOTE = 'Say what happened, not who. No names or photos. In an emergency, call 911.';

export const REPORT_PROBLEM: Record<string, string> = {
  limit: 'You can report up to 3 posts a day.',
  blocked: 'Reporting is turned off for your account.',
};

export function ageText(daysAgo: number): string {
  return daysAgo <= 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
}

export const PROBLEM_TEXT: Record<PostProblem, string> = {
  not_verified: 'Only Verified Residents can post.',
  locked: 'Posts open once the Welcome sign is built.',
  daily_limit: 'You already posted today. Come back tomorrow!',
  kind: 'Pick what kind of post this is.',
  kind_locked: 'That kind of post opens at a later step.',
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
      return 'Become a Verified Resident to post local news here.';
    case 'not_verified':
      return 'Posts open once you are a Verified Resident. Until then, answer today\'s question!';
    case 'locked':
      return 'Posts open once the Welcome sign is built.';
    case 'daily_limit':
      return 'You posted today. You can post again tomorrow.';
    case 'other_community':
      return 'You can post in your own community.';
  }
}

export const MAX_CHARS = 300;

/** "🎉 Events and 🏷️ Local deals open after 14 active days (9 to go)" — the write box's next step. */
export function nextStepText(next: NextStep | null): string | null {
  if (!next || next.kinds.length === 0) return null;
  const names = next.kinds.map((k) => `${KIND_LABEL[k].icon} ${KIND_LABEL[k].label}`);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const verb = names.length === 1 ? 'opens' : 'open';
  return `${list} ${verb} after ${next.days} active days (${next.to_go} to go)`;
}
