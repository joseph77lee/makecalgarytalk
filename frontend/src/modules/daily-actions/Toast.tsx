import { useEffect, useState } from 'react';
import { useDailyActions } from './liveStore';

/** Short message above the action bar; disappears after 3 seconds. */
export function Toast() {
  const toast = useDailyActions((s) => s.toast);
  const [hiddenId, setHiddenId] = useState<number | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setHiddenId(toast.id), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || toast.id === hiddenId) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 bottom-[13.5rem] z-40 flex justify-center px-4">
      <span className="rounded-full bg-slate-900/85 px-4 py-2 text-sm text-white shadow">{toast.text}</span>
    </div>
  );
}
