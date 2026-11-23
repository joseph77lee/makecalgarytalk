/** Invite links and texts (pure functions, tested). */
import type { Badge, InviteLanding } from './api';

const CODE = /^[A-HJ-NP-Z2-9]{8}$/;

/** `?invite=k7qm-2xpa` → "K7QM2XPA"; null when missing or not a plausible code. */
export function inviteCodeFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get('invite');
  const code = raw?.toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
  return CODE.test(code) ? code : null;
}

/** Removes `invite` from a URL's query (after it was saved), keeping everything else. */
export function withoutInvite(href: string): string {
  const url = new URL(href);
  url.searchParams.delete('invite');
  return url.pathname + (url.search === '?' ? '' : url.search) + url.hash;
}

export function inviteUrl(origin: string, code: string): string {
  return `${origin}/?invite=${code}`;
}

/** The share text always names the community (requirement §12.2). */
export function inviteMessage(communityName: string | null): string {
  return communityName
    ? `Help me build ${communityName} on MakeCalgaryTalk! Neighbours grow it together, a few taps a day. 🏡`
    : 'Help build your Calgary community on MakeCalgaryTalk! Neighbours grow it together, a few taps a day. 🏡';
}

export function landingText(l: InviteLanding): string {
  const who = l.nickname ?? 'A neighbour';
  return l.community ? `${who} invited you to build ${l.community} together` : `${who} invited you to build your community together`;
}

export function badgeText(b: Badge): { icon: string; title: string; detail: string } {
  switch (b.key) {
    case 'founding_resident':
      return { icon: '🏅', title: 'Founding Resident', detail: `First resident of ${b.community}` };
    case 'good_neighbour':
      return { icon: '🤝', title: b.count > 1 ? `Good Neighbour ×${b.count}` : 'Good Neighbour', detail: 'Brought a neighbour home' };
    case 'community_reporter':
      return { icon: '🗞️', title: 'Community Reporter', detail: 'Neighbours thanked your local news 10 times' };
    case 'pioneer_sponsor':
      return { icon: '🚩', title: b.count > 1 ? `Pioneer Sponsor ×${b.count}` : 'Pioneer Sponsor', detail: 'Invited the first resident of a community' };
  }
}

/** Welcome card line after the first check-in (§5.1): how many neighbours until the island grows. */
export function welcomeGoal(nextLandResidents: number | null): string {
  if (nextLandResidents === null) return 'Invite neighbours to finish it together.';
  if (nextLandResidents <= 1) return 'One more neighbour and your community grows!';
  return `${nextLandResidents} more neighbours and your community grows.`;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export function shareOutcomeText(o: ShareOutcome): string | null {
  return { shared: 'Thanks for inviting a neighbour!', copied: 'Invite link copied. Paste it to a neighbour.', cancelled: null, failed: 'Could not share the link.' }[o];
}

export interface NudgeInputs {
  /** Neighbours until the island grows (null at the largest island). */
  nextLandResidents: number | null;
  /** Fewest more residents a locked building still needs (null if none waits for residents). */
  closestBuildingResidents: number | null;
  closestBuildingTitle: string | null;
  /** Something was built or the island grew since yesterday. */
  builtSinceYesterday: string | null;
  landGrew: boolean;
}

/** One short nudge at a good moment (requirement §5.1), or null. The closest goal wins. */
export function inviteNudge(n: NudgeInputs): string | null {
  const more = (k: number) => (k === 1 ? '1 more neighbour' : `${k} more neighbours`);
  if (n.nextLandResidents !== null && n.nextLandResidents <= 2) return `${more(n.nextLandResidents)} and your community grows! Invite someone nearby.`;
  if (n.closestBuildingResidents !== null && n.closestBuildingResidents <= 2 && n.closestBuildingTitle)
    return `${more(n.closestBuildingResidents)} and the ${n.closestBuildingTitle} opens! Invite someone nearby.`;
  if (n.landGrew) return 'Your community grew! Invite neighbours to grow it again.';
  if (n.builtSinceYesterday) return `The ${n.builtSinceYesterday} is built! Share it with your neighbours.`;
  return null;
}
