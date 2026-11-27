import type { ReactNode } from 'react';
import { TogetherBanner } from '../community-state';
import { ProfileForm } from './ProfileForm';
import { useIdentity } from './liveStore';

/**
 * First visit (requirement.md v1.53 §5.1): a "Let's build Calgary together" card (no finished
 * island: players imagine it), then nickname and villager. Shown only until the profile exists.
 */
export function FirstVisit({ banner }: { banner?: ReactNode }) {
  const status = useIdentity((s) => s.status);
  const continueToSetup = useIdentity((s) => s.continueToSetup);
  const saveProfile = useIdentity((s) => s.saveProfile);
  if (status !== 'example' && status !== 'setup') return null;

  return (
    <div className="absolute inset-0 z-40 bg-gradient-to-b from-sky-100 to-indigo-50">
      {status === 'example' ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-4 shadow-lg">
            {banner}
            <TogetherBanner title="Let's build Calgary together" tag="🏘️ MakeCalgaryTalk">
              <p className="mt-2 text-sm text-sky-900">Every neighbourhood starts as a small island. Neighbours grow it, a few taps a day.</p>
            </TogetherBanner>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
              <li>🏗️ Help build your community's places</li>
              <li>👋 The more neighbours join, the more it grows</li>
              <li>🤝 You can't finish it alone</li>
            </ul>
            <button
              type="button"
              onClick={continueToSetup}
              className="mt-4 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Let's start
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-slate-900/20 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Make your villager</h2>
            <ProfileForm submitLabel="Start" onSubmit={saveProfile} />
            <p className="mt-3 text-center text-[11px] text-slate-400">
              For Calgary residents aged 13+. By tapping Start you confirm you are 13 or older and agree to the{' '}
              <a href="/terms.html" target="_blank" rel="noreferrer" className="underline">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
