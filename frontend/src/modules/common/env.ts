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

export function readSupabaseConfig(env: EnvSource = import.meta.env): ConfigResult {
  const url = env.VITE_SUPABASE_URL?.trim();
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
