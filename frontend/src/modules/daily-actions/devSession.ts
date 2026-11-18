/**
 * TEMPORARY until Identity (M6): local development sign-in with the users seeded by
 * supabase/seed.sql (local Docker database only). `?devuser=2` signs in as the second
 * user, so two browsers can play the same community. Production builds never use this.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const DEV_USERS = {
  '1': 'dev@makecalgarytalk.local',
  '2': 'dev2@makecalgarytalk.local',
} as const;
const DEV_PASSWORD = 'dev-password'; // local seed only, not a secret

export function devUserFromSearch(search: string): keyof typeof DEV_USERS {
  return new URLSearchParams(search).get('devuser') === '2' ? '2' : '1';
}

export async function ensureDevSession(client: SupabaseClient, search: string): Promise<void> {
  const email = DEV_USERS[devUserFromSearch(search)];
  const { data } = await client.auth.getSession();
  if (data.session?.user.email === email) return;
  if (data.session) await client.auth.signOut();
  const { error } = await client.auth.signInWithPassword({ email, password: DEV_PASSWORD });
  if (error) throw new Error(`Dev sign-in failed (${email}): ${error.message}. Run "supabase db reset" to seed dev users.`);
}
