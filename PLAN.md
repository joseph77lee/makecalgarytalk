# Development Plan — MakeCalgaryTalk

| Item | Value |
|---|---|
| Plan version | v1.16 |
| First written | 2026-11-16 |
| Last updated | 2026-11-18 |
| Based on | `requirement.md` v1.16 |
| Current module | M3 — Game Core (next; M2 ✅ Done) |

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
9. **One branch per module** (`module/m<number>-<name>`). It is merged to `main` (`--no-ff`) only after the module is ✅ Done, CI is green, and this file already shows ✅ on the branch. Reopened modules use `fix/m<number>-<topic>`. See `CLAUDE.md` §2 Branches & merging.
10. **Each module ends with a Handoff note** (in its section below) before it goes to 🟨: decisions not obvious from the code, deviations from the plan, known gaps / not tested, follow-ups for later modules, environment gotchas. Modules are built in separate sessions; a new session reads `git log`, the newest Change Log entries and the Handoff notes first (see `CLAUDE.md` §3 Session start).

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
| M0 | Foundation | FE + Supabase + infra | Base | — | ✅ |
| M1 | Island View | FE (R3F) | ⭐ Core | M0 | ✅ |
| M2 | Avatar | FE (R3F) | ⭐ Core | M1 | ✅ |
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

### M0 — Foundation ✅
**Goal:** Empty but runnable project skeleton so every later module has a home.
- **In scope**
  - [x] Monorepo folders: `frontend/` (React + Vite + TypeScript, Tailwind, Zustand, react-three-fiber + drei), `supabase/` (migrations, functions), `docs/`
  - [x] **Local** Supabase project (PostgreSQL + PostGIS enabled); Supabase CLI for local dev and SQL migrations; connection pooling via PostgREST (the frontend never opens direct DB connections). The cloud project and its pooler are set up at deploy (M14)
  - [x] Environment config via env vars (no secrets in git); `.env.example`
  - [x] Health check (Postgres function or Edge Function); frontend calls it and shows "connected"
  - [x] Calgary day boundary (America/Edmonton) as **server-side** Postgres functions with tests; the client does no time zone math (receives `calgary_day` / `next_day_start` from the server)
  - [x] Module folder conventions in place (see `CLAUDE.md` §2 Modular code), enforced by tests (frontend import boundaries; DB: RLS on every table, no tables in `public`, module-prefixed RPC)
  - [x] Basic CI: build + tests (Vitest; database tests against local Supabase) on push
- **Out of scope:** any game feature
- **Definition of Done**
  - [x] frontend and local Supabase run locally with one command each
  - [x] health check visible in the browser
  - [x] CI green
  - [x] day-boundary tests cover historic DST and Alberta's permanent UTC-6 from 2026-11-01 (Official Time Act)
- **Handoff**
  - **Day boundary is server-only.** Use `common.calgary_day(ts)` / `common.calgary_day_start(day)` in SQL; the client receives `calgary_day` / `next_day_start` from RPCs and only computes distances (`msUntil`, `formatCountdown` in `frontend/src/modules/common`). Client tzdata is often outdated (Node 20 = 2025a). A test fails if client code mentions `America/Edmonton` or `timeZone:`.
  - **DB module pattern:** tables live in a module schema (e.g. `gamecore`), not exposed by the API (`auto_expose_new_tables = false`); the only callable surface is `public.<module>_<name>()` functions with explicit `grant execute`. When a new module adds RPCs, its prefix must already be in the list in `supabase/tests/database/common_health.test.sql` (all MVP prefixes are listed).
  - **Frontend module pattern:** `frontend/src/modules/<name>/index.ts` is the only import surface; `common` must not import feature modules; no cycles (`src/architecture.test.ts`). App shell is `src/app/App.tsx` (currently the health screen — M1 replaces it with the island).
  - **Keys:** frontend uses the publishable key (`sb_publishable_…`) only; `readSupabaseConfig` throws on a secret-looking key.
  - **Local env gotchas:** ports are 554xx (54321 is taken by CleanMyMac on this Mac); the Supabase CLI needs Docker on PATH (`export PATH="$HOME/.docker/bin:$PATH"`); `frontend/.env.local` holds the local publishable key (`supabase status`).
  - **Not covered yet:** cloud Supabase and production tzdata check (M14); real-phone performance (no 3D yet).
  - **CI:** check results with `gh run list --branch <branch>` / `gh run watch <id> --exit-status` (`gh` is installed and logged in; the repo is private, so the unauthenticated REST API returns 404).

### M1 — Island View ⭐ ✅
**Goal:** The 3D diorama island renders from a state object, using box models through asset keys.
- **In scope**
  - [x] react-three-fiber `<Canvas>` with drei `OrthographicCamera`: isometric view, pastel lights, sky background, rotate/zoom limits
  - [x] Island of size N×N (tiers from `requirement.md` §7.8) with layered dirt
  - [x] **Asset registry**: asset key → box model React component (house, building, silhouette, tree, construction site, sign, mini villager)
  - [x] Render entirely from a **mock community state JSON** (no backend yet)
  - [x] 3 Vitality moods (Lively / Normal / Gloomy) change colours and props
  - [x] Island growth animation when N increases
  - [x] Labels and speech bubbles via drei `Html`, with a show/hide labels toggle (`requirement.md` §10.1)
  - [x] Instanced rendering for tiles and repeated boxes (raw `InstancedMesh`, see Change Log v1.11); animations in `useFrame` with refs (no per-frame React state); phone-size viewport check
- **Out of scope:** avatar, real data, detailed art
- **Definition of Done**
  - [x] changing values in the mock JSON (size, buildings, Vitality, silhouettes) updates the island correctly
  - [ ] runs smoothly at a phone-sized viewport (checked at 390×844 in headless Chromium with a software GPU only; user accepted M1 on 2026-11-18 without a real-phone check — carried to M2 and the M14 low-end phone pass)
  - [x] user has looked at it (confirmed 2026-11-18)
- **Handoff**
  - **Code:** `frontend/src/modules/island-view/`. Public API in `index.ts`: `IslandView({ state })`, `IslandHud`, `IslandDevPanel`, `useMockCommunityStore`, `parseCommunityViewState`, `buildIslandLayout`, `vitalityMood`, and the `CommunityViewState` types.
  - **State contract (`types.ts`):** `CommunityViewState` = community name, `islandSize` (tier number, decided by the server), `vitality` 0–100, shown `houses` (archived ones already removed), `buildings` (unlocked, or locked with `remaining: { streakDays, residents }`), up to 3 `projects` (`kind`, `title`, `stage`, `progress` 0..1), `miniVillagerCount` (≤ 20, decided by the server) and `speechBubbles` (anchored to a house id or a villager index). M3/M5 snapshots should produce exactly this shape; `parseCommunityViewState` validates it and lists every error.
  - **The client computes no game rules.** It does not derive island size from residents or villager counts from Vitality; it only maps Vitality to one of the 3 moods (`vitalityMood`, 60/30 cut-offs) for visuals.
  - **Layout (`layout.ts`):** tile (x, z) on an island of size N covers x, z ∈ [-N/2, N/2-1]; tile centre = (x+0.5, z+0.5). Camera looks from +x/+z; entrance (road end + name arch) is the +z edge. Every slot (plaza, road, 3 unlock buildings, 3 project sites, house lots, trees) is defined once on the 32×32 grid, so **growing never moves anything** (tested). Fixed buildings and project sites all fit on 8×8. House lots fill the island from the centre outward, never touch each other, and are only accepted if, on every island size, all open tiles stay reachable from the plaza and every lot keeps a reachable door tile (tested). Trees follow the same rule. Projects take slots in the order the server lists them, so the server must keep that order stable.
  - **For M2 (Avatar):** `layout.walkable` = tiles reachable on foot from the plaza (houses, trees, buildings and project sites block; decorations, lamps and the arch do not). Use it for A*. Mini villagers already random-walk on it.
  - **Rendering:** every model is a list of boxes (`assets/models.ts`, pure and tested); `BoxBatch` draws them with one `InstancedMesh` per material layer (solid / glow / ghost), so draw calls stay flat with island size. Silhouettes are the real building drawn as translucent ghosts. Art Pass: swap entries in `assets/registry.ts`.
  - **Labels:** drei `Html`, `pointer-events: none`, z-bands so speech bubbles are above name tags (and the HUD/dev panel at z-30 above both). Detail depends on zoom: below 40 px per tile (phone default) labels are compact (🔒 chip, progress bar without title); pinch in for full text. With more than 12 houses, name tags show only when zoomed in.
  - **Labels toggle:** HUD button (top right) shows/hides every island overlay, including villager bubbles. State lives in `uiStore.ts` (`useIslandUi`), on by default, remembered in `localStorage` (wrapped in try/catch; works without storage). Later modules that add island overlays must respect `showLabels`.
  - **Mini villagers:** base speed per mood (Lively 0.75 / Normal 0.55 / Gloomy 0.3 tiles/s) × a per-villager factor 0.65–1.25; per-villager rest habits; only ~35% hop and only when Lively (`assets/villagerPersonality.ts`, deterministic per index). No extra cost: each villager was already simulated on its own.
  - **Growth:** new rings rise from below (1.4 s, ease-out-back), the camera zooms out to fit, objects on the new rings appear after landing, villagers cheer for 2.5 s. No share card yet (M11).
  - **Dev tools:** a panel (dev builds, or `?dev` in production) edits the mock state live (size, Vitality, houses, lights, villagers, unlocks, project stage and progress). `mockCommunityState.json` is validated on load and throws with every error listed.
  - **Not tested / known gaps:** no real phone run yet (only headless Chromium with a software GPU; FPS figures from it mean nothing). No automated tests of the R3F scene itself (logic, models and registry are unit-tested; the scene was checked by screenshots at 1280×800 and 390×844). Not built yet: chimney-smoke and villager polish, mood transition animation, day/night, winter launch theme (user decision 2026-11-18: deferred to the Art Pass; features first. M1 uses the green pastel reference, snow only in Gloomy). Building/house tap info belongs to M2/M4.
  - **Environment gotchas:** in dev, React StrictMode makes drei `Html` log "Attempted to synchronously unmount a root…" once per label; the production build does not. three r187 logs a `THREE.Clock` deprecation warning from R3F internals (harmless). Bundle: ~326 KB gzipped (three + drei).

### M2 — Avatar ⭐ ✅
**Goal:** The user's avatar walks around the island.
- **In scope**
  - [x] Box avatar with name label
  - [x] Tap/click-to-move with **A* pathfinding** on the island grid (blocked tiles: buildings, trees)
  - [x] Keyboard WASD/arrows on PC
  - [x] Camera follow
  - [x] Movement API based on **destination events** (`moveTo(tile)`), so actions and future real-time can reuse it
- **Out of scope:** other residents' avatars, customization
- **Definition of Done**
  - [x] avatar never walks through buildings (simulated walks on 8/12/20/32 islands; every step checked)
  - [x] works with touch and mouse (headless Chromium: mouse click and touch emulation; not yet on a real phone)
  - [x] camera follow feels smooth (user confirmed 2026-11-18)
  - [x] user has walked around (confirmed 2026-11-18)
- **Handoff**
  - **Code:** `frontend/src/modules/avatar/`. Public API: `Avatar({ nickname })`, `moveTo({ x, z })`, `useAvatarStore` (`lastEvent`, `arrival`), `findPath`, `nearestWalkable`, `AVATAR_SPEED` (2.2 tiles/s).
  - **Destination events:** `moveTo` emits `{ avatarId, to, seq, at }` — no positions. Taps and keyboard steps both produce events in this format. The avatar renderer turns events into paths; when a path ends it sets `arrival = { seq, tile }`. **M4:** call `moveTo(siteTile)`, keep the returned `seq`, act when `arrival.seq` matches. `avatarId` is `'local'` until Identity (M6).
  - **Pathfinding:** A* with 8 directions and no corner cutting (a diagonal step needs both side tiles free). Tapping a blocked tile (house, tree, building) walks to the nearest walkable tile, ties going to the one closest to the avatar. The avatar finishes its current step before turning. If the island changes under it (new house, growth), it re-plans; if its own tile becomes blocked it moves to the nearest free tile.
  - **Keyboard:** WASD/arrows mean screen directions, converted to grid steps using the current camera rotation (`keyboard.ts`); if the best direction is blocked it slides along the wall using the two neighbouring directions. Keys are ignored while typing in inputs (the dev panel sliders).
  - **island-view interface additions (made in this module):** `IslandView` now takes `onTileTap(tile)` and `children` (rendered inside the scene); new exports `useIslandWalkable()` (walkable tiles that are already shown, so rings still rising after growth are excluded), `useShowIslandLabels()`, `setCameraFocus` / `clearCameraFocus`, `tileKey`.
  - **Tap vs drag:** taps go to an invisible ground plane; presses that move more than 8 px count as camera drags and are ignored. A tap on a tall object lands on the ground behind it (isometric view), so tapping a house roof walks to tiles behind the house. Tapping buildings for info is M4.
  - **Camera follow:** the orbit target and the camera move together towards the avatar. Strength depends on zoom: at the default "whole island" zoom it follows only 20% (island stays centred), and fully from about 2× zoom.
  - **Not tested / known gaps:** no real phone yet (touch only emulated); "smooth" camera follow judged from screenshots only; no automated tests of the R3F components (walker, pathfinding and keyboard logic are unit-tested). Avatar look is placeholder boxes (orange shirt, navy cap); the nickname is the placeholder "You" until M6.
  - **Environment gotchas:** the Playwright MCP browser may be locked by another session; a scratchpad Playwright script with `--use-angle=swiftshader` works for screenshots (FPS from it is meaningless). When scripting taps, compute positions in CSS pixels from the screenshot (screenshots are 2× device pixels).

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
  - [ ] Village build map screen (`requirement.md` §7.6a): unlock track + island size track with remaining conditions and progress, completed projects; Village tab only (Me tab is Phase 2)
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
  - [ ] avatar shirt colour choice on first visit, changeable later (`requirement.md` §10.2)
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
  - [ ] Village Notice Board object on the island opens it on tap (Community Centre once built); no walking required
  - [ ] global operator announcements (one feed for all communities) at the top of the newspaper, managed by the operator (no per-community announcements)
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
  - [ ] default name sign for every community (custom signs come from Phase 3 photo petitions)
  - [ ] a few feature blocks (lake, creek, hill, park) as box models
  - [ ] community → feature mapping (OSM / City hydrology suggestion + CSV override) for launch communities
  - [ ] reserve feature/landmark slots in the island layout (M1 layout has none yet; house lots will be re-laid once, acceptable before launch)
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
  - [ ] production database tzdata is 2026c or newer (`common_calgary_day` tests pass against it; Alberta permanent UTC-6)
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

### 2026-11-18 — v1.16
**Changed:** "Based on" → `requirement.md` v1.16. M5: added the Village build map screen. M6: added avatar shirt colour choice.

**Why:** Sync with requirement v1.16 (village build-up and avatar build-up; avatar growth itself is Phase 2).

**Previous:**
- `| Plan version | v1.15 |` / `| Based on | `requirement.md` v1.15 |`
- M5 and M6 had no build map / shirt colour items.

### 2026-11-18 — v1.15
**Changed:** "Based on" → `requirement.md` v1.15. M13: name sign item is now the default sign for every community; removed the launch-community landmark item (custom signs/landmarks move to Phase 3 photo petitions).

**Why:** Sync with requirement v1.15 (resident-driven signs and landmarks).

**Previous:**
- `| Plan version | v1.14 |` / `| Based on | `requirement.md` v1.14 |`
- M13: `  - [ ] name sign (voxel reinterpretation of the real entrance sign from operator photos; community name only, no developer logos; default sign otherwise)` / `  - [ ] optional community-specific landmark for launch communities only (e.g. Mahogany)`

### 2026-11-18 — v1.14
**Changed:** "Based on" → `requirement.md` v1.14. M9: notice board opens on tap without walking; added global operator announcements.

**Why:** Sync with requirement v1.14 (user decisions).

**Previous:**
- `| Plan version | v1.13 |` / `| Based on | `requirement.md` v1.13 |`
- M9: `  - [ ] Village Notice Board object on the island opens it` (announcements item did not exist)

### 2026-11-18 — v1.13
**Changed:** "Based on" → `requirement.md` v1.13. M13: name sign wording (voxel reinterpretation, no logos), mapping sources include City hydrology, added optional launch-community landmark and a layout-slot item.

**Why:** Sync with requirement v1.13. User chose to keep M13 in its planned order (no layout change in M1).

**Previous:**
- `| Plan version | v1.12 |` / `| Based on | `requirement.md` v1.12 |`
- M13: `  - [ ] name sign` / `  - [ ] community → feature mapping (OSM suggestion + CSV override) for launch communities` (landmark and layout-slot items did not exist)

### 2026-11-18 — v1.12
**Changed:** "Based on" → `requirement.md` v1.12. M1 label item now includes the show/hide labels toggle.

**Why:** Sync with requirement v1.12 (labels toggle, slower individual villagers) after the user's first look at M1.

**Previous:**
- `| Plan version | v1.11 |` / `| Based on | `requirement.md` v1.11 |`
- M1: `  - [x] Labels and speech bubbles via drei `Html``

### 2026-11-18 — v1.11
**Changed:** M1 item "Instanced rendering for tiles (drei `Instances`)" now reads "Instanced rendering for tiles and repeated boxes (raw `InstancedMesh`, ...)". M1 set to 🟨 with its Handoff note.

**Why:** drei `<Instances>` re-uploads every instance matrix on every frame (one React child per instance). Island boxes are static, so a raw `InstancedMesh` updated only when the state changes is cheaper on phones and still follows `requirement.md` §20.3a (instanced rendering).

**Previous:**
- M1: `  - [ ] Instanced rendering for tiles (drei `Instances`); animations in `useFrame` with refs (no per-frame React state); phone-size viewport check`
- Header: `| Plan version | v1.10 |` / `| Current module | M1 — Island View (next; M0 ✅ Done) |`

### 2026-11-18 — v1.10
**Changed:** Added rule 10 (each module ends with a Handoff note; new sessions read `git log`, Change Logs and Handoff notes first). Added the M0 Handoff note. M0 marked ✅ and current module set to M1 (status update, recorded here for completeness).

**Why:** Each module is built in a new Claude Code session with no memory of earlier sessions. Commits and Change Logs record *what* changed; Handoff notes record decisions, gaps and gotchas that are not obvious from the code.

**Previous:**
- Rule 10: (none)
- M0 Handoff: (none)
- Header: `| Plan version | v1.9 |` / `| Current module | M0 — Foundation (in progress) |`

### 2026-11-18 — v1.9
**Changed:** M0 status 🟦 In progress. M0 items reworded to what was built: local Supabase (cloud project at M14), pooling via PostgREST, Calgary day boundary as server-side Postgres functions (no client time zone math), conventions enforced by tests; DoD day-boundary item now covers Alberta's permanent UTC-6. M14: added a production tzdata check. "Based on" → `requirement.md` v1.11.

**Why:** Alberta's Official Time Act (2026) ended DST: no fall-back on 2026-11-01, UTC-6 year-round (IANA tzdata 2026c+). Database tests caught this; client tzdata (Node 20 = 2025a, many browsers) is outdated, so the day boundary must be server-only. Local-only Supabase for M0 was agreed with the user.

**Previous:**
- `| Based on | `requirement.md` v1.10 |`
- M0 In scope (verbatim):
```
  - [ ] Supabase project (PostgreSQL + PostGIS enabled); Supabase CLI for local dev and SQL migrations; database connection pooling
  - [ ] Shared time utility: **Calgary day boundary (America/Edmonton)** with tests
  - [ ] Module folder conventions in place (see `CLAUDE.md` §2 Modular code)
```
- M0 DoD: `  - [ ] day-boundary tests cover DST changes`
- M14: (tzdata check did not exist)

### 2026-11-18 — v1.8
**Changed:** Added rule 9 to "How this plan works": one branch per module, merged to `main` with `--no-ff` only after ✅ Done, green CI, and ✅ already recorded on the branch; reopened modules use `fix/` branches.

**Why:** User decision: `main` should only contain modules that were checked together and work. Branches also make it easy to discard a failed attempt.

**Previous:** Rules 1–8 only (rule 9 did not exist).

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
