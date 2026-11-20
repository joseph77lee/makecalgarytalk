import { useEffect, useState, type ReactNode } from 'react';
import { IslandView, finishedExampleState, loadIslandPlan, type IslandPlan } from '../island-view';
import { ProfileForm } from './ProfileForm';
import { useIdentity } from './liveStore';

/** Plan used for the first-visit example (any stored plan works; Mahogany has water and all lots). */
const EXAMPLE_PLAN = 'MAH';

/**
 * First visit (requirement.md §5.1): a finished neighbourhood drawn by the real engine, then
 * nickname and shirt colour. Shown only until the profile exists.
 */
export function FirstVisit({ banner }: { banner?: ReactNode }) {
  const status = useIdentity((s) => s.status);
  const continueToSetup = useIdentity((s) => s.continueToSetup);
  const saveProfile = useIdentity((s) => s.saveProfile);
  const [plan, setPlan] = useState<IslandPlan | null>(null);
  const [state] = useState(() => finishedExampleState('Your community'));
  useEffect(() => {
    void loadIslandPlan(EXAMPLE_PLAN).then(setPlan, () => setPlan(null));
  }, []);
  if (status !== 'example' && status !== 'setup') return null;

  return (
    <div className="absolute inset-0 z-40 bg-gradient-to-b from-sky-100 to-indigo-50">
      {plan && <IslandView plan={plan} state={state} />}
      {status === 'example' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto w-full max-w-sm rounded-3xl bg-white/90 p-4 text-center shadow-lg backdrop-blur">
            {banner}
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Example</p>
            <h1 className="mt-1 text-xl font-bold text-slate-800">A finished Calgary neighbourhood</h1>
            <p className="mt-1 text-sm text-slate-600">You can't finish it alone. The more neighbours join, the more it grows, a few taps a day.</p>
            <button
              type="button"
              onClick={continueToSetup}
              className="mt-3 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Let's build ours together
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-900/20 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Make your villager</h2>
            <ProfileForm submitLabel="Start" onSubmit={saveProfile} />
            <p className="mt-3 text-center text-[11px] text-slate-400">For Calgary residents aged 13+.</p>
          </div>
        </div>
      )}
    </div>
  );
}
