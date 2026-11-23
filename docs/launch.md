# Launch guide (M16 Deploy & Playtest)

Steps that need the operator's own accounts. Claude Code does everything that runs from this
repository (linking, migrations, checks) once the accounts exist. Order matters.

Decisions (requirement.md v1.35): Supabase **Free** for the family/friends playtest, **Pro**
right before the public launch; hosting on **Cloudflare Pages** (domain already on Cloudflare);
contact **hello@makecalgarytalk.com**; own analytics in Supabase + Cloudflare Web Analytics.

## 1. Supabase project (operator)
1. supabase.com → New project. Name `makecalgarytalk`, region **Canada (Central)** — the Privacy
   Policy says data is hosted in Canada. Save the database password in a password manager.
2. Project Settings → API: copy the **Project URL** and the **publishable key** (`sb_publishable_…`).
   Never share the secret / service-role key with anyone (Claude Code does not need it).
3. In a terminal in this repo: `supabase login` (opens the browser), then tell Claude Code the
   project ref (the `xxxx` in `https://xxxx.supabase.co`).

## 2. Database (Claude Code)
- `supabase link --project-ref <ref>` (asks for the database password — the operator types it).
- `supabase db push` applies every migration (PostGIS, pg_cron, all modules). `seed.sql` is
  local only and is **not** pushed.
- Day-boundary check against production (tzdata must be 2026c+, Alberta permanent UTC-6):
  ```sql
  select common.calgary_day('2026-11-02 05:59:59+00') = '2026-11-01'
     and common.calgary_day('2027-03-14 12:00:00+00') = '2027-03-14'
     and common.calgary_day_start('2026-12-31') = '2026-12-31 06:00:00+00';  -- expect true
  ```

## 3. Auth settings (operator, Supabase dashboard → Authentication)
- **Sign In / Providers**: Anonymous sign-ins **on**; "Allow manual linking" **on**.
- **URL Configuration**: Site URL `https://makecalgarytalk.com`; redirect URLs
  `https://makecalgarytalk.com/**`, `https://*.makecalgarytalk.pages.dev/**`, `http://localhost:5173/**`.
- **Attack Protection**: CAPTCHA **Turnstile**, secret key from step 5.
- **Rate limits**: keep anonymous sign-ins at 30 per hour per IP (same as local).

## 4. Cloudflare Pages (operator)
1. Workers & Pages → Create → Pages → connect GitHub repo `makecalgarytalk`.
2. Build: root directory `frontend`, command `npm run build`, output `dist`, production branch `main`.
3. Environment variables (Production and Preview):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`,
   `VITE_GOOGLE_LINKING=true` (after step 6), `NODE_VERSION=20`.
4. Custom domains: add `makecalgarytalk.com` (and `www` → redirect).
5. Web Analytics: enable for the site (no cookies, no code change).
6. `frontend/public/_headers` sets security and cache headers automatically.

## 5. Turnstile (operator, Cloudflare dashboard → Turnstile)
Add a widget for `makecalgarytalk.com` (+ `localhost` if wanted). Site key → Pages env
`VITE_TURNSTILE_SITE_KEY`; secret → Supabase CAPTCHA setting (step 3).

## 6. Google sign-in (operator, Google Cloud console)
1. APIs & Services → OAuth consent screen: External, app name MakeCalgaryTalk, support email
   hello@makecalgarytalk.com, links to `/privacy.html` and `/terms.html`.
2. Credentials → OAuth client ID (Web): authorised redirect URI
   `https://<ref>.supabase.co/auth/v1/callback`; for local testing also
   `http://127.0.0.1:55421/auth/v1/callback`.
3. Supabase → Authentication → Providers → Google: paste client ID and secret.
4. Check together: link Google on a phone, play, sign in with Google on another device → same
   villager and progress (M6 Handoff).

## 7. Email (operator, Cloudflare → Email → Email Routing)
Create `hello@makecalgarytalk.com` forwarding to the operator's inbox. Send a test mail.

## 8. Operator access to the dashboard
After signing in on the live site with Google, find your user id (Supabase → Authentication →
Users) and run in the SQL editor:
```sql
insert into admin.operators (user_id, note) values ('<your-user-id>', 'operator');
```
Then open `https://makecalgarytalk.com/?admin`.

## 9. Account deletion requests
Supabase → Authentication → Users → delete the user. Every game table references `auth.users`
with `on delete cascade`, so the player's rows go with it (community totals stay).

## 10. Before the public launch
- [ ] Family/friends playtest done, feedback triaged (PLAN.md M16)
- [ ] Supabase upgraded to **Pro** (no pausing, daily backups)
- [ ] Low-end phone check on a real device
- [ ] Error monitoring with Sentry (free plan; requirement.md §20.1 — deferred by the operator on 2026-11-23 until after the family/friends playtest)
