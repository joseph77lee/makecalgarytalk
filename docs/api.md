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
| `gamecore_get_me()` | authenticated | The community I play in, pending flag, energy |
| `identity_get_profile()` | authenticated | My nickname, shirt, account type |
| `identity_save_profile(p_nickname, p_shirt)` | authenticated | First-visit setup and later changes |
| `identity_mark_changes_seen()` | authenticated | "What changed since yesterday" seen today |
| `residency_get_status()` | authenticated | My residency: verifying, verified, moving |
| `residency_check_location(p_lat, p_lon, p_accuracy)` | authenticated | Location check-in (coordinates never stored) |
| `residency_start_move()` | authenticated | "I moved" |
| `residency_cancel_move()` | authenticated | Cancel my move |
| `invites_get_mine()` | authenticated | My invite code, counts, who invited me, badges |
| `invites_accept(p_code)` | authenticated | Accept an invite (once) |
| `invites_lookup(p_code)` | anon, authenticated | Who sent an invite link (nickname, community) |
| `news_get_newspaper(p_community_id)` | anon, authenticated | Today's community newspaper (incl. local news posts) |
| `posts_create(p_kind, p_body)` | authenticated | Post local news (Verified Residents) |
| `posts_delete(p_post_id)` | authenticated | Delete my post |
| `posts_report(p_post_id)` | authenticated | Report a post |
| `posts_thank(p_post_id)` | authenticated | Thank a post |

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
  "houses": [{ "slot": 0, "nickname": "Snowy Moose", "active_today": true, "founding": true }],
  "hidden_houses": 0,
  "today_actions": [{ "nickname": "Snowy Moose", "building_key": "fire-pit", "title": "Fire pit" }],
  "me": { "member": true, "pending": false, "energy_max": 3, "energy_left": 2, "house_slot": 0 }
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
- `houses` (§7.2): residents whose last active day is within 30 days (movers keep theirs until
  the move completes). `slot` = fixed house lot 0..149, mapped by the client to the stored plan's
  house lots ordered by land stage, then plan order (`houseLotOrder`). Lots are assigned while the
  snapshot is built; archived residents keep theirs unless every lot is taken. No user ids.
  `hidden_houses`: active residents beyond the lots (not drawn). Part of the 5-minute snapshot.
- `today_actions` (§7.3): today's real actions, newest first, at most 20, without times (live);
  pending help is left out. Mini villagers replay them.
- `me.house_slot`: my house here, or `null`.
- `me`: `null` for visitors (not signed in). `member`: this is the community I play in
  (otherwise I am only looking around and cannot act). `pending`: my actions here are saved but
  count only once I am a Verified Resident here (§6.3).
- Errors: unknown community → `P0002`.

## `gamecore_submit_actions(p_actions jsonb)`
```json
[{ "id": "client-generated uuid", "project_id": "uuid" }]
```
At most 10 entries per call. Each entry is processed in order and gets a result:

```json
{
  "calgary_day": "2026-12-01", "next_day_start": "2026-12-02T06:00:00+00:00",
  "pending": false, "energy_max": 3, "energy_left": 0,
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
| `rejected` · `not_member` | You have no community yet (no counted location check-in) |
| `rejected` · `other_community` | The project (building) belongs to another community |
| `rejected` · `project_not_active` | The construction is finished (goal reached) |
| `rejected` · `project_not_found` | Unknown project id |
| `rejected` · `id_conflict` | Another player already used this id |
| `rejected` · `invalid` | Missing or malformed `id` / `project_id` |

- **Idempotency:** always generate the id once per tap (e.g. `crypto.randomUUID()`) and
  reuse it on retries.
- The action's day is the **server's** Calgary day when it arrives. An action queued
  offline before midnight and sent after midnight counts for the new day.
- Actions go to the community I play in (`gamecore_get_me`). While verifying, they are stored
  with `pending = true` and count toward progress from the day I am verified there (shown the
  day after, like all help); past days' attendance and Vitality do not change.
- Errors: not signed in → `28000`; body not an array or more than 10 entries → `22023`.

## `gamecore_get_me()`
```json
{ "calgary_day": "2026-12-01", "next_day_start": "…", "community_id": "uuid | null", "pending": true, "energy_max": 3, "energy_left": 3 }
```
`community_id` comes from Residency: my verified community, or my candidate community while
verifying or moving (then `pending: true`). While moving and before any check-in elsewhere, I
still play in my old community (`pending: false`). `null` = no community yet.

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

## `residency_get_status()`
```json
{
  "calgary_day": "2026-12-03",
  "status": "verifying",
  "community": null,
  "candidate": { "id": "uuid", "name": "Mahogany", "days": 2, "needed": 3, "checked_today": true },
  "play_community": { "id": "uuid", "name": "Mahogany" },
  "pending": true,
  "move": null,
  "can_move": { "allowed": false, "reason": "not_verified" },
  "checks_left": 19
}
```
- `status`: `new` (no counted check-in) · `verifying` · `verified` · `moving`.
- `community`: my verified community with `verified_on`, or `null`.
- `candidate`: while verifying or moving, the community with the most check-in days in the last
  7 Calgary days (tie → most recent check-in; during a move only days since it started and not
  the old community).
- `move`: `{ started_on, last_day, free_correction }` while moving (cancelled automatically
  after `last_day`).
- `can_move`: `{ allowed: true, free_correction, correction_until? }` or
  `{ allowed: false, reason: not_verified | moving | cooldown, available_on? }`.

## `residency_check_location(p_lat float8, p_lon float8, p_accuracy float8)`
The server finds the residential community that contains the point and **forgets the
coordinates**: they are never written to a table, a log or the response. Only "this player
checked in from this community on this Calgary day" is kept (no clock time). The frontend
rounds coordinates to 4 decimals (about 11 m) before sending.

Returns the status above plus `result` and `checked_community` (`{id, name}` or `null`):

| `result` | Meaning |
|---|---|
| `counted` | Check-in counted for `checked_community` |
| `verified` | That was the 3rd day within 7: now a Verified Resident (or the move completed) |
| `not_needed` | Already verified and not moving: no location checks any more (not counted) |
| `limit` | More than 20 checks today (Calgary day) |
| `inaccurate` | Accuracy missing or worse than 1 km ("verify on your phone") |
| `no_community` | Not inside a Calgary residential community |
| `current_community` | Moving, but this is the community I am moving from |

Errors: not signed in → `28000`; latitude/longitude out of range, NaN or a negative accuracy →
`22023`.

## `residency_start_move()` / `residency_cancel_move()`
Return the status plus `ok`. Not allowed → `{ ok: false, problem }` with
`not_verified | moving | cooldown` (start) or `not_moving` (cancel). A cancelled move (by the
player or after 7 days) loses nothing and does not start the cooldown.

## `invites_get_mine()`
```json
{
  "code": "K7QM2XPA",
  "invited": 3, "joined": 2,
  "invited_by": "Snowy Moose",
  "badges": [
    { "key": "founding_resident", "community": "Mahogany" },
    { "key": "good_neighbour", "count": 2 },
    { "key": "pioneer_sponsor", "count": 1 }
  ]
}
```
- `code`: my personal code (created on first call; 8 characters, no I/O/0/1). Link:
  `<app>/?invite=<code>`.
- `invited`: accounts that accepted my invite; `joined`: those whose first verification was in
  the community I lived in that day.
- Badges (computed from history, never lost when anyone moves; a move never creates one):
  **Good Neighbour** (both people, ×N), **Pioneer Sponsor** (my invitee became the first Verified
  Resident of a community), **Founding Resident** (I was the first Verified Resident there).

## `invites_accept(p_code text)`
`{ ok: true }` or `{ ok: false, problem }`: `unknown` code, `self`, `already` accepted someone
else's invite, `too_late` (already verified somewhere). Accepting the same invite again is `ok`.
The app remembers the link's code on the first visit and accepts it right after sign-in.

## `invites_lookup(p_code text)`
`{ "nickname": "Snowy Moose", "community": "Mahogany" }` (community `null` if the inviter has
none yet), or `null` for an unknown code. Works before sign-in (invite landing banner).

## `news_get_newspaper(p_community_id uuid)`
```json
{
  "calgary_day": "2026-12-02",
  "community": "Mahogany",
  "locked": null,
  "announcements": [{ "title": "Maintenance Sunday", "body": "Short break at night." }],
  "lines": [
    { "icon": "👋", "text": "2 new neighbours joined yesterday: Maple Fox and Snowy Moose. Welcome!" },
    { "icon": "💐", "text": "Sarah moved to Bridgeland — thanks for everything, neighbour!" }
  ],
  "board": { "open": false, "roadmap": [] }
}
```
- `lines`: real people news about yesterday: how many new neighbours joined (with nicknames) and
  farewells (with the new community). Game events stay in the community state's `changes`. Written
  **once per community per Calgary day** on the first read, then served from `news.editions`.
  No clock times.
- `locked: "welcome_sign"` until the Welcome sign is built (`lines` empty).
- `announcements`: global operator notices running today (always shown). Add one with SQL:
  `insert into news.announcements (title, body, starts_on, ends_on) values ('…', '…', '2026-12-01', '2026-12-03');`
- `posts`: residents' local news, newest first: `{id, kind, body, nickname, days_ago, thanks, mine,
  thanked, reported}` (no times, no user ids); `can_post`: `{allowed: true}` or `{allowed: false,
  reason: not_signed_in | not_verified | locked | daily_limit | other_community}` for the viewer.
- `board.open` once the Warming hut is built; `board.roadmap` = "Coming soon" items from
  `news.roadmap` (set `done = true` to hide one).
- The app opens it when the player taps the Welcome sign's lot (sign or Gateway arch), later the
  Community hall; a "📰 News" chip marks it.

## `posts_create(p_kind text, p_body text)` and friends
- `posts_create`: Verified Residents, own community, once the Welcome sign is built; `kind` =
  `event | deal | lost_found | other`; 1–300 characters (spaces tidied); 1 per Calgary day
  (a deleted post still counts). `{ok: true, post_id}` or `{ok: false, problem}`:
  `not_verified | locked | daily_limit | kind | length | link | phone | address | blocked`.
  Links, phone numbers, street addresses (house number + street type, or + NW/NE/SW/SE) and
  blocked words are refused. Visible for 3 Calgary days.
- `posts_delete(id)`: my own post. `posts_report(id)`: once per player; Verified Residents 2
  points, others 1; 3 points hide the post; not my own; refused (`blocked`) for accounts in
  `posts.report_blocks`. `posts_thank(id)`: once per player, not my own.
- Operator (SQL): hide a post `update posts.posts set hidden = true where id = '…';`, block a
  reporter `insert into posts.report_blocks (user_id) values ('…');`.
- Badge: 10 thanks received in total → `community_reporter` in `invites_get_mine().badges`.

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
- **Members** are Verified Residents (Residency, M7): players whose latest verification on or
  before that day was into the community, **excluding players with a move in progress** (§6.4).
  Cumulative residents = distinct people ever verified there (movers stay counted, returners
  count once). gamecore reads these only through `residency.*` functions.
- **Verification** (§6.3): check-ins from the same community on 3 different Calgary days within
  7 (today and the 6 days before). **Moving** (§6.4): started by the player; re-verification in
  another community from the move's start; cancelled after 7 days or by the player; cooldown 90
  days from the last completed move, or from the first verification before any move; one free
  correction within 14 days of the first verification.
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
  `dev-password`), Verified Residents of Mahogany with profiles ("Dev One", "Dev Two").
- The app signs in as them only with `?devuser=1` or `?devuser=2` (dev builds). Without the
  parameter it uses the real flow: anonymous account → first-visit example → profile setup.
  A private window gives a fresh anonymous player.
- Turnstile runs locally with Cloudflare's public **test** keys (always pass): the secret in
  `supabase/config.toml`, the site key in `frontend/.env.local` (`VITE_TURNSTILE_SITE_KEY`).
  The browser loads the widget from `challenges.cloudflare.com`, so local play needs internet.
- **Location in dev:** `?devloc=MAH` (dev builds only) pretends the browser is inside that
  community (any community code); the server still checks the point. Without it the browser's
  real location is used (computers locate by Wi-Fi and can be off).
- **Phone testing on the same Wi-Fi:** `npm run dev:phone` (in `frontend/`) serves
  `https://<computer's LAN IP>:5181` with a self-signed certificate (accept the warning once on
  the phone) and proxies `/supabase` to the local API, so the phone's GPS works (browsers allow
  location only on https). Nothing is exposed outside the local network.
