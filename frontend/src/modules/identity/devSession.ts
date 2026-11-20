/**
 * Local development only: `?devuser=1` / `?devuser=2` signs in as the users seeded by
 * supabase/seed.sql (local Docker database), so two browsers can play the same community
 * with known accounts. Without the parameter, development uses the real anonymous flow.
 * Production builds never use this.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export const DEV_USERS = {
  '1': 'dev@makecalgarytalk.local',
  '2': 'dev2@makecalgarytalk.local',
} as const;
export type DevUser = keyof typeof DEV_USERS;
const DEV_PASSWORD = 'dev-password'; // local seed only, not a secret

export function devUserFromSearch(search: string): DevUser | null {
  const v = new URLSearchParams(search).get('devuser');
  return v === '1' || v === '2' ? v : null;
}

/** True when already signed in as that dev user; otherwise signs in (needs a captcha token). */
export async function isDevSession(client: SupabaseClient, user: DevUser): Promise<boolean> {
  const { data } = await client.auth.getSession();
  return data.session?.user.email === DEV_USERS[user];
}

export async function signInDevUser(client: SupabaseClient, user: DevUser, captchaToken: string): Promise<void> {
  const email = DEV_USERS[user];
  await client.auth.signOut();
  const { error } = await client.auth.signInWithPassword({ email, password: DEV_PASSWORD, options: { captchaToken } });
  if (error) throw new Error(`Dev sign-in failed (${email}): ${error.message}. Run "supabase db reset" to seed dev users.`);
}
