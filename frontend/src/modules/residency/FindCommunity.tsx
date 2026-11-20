import { looksLikeDesktop } from './geolocation';
import { useResidency } from './liveStore';
import { PHONE_HINT } from './text';
import { MessageLine } from './MessageLine';

/**
 * First community step (requirement.md §6.2): find the player's community from their location.
 * Shown while the player has no counted check-in yet.
 */
export function FindCommunity({ onLookAround }: { onLookAround: () => void }) {
  const status = useResidency((s) => s.status);
  const checking = useResidency((s) => s.checking);
  const message = useResidency((s) => s.message);
  const checkIn = useResidency((s) => s.checkIn);
  if (status?.status !== 'new') return null;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-label="Find your community" className="w-full max-w-sm rounded-3xl bg-white/95 p-5 shadow-xl backdrop-blur">
        <p className="text-3xl" aria-hidden>
          🏡
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Find your community</h1>
        <p className="mt-1 text-sm text-slate-600">
          Neighbours build their community together. Your location tells us which one is yours.
        </p>
        <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          🔒 Used only to find your community. Your exact location is never stored, and we never ask for your address.
        </p>
        {looksLikeDesktop() && <p className="mt-2 text-xs font-medium text-amber-700">📱 {PHONE_HINT}</p>}
        <button
          type="button"
          onClick={() => void checkIn()}
          disabled={checking}
          className="mt-4 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {checking ? 'Finding your community…' : 'Use my location'}
        </button>
        <MessageLine message={message} />
        <button type="button" onClick={onLookAround} className="mt-3 w-full text-center text-xs text-slate-500 underline">
          Just look around first
        </button>
      </div>
    </div>
  );
}
