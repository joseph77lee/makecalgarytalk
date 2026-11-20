/**
 * Frontend configuration from Vite env vars (see frontend/.env.example).
 * Only public values belong here: the Supabase URL and the publishable (anon) key.
 * The secret/service-role key must never reach the frontend.
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export type ConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: string[] };

type EnvSource = Record<string, string | undefined>;

/**
 * `VITE_SUPABASE_URL` may be a path such as `/supabase` (phone testing through the dev server's
 * proxy); it is then resolved against the page's origin.
 */
export function readSupabaseConfig(env: EnvSource = import.meta.env, origin: string | undefined = globalThis.location?.origin): ConfigResult {
  const raw = env.VITE_SUPABASE_URL?.trim();
  const url = raw?.startsWith('/') && origin ? origin + raw : raw;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [
    ...(url ? [] : ['VITE_SUPABASE_URL']),
    ...(publishableKey ? [] : ['VITE_SUPABASE_PUBLISHABLE_KEY']),
  ];
  if (!url || !publishableKey) {
    return { ok: false, missing };
  }
  if (/^sb_secret_/.test(publishableKey) || /service_role/.test(publishableKey)) {
    throw new Error('A secret Supabase key was put in VITE_SUPABASE_PUBLISHABLE_KEY. Use the publishable key.');
  }
  return { ok: true, config: { url, publishableKey } };
}
