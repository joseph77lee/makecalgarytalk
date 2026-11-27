/** Newspaper texts (pure functions, tested). */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-12-07" → "Dec 6" (the news is about the day before). No time zone math. */
export function yesterdayLabel(calgaryDay: string): string {
  const [y, m, d] = calgaryDay.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d - 1));
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** Buildings that hold the newspaper (requirement.md v1.49 §7.6, §11): the Welcome sign, until the Community hall is built. */
export function newsBuildingKeys(builtKeys: Iterable<string>): string[] {
  for (const k of builtKeys) if (k === 'community-hall') return ['community-hall'];
  return ['welcome-sign'];
}

/** Whether tapping this building opens the newspaper. */
export function opensNews(key: string): boolean {
  return key === 'welcome-sign' || key === 'community-hall';
}

/** Whether the newspaper is open at all (the Welcome sign is built), for the chip. */
export function newsReady(builtKeys: Iterable<string>): boolean {
  for (const k of builtKeys) if (k === 'welcome-sign') return true;
  return false;
}
