import { useEffect, useState } from 'react';

const currentTime = () => new Date();

/** Current time, refreshed every `intervalMs` (for countdowns). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(currentTime);
  useEffect(() => {
    const id = setInterval(() => setNow(currentTime()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
