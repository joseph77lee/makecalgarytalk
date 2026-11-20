/**
 * Nicknames (requirement.md §6.1). The server decides what is allowed; the client only
 * suggests a friendly default and gives instant hints with the same length/character rules.
 */
const ADJECTIVES = ['Snowy', 'Cozy', 'Sunny', 'Frosty', 'Brave', 'Jolly', 'Quiet', 'Lucky', 'Happy', 'Merry', 'Swift', 'Kind'];
const ANIMALS = ['Moose', 'Owl', 'Fox', 'Bison', 'Hare', 'Lynx', 'Otter', 'Elk', 'Magpie', 'Beaver', 'Robin', 'Badger'];

/** e.g. "Snowy Moose 42" (always 16 characters or fewer). */
export function suggestNickname(random: () => number = Math.random): string {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length) % list.length];
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)} ${10 + Math.floor(random() * 90)}`;
}

export const cleanNickname = (s: string): string => s.trim().replace(/\s+/g, ' ');

export type NicknameProblem = 'length' | 'characters' | 'blocked';

/** Instant hint before asking the server (which also checks blocked words). */
export function nicknameHint(raw: string): NicknameProblem | null {
  const s = cleanNickname(raw);
  if ([...s].length < 2 || [...s].length > 16) return 'length';
  if (!/^[\p{L}\p{N} _.'-]+$/u.test(s) || !/[\p{L}\p{N}]/u.test(s)) return 'characters';
  return null;
}

export const NICKNAME_MESSAGES: Record<NicknameProblem, string> = {
  length: 'Use 2–16 characters.',
  characters: 'Use letters, numbers, spaces and - _ . \' only.',
  blocked: 'Please choose a different nickname.',
};
