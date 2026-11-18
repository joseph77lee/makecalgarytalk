/** Labels stack by depth inside their band; speech bubbles use a higher band than name tags. */
export const LABEL_Z: [number, number] = [20, 0];
export const BUBBLE_Z: [number, number] = [29, 21];

const plural = (n: number, word: string) => `${n} more ${word}${n === 1 ? '' : 's'}`;

/** "4 more streak days · 1 more resident" (what is still missing for an unlock, §7.6). */
export function remainingText({ streakDays, residents }: { streakDays: number; residents: number }): string {
  const parts: string[] = [];
  if (streakDays > 0) parts.push(plural(streakDays, 'streak day'));
  if (residents > 0) parts.push(plural(residents, 'resident'));
  return parts.length > 0 ? parts.join(' · ') : 'Unlocks tomorrow';
}
