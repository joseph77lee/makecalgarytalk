import type { CommunityListItem } from './api';

/** Case- and accent-insensitive search on name and code. */
export function filterCommunities(list: CommunityListItem[], query: string): CommunityListItem[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(query.trim());
  if (!q) return list;
  return list.filter((c) => norm(c.name).includes(q) || c.code.toLowerCase() === q);
}
