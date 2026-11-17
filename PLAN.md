# Development Plan — MakeCalgaryTalk

| Item | Value |
|---|---|
| Plan version | v1.7 |
| First written | 2026-11-16 |
| Last updated | 2026-11-17 |
| Based on | `requirement.md` v1.10 |
| Current module | M0 — Foundation (not started) |

---

## 📌 How this plan works

1. **Build the core first, then add modules one at a time.** A module is finished before the next one starts.
2. **Only one module is "In progress" at a time.**
3. Each module has a goal, scope, out-of-scope, dependencies, and a **Definition of Done**.
4. A module is ✅ **Done only after the user has played it and confirmed** (see `CLAUDE.md` Rule 4).
5. If something breaks later, **reopen only the module that owns it** and log it.
6. This plan will change. Before changing it, add an entry at the top of the [Change Log](#change-log) (date, version, Changed, Why, Previous text verbatim), then edit the body.
7. **No time estimates.** The plan exists to check that nothing is missing and to see progress. Tick each checkbox (`- [x]`) when that item is implemented and verified.
8. `requirement.md` defines **what** to build. This plan defines **in what order and in what pieces**. If they conflict, `requirement.md` wins — update one of them.

### Status legend
| Mark | Meaning |
|---|---|
| ⬜ | Not started |
| 🟦 | In progress |
| 🟨 | Ready for playtest (verified by Claude Code, waiting for the user) |
| ✅ | Done (user played it and confirmed) |
| 🔁 | Reopened (fixing after Done) |

---

## Module overview (MVP)

| # | Module | Layer | Core? | Depends on | Status |
|---|---|---|---|---|---|
| M0 | Foundation | FE + Supabase + infra | Base | — | ⬜ |
| M1 | Island View | FE (R3F) | ⭐ Core | M0 | ⬜ |
| M2 | Avatar | FE (R3F) | ⭐ Core | M1 | ⬜ |
| M3 | Game Core | BE | ⭐ Core | M0 | ⬜ |
| M4 | Daily Actions | FE + BE | ⭐ Core | M2, M3 | ⬜ |
| M5 | Community State | BE + FE | ⭐ Core | M4 | ⬜ |
| M6 | Identity | FE + BE | | M4 | ⬜ |
| M7 | Residency | FE + BE | | M6 | ⬜ |
| M8 | Residents & Villagers | FE + BE | | M5, M7 | ⬜ |
| M9 | Village News | BE + FE | | M8 | ⬜ |
| M10 | World Map | FE (2D) + BE | | M5 | ⬜ |
| M11 | Ranking & Share | BE + FE | | M5, M10 | ⬜ |
| M12 | Invites | FE + BE | | M6, M7 | ⬜ |
| M13 | Feature Library | FE + data | | M1 | ⬜ |
| M14 | Launch Readiness | All | | All above | ⬜ |

No time estimates: with AI-assisted (vibe) coding, modules may finish faster or slower than expected. This plan tracks **order, completeness and progress**, not schedule.

**Layers:** FE = React app (`frontend/`). BE = Supabase (`supabase/`: SQL migrations, Postgres functions/RPC with RLS, Edge Functions, pg_cron). There is no separate backend server.

**Core loop is complete after M5.** At that point the game is playable end to end with a dev user and a manually chosen community: see the island → move the avatar → take daily actions → progress next day → streak, Vitality, unlocks, island growth.

```
M0 ─┬─ M1 ── M2 ─┐
    └─ M3 ───────┴─ M4 ── M5 ─┬─ M10 ── M11
                     │        ├─ M8 ── M9
                     └─ M6 ── M7 ─┬─ M8
                                  └─ M12
    M1 ── M13
    (all) ── M14
```

---

## Module details

### M0 — Foundation ⬜
**Goal:** Empty but runnable project skeleton so every later module has a home.
- **In scope**
  - [ ] Monorepo folders: `frontend/` (React + Vite + TypeScript, Tailwind, Zustand, react-three-fiber + drei), `supabase/` (migrations, functions), `docs/`
  - [ ] Supabase project (PostgreSQL + PostGIS enabled); Supabase CLI for local dev and SQL migrations; database connection pooling
  - [ ] Environment config via env vars (no secrets in git); `.env.example`
  - [ ] Health check (Postgres function or Edge Function); frontend calls it and shows "connected"
  - [ ] Shared time utility: **Calgary day boundary (America/Edmonton)** with tests
  - [ ] Module folder conventions in place (see `CLAUDE.md` §2 Modular code)
  - [ ] Basic CI: build + tests (Vitest; database tests against local Supabase) on push
- **Out of scope:** any game feature
- **Definition of Done**
  - [ ] frontend and local Supabase run locally with one command each
  - [ ] health check visible in the browser
  - [ ] CI green
  - [ ] day-boundary tests cover DST changes

### M1 — Island View ⭐ ⬜
**Goal:** The 3D diorama island renders from a state object, using box models through asset keys.
- **In scope**
  - [ ] react-three-fiber `<Canvas>` with drei `OrthographicCamera`: isometric view, pastel lights, sky background, rotate/zoom limits
  - [ ] Island of size N×N (tiers from `requirement.md` §7.8) with layered dirt
  - [ ] **Asset registry**: asset key → box model React component (house, building, silhouette, tree, construction site, sign, mini villager)
  - [ ] Render entirely from a **mock community state JSON** (no backend yet)
  - [ ] 3 Vitality moods (Lively / Normal / Gloomy) change colours and props
  - [ ] Island growth animation when N increases
  - [ ] Labels and speech bubbles via drei `Html`
  - [ ] Instanced rendering for tiles (drei `Instances`); animations in `useFrame` with refs (no per-frame React state); phone-size viewport check
- **Out of scope:** avatar, real data, detailed art
- **Definition of Done**
  - [ ] changing values in the mock JSON (size, buildings, Vitality, silhouettes) updates the island correctly
  - [ ] runs smoothly at a phone-sized viewport
  - [ ] user has looked at it

### M2 — Avatar ⭐ ⬜
**Goal:** The user's avatar walks around the island.
- **In scope**
  - [ ] Box avatar with name label
  - [ ] Tap/click-to-move with **A* pathfinding** on the island grid (blocked tiles: buildings, trees)
  - [ ] Keyboard WASD/arrows on PC
  - [ ] Camera follow
  - [ ] Movement API based on **destination events** (`moveTo(tile)`), so actions and future real-time can reuse it
- **Out of scope:** other residents' avatars, customization
- **Definition of Done**
  - [ ] avatar never walks through buildings
  - [ ] works with touch and mouse
  - [ ] camera follow feels smooth
  - [ ] user has walked around

### M3 — Game Core ⭐ ⬜
**Goal:** Backend domain for communities, projects and actions with server-side rules.
- **In scope**
  - [ ] SQL migrations: communities (seeded with Calgary community list + population), projects, actions, users (dev user only for now)
  - [ ] Rules: **3 energy per day** (Calgary day), action must target an active project, project progress applied **next day** (compute-on-read)
  - [ ] Server API as **Supabase Postgres functions (RPC)** with Row Level Security: get community state, submit action(s)
  - [ ] Actions are **append-only** with a client-generated unique ID (**idempotent**); progress is aggregated, never a shared counter updated per action (`requirement.md` §20.3b)
  - [ ] Database tests for every rule including day boundary, energy limit, and duplicate submissions
- **Out of scope:** auth, location, streaks/Vitality (M5)
- **Definition of Done**
  - [ ] API rejects a 4th action in a day
  - [ ] a duplicate action ID is ignored
  - [ ] progress appears after Calgary midnight
  - [ ] tests cover edge cases
  - [ ] API documented in `docs/api.md`

### M4 — Daily Actions ⭐ ⬜
**Goal:** Connect the island to the backend so actions really change the community.
- **In scope**
  - [ ] Island loads real community state from the API (replacing mock JSON)
  - [ ] Bottom action bar: energy display, choose a project, act
  - [ ] Avatar runs to the project's spot (via M2 `moveTo`) then the action is sent; optimistic UI with server confirmation/rollback
  - [ ] Satisfying feedback: progress bar animation, simple sound, villager cheer placeholder
  - [ ] Community chosen manually from a list (temporary until M7)
- **Out of scope:** streaks, Vitality calc, news
- **Definition of Done**
  - [ ] two browsers acting on the same community both see progress after the day rolls over
  - [ ] energy limit enforced by server
  - [ ] user has played a "day"

### M5 — Community State ⭐ ⬜
**Goal:** The community feels alive and changes over days. **Core loop complete.**
- **In scope**
  - [ ] Backend: community streak (≥ half, rounded up, of **Active Verified Residents** = acted within last 7 Calgary days), Vitality (7-day average; denominator = Verified Residents whose **last active day** (later of last action and verification day) is within last 30 days incl. today, rises fast/falls slow), unlocks (Playground / Community Centre / Park; resident counts cumulative), island size from cumulative residents
  - [ ] Snapshot generation every 5–10 min (JSON) for community state via **pg_cron**
  - [ ] Frontend: streak bar ("2/6 today"), locked silhouettes with remaining conditions, "What changed since yesterday" panel, island growth goal
- **Out of scope:** real residents/verification (dev users simulate residents)
- **Definition of Done**
  - [ ] with simulated users over simulated days, streak, Vitality, unlocks and growth behave as specified
  - [ ] a 1-resident community works
  - [ ] user has played across at least 3 real days

### M6 — Identity ⬜
**Goal:** Real users without friction.
- **In scope**
  - [ ] Supabase anonymous sign-in on first visit
  - [ ] optional Google linking
  - [ ] Cloudflare Turnstile
  - [ ] sign-up rate limits
  - [ ] re-join with same Google account restores record
- **Definition of Done**
  - [ ] new visitor plays instantly without a form
  - [ ] linking Google keeps progress
  - [ ] bot check active

### M7 — Residency ⬜
**Goal:** Users belong to the community they live in.
- **In scope**
  - [ ] browser geolocation → server-side point-in-polygon (PostGIS, via Postgres function or Edge Function) → **coordinates discarded**, only community ID stored
  - [ ] pending contributions
  - [ ] **3 different days within 7** → Verified Resident
  - [ ] no location checks after verification
  - [ ] moving (`requirement.md` §6.4): user-started "I moved", stays in old community until re-verified, excluded from old community's streak/Vitality denominators during the move, auto-cancel after 7 days, 90-day cooldown from last completed move, one free correction within 14 days of first verification
  - [ ] cumulative Verified Residents counted as distinct people per community (movers stay counted, returners not counted twice)
  - [ ] "verify on your phone" hint
- **Definition of Done**
  - [ ] tests prove coordinates are never persisted or logged
  - [ ] verification edge cases tested (other community visit same day, day boundary)
  - [ ] move edge cases tested (auto-cancel at day 7, cooldown not used on cancel, free correction once only, old community keeps cumulative count, returner not double counted)
  - [ ] user verified their own community

### M8 — Residents & Villagers ⬜
**Goal:** Show who lives here and what they did.
- **In scope**
  - [ ] one house per Verified Resident with name tag, lights on if active today, archived after 30 days
  - [ ] mini villagers (count by residents + Vitality, max 20)
  - [ ] **action replay** with system speech bubbles from today's real actions
  - [ ] other residents shown asynchronously (no real-time)
- **Definition of Done**
  - [ ] replay only shows real actions
  - [ ] inactive houses dark
  - [ ] performance OK on phone

### M9 — Village News ⬜
**Goal:** A daily reason to check in.
- **In scope**
  - [ ] auto-generated daily newspaper from game events (templates)
  - [ ] farewell line when a resident moves away (`requirement.md` §6.4, §11)
  - [ ] roadmap notices + "Coming soon" locks
  - [ ] Village Notice Board object on the island opens it
- **Definition of Done**
  - [ ] newspaper reflects yesterday's real events with nicknames
  - [ ] no activity times exposed

### M10 — World Map ⬜
**Goal:** See all of Calgary and spread to empty communities.
- **In scope**
  - [ ] 2D map from real community boundary polygons (Canvas)
  - [ ] **small development illustrations inside each polygon** by level (houses → playground → park → community centre), Vitality mood (ground/roof tone, lights), grey dashed + cloud for unsettled
  - [ ] icon count scaled by polygon area
  - [ ] zoom-dependent detail
  - [ ] tap → zoom + info card → enter community island
  - [ ] empty community → invite prompt (link placeholder until M12). Animated rivers, CTrain and landmarks are Art Pass (`requirement.md` §9)
- **Definition of Done**
  - [ ] all communities render and are tappable on phone
  - [ ] loads fast (static data via CDN)

### M11 — Ranking & Share ⬜
**Goal:** Competition and shareable moments.
- **In scope**
  - [ ] weekly ranking (per-1,000 formula, min 5 active verified residents, Monday reset Calgary time)
  - [ ] TOP 10 + my community
  - [ ] share card images (weekly result, building completed, revival) always including community name
  - [ ] #1 flag on World Map
- **Definition of Done**
  - [ ] ranking math tested
  - [ ] share card renders correctly on phones and social previews

### M12 — Invites ⬜
**Goal:** Built-in acquisition.
- **In scope**
  - [ ] personal invite links
  - [ ] reward when invitee becomes Verified Resident of the same community
  - [ ] Pioneer Sponsor badge for first resident of an empty community
  - [ ] Founding Resident badge
- **Definition of Done**
  - [ ] rewards cannot be farmed with self-invites (tests)

### M13 — Feature Library ⬜
**Goal:** Each island feels like its community.
- **In scope**
  - [ ] name sign
  - [ ] a few feature blocks (lake, creek, hill, park) as box models
  - [ ] community → feature mapping (OSM suggestion + CSV override) for launch communities
- **Definition of Done**
  - [ ] launch communities show their features
  - [ ] adding a feature = data change only

### M14 — Launch Readiness ⬜
**Goal:** Safe to show the public.
- **In scope**
  - [ ] Terms of Use + Privacy Policy pages (13+, location statement)
  - [ ] analytics (D1/D7, shares, invites)
  - [ ] abnormal sign-up flags
  - [ ] optional update-email opt-in (CASL)
  - [ ] production deploy
  - [ ] low-end phone performance pass
  - [ ] **family/friends playtest**
- **Definition of Done**
  - [ ] checklist complete
  - [ ] playtest feedback triaged into modules or Phase 2

---

## After MVP (not planned in detail yet)
Phase 2 modules (from `requirement.md` §22.2): Art Pass, Resident Board + moderation, Profile & Ranks, Speech Bubbles, Requests, 5 Vitality moods, feature upgrades. Plan them after MVP playtest data.

---

## Change Log

> Add new entries at the **top**. Format:
> ```
> ### YYYY-MM-DD — vX.Y
> **Changed:** what changed
> **Why:** why it changed
> **Previous:** the old text, verbatim
> ```

### 2026-11-17 — v1.7
**Changed:** "Based on" → `requirement.md` v1.10. M7: replaced "90-day community change" with the full moving flow (§6.4) and cumulative-count rule; added move edge-case tests to M7 Definition of Done. M9: added farewell line item.

**Why:** Sync with requirement v1.10 (user-friendly moving rules).

**Previous:**
- `| Based on | `requirement.md` v1.9 |`
- M7 In scope: `  - [ ] 90-day community change`
- M7 Definition of Done: (move edge-case item did not exist)
- M9 In scope: (farewell line item did not exist)

### 2026-11-17 — v1.6
**Changed:** "Based on" → `requirement.md` v1.9. M5 item: Vitality denominator uses the last active day (later of last action and verification day), 30 days including today.

**Why:** Sync with requirement v1.9.

**Previous:**
- `| Based on | `requirement.md` v1.8 |`
- M5 (part): `Vitality (7-day average; denominator = Verified Residents active within last 30 days, rises fast/falls slow)`

### 2026-11-17 — v1.5
**Changed:** "Based on" → `requirement.md` v1.8. M5 item: Vitality uses the 30-day denominator; unlock resident counts are cumulative.

**Why:** Sync with requirement v1.8.

**Previous:**
- `| Based on | `requirement.md` v1.7 |`
- M5 (part): `Vitality (7-day, same Active Verified Resident denominator, rises fast/falls slow), unlocks (Playground / Community Centre / Park)`

### 2026-11-17 — v1.4
**Changed:** "Based on" updated to `requirement.md` v1.7. M5 streak/Vitality item now uses the Active Verified Resident (7-day) denominator.

**Why:** Keep the plan in sync with requirement fixes (v1.6 was missed; v1.7 defines the streak denominator).

**Previous:**
- `| Based on | `requirement.md` v1.5 |`
- M5: `  - [ ] Backend: community streak (≥ half of residents acted), Vitality (7-day, rises fast/falls slow), unlocks (Playground / Community Centre / Park), island size from cumulative residents`

### 2026-11-16 — v1.3
**Changed:** Removed all time estimates (Est. column and total). Added rule 7 (no time estimates; tick checkboxes). Converted every module's In scope and Definition of Done items into checkboxes (`- [ ]`) for progress tracking; single-line lists were split on `; ` with the wording unchanged.

**Why:** With vibe coding, durations are unpredictable. The plan's main purpose is to make sure nothing is missed and to see progress, not to schedule.

**Previous:**
- Overview table:
```
| # | Module | Layer | Core? | Depends on | Est. | Status |
|---|---|---|---|---|---|---|
| M0 | Foundation | FE + Supabase + infra | Base | — | 1 wk | ⬜ |
| M1 | Island View | FE (R3F) | ⭐ Core | M0 | 2 wk | ⬜ |
| M2 | Avatar | FE (R3F) | ⭐ Core | M1 | 1 wk | ⬜ |
| M3 | Game Core | BE | ⭐ Core | M0 | 1 wk | ⬜ |
| M4 | Daily Actions | FE + BE | ⭐ Core | M2, M3 | 1 wk | ⬜ |
| M5 | Community State | BE + FE | ⭐ Core | M4 | 1.5 wk | ⬜ |
| M6 | Identity | FE + BE | | M4 | 0.5 wk | ⬜ |
| M7 | Residency | FE + BE | | M6 | 1 wk | ⬜ |
| M8 | Residents & Villagers | FE + BE | | M5, M7 | 1 wk | ⬜ |
| M9 | Village News | BE + FE | | M8 | 0.5 wk | ⬜ |
| M10 | World Map | FE (2D) + BE | | M5 | 1.5 wk | ⬜ |
| M11 | Ranking & Share | BE + FE | | M5, M10 | 1 wk | ⬜ |
| M12 | Invites | FE + BE | | M6, M7 | 0.5 wk | ⬜ |
| M13 | Feature Library | FE + data | | M1 | 0.5 wk | ⬜ |
| M14 | Launch Readiness | All | | All above | 1 wk | ⬜ |
```
- `Estimates assume ~10 hours/week. Total ≈ 15–16 weeks including learning time (React + react-three-fiber) and playtests. Estimates are rough and will be revised.`
- Scope and Definition of Done items were plain bullets / single lines (same wording).

### 2026-11-16 — v1.2
**Changed:** M10 World Map scope updated for `requirement.md` v1.5 (development illustrations inside real boundary polygons, area-scaled icons, zoom-dependent detail, Canvas). M10 estimate 1 → 1.5 weeks; total 14–15 → 15–16 weeks.

**Why:** World Map design refined after the user chose the polygon style with in-polygon development illustrations.

**Previous:**
- `| Plan version | v1.1 |` / `| Based on | \`requirement.md\` v1.4 |`
- `| M10 | World Map | FE (2D) + BE | | M5 | 1 wk | ⬜ |`
- `Total ≈ 14–15 weeks ...`
- M10: `- **In scope:** 2D map from community boundaries (SVG/Canvas); Vitality colours, grey for unsettled, tier label; tap → enter community island; empty community → invite prompt (link placeholder until M12)`

### 2026-11-16 — v1.1
**Changed:** Updated for the new tech stack (`requirement.md` v1.4): React + Vite + TypeScript + react-three-fiber + drei on the frontend; Supabase only (SQL migrations, Postgres functions/RPC with RLS, Edge Functions, pg_cron) instead of Spring Boot. Added scalability rules to M3. M1 estimate 1.5 → 2 weeks for learning React/R3F; total 13–14 → 14–15 weeks.

**Why:** Stack changed to the best-fit combination for this project (vibe coding, lowest ops cost, largest web-3D ecosystem).

**Previous:**
- Header: `| Plan version | v1.0 |` / `| Based on | \`requirement.md\` v1.2 |`
- Overview rows: `| M0 | Foundation | FE + BE + infra | Base | — | 1 wk | ⬜ |` / `| M1 | Island View | FE (three.js) | ⭐ Core | M0 | 1.5 wk | ⬜ |` / `| M2 | Avatar | FE (three.js) | ⭐ Core | M1 | 1 wk | ⬜ |`
- `Estimates assume ~10 hours/week. Total ≈ 13–14 weeks including learning time and playtests. Estimates are rough and will be revised.` (Layers note did not exist)
- M0: `  - Monorepo folders: \`frontend/\` (Angular), \`backend/\` (Spring Boot), \`docs/\`` / `  - Supabase project (PostgreSQL + PostGIS enabled); DB migrations tool (e.g. Flyway)` / `  - Backend health endpoint; frontend calls it and shows "connected"` / `  - Basic CI: build + tests on push` / DoD: `both apps run locally with one command each;`
- M1: `  - three.js scene inside an Angular component: orthographic isometric camera, pastel lights, sky background, rotate/zoom limits` / `  - **Asset registry**: asset key → box model (house, building, silhouette, tree, construction site, sign, mini villager)` / `  - HTML overlay system for labels and speech bubbles` / `  - InstancedMesh for tiles; phone-size viewport check`
- M3: `  - Tables/migrations: communities ...` / `  - REST API: get community state, submit action(s)` / `  - Unit tests for every rule including day boundary and energy limit` / DoD: `API rejects a 4th action in a day;`
- M5: `  - Snapshot generation every 5–10 min (JSON) for community state`
- M7: `browser geolocation → server-side point-in-polygon (PostGIS)`

### 2026-11-16 — v1.0 (initial plan)
**Changed:** Initial module-based development plan for the MVP (M0–M14), core-first order.

**Why:** Keep vibe coding on track; finish one module before the next; isolate fixes to the owning module.

**Previous:** None (initial version).
