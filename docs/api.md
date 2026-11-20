# Server API (Supabase RPC)

The frontend talks to the database **only** through these Postgres functions
(`supabase.rpc('<name>', args)`). Tables live in module schemas that the API does not
expose; Row Level Security is on for every table. All game rules run on the server.

Times: the server owns the Calgary day (America/Edmonton). Responses include
`calgary_day` (date) and `next_day_start` (instant of the next Calgary midnight). The
client never computes time zones; it only counts down to `next_day_start`.

| Function | Who | Purpose |
|---|---|---|
| `common_health()` | anon, authenticated | Connectivity check |
| `gamecore_list_communities()` | anon, authenticated | All game communities |
| `gamecore_get_community_state(p_community_id)` | anon, authenticated | Buildings, streak, Vitality, changes, my energy |
| `gamecore_submit_actions(p_actions)` | authenticated | Spend energy on projects |
| `gamecore_get_me()` | authenticated | My community and energy |
| `gamecore_choose_community(p_community_id)` | authenticated | **Temporary until M7** |
| `identity_get_profile()` | authenticated | My nickname, shirt, account type |
| `identity_save_profile(p_nickname, p_shirt)` | authenticated | First-visit setup and later changes |
| `identity_mark_changes_seen()` | authenticated | "What changed since yesterday" seen today |

**Accounts (Identity, M6):** every visitor gets a Supabase Auth account on the first visit
with `signInAnonymously` (no form). Sign-ups need a Cloudflare **Turnstile** token
(`options.captchaToken`); Supabase Auth checks it and limits anonymous sign-ups per IP
(`[auth.rate_limit] anonymous_users`). Anonymous players use the `authenticated` role like
everyone else. Optional Google linking uses `linkIdentity` (same user id, progress kept);
signing in with a Google account that is already linked restores that account
(`signInWithOAuth`).

---

## `gamecore_list_communities()`
Residential Calgary communities (City of Calgary Open Data, see `docs/data-sources.md`).

```json
[{ "id": "uuid", "code": "MAH", "name": "Mahogany", "sector": "Southeast", "population": 13860 }]
```
`population` is `null` for brand-new communities without census data.

## `gamecore_get_community_state(p_community_id uuid)`
State on the current Calgary day. The shared part comes from a **snapshot** per community,
rebuilt every 5 minutes by pg_cron (`gamecore.refresh_snapshots()`), on the first read of a
new Calgary day, and right after someone joins or leaves the community. Building the snapshot
also updates the building tree (newly unlocked buildings are recorded as opened, new
constructions start while fewer than 3 are active; these rows are written once). `streak` and
`me` are computed live on every read.

```json
{
  "calgary_day": "2026-12-02",
  "next_day_start": "2026-12-03T06:00:00+00:00",
  "community": { "id": "uuid", "code": "MAH", "name": "Mahogany", "sector": "Southeast", "population": 13860,
                 "residents": 4, "land_stage": 1, "next_land_residents": 2, "settled": true,
                 "vitality": 64, "mini_villagers": 5 },
  "streak": { "days": 5, "today": { "acted": 2, "active_residents": 6, "needed": 3, "attended": false } },
  "changes": {
    "actions": 4,
    "progress": [{ "building_key": "fire-pit", "title": "Fire pit", "level": 1, "added": 4 }],
    "built": [{ "building_key": "frozen-pond", "title": "Frozen pond", "level": 1 }],
    "opened": [{ "building_key": "playground", "title": "Playground" }],
    "new_residents": 1, "land_grew": false, "vitality_before": 58
  },
  "buildings": [
    { "key": "welcome-sign", "name": "Welcome sign", "stage": 1, "status": "building", "level": 2, "progress": 0.25, "remaining": null },
    { "key": "frozen-pond", "name": "Frozen pond", "stage": 1, "status": "built", "level": 1, "progress": 1, "remaining": null },
    { "key": "warming-hut", "name": "Warming hut", "stage": 2, "status": "locked", "level": 1, "progress": 0,
      "remaining": { "residents": 0, "streak_days": 3, "requires": ["fire-pit"] } }
  ],
  "projects": [
    { "id": "uuid", "building_key": "welcome-sign", "title": "Welcome sign", "level": 2,
      "required": 4, "progress": 1, "stage": "scaffolding" }
  ],
  "me": { "member": true, "energy_max": 3, "energy_left": 2 }
}
```
- `community.residents`: cumulative residents = distinct people who have ever joined
  (**temporary:** joining stands in for verification until M7). `land_stage`: 0–5 from the
  land tiers; `next_land_residents`: residents still needed to grow, `null` at the largest
  island. `settled`: the first building has been built.
- `community.vitality`: 0–100 (§7.4), changes once a day; `null` before the first finished
  day (draw the normal mood). `mini_villagers`: ambient villagers to draw (3–20).
- `streak.days`: consecutive attendance days up to yesterday, +1 once today is an attendance
  day. `streak.today`: members who acted today, 7-day active residents, how many are needed
  (half, rounded up, at least 1), and whether today already counts.
- `changes`: what changed since yesterday — yesterday's actions (total and per building
  level), buildings that became built or reached a new level today, buildings unlocked since
  yesterday (not the three seeds), new residents yesterday, whether the land grew, and
  yesterday's Vitality.
- `buildings`: every building of the tree, in tree order.
  - `status`: `locked` (conditions not met), `opened` (unlocked, waiting for a free
    construction slot), `building` (a construction or upgrade is active), `built`.
  - `level`: the level under construction, or the highest built level.
  - `progress`: 0–1 while building, 1 when built.
  - `remaining`: only for `locked`; what is still missing (`residents` and `streak_days` are
    the shortfall, `requires` the buildings that are not yet built).
- `projects`: the active constructions (at most 3); the ids to send to
  `gamecore_submit_actions`. `progress` counts actions from **before today** (today's
  actions show tomorrow), capped at `required`. `stage`: `scaffolding` below half, `frame`
  from half. A building is `built` the day after its goal was reached.
- `me`: `null` for visitors (not signed in).
- Errors: unknown community → `P0002`.

## `gamecore_submit_actions(p_actions jsonb)`
```json
[{ "id": "client-generated uuid", "project_id": "uuid" }]
```
At most 10 entries per call. Each entry is processed in order and gets a result:

```json
{
  "calgary_day": "2026-12-01", "next_day_start": "2026-12-02T06:00:00+00:00",
  "energy_max": 3, "energy_left": 0,
  "results": [
    { "id": "…", "status": "accepted" },
    { "id": "…", "status": "duplicate" },
    { "id": "…", "status": "rejected", "reason": "no_energy" }
  ]
}
```

| Status / reason | Meaning |
|---|---|
| `accepted` | Stored; one energy spent |
| `duplicate` | This id was already accepted for you (safe retry; no energy spent, even after midnight) |
| `rejected` · `no_energy` | 3 actions already today (Calgary day) |
| `rejected` · `not_member` | You have not joined a community |
| `rejected` · `other_community` | The project (building) belongs to another community |
| `rejected` · `project_not_active` | The construction is finished (goal reached) |
| `rejected` · `project_not_found` | Unknown project id |
| `rejected` · `id_conflict` | Another player already used this id |
| `rejected` · `invalid` | Missing or malformed `id` / `project_id` |

- **Idempotency:** always generate the id once per tap (e.g. `crypto.randomUUID()`) and
  reuse it on retries.
- The action's day is the **server's** Calgary day when it arrives. An action queued
  offline before midnight and sent after midnight counts for the new day.
- Errors: not signed in → `28000`; body not an array or more than 10 entries → `22023`.

## `gamecore_get_me()`
```json
{ "calgary_day": "2026-12-01", "next_day_start": "…", "community_id": "uuid | null", "energy_max": 3, "energy_left": 3 }
```

## `gamecore_choose_community(p_community_id uuid)` — temporary
Joins (or switches to) a community chosen from the list; returns the same shape as
`gamecore_get_me()`. **Residency (M7) replaces this** with location-based verification and
the moving rules (§6.4).

## `identity_get_profile()`
```json
{ "calgary_day": "2026-12-01", "is_anonymous": true,
  "profile": { "nickname": "Snowy Moose 42", "shirt": 3 },
  "changes_seen_today": false }
```
- `profile` is `null` until the first-visit setup is saved (the app then shows the finished
  example and the setup).
- `shirt`: index 0–7 into the client's palette.

## `identity_save_profile(p_nickname text, p_shirt integer)`
Creates or updates my profile. Returns `{ "ok": true, ...identity_get_profile }`, or
`{ "ok": false, "problem": "length" | "characters" | "blocked" | "shirt" }`.
- Nickname is trimmed and inner spaces collapsed, then: 2–16 characters; letters (any
  language), digits, spaces and `- _ . '`, with at least one letter or digit; not a blocked
  word (`identity.blocked_words`: equal to one of its words, or contained in it with symbols
  removed for words of 5+ letters).

## `identity_mark_changes_seen()`
Records today's Calgary day as seen; returns the same shape as `identity_get_profile()`.

---

## Rules (starting values, `requirement.md` §7.7, §8, §22.8)
- 3 energy per player per Calgary day; enforced by a database constraint (energy slots 1–3).
- Building tree (`supabase/data/building_tree.json`, seeded into `gamecore.building_types`,
  `requirement.md` §7.6b). A building **opens** when its required buildings are built and
  the community has enough cumulative residents and streak days. Openings are recorded once,
  so a building never locks again when residents leave.
- At most 3 constructions at a time. Opened buildings start in tree order; when none is
  waiting, the newest building of each growth chain is upgraded (lowest level first).
- Required actions, frozen when a construction starts:
  `ceil(max(10, 5 × active residents) × stage multiplier × 1.25^(level−1))`, at least 3 for
  stage-1 buildings. Stage multipliers: 1: 0.3, 2: 1, 3: 1.5, 4: 2, 5: 3.
  Active residents = members whose last active day (later of joining and last action) is
  within the last 30 Calgary days.
- Land tiers (cumulative residents → land stage): 0, 3, 6, 11, 26, 51 → 0–5.
- **Members** come from membership events (one row per join into a different community,
  append-only). Members on a day = players whose latest join on or before that day was into
  the community. **Temporary** until M7 (Verified Residents, moves in progress).
- **Community streak** (§7.5): an attendance day = at least half (rounded up) of the members
  who acted within the last 7 Calgary days acted that day; 0 active → not an attendance day.
- **Vitality** (§7.4): daily ratio = members who acted ÷ members whose last active day (later
  of joining and last action) is within the last 30 days; Vitality = 100 × max(average of the
  last 3 finished days, average of the last 7), only days since the first resident.
- Finished days are stored once in `gamecore.community_days` (they never change).
- Mini villagers = clamp(3, 20, ⌈shown residents × (0.5 + Vitality/100)⌉), Vitality 50 if unknown.
- Actions are append-only; progress and completion are computed from the action log.

## Local development
- `supabase db reset` applies migrations and `supabase/seed.sql`, which creates two **local-only**
  dev users, `dev@makecalgarytalk.local` and `dev2@makecalgarytalk.local` (password
  `dev-password`), members of Mahogany with profiles ("Dev One", "Dev Two").
- The app signs in as them only with `?devuser=1` or `?devuser=2` (dev builds). Without the
  parameter it uses the real flow: anonymous account → first-visit example → profile setup.
  A private window gives a fresh anonymous player.
- Turnstile runs locally with Cloudflare's public **test** keys (always pass): the secret in
  `supabase/config.toml`, the site key in `frontend/.env.local` (`VITE_TURNSTILE_SITE_KEY`).
  The browser loads the widget from `challenges.cloudflare.com`, so local play needs internet.
