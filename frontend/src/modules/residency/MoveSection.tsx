import { useState } from 'react';
import { useResidency } from './liveStore';
import { MessageLine } from './MessageLine';
import { MOVE_EXPLAINER, formatDay, moveAvailability, progressText } from './text';

/** "My community" part of the profile sheet: verified community and "I moved" (§6.4). */
export function MoveSection() {
  const status = useResidency((s) => s.status);
  const message = useResidency((s) => s.message);
  const startMove = useResidency((s) => s.startMove);
  const cancelMove = useResidency((s) => s.cancelMove);
  const [confirming, setConfirming] = useState(false);
  if (!status?.community) return null;
  const can = status.can_move;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-700">My community</h3>
      <p className="mt-1 text-sm text-slate-600">
        {status.community.name} <span className="text-emerald-600">✓ Verified Resident</span>
        <span className="block text-[11px] text-slate-400">since {formatDay(status.community.verified_on)}</span>
      </p>

      {status.status === 'moving' ? (
        <>
          <p className="mt-2 text-xs text-slate-600">{progressText(status) ?? 'Moving: check in from your new home.'}</p>
          <button type="button" onClick={() => void cancelMove()} className="mt-2 w-full rounded-2xl bg-slate-100 py-2 text-sm text-slate-600">
            Cancel the move
          </button>
        </>
      ) : confirming ? (
        <div className="mt-2 rounded-2xl bg-slate-50 p-3">
          <p className="text-xs text-slate-600">{MOVE_EXPLAINER}</p>
          <p className="mt-1 text-xs text-slate-500">{moveAvailability(can)}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className="flex-1 rounded-2xl bg-white py-2 text-sm text-slate-600 shadow-sm">
              Not now
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                void startMove();
              }}
              className="flex-1 rounded-2xl bg-indigo-500 py-2 text-sm font-semibold text-white"
            >
              Start moving
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!can.allowed}
            className="mt-2 w-full rounded-2xl bg-slate-100 py-2 text-sm text-slate-600 disabled:opacity-50"
          >
            I moved
          </button>
          {!can.allowed && <p className="mt-1 text-[11px] text-slate-400">{moveAvailability(can)}</p>}
        </>
      )}
      <MessageLine message={message} />
    </div>
  );
}
