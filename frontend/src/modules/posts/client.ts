import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, readSupabaseConfig } from '../common';

export function postsClient(): SupabaseClient {
  const cfg = readSupabaseConfig();
  if (!cfg.ok) throw new Error('Supabase is not configured');
  return getSupabaseClient(cfg.config);
}
