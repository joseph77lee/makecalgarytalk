import { useNow } from '../modules/common';
import { HealthStatus, useHealth } from '../modules/health';

/** App shell. M0: connectivity check only; game screens arrive in later modules. */
export function App() {
  const health = useHealth();
  const now = useNow();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">MakeCalgaryTalk</h1>
        <p className="mt-1 text-sm text-slate-500">Grow your Calgary community together.</p>
      </header>
      <HealthStatus state={health} now={now} />
      <p className="text-xs text-slate-400">M0 Foundation — development build</p>
    </main>
  );
}
