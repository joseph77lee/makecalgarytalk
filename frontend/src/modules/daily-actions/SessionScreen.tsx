import { useDailyActions } from './liveStore';

/** Loading / problem screens before the island can be shown. */
export function SessionScreen() {
  const status = useDailyActions((s) => s.status);
  const error = useDailyActions((s) => s.error);
  const init = useDailyActions((s) => s.init);
  if (status === 'ready' || status === 'no-community') return null;
  const text = {
    loading: 'Loading your community…',
    'no-config': 'The app is not configured (frontend/.env.local is missing).',
    'signed-out': 'Sign-in is coming soon.',
    error: `Something went wrong: ${error ?? 'unknown error'}`,
  }[status];
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="max-w-sm text-sm text-slate-600">{text}</p>
      {status === 'error' && (
        <button type="button" onClick={() => void init()} className="rounded-full bg-slate-800 px-4 py-1.5 text-sm text-white">
          Try again
        </button>
      )}
    </div>
  );
}
