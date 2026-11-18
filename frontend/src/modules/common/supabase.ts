import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from './env';

let client: SupabaseClient | undefined;

/** Single shared Supabase client. Modules call only `public.<module>_<name>()` RPC functions. */
export function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  client ??= createClient(config.url, config.publishableKey);
  return client;
}
