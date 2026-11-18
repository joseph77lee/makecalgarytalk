import { formatCountdown, msUntil } from '../common';
import type { HealthState } from './useHealth';

interface Props {
  state: HealthState;
  now: Date;
}

/** Shows whether the app can reach the server, plus the server's Calgary day. */
export function HealthStatus({ state, now }: Props) {
  if (state.status === 'checking') {
    return (
      <div role="status" className="rounded-2xl bg-white/80 p-4 shadow-sm">
        <p className="font-medium text-slate-500">Checking server…</p>
      </div>
    );
  }

  if (!state.ok) {
    return (
      <div role="status" className="rounded-2xl bg-rose-50 p-4 shadow-sm ring-1 ring-rose-200">
        <p className="font-semibold text-rose-700">
          <span aria-hidden="true">● </span>Disconnected
        </p>
        <p className="mt-1 break-words text-sm text-rose-600">{state.reason}</p>
      </div>
    );
  }

  const { info } = state;
  return (
    <div role="status" className="rounded-2xl bg-emerald-50 p-4 shadow-sm ring-1 ring-emerald-200">
      <p className="font-semibold text-emerald-700">
        <span aria-hidden="true">● </span>Connected
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-slate-700">
        <dt className="text-slate-500">Calgary day</dt>
        <dd>{info.calgaryDay}</dd>
        <dt className="text-slate-500">Next day in</dt>
        <dd>{formatCountdown(msUntil(info.nextDayStart, now))}</dd>
        <dt className="text-slate-500">PostGIS</dt>
        <dd>{info.postgis}</dd>
      </dl>
    </div>
  );
}
