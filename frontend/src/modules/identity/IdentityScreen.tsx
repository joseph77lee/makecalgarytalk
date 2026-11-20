import { useIdentity } from './liveStore';

/** Loading / problem screens while the account is being prepared. */
export function IdentityScreen() {
  const status = useIdentity((s) => s.status);
  const error = useIdentity((s) => s.error);
  const init = useIdentity((s) => s.init);
  if (status !== 'loading' && status !== 'no-config' && status !== 'error') return null;
  const text = {
    loading: 'Getting things ready…',
    'no-config': 'The app is not configured (frontend/.env.local is missing).',
    error: `Something went wrong: ${error ?? 'unknown error'}`,
  }[status];
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-sky-100 to-indigo-50 p-6 text-center">
      <p className="max-w-sm text-sm text-slate-600">{text}</p>
      {status === 'error' && (
        <button type="button" onClick={() => void init()} className="rounded-full bg-slate-800 px-4 py-1.5 text-sm text-white">
          Try again
        </button>
      )}
    </div>
  );
}
