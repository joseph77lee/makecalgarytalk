/** World Map texts (pure, tested). */

export const LEVEL_TEXT = ['Not settled yet', 'Settled', 'Growing', 'Thriving', 'Flourishing'] as const;

export function levelText(level: number): string {
  return LEVEL_TEXT[Math.max(0, Math.min(4, level))]!;
}

/** Case- and accent-insensitive name search, best matches (name start) first. */
export function searchCommunities<T extends { name: string; code: string }>(list: T[], query: string, max = 6): T[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(query.trim());
  if (!q) return [];
  return list
    .filter((c) => norm(c.name).includes(q) || c.code.toLowerCase() === q)
    .sort((a, b) => Number(!norm(a.name).startsWith(q)) - Number(!norm(b.name).startsWith(q)) || a.name.localeCompare(b.name))
    .slice(0, max);
}
