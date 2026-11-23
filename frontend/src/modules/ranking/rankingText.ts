import type { RankEntry, WeekBoard, WeeklyRanking } from './api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Dec 7" from a server day (YYYY-MM-DD); plain string handling, no time zones. */
export function dayLabel(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return m && d ? `${MONTHS[m - 1]} ${d}` : day;
}

export function scoreText(score: number): string {
  return score.toFixed(2);
}

/** My community's line under the list. */
export function mineText(mine: RankEntry, ranked: number): string {
  if (mine.rank !== null) return `#${mine.rank} of ${ranked}`;
  return mine.needed === 1 ? '1 more resident to enter the ranking' : `${mine.needed} more residents to enter the ranking`;
}

/** Whether my community already shows in the top list. */
export function mineInTop(week: WeekBoard): boolean {
  return !!week.mine && week.top.some((e) => e.code === week.mine?.code);
}

/** Monday line for "Since yesterday", when my community was ranked last week. */
export function weeklyAnnouncement(r: WeeklyRanking | null): { text: string; rank: number; ranked: number } | null {
  const mine = r?.last_week.mine;
  if (!r || !r.results_day || !r.home || !mine || mine.rank === null) return null;
  return { text: `Last week ${r.home.name} ranked #${mine.rank} in Calgary`, rank: mine.rank, ranked: r.last_week.ranked };
}

/** Share card title for a weekly result. */
export function weeklyCardTitle(rank: number): string {
  return rank === 1 ? '#1 in Calgary last week!' : `#${rank} in Calgary last week`;
}
