import type { ServerStreak } from '../daily-actions';

const more = (n: number, one: string, many: string) => `${n} more ${n === 1 ? one : many}`;

/** Streak bar text (requirement.md §7.5), e.g. "5-day streak" / "Today 2/6" / "1 more keeps it going". */
export function streakText({ days, today }: ServerStreak): { title: string; today: string; hint: string } {
  const missing = Math.max(0, today.needed - today.acted);
  return {
    title: days === 0 ? 'No streak yet' : `${days}-day streak`,
    today: `Today ${today.acted}/${Math.max(today.active_residents, today.needed)}`,
    hint: today.attended
      ? 'Today counts ✓'
      : days === 0
        ? `${more(missing, 'neighbour', 'neighbours')} today starts a streak`
        : `${more(missing, 'neighbour', 'neighbours')} today keeps it going`,
  };
}

/** Island growth goal (§7.8), or null at the largest island. */
export function landGoalText(nextLandResidents: number | null): string | null {
  if (nextLandResidents === null) return null;
  return `${more(nextLandResidents, 'neighbour', 'neighbours')} until the island grows`;
}

/** Shown while the community is Sleepy (Vitality 0–29, §7.4): help is what wakes it up. */
export function sleepyText(communityName: string): string {
  return `😴 ${communityName} is sleepy. Help today to wake it up!`;
}
