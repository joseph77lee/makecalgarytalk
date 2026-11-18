/**
 * Time helpers that need NO time zone data.
 *
 * The Calgary day boundary is computed only on the server (`common.calgary_day`), because
 * browsers may ship outdated tzdata (Alberta stays at UTC-6 year-round from 2026-11-01).
 * The client receives instants such as `next_day_start` and only measures distances to them.
 */

/** Milliseconds from `now` until `target`, never negative. */
export function msUntil(target: Date, now: Date): number {
  return Math.max(0, target.getTime() - now.getTime());
}

/** "3h 05m", "42m", "under 1m" — for countdowns like "energy resets in …". */
export function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`Invalid duration: ${ms}`);
  }
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) {
    return 'under 1m';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`;
}
