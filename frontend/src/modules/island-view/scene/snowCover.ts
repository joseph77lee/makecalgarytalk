/**
 * When the island shows lying snow (requirement.md v1.40 §10.4): at once when the island opens
 * with snow already there, but when snow starts falling while the island is open, the ground turns
 * white only after a while. Pure: the hook in IslandView keeps the memo between renders.
 */
export interface SnowMemo {
  /** The cover reported last time. */
  cover: boolean;
  /** The cover appeared while the island was open and it was snowing (waits before showing). */
  late: boolean;
  /** Counts late starts, so each one waits once. */
  episode: number;
}

export const initialSnowMemo = (cover: boolean): SnowMemo => ({ cover, late: false, episode: 0 });

/** The memo after this render; unchanged (same object) when the cover did not change. */
export function nextSnowMemo(m: SnowMemo, cover: boolean, snowing: boolean, opening: boolean): SnowMemo {
  if (cover === m.cover) return m;
  const late = cover && snowing && !opening;
  return { cover, late, episode: late ? m.episode + 1 : m.episode };
}

/** Whether the snow shows; `settledEpisode` is the last late start whose wait is over. */
export function snowVisible(m: SnowMemo, settledEpisode: number): boolean {
  return m.cover && !(m.late && settledEpisode !== m.episode);
}
