import { useEffect, useState } from 'react';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { EMAIL_CONSENT_TEXT, identityApi, isEmail, type EmailUpdates } from './api';

const client = () => {
  const cfg = readSupabaseConfig();
  return cfg.ok ? getSupabaseClient(cfg.config) : null;
};

/**
 * Optional email updates in the profile sheet (requirement.md §18, CASL): the box is never
 * pre-checked, the address is asked only after ticking it, and unticking withdraws at once.
 */
export function EmailUpdatesSection() {
  const [state, setState] = useState<EmailUpdates | null>(null);
  const [ticked, setTicked] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = client();
    if (!c) return;
    let alive = true;
    identityApi.getEmailUpdates(c).then(
      (s) => alive && setState(s),
      () => alive && setState({ on: false, email: null }),
    );
    return () => {
      alive = false;
    };
  }, []);

  const save = async (on: boolean) => {
    const c = client();
    if (!c) return;
    if (on && !isEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const s = await identityApi.setEmailUpdates(c, on ? email.trim() : null, on);
      setState(s);
      setTicked(false);
      setEmail('');
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {state.on ? (
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" checked disabled={busy} onChange={() => void save(false)} className="mt-0.5" />
          <span>
            Email updates are on for <span className="font-semibold">{state.email}</span>. Untick to unsubscribe.
          </span>
        </label>
      ) : (
        <>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} className="mt-0.5" />
            <span>{EMAIL_CONSENT_TEXT}</span>
          </label>
          {ticked && (
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for updates"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm"
              />
              <button type="button" disabled={busy} onClick={() => void save(true)} className="rounded-xl bg-indigo-500 px-3 text-sm font-semibold text-white disabled:opacity-50">
                Save
              </button>
            </div>
          )}
        </>
      )}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      <p className="mt-1 text-[10px] text-slate-400">
        Optional. See the <a href="/privacy.html" target="_blank" rel="noreferrer" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}
