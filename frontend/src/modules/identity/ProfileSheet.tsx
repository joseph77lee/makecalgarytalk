import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { EmailUpdatesSection } from './EmailUpdatesSection';
import { currentLook } from '../avatar';
import { ProfileForm } from './ProfileForm';
import { LegalLinks } from './LegalLinks';
import { GOOGLE_LINKING, useIdentity } from './liveStore';
import { shirtColor } from './shirts';

/** Top-left chip with my nickname; opens a sheet to change it and to link Google. `children` adds sections (e.g. my community). */
export function ProfileButton({ children }: { children?: ReactNode }) {
  const profile = useIdentity((s) => s.profile);
  const [open, setOpen] = useState(false);
  if (!profile) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`My villager: ${profile.nickname}`}
        title={profile.nickname}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur"
      >
        <span className="h-7 w-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: shirtColor(profile.shirt) }} aria-hidden />
      </button>
      {/* Portal: the chip sits inside the small top bar; the sheet must cover the whole screen. */}
      {open && createPortal(<ProfileSheet onClose={() => setOpen(false)}>{children}</ProfileSheet>, document.body)}
    </>
  );
}

function ProfileSheet({ onClose, children }: { onClose: () => void; children?: ReactNode }) {
  const profile = useIdentity((s) => s.profile);
  const isAnonymous = useIdentity((s) => s.isAnonymous);
  const saveProfile = useIdentity((s) => s.saveProfile);
  const linkGoogle = useIdentity((s) => s.linkGoogle);
  const signInWithGoogle = useIdentity((s) => s.signInWithGoogle);
  const [googleError, setGoogleError] = useState<string | null>(null);
  if (!profile) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label="My villager" className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">My villager</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            ✕
          </button>
        </div>
        <ProfileForm
          initialNickname={profile.nickname}
          initialShirt={profile.shirt}
          initialLook={currentLook(profile.nickname, profile.look)}
          submitLabel="Save"
          onSubmit={async (n, s, l) => {
            const err = await saveProfile(n, s, l);
            if (!err) onClose();
            return err;
          }}
        />
        {children}
        {GOOGLE_LINKING && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {isAnonymous ? (
              <>
                <p className="mb-2 text-xs text-slate-500">This device keeps your progress. Link Google to keep it on any device.</p>
                <button
                  type="button"
                  onClick={async () => setGoogleError(await linkGoogle())}
                  className="w-full rounded-2xl border border-slate-200 py-2 text-sm font-semibold text-slate-700"
                >
                  Link Google to keep your progress
                </button>
                <button type="button" onClick={async () => setGoogleError(await signInWithGoogle())} className="mt-2 w-full text-xs text-indigo-600">
                  Already linked on another device? Sign in with Google
                </button>
              </>
            ) : (
              <p className="text-xs text-emerald-700">✓ Your progress is linked to Google.</p>
            )}
            {googleError && <p className="mt-2 text-xs text-rose-600">{googleError}</p>}
          </div>
        )}
        <EmailUpdatesSection />
        <LegalLinks className="mt-4" />
      </div>
    </div>
  );
}
