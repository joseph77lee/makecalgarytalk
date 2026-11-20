import { useState } from 'react';
import { createPortal } from 'react-dom';
import { looksLikeDesktop } from './geolocation';
import { useResidency } from './liveStore';
import { MessageLine } from './MessageLine';
import { PHONE_HINT, chipLabel, formatDay, progressText } from './text';

/** HUD chip while verifying or moving (and for visitors looking around); opens the details. */
export function ResidencyChip() {
  const status = useResidency((s) => s.status);
  const [open, setOpen] = useState(false);
  const label = status && chipLabel(status);
  if (!label) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto flex h-10 shrink-0 items-center gap-1 rounded-full bg-amber-100/95 px-3 text-xs font-semibold text-amber-800 shadow-sm backdrop-blur"
      >
        <span aria-hidden>🏠</span>
        {label}
      </button>
      {open && createPortal(<ResidencySheet onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ResidencySheet({ onClose }: { onClose: () => void }) {
  const status = useResidency((s) => s.status);
  const checking = useResidency((s) => s.checking);
  const message = useResidency((s) => s.message);
  const checkIn = useResidency((s) => s.checkIn);
  const cancelMove = useResidency((s) => s.cancelMove);
  if (!status) return null;
  const c = status.candidate;
  const title = status.status === 'moving' ? 'Moving' : status.status === 'new' ? 'Find your community' : 'Becoming a resident';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label={title} className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            ✕
          </button>
        </div>
        {status.status === 'new' && (
          <p className="mb-3 text-sm text-slate-600">
            Use your location to find the community you live in. You can help build it from your first day.
          </p>
        )}
        {c && (
          <div className="mb-3">
            <div className="mb-1 flex gap-1.5" aria-label={`${c.days} of ${c.needed} days`}>
              {Array.from({ length: c.needed }, (_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < c.days ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm text-slate-700">{progressText(status)}</p>
          </div>
        )}
        {status.status === 'moving' && status.community && (
          <p className="mb-2 text-xs text-slate-500">
            Until then you stay a resident of {status.community.name}
            {status.move && <> (move started {formatDay(status.move.started_on)})</>}.
          </p>
        )}
        {status.pending && (
          <p className="mb-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Your help in {status.play_community?.name} is saved and counts once you are a Verified Resident there.
          </p>
        )}
        {status.status === 'moving' && !c && (
          <p className="mb-2 text-xs text-slate-500">Check in from your new home to start counting days.</p>
        )}
        {c?.checked_today && <p className="mb-2 text-xs text-slate-500">Today is counted. Come back on another day.</p>}
        {looksLikeDesktop() && <p className="mb-2 text-xs font-medium text-amber-700">📱 {PHONE_HINT}</p>}
        <button
          type="button"
          onClick={() => void checkIn()}
          disabled={checking}
          className="w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {checking ? 'Checking your location…' : 'Check in now'}
        </button>
        <MessageLine message={message} />
        {status.status === 'moving' && (
          <button type="button" onClick={() => void cancelMove()} className="mt-3 w-full rounded-2xl bg-slate-100 py-2 text-sm text-slate-600">
            Cancel the move
          </button>
        )}
        <p className="mt-3 text-[11px] text-slate-400">🔒 Your exact location is never stored.</p>
      </div>
    </div>
  );
}
