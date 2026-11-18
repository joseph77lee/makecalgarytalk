import { useEffect, useState } from 'react';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { fetchHealth, type HealthResult, type RpcCaller } from './healthApi';

export type HealthState = { status: 'checking' } | ({ status: 'done' } & HealthResult);

/** Returns an RPC caller, or the reason one cannot be created. */
function defaultRpc(): RpcCaller | string {
  const config = readSupabaseConfig();
  if (!config.ok) {
    return `Missing ${config.missing.join(', ')} (copy frontend/.env.example to frontend/.env.local)`;
  }
  const client = getSupabaseClient(config.config);
  return (fn) => client.rpc(fn);
}

/** Calls the health RPC once on mount. */
export function useHealth(rpcOverride?: RpcCaller | string): HealthState {
  const [rpc] = useState(() => rpcOverride ?? defaultRpc());
  const [state, setState] = useState<HealthState>({ status: 'checking' });

  useEffect(() => {
    let cancelled = false;
    const run: Promise<HealthResult> =
      typeof rpc === 'string' ? Promise.resolve({ ok: false, reason: rpc }) : fetchHealth(rpc);
    run.then((result) => {
      if (!cancelled) setState({ status: 'done', ...result });
    });
    return () => {
      cancelled = true;
    };
  }, [rpc]);

  return state;
}
