import type { AvatarLook } from '../common';
import { avatarLookFromSeed } from '../island-view';

/** The seed of a nickname (FNV-1a), which picked the look before players chose one. */
export function nicknameSeed(nickname: string): number {
  return [...nickname].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
}

/** The look a player has now: the chosen one, or the one their nickname gave them. */
export function currentLook(nickname: string, look: AvatarLook | null | undefined): AvatarLook {
  return look ?? avatarLookFromSeed(nicknameSeed(nickname));
}
