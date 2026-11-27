# Development Plan — MakeCalgaryTalk

| Item | Value |
|---|---|
| Plan version | v2.06 |
| First written | 2026-11-16 |
| Last updated | 2026-11-27 |
| Based on | `requirement.md` v1.52 |
| Current module | M27 Avatar Look 🟨 (then M16) |

---

## 📌 How this plan works

1. **Build the core first, then add modules one at a time.** A module is finished before the next one starts.
2. **Only one module is "In progress" at a time.**
3. Each module has a goal, scope, out-of-scope, dependencies, and a **Definition of Done**.
4. A module is ✅ **Done only after the user has played it and confirmed** (see `CLAUDE.md` Rule 4).
5. If something breaks later, **reopen only the module that owns it** and log it.
6. This plan will change. Before changing it, add an entry at the top of [`changelog/plan.md`](changelog/plan.md) (date, version, Changed, Why, Previous text verbatim), then edit the body.
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
| M3 | Game Core | BE | ⭐ Core | M0 | ✅ |
| M4 | Daily Actions | FE + BE | ⭐ Core | M2, M3 | ✅ |
| M5 | Community State | BE + FE | ⭐ Core | M4, M1 🔁, M3 🔁 | ✅ |
| M6 | Identity | FE + BE | | M4 | ✅ |
| M7 | Residency | FE + BE | | M6 | ✅ |
| M8 | Residents & Villagers | FE + BE | | M5, M7 | ✅ |
| M9 | Community News | BE + FE | | M8 | ✅ |
| M15 | Community Posts | FE + BE | | M9 | ✅ |
| M10 | World Map | FE (2D) + BE | | M5 | ✅ |
| M11 | Ranking & Share | BE + FE | | M5, M10 | ✅ |
| M12 | Invites | FE + BE | | M6, M7 | ✅ |
| M13 | Feature Library | FE + data | | M1 | ✅ |
| M14 | Launch Prep | All | | All above | ✅ |
| M19 | Art Pass | FE (R3F) | | M14 | ✅ |
| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | ✅ |
| M21 | Living Community | FE + BE | | M20 | ✅ |
| M22 | Sound | FE | | M21 | ✅ |
| M23 | Art Pass 2 (voxel variety) | FE (R3F) | | M22 | ✅ |
| M24 | Community Identity | BE + FE (R3F) + data | | M23 | ✅ |
| M25 | Terrain (decide after M24) | FE (R3F) + data | | M24 | ⬜ |
| M26 | Community News Steps | BE + FE + data | | M24 | ✅ |
| M27 | Avatar Look | BE + FE (R3F) | | M26 | 🟨 |
| M16 | Deploy & Playtest | All + operator accounts | | M27 | ⬜ |
| M17 | Return Reminders | BE + FE | | M16 | ⬜ |
| M18 | Association Partnership | BE + FE + operator | | M16, M9 | ⬜ |

**Order after M7 (user decision 2026-11-20):** M1 🔁 Sleepy mood fix → **M12 Invites** (before M8: bringing neighbours in is the core of the game) → M8 → M9 → **M15 Community Posts** (resident-written local news, right after M9) → M10 → M11 → M13 → M14.

No time estimates: with AI-assisted (vibe) coding, modules may finish faster or slower than expected. This plan tracks **order, completeness and progress**, not schedule.

**Layers:** FE = React app (`frontend/`). BE = Supabase (`supabase/`: SQL migrations, Postgres functions/RPC with RLS, Edge Functions, pg_cron). There is no separate backend server.

**Core loop is complete after M5.** At that point the game is playable end to end with a dev user and a manually chosen community: see the island → move the avatar → take daily actions → progress next day → streak, Vitality, building tree, island growth.

**Reopened after M4 (requirement v1.18):** M1 (real-shape islands, stored lot plans, tree building models) and M3 (building tree as data) are reworked on `fix/` branches before M5, because buildings must stay where they are built and islands take the real community shape.

```
M0 ─┬─ M1 ── M2 ─┐
    └─ M3 ───────┴─ M4 ── M5 ─┬─ M10 ── M11
                     │        ├─ M8 ── M9
                     └─ M6 ── M7 ─┬─ M8
                                  └─ M12
    M1 ── M13
    (all) ── M14 ── M19 ── M20 ── M21 ── M22 ── M23 ── M24 ── (M25?) ── M26 ── M27 ── M16 ── M17 ── M18
```

---

## Module details

### M0 — Foundation ✅
**Goal:** Empty but runnable project skeleton so every later module has a home.
- **In scope**
  - [x] Monorepo folders: `frontend/` (React + Vite + TypeScript, Tailwind, Zustand, react-three-fiber + drei), `supabase/` (migrations, functions), `docs/`
  - [x] **Local** Supabase project (PostgreSQL + PostGIS enabled); Supabase CLI for local dev and SQL migrations; connection pooling via PostgREST (the frontend never opens direct DB connections). The cloud project and its pooler are set up at deploy (M16)
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
  - **Not covered yet:** cloud Supabase and production tzdata check (M16); real-phone performance (no 3D yet).
  - **CI:** check results with `gh run list --branch <branch>` / `gh run watch <id> --exit-status` (`gh` is installed and logged in; the repo is private, so the unauthenticated REST API returns 404).

### M1 — Island View ⭐ ✅
**Reopened 2026-11-19** (`requirement.md` v1.18 §7.6–7.8, §20.4; branch `fix/m1-real-shape-islands`, after M4 is merged). The original items below stay ticked; the rework:
- **In scope (rework)**
  - [x] Island from the **real community boundary**: rasterize to ~1,024 tiles (equal max land), smooth thin spurs, keep the largest part, centre = farthest from the edge, reveal order by walking distance; land tiers 64 / 144 / 256 / 400 / 676 / all
  - [x] **Whole outline visible from day one** (clouds / translucent future land); new land rises inside it
  - [x] **Lot plan per community generated once and stored** (static JSON, served like other static data): tree building lots reserved at final size, house lots, spare lots, Main Street lots, paths; never regenerated for existing communities
  - [x] Box models for the tree buildings (welcome sign → gateway arch, fire pit → warming hut → community hall, frozen pond → skating rink → lit hockey rink, playground, sledding hill, dog park, pathway lights, community garden, neighbourhood park) and a **generic placeholder** for unknown building keys; remove the M4 showcase miniatures
  - [x] ~~Default camera angle per community (long side vertical on a portrait phone)~~ replaced in M10 by the World Map orientation (`requirement.md` v1.30 §7.8); growth animation for irregular land
  - [x] Real water from City Hydrology at its real position (not walkable, no lots; bridges if water splits the land) (`requirement.md` v1.19 §7.8)
  - [x] Later-stage lots in newly grown outer land, spread in different directions; first-stage lots around the plaza
  - [x] Locked buildings not drawn on the island; opened buildings as ✨ silhouettes (§7.6)
- **Definition of Done (rework)**
  - [x] all 223 communities produce valid islands (automated checks: one connected island per stage, every lot fits and is reachable, positions identical across stages)
  - [x] phone-size check of a few unusual shapes (Beltline and Diamond Cove on a phone, Lower Mount Royal on desktop; Bowness only in the stored-plan tests; headless Chromium, not a real phone)
  - [x] user has looked at it (confirmed 2026-11-19)

- **Handoff (rework)**
  - **Data:** `supabase/data/building_tree.json` is the single source of the tree (buildings, stages, conditions, lots with size and land stage); the frontend imports it directly (`vite.config.ts` allows `..`), M3 🔁 must seed the database from the same file. `supabase/data/calgary_boundaries.json` = residential boundaries snapshot (also for M7 and M10).
  - **Plans:** `frontend/scripts/island_plans.py` (Python, standard library — Node 20 cannot run TypeScript scripts) writes `frontend/public/islands/<CODE>.json` (223 files, ~12 KB each, 2.6 MB). It **never overwrites** an existing plan; `--force` is for before launch only. Reveal order grows from the plaza taking the nearest tile next to existing land (disc-like, always connected); tiers 64 / 144 / 256 / 400 / 676 / all. Two main paths, then lots (stage-0 tree lots, minimum early houses, Main Street on the paths, other lots preferring their own land ring), then houses (150 max) and trees, all with reachability checks on every stage.
  - **Validation:** `plan/islandPlans.test.ts` checks every stored file with the game's own `walkableTiles()`: tier sizes, one island per stage, lot sizes/land stages, no overlaps, every tile/lot/house reachable with every lot and every house lot blocked, minimum houses per stage (2, 5, 10, 25, 50, 80). The rework surfaced and fixed: diamond-shaped early land (no room for 3×3 lots), lots eating early land, and a mismatch between generator and test on when a lot blocks.
  - **Rendering:** `IslandView({ plan, state })`. State = `landStage`, `buildings[]` (`key`, `status` locked/opened/building/built, `level`, `progress`, `title`, `remaining {residents, streakDays, requires}` or null), houses, villagers, bubbles, Vitality (null allowed). Each tree lot shows its chain's most advanced building (construction site → last built → silhouette; "ready" when opened). Unknown keys → placeholder on spare lots, then Main Street lots. Empty lots (spare, landmark, not yet open) draw nothing and are **walkable**; Main Street lots show faint blue stakes. Future land = faint mist (`mist` layer). Pathway lights = lamps along paths once built.
  - **Camera:** fits the current land's on-screen frame (not a circle around the plaza) and aims at its centre; zoom out shows the whole outline. The stored angle is for portrait; on landscape screens elongated communities turn 90°. The key light rotates with the angle.
  - **Live mode until M3 🔁:** the server still sends the old project kinds; `toViewState` shows them as unknown buildings (placeholders) and uses **land stage 2** so they have lots. M3 🔁 replaces this with real tree state; M5 provides the land stage.
  - **Mock mode:** `?mock` (Mahogany) and `?mock&plan=<CODE>` for any community; the dev panel edits land stage, Vitality, houses, villagers and every building's status/level/progress.
  - **Water (v1.20):** `supabase/data/calgary_water.json` (City Hydrology, 823 pieces, outlines simplified to 5 m, `build_water.py`) is rasterized with the island's own projection, so lakes sit at their real positions (e.g. Mahogany Lake). Water is never walkable or built on; the plaza and roads avoid it; where water would split a stage's land the generator adds the shortest bridge (53 communities). Tiers count dry land; bridges count as water for size and as land for walking. 13 communities with central water use a slightly larger first stage (plan field `tiers`; 210 use the standard 64/144). Plan format is now `v: 2` (`water`, `bridges`, `tiers`).
  - **Lot spread:** later-stage lots aim at ~80% of their stage's radius and away from other later lots' directions; validated per plan (≥ 2× the first-stage distance, no direction gap over 150°; measured 4.1× average).
  - **Hidden locks:** locked buildings are not drawn and their lot is walkable; an opened building shows as a ✨ silhouette and then blocks its lot.
  - **Not tested / known gaps:** real phone; the rising animation for irregular land is the old ring-rise group (works, only checked in passing); box models are first drafts; detailed labels can crowd on desktop (labels toggle helps); boundary snapshot dated 2026-11-19; `lot-b` is 3×2 (rink shape).

**Original M1 (done 2026-11-18):**
**Goal:** The 3D diorama island renders from a state object, using box models through asset keys.
- **In scope**
  - [x] react-three-fiber `<Canvas>` with drei `OrthographicCamera`: isometric view, pastel lights, sky background, rotate/zoom limits
  - [x] Island of size N×N (tiers from `requirement.md` §7.8) with layered dirt
  - [x] **Asset registry**: asset key → box model React component (house, building, silhouette, tree, construction site, sign, mini villager)
  - [x] Render entirely from a **mock community state JSON** (no backend yet)
  - [x] 3 Vitality moods (Lively / Normal / Sleepy) change colours and props
  - [x] 🔁 Sleepy (was Gloomy, requirement v1.24): snowy winter-evening palette instead of grey; "<Community> is sleepy. Help today to wake it up!" line in the streak bar (branch `fix/m1-sleepy-mood`)
  - [x] Island growth animation when N increases
  - [x] Labels and speech bubbles via drei `Html`, with a show/hide labels toggle (`requirement.md` §10.1)
  - [x] Instanced rendering for tiles and repeated boxes (raw `InstancedMesh`, see Change Log v1.11); animations in `useFrame` with refs (no per-frame React state); phone-size viewport check
- **Out of scope:** avatar, real data, detailed art
- **Definition of Done**
  - [x] changing values in the mock JSON (size, buildings, Vitality, silhouettes) updates the island correctly
  - [ ] runs smoothly at a phone-sized viewport (checked at 390×844 in headless Chromium with a software GPU only; user accepted M1 on 2026-11-18 without a real-phone check — carried to M2 and the M16 low-end phone pass)
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

### M3 — Game Core ⭐ ✅
**Reopened 2026-11-19** (`requirement.md` v1.18 §7.1, §7.6, §7.6b, §7.7; branch `fix/m3-building-tree`, after M4 is merged). The original items below stay ticked; the rework:
- **In scope (rework)**
  - [x] **Building tree as data**: building types, parent buildings, conditions (cumulative residents, streak days), stage multipliers, footprints, growth chains (same lot); seeded with the MVP tree (§7.6)
  - [x] Building states per community computed from the action log and conditions: locked / opened / building / built / level; **at most 3 constructions** in tree order; **upgrades in place** when nothing else is opened; nothing ever re-locks
  - [x] Required actions = max(10, 5 × active residents) × stage multiplier (stage 1 at least 3) × 1.25 per upgrade level
  - [x] Settled = Welcome sign built (§7.1)
  - [x] Streak conditions stay locked until M5 provides the community streak
  - [x] RPC returns the tree state (for the island, the action bar and the build map); `docs/api.md` updated
- **Definition of Done (rework)**
  - [x] database tests for every condition type, the 3-construction limit, growth chains on the same lot, upgrades in place, no re-locking, a 1-resident community finishing a first building on day one
  - [x] user has reviewed it (confirmed 2026-11-19)
- **Handoff (rework)**
  - **Code:** `supabase/migrations/20261119120000_gamecore_building_tree.sql` (tables, rules, state), `…120100_gamecore_building_tree_seed.sql` (generated by `supabase/data/build_tree_seed.py` from `building_tree.json`; rerun it whenever the JSON changes, in a **new** migration after launch). Tests: `gamecore_rules.test.sql` (62 checks; 104 in all DB files). Frontend: `daily-actions/api.ts` (types + response checks), `toViewState.ts` (copies the server's buildings and land stage unchanged).
  - **Model:** `building_types` (tree order = `position`), `building_requires`, `stage_multipliers`, `land_tiers` are seeded data. Per community only two kinds of one-time rows are written: `building_openings` (when a building first meets its conditions — this is what makes "never re-locks" hold) and `projects` (one row per building level when its construction starts). Everything else (built level, progress, status) is computed from the action log on read.
  - **Picking the next construction (`ensure_tree`):** while fewer than 3 are active, start the earliest opened building that was never started; if none, upgrade the chain head (a built building nothing has grown out of yet) with the lowest level, tree order breaking ties. So a grown-out building (Frozen pond → Skating rink) is never upgraded again. Runs on state reads and submissions under a per-community advisory lock.
  - **API change:** `community` now has `residents`, `land_stage`, `settled`; new `buildings` array (every tree building with status/level/progress/remaining); `projects` items use `building_key` (no `seq`/`kind`); `completed_projects` is gone. `docs/api.md` updated.
  - **Temporary inputs:** cumulative residents = players currently in the community (M7: distinct Verified Residents ever, so it never shrinks); community streak = 0 (M5), so Playground, Warming hut and other streak buildings stay locked in live mode — this is expected, not a bug. `land_stage` is computed on the server now (the M1 note "land stage 2 until M3 🔁" no longer applies).
  - **Pre-launch reset:** the migration deletes all actions and projects (old catalog). Fine locally and in CI; it must never be repeated after launch.
  - **Island display (island-view, done on this branch with the user's OK, 2026-11-19):** an upgrade (status `building`, level 2+) keeps the built model on its lot with a small scaffold and a progress label (`BuildingObject.upgrade`, `level` = built level); only a new building of the chain shows a construction site. Also fixed a latent M1 bug: drei `Html` overlays could stay **empty** (the Welcome sign's name tag vanished) because their React root was rebuilt when `events.connected` changed; every overlay now uses `useHtmlPortal()` (labels, villager bubbles, avatar tag).
  - **Not tested / known gaps:** no load test; `ensure_tree` and `remaining` run on every state read (M5 snapshots should take the read path); the build map (M5) is not built yet; the overlay fix was checked in Chromium (desktop + phone size) only.

**Original M3 (done 2026-11-18):**
**Goal:** Backend domain for communities, projects and actions with server-side rules.
- **In scope**
  - [x] SQL migrations: communities (seeded with Calgary community list + population), projects, actions, users (dev user only for now)
  - [x] Rules: **3 energy per day** (Calgary day), action must target an active project, project progress applied **next day** (compute-on-read)
  - [x] Server API as **Supabase Postgres functions (RPC)** with Row Level Security: get community state, submit action(s)
  - [x] Actions are **append-only** with a client-generated unique ID (**idempotent**); progress is aggregated, never a shared counter updated per action (`requirement.md` §20.3b)
  - [x] Database tests for every rule including day boundary, energy limit, and duplicate submissions
- **Out of scope:** auth, location, streaks/Vitality (M5)
- **Definition of Done**
  - [x] API rejects a 4th action in a day
  - [x] a duplicate action ID is ignored
  - [x] progress appears after Calgary midnight
  - [x] tests cover edge cases
  - [x] API documented in `docs/api.md`
  - [x] user has reviewed it (confirmed 2026-11-18)
- **Handoff**
  - **Code:** migrations `supabase/migrations/20261118120000_gamecore_schema.sql` (tables), `…120100_gamecore_communities.sql` (generated data), `…120200_gamecore_rules.sql` (rules + RPC); tests `supabase/tests/database/gamecore_rules.test.sql` (57 checks); API reference `docs/api.md`; data `supabase/data/` + `docs/data-sources.md`.
  - **Pattern:** every rule is an internal `gamecore.*_at(…, p_now, p_uid)` function; the public RPC only passes `now()` and `auth.uid()`. Tests move through days by passing fixed instants. Public RPCs are `security definer` with `search_path = ''`; gamecore tables have RLS on and **no policies**, so they are reachable only through the RPCs.
  - **Communities:** 223 residential Calgary communities (City Open Data `surr-xmvs`), population from the 2021 federal census (`f9wk-wej9`), 2019 civic census fallback, 17 new communities `null`. Keyed by uuid; `(city, code)` unique (per-city data, §20.5). Industrial/park districts are not game communities (the World Map can still draw them from the boundary data in M10).
  - **Energy:** 3 per Calgary day, backed by `unique (user_id, calgary_day, energy_slot)` with slots 1–3, plus a per-player advisory lock. Verified: 6 parallel requests → exactly 3 stored. The action's day is the server's day on arrival.
  - **Idempotency:** client action id = primary key. Same player + same id → `duplicate` (even after midnight, no new energy); another player's id → `id_conflict`.
  - **Projects:** 3 active; rows are written only when a project starts (by `ensure_projects`, called from state reads and submissions, serialized per community with an advisory lock). Progress and completion are counted from actions before today. Required actions are frozen at start (`required_actions(members, level)`).
  - **Players (temporary):** `gamecore.players` + `gamecore_choose_community` stand in for Residency until M7 (joining = verification day for the 30-day member count). M7 should replace the RPC and feed the member count from Verified Residents.
  - **For M4:** the frontend has models only for `ice-rink`, `flower-path`, `holiday-decorations`; add box models + `PROJECT_KINDS` for `snowman-garden`, `lantern-street`, `bird-feeders` and show `level` (e.g. "Lv 2"). Map server state into `CommunityViewState` (projects → `{id, kind, title, stage, progress/required}`). Completed projects need permanent spots on the island (the M1 layout has only 3 project slots) — decide in M4/M5. Use `crypto.randomUUID()` per tap and resend the same id on retry. Sign in locally with the seeded dev user (`dev@makecalgarytalk.local` / `dev-password`, member of Mahogany; `supabase/seed.sql`, local only).
  - **Not tested / known gaps:** no load test (single-player concurrency only); `ensure_projects` runs on every state read (cheap check first, lock only when a project must start) — M5 snapshots will take over the read path. `completed_on` is computed per completed project on every read (fine for now; snapshot later). Data attribution must also appear in the app's legal page (M14).
  - **Environment gotchas:** `supabase db reset` wipes local data and re-runs `seed.sql`. To run a test file by hand with psql inside the DB container, first `create extension pgtap with schema extensions; set search_path = public, extensions;` (`supabase test db` does this automatically).

### M4 — Daily Actions ⭐ ✅
**Goal:** Connect the island to the backend so actions really change the community.
- **In scope**
  - [x] Island loads real community state from the API (replacing mock JSON)
  - [x] Bottom action bar: energy display, choose a project, act
  - [x] Avatar runs to the project's spot (via M2 `moveTo`) then the action is sent; optimistic UI with server confirmation/rollback
  - [x] Satisfying feedback: progress bar animation, simple sound, villager cheer placeholder
  - [x] Community chosen manually from a list (temporary until M7)
- **Out of scope:** streaks, Vitality calc, news
- **Definition of Done**
  - [x] two browsers acting on the same community both see progress after the day rolls over (two dev users in separate browser contexts; the day change was simulated by moving the day's actions to the previous day in the local DB)
  - [x] energy limit enforced by server
  - [x] user has played a "day" (confirmed 2026-11-19)
- **Handoff**
  - **Code:** `frontend/src/modules/daily-actions/` — `api.ts` (typed RPC + response checks), `toViewState.ts` (server → island), `actionQueue.ts` (pure optimistic queue), `store.ts` (session flow, dependencies injected), `liveStore.ts` (real wiring), UI: `ActionBar`, `CommunityPicker`, `Toast`, `SessionScreen`. App: live game by default; `?mock` shows the M1 mock island with its dev panel.
  - **Action flow:** tap a project card → energy drops at once, one id per tap (`crypto.randomUUID`) → avatar walks to `projectSiteTile(i)` → on arrival (or after 4 s) the avatar does a "work" bow, villagers cheer, a short sound plays, and the queue is sent (batches of ≤10). Accepted/duplicate → "+N today" on the card; rejected → energy rolls back and a toast explains; `project_not_active` also refreshes the state. A network failure retries with the **same ids** (2 s, 5 s, 15 s, 30 s). Unsent actions and today's "+N" are kept in `localStorage` (try/catch) and survive a reload.
  - **No polling:** progress only changes at Calgary midnight, so the store refreshes once at `next_day_start` + 1.5 s (from the server; no client time zone math), plus after a finished-project rejection.
  - **Zero energy:** cards stay tappable (dimmed, `aria-disabled`) so a tap explains "New energy in …"; a real `disabled` button would silently ignore the tap.
  - **Showcase (M4 decision, not yet in requirement.md):** completed projects stay on the island as a 1×1 miniature on a pedestal, one per kind at its highest level (gold markers from level 2), on reserved spots in the front row on both sides of the entrance road. These spots are **not blocking** (the 8×8 island's edge is a one-tile corridor). Active projects remain 2×2 construction sites.
  - **RESOLVED 2026-11-19 (requirement v1.18):** buildings stay full size where built; the project catalog and showcase are replaced by the building tree (M3 🔁) and real-shape islands with stored lot plans (M1 🔁). Earlier note: **OPEN — decide before M5 starts (user discussion 2026-11-18/19):** the showcase is a stop-gap. The user prefers that a **finished building stays full size where it was built** (positions must never change). Ideas on the table: (1) island also grows when buildings complete (e.g. growth points: building +2, new neighbour +1, plus a "no room → grow" safety); (2) **residents open building lots** (e.g. 1–2 residents: 3 lots, 3–5: 6 lots; when every open lot is built, projects upgrade existing buildings in place), with island growth from residents only (§7.8) or also from buildings. Constraints agreed so far: buildings never move; more participating residents must grow the island; a 1-resident community must always have something to build or upgrade. No requirement change has been made yet.
  - **island-view changes:** 6 project kinds + `level`; `stage` is only scaffolding/frame (complete → showcase); `showcase` field; `vitality` and lock `remaining` may be `null` (M5 provides them; null → Normal mood, no HUD chip, lock without conditions); new exports `projectSiteTile`, `celebrateIsland`, `PROJECT_KINDS`. avatar: `playWork(facing)`.
  - **Placeholders until later modules:** island size 8, no houses (M8), 3 ambient villagers, buildings locked without conditions, Vitality hidden (M5).
  - **Dev sign-in (temporary until M6):** dev builds sign in automatically as `dev@makecalgarytalk.local`; `?devuser=2` uses `dev2@…` (both seeded members of Mahogany, `supabase/seed.sql`). Same-browser tabs share one session; use two browsers or a private window for two players. Production builds show "Sign-in is coming soon" until M6.
  - **Not tested / known gaps:** a real Calgary midnight (simulated only; the refresh timer is unit-tested); real phone; sound on iOS (AudioContext needs a gesture — the tap is one); offline-for-hours retry beyond 30 s intervals; the "Switch community (dev)" button exists only in dev builds.
  - **For M5:** fill `vitality`, `buildings` (unlocked / remaining), `islandSize`, `miniVillagerCount` in `toViewState` from server data; the build map can reuse `server.projects` / `completed_projects`.

### M5 — Community State ⭐ ✅
**Goal:** The community feels alive and changes over days. **Core loop complete.**
- **In scope**
  - [x] Backend: community streak (≥ half, rounded up, of **Active Verified Residents** = acted within last 7 Calgary days), Vitality (7-day average; denominator = Verified Residents whose **last active day** (later of last action and verification day) is within last 30 days incl. today, rises fast/falls slow), streak and resident conditions for the **building tree** (§7.6; resident counts cumulative), island land tier from cumulative residents (§7.8)
  - [x] Snapshot generation every 5–10 min (JSON) for community state via **pg_cron**
  - [x] Frontend: streak bar ("2/6 today"), locked silhouettes with remaining conditions, "What changed since yesterday" panel, island growth goal
  - [x] Village build map screen (`requirement.md` §7.6a): the building tree with done / building / opened / locked, remaining conditions and progress, island land track, community completion %, "See a finished example" button; Village tab only (Me tab is Phase 2)
- **Out of scope:** real residents/verification (dev users simulate residents)
- **Definition of Done**
  - [x] with simulated users over simulated days, streak, Vitality, unlocks and growth behave as specified
  - [x] a 1-resident community works
  - [x] user has played across at least 3 real days — user confirmed and approved the merge on 2026-11-19 after simulated days; a run across real Calgary midnights is still open
- **Handoff**
  - **Code:** migration `supabase/migrations/20261119130000_gamecore_community_state.sql`; tests `supabase/tests/database/gamecore_state.test.sql` (48 checks; 152 in all DB files). Frontend module `frontend/src/modules/community-state/` (`StreakBar`, `ChangesPanel`, `BuildMap` + pure text/model helpers with tests); `daily-actions` maps `vitality` / `mini_villagers` and exports `projectIcon` and the server types; `island-view` exports `finishedExampleState` and `remainingText`. API reference `docs/api.md`.
  - **Members (temporary until M7):** `gamecore.membership_events` (append-only, one row per join into a different community) gives members per day (`members_on`) and cumulative residents (never shrink). `gamecore.players` stays the "current community" row. `seed.sql` now joins the dev users through `choose_community_at` so their event exists (migrations run before the seed, so a backfill in a migration does not see seeded players).
  - **Days:** `gamecore.community_days` stores each finished Calgary day once (filled lazily by `ensure_days` under a per-community lock). Streak = consecutive attended days up to yesterday + today if attended. Vitality = 100 × max(3-day, 7-day average ratio) of finished days since the first resident (requirement v1.21); `null` before the first finished day so new communities start with the normal mood.
  - **Snapshots:** `gamecore.community_snapshots` (one row per community) rebuilt by pg_cron every 5 min (`gamecore-snapshots` → `refresh_snapshots()`, communities with residents only), lazily on the first read of a new Calgary day, and dropped when someone joins or leaves. Reads add live `streak` (today's count) and `me`. The client refreshes once after the first accepted action of the day so the streak bar counts it. CDN publishing of snapshots (R2) is for M14.
  - **Openings timing:** `submit_actions` checks the tree before inserting the actions, so a streak reached by today's action opens buildings at the next snapshot (≤ 5 min) or new-day read, still dated today.
  - **What changed since yesterday:** built in the snapshot from yesterday's actions, levels built today, buildings unlocked since yesterday (not the three seeds), new residents, land growth and yesterday's Vitality; the panel shows once per Calgary day (localStorage, try/catch) and stays closed when nothing happened.
  - **Finished example:** the community's own stored plan with every tree building built, full land, unnamed houses and Vitality 85, labelled "Example"; the M6 first-visit example can reuse `finishedExampleState`.
  - **Not tested / known gaps:** a real Calgary midnight (days simulated by shifting data); a real phone; load (one job rebuilds all communities with residents — fine at MVP size, measure before launch); Community Revival effect and share card (M11); houses still empty (M8).
  - **Dev tip:** to simulate "the next day" locally, move all gamecore dates back one day with `session_replication_role = replica` (actions in two steps because of the energy-slot unique key) and clear `community_days` and `community_snapshots`.

### M6 — Identity ✅
**Goal:** Real users without friction.
- **In scope**
  - [x] Supabase anonymous sign-in on first visit
  - [x] optional Google linking — code done; real verification moved to M16
  - [x] avatar shirt colour choice on first visit, changeable later (`requirement.md` §10.2)
  - [x] nickname on first visit with a suggested default, validated on the server, changeable later (`requirement.md` §6.1)
  - [x] completed-neighbourhood example on the first visit only (one image or short animated scene rendered with the real engine, `requirement.md` §5.1)
  - [x] Cloudflare Turnstile (local: Cloudflare test keys; real keys at deploy, M16)
  - [x] sign-up rate limits (Supabase Auth per-IP anonymous limit; Cloudflare rate limiting at deploy, M16)
  - [x] re-join with same Google account restores record — code done (`signInWithOAuth`); real verification moved to M16
  - [x] "What changed since yesterday" seen once per **account** per Calgary day (server-side record instead of the M5 per-browser localStorage flag)
- **Definition of Done**
  - [x] new visitor plays instantly without a form
  - [x] linking Google keeps progress — moved to M16 (needs the production Google OAuth client)
  - [x] bot check active
- **Handoff**
  - **Code:** migration `supabase/migrations/20261120120000_identity_profiles.sql` (schema `identity`: `profiles`, `blocked_words`; RPC `identity_get_profile`, `identity_save_profile`, `identity_mark_changes_seen`); tests `supabase/tests/database/identity_profiles.test.sql` (26). Frontend `frontend/src/modules/identity/` (store with injected deps, Turnstile loader, `FirstVisit`, `ProfileForm`, `ProfileButton`/sheet, `IdentityScreen`, dev sign-in). App: `IdentityGate` signs in and runs the first visit before `LiveApp`; `IslandHud` got a `left` slot for the profile chip; `Avatar` takes `shirtColor`. Auth settings in `supabase/config.toml` (anonymous sign-ins, manual linking, Turnstile captcha, site URL `http://localhost:5180`).
  - **First visit = no profile yet.** The finished example uses Mahogany's stored plan with the sign reading "Your community"; then nickname + shirt; then the community picker (World Map in M10).
  - **Turnstile:** every Supabase Auth sign-in/sign-up needs a token (also the dev password sign-in). Local uses Cloudflare's public test keys (always pass, need internet). For production: create a Turnstile widget, put the site key in the frontend env and the secret in the hosted Supabase project's Auth → Bot protection.
  - **Google (open):** `linkIdentity` / `signInWithOAuth` are wired and unit-tested with fakes; the buttons show only with `VITE_GOOGLE_LINKING=true`. To verify: create a Google OAuth client (redirect URI `http://127.0.0.1:55421/auth/v1/callback` locally), put id/secret in `supabase/.env`, set `[auth.external.google] enabled = true`, restart Supabase. Linking an already-linked Google account returns an error; the sheet then offers "Sign in with Google" (the anonymous account's progress stays on that anonymous account).
  - **Nicknames:** validated in Postgres (length, characters, blocked words); the client mirrors length/characters for instant hints only. Blocked list is basic (reserved names + common profanity); extend `identity.blocked_words` as needed.
  - **Dev:** `?devuser=1|2` signs in as the seeded users (now with profiles, so they skip the first visit); without it, dev uses the real anonymous flow. A private window = a new anonymous player.
  - **Not tested / known gaps:** real Google linking and re-join (no OAuth client yet); real Turnstile keys and challenge UI; a real phone; Cloudflare-level rate limiting (deploy); account deletion with hashed identifier (§6.1) is not in M6.

### M7 — Residency ✅
**Goal:** Users belong to the community they live in.
- **In scope**
  - [x] browser geolocation → server-side point-in-polygon (PostGIS, via Postgres function or Edge Function) → **coordinates discarded**, only community ID stored
  - [x] pending contributions
  - [x] **3 different days within 7** → Verified Resident
  - [x] no location checks after verification
  - [x] moving (`requirement.md` §6.4): user-started "I moved", stays in old community until re-verified, excluded from old community's streak/Vitality denominators during the move, auto-cancel after 7 days, 90-day cooldown from last completed move, one free correction within 14 days of first verification
  - [x] cumulative Verified Residents counted as distinct people per community (movers stay counted, returners not counted twice)
  - [x] "verify on your phone" hint
  - [x] candidate community while verifying; accuracy and per-day check limits (`requirement.md` v1.23 §6.2–6.3)
  - [x] replace the temporary manual community choice (M4); resident records move from `gamecore` to the `residency` schema, gamecore reads them through residency functions
  - [x] local phone testing over HTTPS on the same Wi-Fi (dev only)
- **Definition of Done**
  - [x] tests prove coordinates are never persisted or logged
  - [x] verification edge cases tested (other community visit same day, day boundary)
  - [x] move edge cases tested (auto-cancel at day 7, cooldown not used on cancel, free correction once only, old community keeps cumulative count, returner not double counted)
  - [x] user verified their own community — user checked in from their own community on their phone over local HTTPS (day 1 of 3 counted, correct community, pending help); the remaining days were verified with simulated days
- **Handoff**
  - **Code:** migrations `20261120125900_gamecore_community_lookup.sql` (community id/name lookups for other modules), `20261120130000_residency_schema.sql`, `20261120130100_residency_boundaries.sql` (GENERATED by `supabase/data/build_boundaries_sql.py` from `calgary_boundaries.json`, 223 residential communities, PostGIS), `20261120130200_residency_rules.sql`, `20261120130300_gamecore_residency_inputs.sql`. Tests `supabase/tests/database/residency_rules.test.sql` (81). Frontend `frontend/src/modules/residency/` (store with injected deps, `FindCommunity`, `ResidencyChip` + sheet, `MoveSection` inside the profile sheet via `ProfileButton` children, `?devloc=` dev override).
  - **Module boundary changed:** `gamecore.players`, `gamecore.membership_events` and `gamecore_choose_community` are gone. Residents live in `residency.verifications` (append-only; latest one = current community, first = first verification). gamecore reads them only through `residency.counted_residents_on`, `cumulative_residents_on`, `first_day`, `communities_with_residents`, `play_on`, `applied_on`, `changed_at` (one-way dependency gamecore → residency; residency only uses `gamecore.community_name` / `community_id_by_code` for reference data). Snapshots are rebuilt when `residency.changed_at` is not older than the snapshot (strict, so a change in the same transaction time rebuilds).
  - **Pending:** `gamecore.actions.pending` is set at insert (player not verified in that community). Progress counts a pending action from `residency.applied_on` (first verification there on/after the action day) — shown the day after like all help; finished days never change.
  - **Where a player plays:** verified → their community; verifying → candidate (pending); moving → candidate (pending), or still the old community (not pending) before any check-in elsewhere; none → `community_id: null` (frontend shows "Find your community"; "Just look around first" opens the community list view-only — my avatar is hidden and taps do nothing).
  - **Seed/tests:** `residency.add_verified_resident_at(uid, community, now)` makes a Verified Resident directly (seed and DB tests only; not exposed).
  - **Dev:** `?devloc=MAH` uses a point inside that community (dev builds only; production drops it). `npm run dev:phone` → `https://<LAN IP>:5181` (self-signed cert, `/supabase` proxy) for real phone GPS on the same Wi-Fi. The scratch "next day" script must also shift `residency.check_days`, `check_ins`, `verifications`, `moves`.
  - **Playwright gotcha:** Chromium's location emulation stops answering once the Turnstile iframe has loaded (also for a direct `getCurrentPosition` call), so screen checks use `?devloc=`. The real browser prompt path is covered by the user's phone test.
  - **Not tested / known gaps:** a real phone (DoD item, waiting for the user); the browser permission prompt in automation (see gotcha); Postgres/API gateway logs were not inspected — tests prove coordinates are not stored, not returned and not raised as notices, and PostgREST passes RPC arguments as bound parameters; location spoofing is accepted for the MVP; Founding Resident badge, farewell line and houses moving are later modules (M8, M9); real 7-day runs (all day logic verified with time travel).


### M8 — Residents & Villagers ✅
**Goal:** Show who lives here and what they did.
- **In scope**
  - [x] one house per Verified Resident, window lights if active today (no smoke), archived after 30 days (`requirement.md` v1.26 §7.2)
  - [x] tap a house → "<nickname>'s house", active today, Founding Resident; my house marked; all names with labels on when zoomed in
  - [x] fixed house lot per resident (assigned while building the snapshot; archived lots reused only when full; "+N more residents" overflow)
  - [x] mini villagers (count by residents + Vitality, max 20)
  - [x] **action replay** with system speech bubbles from today's real actions
  - [x] other residents shown asynchronously (no real-time)
- **Definition of Done**
  - [x] replay only shows real actions
  - [x] inactive houses dark
  - [x] performance OK on phone — user checked on their phone (local HTTPS)
- **Handoff**
  - **Code:** migrations `20261120150000_residency_houses_interface.sql` (`residency.residents_on` incl. movers, `founder_of`), `20261120150100_gamecore_houses.sql` (`gamecore.house_lots`, `shown_houses`, `houses_at`, `today_actions`; snapshot gets `houses` / `hidden_houses`, state gets `today_actions` and `me.house_slot`). Tests `supabase/tests/database/gamecore_houses.test.sql` (30, incl. 150 full lots). Frontend: `houseLotOrder` + slot placement in `layout.ts`, `walkableTiles` takes the taken house tiles, `HouseAsset` without smoke, house tap (ray vs house boxes in `IslandView`), `HouseMarks` (my house "🏠 Me", tapped house info) in `Labels.tsx`, replay bubbles cycling over villagers every 6 s, `toViewState(server, actedToday)`.
  - **Slots:** slot i = i-th house lot by (land stage, plan order). Lowest-free assignment keeps used slots below the cumulative residents, which each stage can hold (plan test `HOUSES_NEEDED`), so a house is on land; the client still hides an off-land slot and counts it. 150 lots per plan (tested); the server constant `gamecore.house_slots()` must match.
  - **Names:** floating names only with labels on and zoomed in; my house always marked; tapping shows "<nickname>'s house" / "My house", active today, Founding Resident (5 s). My own window lights up at once after my first help (`actedToday`), before the next snapshot.
  - **Not tested / known gaps:** a real phone; villagers do not walk to the site during the replay (bubble only); badges other than Founding Resident are not in the bubble (decision); interiors are a Phase 3 idea (requirement §22.3).


### M9 — Community News ✅
**Goal:** A daily reason to check in.
- **In scope**
  - [x] daily newspaper about real community life: new neighbours (count + nicknames) and farewells; game events stay in the "Since yesterday" panel; a "Local news" slot announces resident posts (next module)
  - [x] farewell line when a resident moves away (`requirement.md` §6.4, §11)
  - [x] roadmap notices + "Coming soon" locks
  - [x] newspaper opens on tap of the Welcome sign; the Warming hut adds the community board; the Community hall takes both over (`requirement.md` §7.6, §11); no walking required
  - [x] global operator announcements (one feed for all communities) at the top of the newspaper, managed by the operator (no per-community announcements)
  - [x] newspaper written once per community per Calgary day and stored; locked until the Welcome sign is built; board section locked until the Warming hut (`requirement.md` v1.27 §11)
- **Definition of Done**
  - [x] newspaper reflects yesterday's real new neighbours and farewells with nicknames
  - [x] no activity times exposed
- **Handoff**
  - **Code:** migrations `20261120160000_residency_news_interface.sql` (`arrivals_on`, `departures_on`), `20261120160200_news.sql` (schema `news`: `editions`, `announcements`, `roadmap`; `lines_at`, `newspaper_at`; RPC `news_get_newspaper`). Tests `supabase/tests/database/news_rules.test.sql` (24). Frontend `frontend/src/modules/news/` (`NewspaperPanel`, store, `newsBuildingKeys`); island-view got `onBuildingTap` (ray vs building footprints) and a "📰 News" chip (`newsBuildingKeys`).
  - **Newspaper host:** the Welcome sign's lot — the sign grows into the Gateway arch on the same lot, and right after the sign is built the arch construction stands there — so the host keys are `welcome-sign` + `gateway-arch` until the Community hall is built. The chip shows only once the sign is built; tapping the unbuilt sign's site shows the locked paper.
  - **Edition:** arrivals and departures of yesterday, built on the first read of the day and stored in `news.editions`; announcements and the board are live.
  - **Operator content:** announcements and roadmap via SQL (see docs/api.md); no admin UI yet.
  - **People news, not game news:** the edition has only new neighbours and farewells (user decision 2026-11-20); `gamecore.helpers_on` was dropped again. "Since yesterday" keeps the game events; "Your community grew!" and "N more neighbours to grow" replace island wording.
  - **Wording:** "community", not "village", in the UI (Calgary calls each neighbourhood a community): "Community News", the "Community" button, "Community complete"; "mini villagers" keep their name.
  - **Not tested / known gaps:** a real phone; announcements are not rate-limited or moderated beyond the operator; the board has no events yet (roadmap only).


### M15 — Community Posts ✅
**Goal:** Neighbours write the community's local news.
- **In scope** (`requirement.md` v1.28 §14)
  - [x] Verified Residents post in their own community once the Welcome sign is built: kind (Safety, Local deals, Events, Lost & found, Free talk) + up to 300 characters, 1 per Calgary day, no links/photos; Safety posts carry a reminder (no names, call 911)
  - [x] shown in Community News → Local news with nickname and "today / yesterday / 2 days ago"; visible 3 Calgary days; author can delete
  - [x] blocked words, phone numbers and street addresses refused
  - [x] reports (Verified 2 points, others 1; 3 points hide; at most 3 reports per player per day; confirm before sending; a report can be taken back; a report takes back my thanks and folds the post away for me), operator hide / restore / report-block (SQL)
  - [x] thanks (once per player per post) and the Community Reporter badge (10 thanks)
  - [x] posts come with the newspaper response (no extra request when opening)
- **Definition of Done**
  - [x] only Verified Residents can post; abuse is limited and tested
  - [x] no times exposed
- **Handoff**
  - **Code:** migrations `20261120170000_identity_text_filter.sql` (`identity.has_blocked_words`: per-word, reserved names allowed), `20261120170100_posts.sql` (schema `posts`: `posts`, `reports`, `thanks`, `report_blocks`; `body_problem`, `can_post_at`, `feed_at`, `create_at` / `delete_at` / `report_at` / `thank_at`; RPC `posts_*`), `20261120170200_news_posts.sql` (`news.newspaper_at(c, now, uid)` adds `posts` and `can_post`), `20261120170300_invites_reporter_badge.sql`. Tests `supabase/tests/database/posts_rules.test.sql` (55). Frontend `frontend/src/modules/posts/` (`LocalNews` with composer, post items, thanks, report/delete), wired into `NewspaperPanel`; news store `show(id, {quiet})` refreshes after changes.
  - **Filters:** address = house number + street type (with "10 am"-style times skipped), or + Calgary quadrant; phone = 10 digits with separators; links = scheme, www or common TLDs. False positives get a friendly message ("a landmark is fine"). Blocked words: per word, no substring (so "therapist" passes).
  - **Daily limit counts deleted posts** (no delete-and-repost); reports are once per player; the operator hides posts and blocks reporters with SQL (docs/api.md).
  - **Not tested / known gaps:** a real phone; no notification for authors; no operator UI; links/photos stay out (decision).


### M10 — World Map ✅
**Goal:** See all of Calgary and spread to empty communities.
- **In scope**
  - [x] 2D map from real community boundary polygons (Canvas)
  - [x] **small development illustrations inside each polygon** by level (houses + welcome sign → playground / skating rink → community hall → neighbourhood park), settled = Welcome sign built, Vitality mood (ground/roof tone, lights), grey dashed + cloud for unsettled
  - [x] icon count scaled by polygon area
  - [x] zoom-dependent detail
  - [x] tap → zoom + info card → enter community island
  - [x] empty community → invite prompt (M12 invite link naming that community). Animated rivers, CTrain and landmarks are Art Pass (`requirement.md` §9)
  - [x] opens from the 🗺 Calgary button and "Just look around first" (replaces the community list); search a community by name; my community highlighted (`requirement.md` v1.29 §5.1, §9)
  - [x] island keeps the map's orientation: same diagonal camera angle for every community + compass (`requirement.md` v1.30 §7.8; changes M1's per-community angle)
- **Definition of Done**
  - [x] all communities render and are tappable on phone
  - [x] loads fast (static data via CDN)
- **Handoff**
  - **Code:** `frontend/scripts/world_map.py` → `frontend/public/worldmap/calgary.json` (223 residential outlines in metres, Douglas–Peucker 20 m, label points; 60 KB). Migration `20261122120000_gamecore_world_map.sql` (`gamecore.world_map`, RPC `gamecore_world_map`), tests `supabase/tests/database/gamecore_world_map.test.sql` (8). Frontend `frontend/src/modules/world-map/` (`WorldMap` Canvas component, `geometry.ts`, `draw.ts`, `mapText.ts`, tests); island-view exports `MOOD_PALETTES` and `IslandHud` got a `right` slot (🗺 button). The old community list picker is gone (`CommunityPicker` deleted); "Just look around first" opens the map.
  - **Rendering:** grounds and outlines drawn with a world transform from cached `Path2D`s; icons in screen space; icon count = min(level density × km², how many 15 px cells fit) → zoom-dependent detail; unsettled = dashed grey + a faint cloud only where there is room. Pan/pinch/wheel with refs and rAF (no React state per frame); tap = movement under 8 px → hit test → animated zoom + info card. Names: once a community covers 1,200 screen px² (max zoom 0.3 px/m), bigger communities first, overlapping names skipped until more zoom.
  - **Card:** visit any community (the map lists every community with its id; view only, its Community News readable; "👀 Visiting <name> · Back home" bar; Since yesterday only at home); unsettled → also "Invite a friend from <name>" (M12 invite, message "Do you live in <name>? … Be its first resident").
  - **Island orientation:** `ISLAND_AZIMUTH` (π/4) in `island-view/scene/camera.ts` for every community and screen (portrait and landscape); `screenAzimuth` removed. The stored plans still carry `cameraAzimuth` (unused, kept so the plans decode unchanged; `scripts/island_plans.py` still writes it). Compass (`NorthArrow` in `IslandView.tsx`, lower left above the action panel) turns with the camera through a small listener channel, no React state per frame. Long communities (e.g. Bayview) now look smaller on a portrait phone than before; pinch to zoom.
  - **Not tested / known gaps:** a real phone; crown for the weekly #1 waits for M11; rivers, CTrain, landmarks are Art Pass; an unsettled community's island is mostly empty when visited (by design).


### M11 — Ranking & Share ✅
**Goal:** Competition and shareable moments.
- **In scope**
  - [x] weekly ranking (per-1,000 formula, min 5 active verified residents, Monday reset Calgary time); last week fixed on Monday, this week so far cached (`requirement.md` v1.31 §12.1)
  - [x] TOP 10 + my community in a 🏆 sheet on the World Map; "N more residents to enter the ranking"
  - [x] share card images made on the phone (weekly result, building completed, revival) always including community name; share sheet or save (§12.2)
  - [x] Monday announcement of last week's result in "Since yesterday"
  - [x] Community Revival effect (cheering, flowers) when Sleepy → recovered (§7.4)
  - [x] crown on last week's #1 on the World Map
  - [x] site-wide link preview image (Open Graph)
- **Definition of Done**
  - [x] ranking math tested (week boundary at Calgary midnight, 5-resident rule, small population, ties, moves)
  - [x] share card renders correctly on phones; the link preview shows the site image
  - [x] user has played it (confirmed 2026-11-23, with local demo data: 18 communities, 15 ranked last week)
- **Handoff**
  - **Code:** migrations `20261123120000_gamecore_ranking_interface.sql` (`gamecore.week_activity`, `gamecore.home_community`) and `20261123120100_ranking.sql` (schema `ranking`: `weeks`, `results`, `live`; RPC `ranking_weekly`), tests `supabase/tests/database/ranking_rules.test.sql` (30). Frontend modules `ranking/` (api, store with 3-minute keep, `RankingSheet`, texts) and `share-cards/` (`drawCard` 1080×1350, `shareImage` = Web Share with files, else download; `ShareCardDialog`). island-view: `captureIsland()` (renders once, copies the WebGL canvas in the same task, crops transparent sky), `reviveIsland()` + `BloomBurst` (big flower patches on free grass, ~7 s, then fold away), compass unchanged. community-state: `ChangesPanel` takes `extra` lines and `onShare`; `revivedToday()`. App wires the Monday line, cards and revival; the World Map has the 🏆 button, sheet and crown.
  - **Decisions:** scores shown with two decimals (real scores are small; one decimal made different ranks look equal). This week's leader shows "#1" in the sheet; only last week's #1 wears 👑 (sheet and map). The ranking uses finished `community_days` + today's live stats, so it matches the streak/Vitality data; last week is fixed by the first read on/after Monday (no cron). Revival is detected on the client from server Vitality values (same as the mood itself) and plays when the "Since yesterday" panel closes. A card's island picture is used only when the card is about the island on screen; otherwise the card shows the event emoji.
  - **Fixed along the way (M10 code):** the World Map's draw loop read statuses/selection from the first render (stale closure); it now reads them through a ref.
  - **Not tested / known gaps:** a real phone's share sheet (desktop test = download path; Web Share with files needs HTTPS on the phone); link preview only checked as an image and meta tags, not in Facebook's debugger (needs the real domain); Monday announcement and revival were checked by patching server responses in the browser (real Monday not waited for); ranking speed with hundreds of active communities (one query per community per day, cached 5 minutes) not load-tested.
  - **Local demo data:** `rank_demo.sql` style inserts were used for screen checks only (local database; gone after `supabase db reset`). For the review, 11 more communities with `@demo.local` residents were added (last week and today's actions); after adding past actions, delete that week's `ranking.results` / `ranking.weeks` rows and `ranking.live` so they are recomputed. Never act for `dev@` / `dev2@` / anonymous accounts.
  - **Wording (review, requirement v1.32):** player-facing text says "community", never "island" ("Visit this community", "Back to my community", "Community size"); code names (`IslandView`, …) stay.

### M12 — Invites ✅
**Goal:** Built-in acquisition.
- **In scope**
  - [x] personal invite links
  - [x] reward when invitee becomes Verified Resident of the same community
  - [x] Pioneer Sponsor badge for first resident of an empty community
  - [x] Founding Resident badge (the community's first Verified Resident)
  - [x] MVP reward = "Good Neighbour" badge for both, ×N; badges and invite counts in the profile sheet
  - [x] invite link landing: "<nickname> invited you to build <community> together"
  - [x] welcome card after the first counted check-in with Invite neighbours; "N more neighbours" goals (streak bar, build map) open the invite; share via the phone's share sheet (copy link fallback)
  - [x] first-visit copy: "You can't finish it alone"
  - [x] always-visible floating Invite button (bottom right, × hides it for the Calgary day) with a once-a-day nudge at good moments; invite chips next to goals are green buttons
- **Definition of Done**
  - [x] rewards cannot be farmed with self-invites (tests)
- **Handoff**
  - **Code:** migrations `20261120140000_residency_invite_interface.sql` (`residency.first_verification`, `community_on`, `founded_communities`), `20261120140100_identity_nickname_lookup.sql` (`identity.nickname`), `20261120140200_invites.sql` (schema `invites`: `codes`, append-only `acceptances`; RPC `invites_get_mine`, `invites_accept`, `invites_lookup`). Tests `supabase/tests/database/invites_rules.test.sql` (40). Frontend `frontend/src/modules/invites/` (store with injected deps, `InviteLandingBanner` in the first visit via `FirstVisit banner`, `WelcomeCard`, `InviteSection` in the profile sheet); `StreakBar` and `BuildMap` got `onInvite`.
  - **Rewards are computed on read** from acceptances + residency verifications (no reward rows): Good Neighbour = the invitee's first verification is in the community the inviter lives in that day; Pioneer Sponsor = that first verification founded the community; Founding Resident = earliest verification of a community (same day → lower id). So moves never remove or create rewards.
  - **Farming guards:** no self-invite; one acceptance per account (append-only); only before the invitee's first verification; rewards need the 3-of-7-day verification. Codes are public identifiers (not secrets); `invites_lookup` is open to anon and only returns nickname + community.
  - **Link flow:** `?invite=CODE` is read at app load, saved in localStorage and removed from the address bar; accepted right after sign-in (kept on a network failure, forgotten once the server answered). Share uses `navigator.share`, else copies "message + link" to the clipboard (toast). The share text always names the community.
  - **Floating Invite button:** `InviteFab` (bottom right above the action bar; toast moved up to `bottom-[13.5rem]`). Hidden day and nudge day are per device (localStorage, Calgary day from the server). Nudge text from `inviteNudge` (closest goal ≤ 2 neighbours, then island grew, then built).
  - **Welcome card:** shown when the player plays pending in a community (verifying or moving) and has not seen it for that community on this device; it takes the place of the changes panel that time.
  - **Not tested / known gaps:** the real share sheet on a phone (headless Chromium has no `navigator.share`; the copy fallback was checked); M8 (houses) will show badges on name tags later; decorations are Phase 2; no per-IP limit on `invites_lookup` (low value: nickname + community only).


### M13 — Feature Library ✅
**Goal:** Each island feels like its community.
- **In scope** (`requirement.md` v1.34 §7.9, §9)
  - [x] 6 feature blocks as box models: CTrain station, pond, hill, creek, big park, school (real water inside the boundary is already drawn since M1 🔁)
  - [x] community → feature mapping for **all 223** residential communities: OpenStreetMap suggestions + operator CSV override, at most 3 each in priority order
  - [x] features keep their spare lot in the stored plan (M1 🔁) and appear when that land rises (no faint previews); labels with public place names
  - [x] **CTrain on the islands**: track at its real position (smoothed line, walkable level crossings, rail bridges over water), stations on platforms at their real position, a running three-car train that stops at stations, "Next: <station>" signs where the track leaves; 46 community plans regenerated (pre-launch, `--rail`)
  - [x] **CTrain on the World Map**: Red and Blue lines and stations (names when zoomed in)
  - [x] build map preview of what the next land brings ("Coming at 6 neighbours: …")
- **Definition of Done**
  - [x] communities show their features (200 of 223 have at least one block; 46 have CTrain track; checked on screen: Varsity, Bridgeland, Signal Hill, Bowness, Mahogany)
  - [x] adding a feature = data change only (edit `community_features_override.csv`, rerun `build_features.py`)
  - [x] user has looked at it (confirmed 2026-11-23)
- **Handoff**
  - **Data pipeline (run in this order):** `supabase/data/build_ctrain.py` (OSM route relations → `calgary_ctrain.json`: one track centreline per line in stop order, simplified to 8 m, stations in stop order; retries when Overpass is busy) → `frontend/scripts/island_plans.py --rail` (rewrites only plans that get track) → `supabase/data/build_features.py` (reads the plans: no symbolic station where there is track; pond/creek only with < 20 water tiles) → `frontend/scripts/world_map.py` (adds `ctrain` to `public/worldmap/calgary.json`; community shapes unchanged). OSM data is ODbL (attribution in each file's `about`; add it to the site credits in M14). `--cache <file>` on the two OSM scripts saves/reuses the Overpass answer.
  - **Plan format v3** (only the 46 track communities; the other 177 stay v2, the decoder accepts both): `rail` (runs `{line, tiles}` in track order, 4-connected, ≥ 4 tiles), `stations` (`{name, lines, rect}` 2×1 platform touching the track), `railEnds` (`{line, next, tile, dir}` only where the track really leaves the island, one sign per station name). Generator rules: track within one tile of the land snaps to the edge row (lines run in road medians = community boundaries); track never on the plaza (runs split there); paths may cross track but pay a cost to run along it; track cells are never lots/houses/trees; stations need a reachable door like lots. New generator check: later lots must not leave a > 150° gap (retries with a stronger spread weight 14, 20) — Bridgeland needed it.
  - **Feature results (2026-11-23):** station block 7 (communities next to a station without track), pond 31, hill 52, creek 18, big park 114, school 141; 23 communities have no block (some of them have track, e.g. Manchester).
  - **Code:** `island-view/plan/ctrain.ts` (`CTRAIN`, `lineColour`, validation), `plan/features.ts`, `plan/upcoming.ts` (`upcomingIdentity(plan, landStage)`, public API; App passes it to `BuildMap upcoming`). `layout.ts`: features only on land; CTrain objects `track` (one per smoothed segment, `smoothTrack` = 7-tile moving average), `rail` (only bridge decks over water / crossing planks on paths), `station`, `rail-end`; `railRoutes` (tiles, smoothed points, station stops) for the trains. Walking: track tiles walkable, station platforms block (`walkableTiles`). `scene/Trains.tsx` + `scene/trainPath.ts`: per run, the longest stretch already on land (≥ 5 tiles), 2.4 tiles/s, 2.5 s station stops, 5–11 s wait off-island, alternating direction; all in `useFrame` with refs. World Map: `geometry.ts mapCtrain()` (ignored if missing/broken), drawn after the community grounds (white casing + line colour), station dots, names from `STATION_NAME_SCALE`.
  - **Tests:** `plan/islandPlans.test.ts` now checks track (on the island, 4-connected, never under lots/houses/trees/stations, stations beside it, signs at real exits, stations reachable) for every plan; `plan/ctrain.test.ts` (data, island layout, smoothing, train path, preview); `plan/features.test.ts`; feature cases in `layout.test.ts`; `community-state/buildMap.test.tsx` (preview text); World Map data test.
  - **Not tested / known gaps:** real phone (train animation cost judged fine: ≤ 3 trains × 3 cars of 5 meshes); the train ignores the avatar and villagers on crossings; on phones the track at the island edge needs zooming out to see whole; the shared downtown segment draws Red over Blue on the map; planned Green Line not shown (not operating); features are not tappable.

### M14 — Launch Prep ✅
**Goal:** Everything the public launch needs that can be built and checked locally.
- **In scope** (`requirement.md` v1.35 §17, §18, §20, §21)
  - [x] Terms of Use + Privacy Policy pages (13+, location statement) — plus Credits (OSM ODbL, City of Calgary OGL); linked from the first visit and the profile sheet
  - [x] analytics (D1/D7, shares, invites) — own, in Supabase; operator dashboard at `?admin`
  - [x] abnormal sign-up flags — verification spike flags on the dashboard (Turnstile and per-IP sign-in limits were already in place)
  - [x] optional update-email opt-in (CASL)
  - [x] adaptive quality for low-end phones (drei `PerformanceMonitor`: 1× pixel ratio, no shadows when frames drop)
  - [x] deploy configuration and launch guide (`frontend/public/_headers`, `docs/launch.md`)
- **Definition of Done**
  - [x] checked on screen: legal pages, operator dashboard (operator / non-operator), email opt-in and withdrawal, first-visit agreement line
  - [x] user has looked at it (confirmed 2026-11-23; deploy and playtest moved to M16)
- **Handoff**
  - **Server:** migrations `20261123130000_gamecore_residency_admin_interface.sql` (`gamecore.acted_between`, `residency.daily_verifications`), `20261123130050_identity_email_updates.sql` (`identity.email_updates`, RPC `identity_get_email_updates` / `identity_set_email_updates`, consent version `2026-11-23` — bump with `EMAIL_CONSENT_TEXT` in `identity/api.ts`), `20261123130100_analytics_admin.sql` (schemas `analytics`: `visits`, `community_views`, append-only `events` capped 50/player/day, RPC `analytics_visit` / `analytics_event`; `admin`: `operators`, spike rule, RPC `admin_dashboard`). New module prefixes `analytics`, `admin` in the health guardrail. Tests `analytics_admin.test.sql` (35). `seed.sql` makes the local dev user an operator.
  - **Frontend:** modules `analytics/` (`track.visit/share/inviteVisit`, never throws; App records today's visit + community on screen, invite-link arrivals, card and invite shares) and `admin/` (`AdminDashboard`, `?admin`). `identity/EmailUpdatesSection` + `LegalLinks`; first-visit agreement line. Static pages `frontend/public/{terms,privacy,credits}.html` + `legal.css` (outside the app bundle).
  - **Launch steps:** `docs/launch.md` lists every operator step (Supabase project in Canada Central, link + `db push`, auth settings, Cloudflare Pages env vars, Turnstile, Google OAuth, email routing, adding an operator, deletion requests, Pro before public launch).
  - **Legal text** is a template-based first version written from what the game actually stores; professional review once revenue starts (§18). If the Supabase region is not Canada, update the Privacy Policy.

### M19 — Art Pass ✅
**Goal:** Every community looks worth playing and feels **busy** before anyone sees it (`requirement.md` v1.39 §19.0, §22.2, §22.6). Built **before M16** (deploy and playtest).
- **In scope** (planned with the user 2026-11-24: own code-built voxel assets, warm pastel colours matching `docs/references/`)
  - [x] the details decided together: own voxel assets (12 voxels per tile) first, buy or redo only if the user does not like them; downtown = towers, other communities = a mix of house types; warm pastel palette
  - [x] houses: 7 types (bungalow, 2-storey with garage, semi-detached, townhouses, infill, apartment, loft) mixed per community type (downtown / inner city / suburb), 11 roof and 8 wall colours, facing the path, lit windows when active today
  - [x] buildings of the tree: voxel models for every building, 2–3 designs per building chosen per community, facing the path; voxel pathway lamps
  - [x] feature blocks (pond, hill, creek, big park, school, symbolic station; 2 designs each) and CTrain (voxel car, platforms facing the track, overhead-wire poles, crossing signs, bridge railings)
  - [x] construction sites (fence, scaffold, materials, frame rising with progress, crane on big lots) and voxel island trees (snow when sleepy)
  - [x] people: avatar and mini villagers are one voxel person at the same size; my avatar's name always shows, my house says "My house" (requirement v1.39)
  - [x] busier communities without fake players (§7.3): street props (benches, flower beds, cars, mailboxes) and island life (clouds beside the island, birds, Canada geese, planes — more often in NE — hot-air balloon, visiting deer, jackrabbits, rare cougars)
  - [x] people and animals move like they walk (operator request 2026-11-24): avatar and villagers swing arms and legs (sit, cheer, hammer too); deer walk and sometimes bound, cougars stalk low and sometimes dash, jackrabbits hop, geese waddle; resting deer and geese graze
  - [x] nobody walks through things (operator request 2026-11-24): props and flower patches block walking; cars park only beside the road (driveway nose-in or along the road; cars do not drive yet — if they ever do, only on paths); the avatar, villagers and animals never walk through each other; wild flowers are a few single-colour patches instead of dots
  - [x] island ground: grass/path colour variation, grass tufts, stepping stones, layered soil edge
  - [x] asset gallery `?gallery` with times of day (dawn, morning, noon, sunset, night)
  - **Priority: looks first** (operator decision 2026-11-24): detail and amounts are chosen for the best look. Performance work is limited to changes that keep the look identical (e.g. merging touching voxels into one box); slow phones are covered by the M14 low-quality mode; one real-phone check before the launch (M16). Rendering cost depends on each player's phone and the island's content, not on the number of players.
- **Definition of Done**
  - [x] everything drawn through the existing asset keys (§20.4), no game-logic changes; all repeated boxes instanced (§20.3a)
  - [x] checked on screen (desktop and 390 px phone viewport): Mahogany (suburb), Beltline (downtown), finished-example buildings, features and CTrain in the gallery, labels on/off
  - [ ] real-phone performance — deferred to the one real-phone check in M16 (looks-first decision)
  - [x] user has looked at it (confirmed 2026-11-24; visual polish, walking animation, props and crowds confirmed 2026-11-24)
- **Handoff**
  - **Code:** voxel kit in `island-view/assets/voxel/` — `voxel.ts` (`V = 12`, `vb`, `vturn` quarter turns 0=+z 1=+x 2=−z 3=−x, `gableRoof`, `hipRoof`, `windowZ/X`, `shade`), `samples.ts` (`ART` palette and every sample model), `houses.ts` (`houseStyleFor(code)`: downtown set DNC, DNE, DNW, EAU, CHN, BLN; Centre sector from the community CSV → inner; others → suburb; `HOUSE_MIX`), `buildings.ts` (`BUILDING_VOXELS`, `BUILDING_VARIANTS`; authored at the canonical lot, turned lots swap w/d), `features.ts` (features + CTrain parts). `assets/VoxelPerson.tsx` (`PERSON_SCALE = 0.72`) is shared by `avatar/Avatar.tsx` and `MiniVillagers`. `models.ts` maps asset keys to these; `registry.ts` adds `feature`, `rail`, `track`, `station`, `rail-end`, `prop`.
  - **Layout:** objects now carry `facing` and `variant` (`Look`); design = `hashString(\`${code}:${key}\`)`, colours picked by `variant % n` (hash picks collided). `houseFacing` / `lotFacing` / `platformFacing` exported from `layout.ts`. House objects carry `houseType` and `height`; labels and tap boxes follow the height. Street props: `assetKey 'prop'`, ≤ `MAX_PROPS = 70`; props and mood decorations (flower patches, snow piles) **block walking** and are placed only where every tile reachable before stays reachable (`reachableFromPlaza`), never on paths, the plaza, track or building lots (even empty ones). Cars need a road beside them: in a driveway (house and road beside) they face the house nose-in, otherwise they park along the road; the car model's front is +x, so its length runs across `facing`. **Crowd:** `scene/crowd.ts` (`Crowd` in the island context, `useIslandCrowd()` for the avatar): every walker claims its tile (and the next one while stepping); villagers and animals pick steps with `freeSteps` (`scene/steps.ts`); the avatar (`walker.update(dt, speed, isTaken)`) waits, then after `DETOUR_AFTER` = 1.2 s walks around, and keeps waiting if the destination itself is taken.
  - **Island life:** `scene/IslandLife.tsx` + `scene/lifePlan.ts` (`lifePlan(code, features, hasWater, rand)`, random per session): plane every 22 s in NE vs 75 s elsewhere; geese only with water; deer with park/hill/creek or water; cougar 8 % with park/hill/creek; balloon 35 %. Clouds are tucked against the real island edges (`landExtent` in `scene/camera.ts`: left, right, under the front cliff), below the ground, never over the land (they hid houses when over it, and pulled the eye away when far off). All movement in `useFrame` with refs.
  - **Ground:** `scene/terrainParts.ts` — kept calm like the reference: faint checker (palette pairs differ < 5 luminance), grass clumps about two voxels wide on ~12 % of grass, stepping stones on ~20 % of path tiles, no specks smaller than a voxel, 4-layer edge soil. Construction sites: low soft fence (≤ 2 voxels), orange only on the gate cones, scaffold shape = `variant % 3`.
  - **Tests:** `voxel.test.ts`, `houses.test.ts`, `lifePlan.test.ts`; `models.test.ts` (every design × facing fits its lot, designs differ, construction fits all lot sizes), `features.test.ts`, `ctrain.test.ts` (every platform faces its track), street-prop case in `layout.test.ts`. 828 frontend tests.
  - **Not tested / known gaps:** real phone (a full island ≈ 13–15k instanced boxes vs ≈ 3–4k before; 120 fps in desktop Chrome at a 390 px viewport, which says nothing about phones) — check in M16, fall back to look-preserving voxel merging if needed; snow on roofs and night windows/lamps in the game wait for M20 (the gallery already previews the night look); animals and props do not avoid the avatar; World Map unchanged.
  - **Walking animation:** `assets/voxel/rigs.ts` splits a model into a body and parts turning at their joints (`personRig`: head, armL/R, legL/R; `animalRig`: legs `fl fr bl br` or `hind front` / `legL legR`, head, tail; left = −z, animals face +x). `assets/voxel/gaits.ts` holds pure, tested pose functions (`personPose`, `animalPose`, `ANIMAL_STYLE` with walk/run/stalk/hop/waddle and strides, `advancePhase` by distance so feet do not slide). `assets/RigView.tsx` draws a rig and calls a pose callback each frame; `VoxelPerson` (props `motion`, `headTilt`) and `VoxelAnimal` (`motion` = speed + running) read a motion ref the caller writes in its own `useFrame`. Cost: a person is 6 instanced meshes instead of 2 (≤ 21 people ≈ 126 small meshes), an animal 5–7.
  - **Gotchas:** the gallery camera always zooms to the centre, so it has view preset buttons; never give files in one folder names that differ only in case.

### M20 — Weather & Time of Day ✅
**Goal:** Each community shows the real Calgary weather and the time of day (`requirement.md` v1.40 §10.4), and every island has the same full look instead of mood scenery (§7.4). Built after M19, **before M21 and M16**.
- **In scope** (planned with the user 2026-11-24)
  - [x] island scenery no longer follows the Vitality mood: one full look (deep green, flowers, lamps) for every community; mini villagers still follow the mood until M21
  - [x] `weather` module (own schema): pg_cron + pg_net read Environment Canada's Calgary conditions (`api.weather.gc.ca` citypageweather `ab-52`) every 15 minutes into an append-only readings table; `public.weather_current()` returns state, wind, temperature, snow cover and the server instant (clear when no reading in the last 3 hours)
  - [x] weather states: clear, partly cloudy, overcast, rain, snow, rain and snow, fog, thunderstorm (lightning flashes); wind calm / breezy / windy (slanted rain and snow, swaying trees and flags, faster clouds)
  - [x] snow settles on roofs, trees and ground while it snows and stays until about 6 hours above +5 °C or rain (computed on read from the readings); flowers hide under snow
  - [x] fix (2026-11-25, user confirmed): snow already lying when the island opens vanished after 10 s for 45 s while it kept snowing; only snow that starts while the island is open waits (`scene/snowCover.ts`, tested)
  - [x] weather chip (icon + temperature; tap → "Data source: Environment and Climate Change Canada")
  - [x] time of day: sun direction from the server instant and Calgary's coordinates (moving shadows, drawn height ≥ ~22°), dawn/dusk tints and night sky blended by sun height; street lamps and public windows lit at night, houses only when active today
  - [x] no time-zone math in the client (§7.5): the client only offsets its clock by the server instant
  - [x] effects within the phone budget (§20.3a): ≤ ~1,500 particles, ≤ ~400 and no lightning in low-quality mode
  - [x] dev overrides `?weather=<state>&wind=<level>&time=<preset>&snow=1&temp=<°C>` (dev builds only); the `?gallery` shares the night lights but has no weather buttons (the overrides cover it, see Handoff)
- **Definition of Done**
  - [x] each weather state and day/night phase checked on screen (desktop 1280 px and 390 px phone viewport; real phone in M16)
  - [x] user has looked at it (confirmed 2026-11-24 on an iPad; villager count and wildlife feedback moved to M21)
- **Handoff**
  - **Server:** `supabase/migrations/20261124120000_weather.sql` — schema `weather` (`readings` keyed by `observed_at`, `requests` for pending pg_net calls). `weather.fetch()` (cron `weather-fetch`, `*/15`) stores the **previous** run's answer (`weather.collect`) and sends a new request, so data lags ≤ 15 min; ECCC observes hourly, duplicates are ignored. Condition text → state in `weather.state_for` (icon code fallback); wind level in `weather.wind_level` (≥ 30 km/h or gusts ≥ 50 → windy, ≥ 10 → breezy). Snow cover is computed on read in `weather.current_at`. No caching table: the read is ≤ ~340 rows. Production needs the `pg_net` extension enabled (the migration creates it) — check after the M16 deploy that `weather.readings` fills.
  - **Client:** `frontend/src/modules/weather/` (`sun.ts` low-precision solar position in UTC; `store.ts` keeps the weather, the server clock offset and the sun, refreshes every 15 min and when the tab comes back, ticks the sun every 30 s; `WeatherChip.tsx`). `IslandView` takes an optional `environment` prop (`IslandEnvironment`, `NOON_CLEAR`); without it it uses `useLiveWeather()` and shows the chip (so the first-visit island is live too). `scene/sky.ts` (pure, tested) turns sun + weather into light direction, colours, stars, fog, lamps on; keyframes are the gallery's day/dawn/dusk/night. `assets/environmentParts.ts` (`withLights`, `withSnow`) is applied in `BoxAsset` to every box model; parts carry `tag: 'roof' | 'house-window'`. Wind sway is a `sway` layer (`scene/wind.ts` shader uniforms written once per frame by `WindDriver`). Rain/snow: `scene/Precipitation.tsx`, GPU-only Points. Lightning flickers the hemisphere light and a white DOM overlay through a channel (no React state per frame).
  - **Mood:** `scenePalette(snow)` replaces `MOOD_PALETTES[mood]` for scenery; `MOOD_PALETTES` stays for the World Map and `villagerSpeed` (ctx `villagerSpeed`, `mood`) until M21. The HUD still shows "Lively · 72" (M21 redefines Vitality).
  - **Deviations:** the gallery got no weather buttons (the game's dev overrides show every state on a real island); birds, flying geese and the balloon stay away at night or in heavy cloud (not asked, looked wrong flying in the dark); when snow starts while the island is open, the ground turns white after 45 s of falling snow (`useShownSnow`).
  - **Not tested / known gaps:** real phone and the low-quality mode on screen (particle caps are unit-tested only); the 45 s settling delay (hook, not unit-tested, not watched on screen); production cron/pg_net; summer sun on screen (unit-tested); rain streaks are vertical on screen even in wind (the drops' positions slant, the streak sprite does not); sway is subtle at full-island zoom (≈ 2 px).
  - **Tests:** `supabase/tests/database/weather_rules.test.sql` (34: mapping, wind, storing, collecting answers, snow cover/melt), `weather/sun.test.ts` (solstices, equinox, sunrise azimuth, midnight from geometry), `weather/weather.test.ts`, `scene/sky.test.ts`, `assets/environmentParts.test.ts`; layout flower test now checks mood-independence. 899 frontend tests, 525 DB tests.

### M21 — Living Community ✅
**Goal:** Communities look naturally alive whatever the number of players, every resident keeps "My house", and players see development instead of Vitality (`requirement.md` v1.42 §7.2–7.4). Built after M20, **before M16**.
- **In scope** (decided with the user 2026-11-24)
  - [x] mini villagers: random count on the device by walkable land size (0–1 on the smallest islands, up to 20), fewer at night (~40 %) and in rain/snow (~50 %); behaviour by time and weather instead of mood; never named; action replay stays real (§7.3). The server's `mini_villagers` field is no longer used
  - [x] wildlife by community location (distance from the city centre, precomputed per community) and island size: downtown/inner city rarely, near the city edge often; fewer geese and jackrabbits overall (§7.3)
  - [x] houses: every house lot on the risen land has a house; residents' houses at their fixed lots (name on tap, "My house", lit when active today); the rest are unnamed village houses (no tap, about half lit at night); archived residents' houses look like village houses (§7.2)
  - [x] development instead of Vitality for players: HUD shows "Lv N" (0–4, same as the World Map); World Map tone by level; sleepy streak text, Community Revival (effect, panel line, share card) and the "Vitality a → b" panel line removed; Vitality stays on the server for the operator (§7.4)
  - [x] today's local posts as villager speech bubbles: "💬 nickname: ~40 characters…" with the kind icon, never Safety, at most 2 at a time taking turns, tap opens the post in Community News; same server function as the newspaper (one extra call per island visit) (§7.3)
- **Definition of Done**
  - [x] requirement §7.2–7.4 (and §9, §10.4, §12.2 where Vitality appears) updated with changelog entries (v1.41)
  - [x] checked on screen (desktop 1280 px and 390 px phone): new community (stage 0, live), small and large islands (mock, Dev tools land stage), downtown (Beltline) and edge (Mahogany)
  - [x] user has looked at it (confirmed 2026-11-25)
- **Handoff**
  - **Villagers:** `island-view/scene/villagers.ts` — `villagerCount(walkable, rand, minimum)` (walkable ÷ 60 × 0.7–1.3, ≤ 20; walkable tiles per land stage ≈ 40, 114, 214, 348, 609, 860), `villagersOutside` (night × 0.4, wet × 0.5), `pickPostBubbles` (turns every 9 s, ≤ 2). `IslandView` picks a seed per visit and passes `villagerCountFor` to `buildIslandLayout` (new 4th parameter); extra villagers are hidden, not removed, when night or rain comes. One villager per real story (replay, posts) is always kept (requirement v1.42). Villager behaviour uses the old mood machinery driven by time and weather (`villagerMood`: night → resting, wet → ordinary, else lively). The server's `mini_villagers` field is still sent but unused — drop it when the snapshot function is next touched.
  - **Wildlife:** `frontend/scripts/wildness.py` → `island-view/plan/wildness.json` (0 within 4 km of the Downtown Commercial Core label, 1 from 18 km; rerun if the World Map data changes). `lifePlan(code, features, hasWater, landTiles, rand)`; `islandSize` = (walkable − 40) / 260.
  - **Houses:** `layout.ts` fills every remaining house lot on the risen land with `village: true` houses (empty nickname → no tap, no label). `houseParts(..., village)` tags about half of them per house `village-window` (lit at night by `withLights`), the rest `house-window` (never lit).
  - **Development:** `island-view/development.ts` `developmentLevel()` mirrors `gamecore.world_map()` (keep them in step). HUD "Lv N". World Map `levelColours(level)` (lively palette from Lv 2, lit windows from Lv 3). `reviveIsland` → `celebrateNewBuilding` (played when the changes panel closes after a build). Removed: `revivedToday`, `sleepyText`, `StreakBar.sleepyName`, the `revival` share card, the Vitality panel line. Vitality stays in the snapshot and the World Map RPC (operator use); `layout.mood` is still computed but only the dev panel shows it.
  - **Posts:** `posts/bubbles.ts` (`postBubbleText`, `postBubbles`: today only, never Safety, not reported by me); `news/islandPosts.ts` `useTodayPostBubbles(communityId)` reads the newspaper RPC once per community (no panel), so posts only appear once the Welcome sign is built (the paper is locked before). Tapping opens the newspaper (it does not scroll to the post).
  - **Not tested / known gaps:** real phone; post bubbles refresh only when the island is reopened (a post written meanwhile shows on the next visit); bubbles can overlap other labels on small phones; analytics still accepts the old `revival` share detail (no new events); requirement §5.1 onboarding text not reviewed for "mood".
  - **Tests:** `villagers.test.ts`, `lifePlan.test.ts` (downtown vs edge, small vs big), `development.test.ts`, `posts/bubbles.test.ts`, layout village-house cases, village night lights in `environmentParts.test.ts`; community-state and share-card tests updated. 919 frontend tests.

### M22 — Sound ✅
**Goal:** The game sounds alive and satisfying: action effects, island ambience by weather and time, World Map sounds, background music, and music/effects switches (`requirement.md` v1.44 §10.5). Built after M21, **before M16**.
- **In scope** (planned with the user 2026-11-25; files collected by the user in `frontend/public/sfx/`)
  - [x] `sound` module: Web Audio engine with music / ambience / effects buses, started on the first tap, paused while hidden, files loaded on demand, missing files skipped
  - [x] 🔊 button: music and effects on/off separately, remembered on the device, both on by default (music quiet)
  - [x] playtest fixes (operator 2026-11-25): the sound panel was hidden behind the streak bar; volume sliders for music, ambience and effects (ambience gets its own switch); louder footsteps; tapping an animal or a villager makes it hop with its sound (requirement v1.44)
  - [x] `?gallery` upgrade for checking (operator request 2026-11-25): weather, wind, snow cover and times of day through the game's sky; a sound board (every effect, ambience auto or by hand, music, volumes); tapping animals and people
  - [x] action effects: project tap, work at the site (hammer / shovel / broom by building), success, error, footsteps (grass/snow), house knock, newspaper, post bubble pop, new building fanfare + cheer, island growth sparkle + cheer
  - [x] island ambience by weather and time (birds, wind, rain, winter night, water, campfire, construction; max 3 loops) and events (CTrain, geese, plane, owl at night, thunder with lightning)
  - [x] World Map sounds (tap a community, enter, open/close) and background music by time and weather (day / night / snow) with crossfades
  - [x] credits page lists the sound and music sources (CC BY credited) and Environment Canada (missing since M20); `sfx/README.md` in English
- **Definition of Done**
  - [x] nothing loads or plays before the first tap, only the needed files load after it, switches remembered (checked in the browser by the loaded files and storage; I cannot hear audio, so every sound still needs the user's ears)
  - [x] user has listened to it (confirmed 2026-11-25)
- **Handoff**
  - **Code:** `frontend/src/modules/sound/` — `catalog.ts` (every file name, relative volumes, minimum gaps), `engine.ts` (one AudioContext created on the first pointerdown/keydown by `installSound()` in `App`; buses music 0.22 / ambience 0.8 / effects 0.9 under a master; `playSound(name, {volume, delay, offset, duration, rate})`, `setAmbience(mix)` with 1.5 s fades, `setMusic(track)` with 2.5 s crossfades; suspended while hidden; ≤ 8 effects at once), `mix.ts` (pure, tested: `ambienceMix` ≤ 3 loops, `musicFor`, `workSound`), `settings.ts` (`mct.sound` in localStorage, both on by default), `SoundToggle.tsx` (in `IslandHud`).
  - **Hooks:** daily-actions deps gained `feedback(tap|refused)` and `onHelped(site, buildingKey)` (work sound, then the confirm chime; the synthesized chime `daily-actions/sound.ts` is gone). `IslandView` has `IslandSound` (ambience + music; ambience stops when the island closes, music carries on), house knock, land rise + cheer, thunder 0.8–2 s after each lightning flash, a pop the first time each post shows. `IslandLife` `LifeSounds` (geese every 45 s when not quiet, plane per its period, owl at night every 40–90 s), `Trains` (tram when a train enters), `Avatar` footsteps per tile (snow variant), `celebrateNewBuilding` (fanfare + cheer), `NewspaperPanel` (page turn), `WorldMap` (whoosh on open/enter, select, close, ranking click), build-map open/close clicks.
  - **Files:** 35 MP3s, 12 MB in `public/sfx/` (README in English with every source). No encoder was available, so files are as delivered; only small effects preload, loops and music load when first wanted (a first island visit fetches ≈ 3 MB: day music 2.3 MB + two loops). CC BY files (music-day, music-snow, ambient-night) are credited on `credits.html`, which now also credits Environment Canada.
  - **Not tested / known gaps:** listening (no audio in the test browser) — volumes, loop seams and the hammer cut (1.1 s from 2 s) need the user's ears; iPhone (needs the first tap; silent switch mutes Web Audio); real phone data use; the World Map does not change the ambience (the island underneath keeps its loops); `plane-flyby` is a low-quality preview.
  - **Playtest fixes (v1.44):** the panel is a portal on `document.body` (fixed, z 90+, closes on an outside tap) so the streak bar no longer covers it; settings are `{on, volume}` per channel (music / ambience / effects; old `{music, effects}` is migrated, ambience follows effects); slider level is squared. Footsteps 0.75 / 0.8. Tapping: `Crowd.whoAt`, `pokeWalker` / `pokeHop` (0.45 s hop read in useFrame), `walkerSound(id)`; the tap checks the tapped tile and its 4 neighbours before houses and moving. Animal and villager files (`deer-call`, `cougar-growl`, `rabbit-hop`, `villager-hello-female`, `villager-hello-male`) were delivered on 2026-11-25; each villager keeps one voice (hash of its index), and every one of these still falls back to `bubble-pop` if its file goes missing (catalog `fallback`).
  - **Gallery (`?gallery`):** time presets are sun positions lit by `skyLook` (the M19 hand-made looks are gone, so gallery and game match); weather (8), wind (3) and snow-on-ground buttons with rain/snow particles, fog, sway and snowy roofs; `dev/SoundBoard.tsx` plays every effect (lists unknown ones under "Other"), ambience automatic or by hand, music auto/day/night/snow/off, plus the volume panel; animals and people in `GalleryLife` hop and sound when tapped (`Tappable`, same crowd ids as the game). No lightning in the gallery (thunder is on the board).
  - **Tests:** `sound/sound.test.ts` (mix, music, work sound, settings incl. migration, required files exist, optional ones have a fallback), walker taps in `crowd.test.ts`. 934 frontend tests.

### M23 — Art Pass 2 (voxel variety) ✅
**Goal:** Every community looks varied and alive in our pastel voxel style (`requirement.md` v1.46 §19.1–19.2): more voxel designs drawn after Polyfork shapes and sized like today's models, varied people. Built after M22, **before M16**. The low-poly Polyfork route (v1.45) was built and reviewed, then dropped by the operator (2026-11-25).
- **In scope**
  - [x] new voxel designs after Polyfork shapes: 13 suburb houses, 9 downtown buildings, 3 arches, 3 fire-pit rings, 2 huts, 4 halls, 2 schools, theatre, picnic shelter, shed, garden bed, 9 trees, 5 cars, school bus, benches, lamps, mailbox, snowman, drinking fountain, play equipment (`assets/voxel/designs*.ts`)
  - [x] every new design fitted to the size of the matching model drawn now (`assets/voxel/designFit.ts`, tested)
  - [x] islands mix them in: house types, trees, parked cars, benches, mailboxes, lamps (per row), snowmen, building and feature variants
  - [x] varied voxel people: ages (children smaller), skin tones, hair styles incl. headscarves, skirts, coats, hats, glasses, beards
  - [x] gallery: "New voxel designs" beside the current models, labels switch, pan and zoom pad
  - [x] Polyfork runtime, files and credits removed
- **Definition of Done**
  - [x] checked on screen (desktop and phone) for a new, a small and a grown community, suburb and downtown (2026-11-25: Mahogany new on a phone at dusk, grown by day; Beltline grown at night and by day with snow; other weathers checked in the gallery, not on an island one by one)
  - [x] user has looked at it (2026-11-25: models approved; the user found the finished community's layout and building tree weak, which is a game-design redesign to plan separately, not part of this art module)
- **Handoff**
  - **Code:** `assets/voxel/designs.ts` (houses, downtown), `designsStreet.ts` (props, trees, cars, play), `designsCivic.ts` (arches, huts, halls, schools, theatre, shelter, shed); `designFit.ts` fits each to a target box measured from today's models (`VOXEL_DESIGNS`); `houses.ts` `HOUSE_DESIGNS` mixes them per house type (mirrored half the time, flat roofs tagged as roof for snow, `houseModelHeight` for labels); `models.ts` tree/lamp/prop/snowPile pools; new variants in `voxel/buildings.ts` and `voxel/features.ts` (`BUILDING_VARIANTS`, `FEATURE_VARIANTS` raised).
  - **Not used yet:** movie theatre and school bus designs (no slot on the islands); the city tram was dropped (the CTrain covers it).
  - **Dev tools kept from the Polyfork attempt:** `?meter` render readout (fps, triangles, draw calls), gallery camera pad and labels switch.


### M24 — Community Identity ✅
**Goal:** Each island grows into a beautiful place with its own signature places and landmarks (`requirement.md` v1.47 §7.2, §7.4, §7.6–§7.9): a build map of three tracks built in order, houses as scenery with only "My house" personal, places laid out by meaning. Built after M23, **before M16**. Design and gallery work so far: `docs/community-identity-handoff.md`, branch `spike/model-library` (place library, 31 unique landmarks), `supabase/data/community_personas.csv`.
- **In scope**
  - [x] persona and landmark list per community as data (from `community_personas.csv`; landmark order 1–3, signature = 1) — `gamecore.community_personas`, landmark steps in `supabase/data/build_map.json`
  - [x] build map as data and server rules: the Welcome sign as root, three tracks, no place twice, persona designs for the Community hall and Neighbourhood park (pavilion/lodge/barn halls, waterside/plaza/terrace/meadow parks, the rest pick a shared design; `PERSONA_DESIGNS` in `assets/voxel/buildings.ts`), conditions (previous step + residents/streak + land that fits the footprint), step multipliers, decoration steps; replaces the building tree and upgrades in place (`gamecore`/`communitystate` functions and DB tests rewritten)
  - [x] island plan generator v2: residential zones, place lots by site (shore, riverbank, hilltop, street, park, plaza) and footprint, a zone per land stage, lots reserved to match step conditions, places facing their site (a beach club faces the real lake); a small pond (or the nearest water) when a water place finds no shore; a report of the islands where that happens; **all 223 plans regenerated** — plan v4, `frontend/scripts/island_plans.py`; lots' land stages seeded by `supabase/data/place_lots_seed.py`; small lakes added for 12 lake/river islands (BOW BRT BYV ERL EYA MAF RID ROX SPR TUS WLD WND); 3 water places only near the water (BYV beach house, ERL teahouse, SDC lighthouse); persona first place on the first land on 203 islands (river ones wait for the riverbank)
  - [x] house rule: scenery houses in zones (growing up), "My house" fixed lot seen only by its owner, shared lots when full, no names/tap/"+N", every house lit at night — `20261126140000_gamecore_houses_scenery.sql` (slots from `gamecore.house_capacity`, shared lots, no house list in the public state); houses grow up into townhouses/apartments from land stage 2 (`houseTypeGrown`)
  - [x] place library and unique landmarks moved from the spike into the island renderer by asset key (drawn water removed from the models so they sit on the real water — **changed:** the five lake landmarks keep their water inside the lot (lowered to the real water level it would hide in the land tile) but it is tagged `water` and takes the island's water colour, icy with snow (`withWater`); rivers/bridges get a crossing-site rule — done with requirement v1.50: site `crossing` (Crescent Heights, Eau Claire and Point McKay landmark bridges, the river footbridge), a straight lot with both ends on free dry land over at least one water tile (`place_crossing` in `island_plans.py`); 11 of 25 bridges cross water (EAU, POI and 9 footbridges), the rest have no water narrow enough and stand on the riverbank (listed in the generator report)), **finished on all sides** (houses too; done by `assets/allSides.ts` `finishAllSides`: front and side windows and doors mirrored onto bare back walls, applied to every model, tested over all houses, buildings, places, landmarks and features), placeholders for unknown keys
  - [x] free camera: 360° turning, closer zoom, panning while zoomed in (kept within the island), compass reset, avatar follow that pauses while panning — `scene/IslandView.tsx` CameraRig, `scene/cameraFocus.ts` (manual view, bounds, reset); real two-finger touch not tested on a device yet
  - [x] build map screen as a skill tree: root, three lanes, resident-count bands, node states, gold landmark nodes, node detail with "Help build it today", finished island picture, completion %; pre-rendered node pictures; read-only for visitors — `community-state/BuildMap.tsx` + `skillTree.ts`; pictures printed at `?pictures` (dev server) into `public/places/<key>.png` and `public/islands/finished/<CODE>.webp`; "See it on the island" glides the camera (`requestLookAt`); "Help build it today" makes that construction glow in the action bar; `?mock` has a 🌳 button for the map (`?mock&streak=N`)
  - [x] development level from the build map; World Map landmark icon at level 4 — level computed on the server (`gamecore.development_level`); `gamecore.world_map()` names the persona step-4 landmark at level 4 (`20261127120000_gamecore_world_map_landmark.sql`) and the map draws its pre-rendered picture (`/places/<key>.png`, a gold stand-in while it loads)
  - [x] "What changed since yesterday", share cards and invites name the new places and landmarks — places already came by name; landmarks now say "Our landmark, the X, was built!" (first, ⭐), "is ready to build" replaces "unlocked", a gold `landmark` share card ("Our landmark is built!"), and an invite nudge up to 5 neighbours away ("…and we can build our landmark, the X!"); `isLandmarkKey` in `community-state`
- **Out of scope:** terrain (M25), more unique landmarks beyond the 31 (data-only additions later), interiors (22.3)
- **Definition of Done**
  - [x] DB tests for every condition (track order, residents, streak, land fit, at most 3 constructions, day boundary), plan generator tests (zones, sites, no overlap, every lot reachable) — `gamecore_rules`/`gamecore_state` (landmark 11 residents + 14-day streak added), `islandPlans.test.ts` (per island: no overlap, lots on risen land, every lot and house reachable on every stage, water places on the shore, houses in zones)
  - [x] simulated islands at 1, 3, 10, 26, 60 residents look right for the three prototypes (Inglewood, Lake Bonavista, McKenzie Towne) and a downtown one, by day, at night and with snow, on desktop and a phone — checked with `?mock&plan=CODE&residents=N` (20 day shots, night at 60, snow at 26, phone at 10; no console errors); McKenzie Towne is MCT (the plan said McKenzie Towne; MCK is McKenzie Lake)
  - [x] user has played it (2026-11-27)
- **Handoff (in progress, 2026-11-26; for the next session)**
  - **Done on `module/m24-community-identity`** (steps 1–5, all pushed, CI green up to step 4): build map data + server rules (`supabase/data/build_map.json`, `build_map_seed.py`, `20261126120000_gamecore_build_map.sql`), plan v4 for all 223 islands + place lots and house capacity seed (`frontend/scripts/island_plans.py`, `supabase/data/place_lots_seed.py`, `20261126150000_gamecore_place_lots_seed.sql`), scenery houses (`20261126140000_gamecore_houses_scenery.sql`), free camera, all-sides models (`assets/allSides.ts`). Server computes the development level (`community.level`); the World Map reads it.
  - **Partly done:** build map item still needs the persona designs for the Community hall and Neighbourhood park (frontend models; server side done). Place library item still needs drawn water removed from the lake/river models (they draw their own water; on islands they sit next to real water) and a crossing-site rule for bridges (CRE, EAU, POI). ⭐2/⭐3 landmark slots draw the purple placeholder until models exist.
  - **Step 6 done (skill-tree build map screen):** `community-state/BuildMap.tsx` reads `server.buildings` through the pure `skillTree.ts`; bands from each step's resident condition; persona step 4+ and every `landmark_order` are gold. Pictures are static: `?pictures` on the dev server, "Print places" (95 + 20 persona hall/park PNGs) and "Print finished islands" (223 WebPs; `&codes=A,B` for a few); rerun after model or plan changes and never edit source files while printing (HMR stops the run).
  - **Steps 7–9 done (2026-11-27):** World Map landmark icon at level 4 (server names the landmark); changes/share card/invite texts name "our landmark" (gold `landmark` share card); persona designs for the Community hall and Neighbourhood park; landmark water takes the island water colour; snow on the models' own lawns; `?mock&residents=N` simulation; DoD screen checks.
  - **Bridge rule done (v1.50, 2026-11-27):** all 223 plans regenerated, seeds rewritten, finished-island pictures reprinted. Known small gaps: decoration gardens stay green in snow; the "Decoration → Decoration" and "Landmark 2 → Landmark 3" next-step labels use the placeholder names; ⭐2/⭐3 landmarks still draw the purple placeholder; `pathway-lights` prints a placeholder picture.
  - **Done:** the operator played M24 and confirmed on 2026-11-27; next is M26.
  - **Gotchas:** after any build map or plan change rerun, in order, `python3 -I frontend/scripts/island_plans.py --force` (pre-launch only), `python3 -I supabase/data/build_map_seed.py supabase/migrations/20261126120100_gamecore_build_map_seed.sql`, `python3 -I supabase/data/place_lots_seed.py supabase/migrations/20261126150000_gamecore_place_lots_seed.sql`, then `supabase db reset`. DB tests clear `gamecore.place_lots` / `house_capacity` and set their own. Docker CLI is at `~/.docker/bin` (add it to PATH for `supabase`). The gallery build-map preview (`dev/buildMapLayout.ts`) shows the old three-start layout; delete it when the real screen exists. `?mock&plan=MAH&time=night` + Dev tools (land stage, "All built") is the quickest screen check.
  - **Not tested yet:** real phone touch gestures, snow, the "My house" marker as a signed-in verified resident on the live server.

### M25 — Terrain ⬜ (decide after M24)
**Goal:** Hills, escarpments and ravines as levels of the island floor (handoff §4.1; gallery concept on `spike/terrain-concept`). Whether it comes before M16 is decided after playing M24.
- **In scope (draft):** up to 4 levels from elevation data with an operator override, cliffs facing the camera, stairs/ramps so every level is reachable (avatar and villager pathfinding with height), building lots flat on one level, CTrain on one level
- **Definition of Done:** to be written when the module is planned

### M26 — Community News Steps ✅
**Goal:** Writing in Community News becomes a daily reason to visit, opened step by step (`requirement.md` v1.49 §11, §14, §14.1): one newspaper with the community board from the Welcome sign, posting in personal steps (the last after 14 active days), and today's question for the whole city. Builds on M15 (posts) and M8/M9 (newspaper); built after M24, **before M16**.
- **In scope**
  - [x] one newspaper: the community board (events, roadmap) is part of it from the Welcome sign; the Warming hut lock and its text removed; the Community hall takes the newspaper over once built; leftover `gateway-arch` keys removed from the news code — `20261127130200_news_one_newspaper.sql` (board with the Welcome sign), `newsText.ts` `opensNews` (Welcome sign, later the Community hall)
  - [x] personal posting steps on the server: a player's step (0 read/Thanks, 1 today's question, 2 Free talk/Lost & found/Safety, 3 Events/Local deals) and total active days computed on read from the action log (no counter; follows the person across moves); post kinds checked on the server; the write box shows the next step and days to go — `gamecore.active_days` (`20261127130000`), `posts.can_post_at` returns `kinds`, `active_days`, `next`; `create_at` refuses `kind_locked` (`20261127130100_posts_steps.sql`); `LocalNews` shows only open kinds and "🎉 Events and 🏷️ Local deals open after 14 active days (N to go)"
  - [x] today's question data: `supabase/data/daily_questions.csv` (from the reviewed operator draft) seeded by a script into the module's schema; a data test for the writing rules (2–4 choices, distinct emoji, ≤ 32 characters, known seasons/situations/categories) — `supabase/data/daily_questions_seed.py` → `20261127140100_questions_seed.sql` (202 questions; the script refuses rule breaks), data checks in `questions_rules.test.sql`
  - [x] today's question rules: one question per Calgary day for the whole city, deterministic (season by month, weekday/weekend, not shown in the last 60 days, not yesterday's category), an answer RPC (residents of the community they play in, verified or verifying; one per player per Calgary day; idempotent; final), community counts on read (no who-chose-what anywhere) — new `questions` module (`20261127140000_questions.sql`): picked on the first read of the day and stored in `questions.days` (same day → same question), short pools relax the 60 days first; `public.questions_today` / `questions_answer`
  - [x] today's question card on the first open of the day (after the changes panel), counts after answering, visitors read-only; the question and yesterday's result in Community News — new frontend module `daily-question` (`QuestionPopUp` after the changes panel and the welcome card, only while I can still answer; `NewsQuestion` in the newspaper with yesterday's line); the newspaper's `question` comes from `20261127140200_news_question.sql`
  - [x] 🔁 answered card closes by itself (requirement v1.51 §14.1): counts in place, closes after a few seconds or on a tap; fewer than 3 answers show a thank-you line instead of bars — `questionText.ts` `showBars` (3+), `autoCloseMs` (3 s after the counts are back), `QuestionPopUp` timer and tap-to-close; checked on a phone-sized screen (1 answer: thank-you line; 3 answers: bars; closed by itself after 3 s; a tap closed it)
- **Out of scope:** situations other than weekday/weekend (game days, Stampede week), city-wide comparisons, an operator screen for questions, free-text replies
- **Definition of Done**
  - [x] DB tests: Calgary day boundary for the question and the one-answer rule, season edges (Mar 31/Apr 1, May 31/Jun 1, Aug 31/Sep 1, Oct 31/Nov 1), weekday/weekend, no repeat within 60 days and never yesterday's category (including a short pool), same question for every community, step 3 at exactly 14 active days (13 is not enough), active days kept after a move, question-only days not counted, visitors and other communities' residents cannot answer, counts never expose who answered — `questions_rules.test.sql` (48), `posts_rules.test.sql` steps, `news_rules.test.sql` board and question result; "kept after a move" is covered by counting actions in every community (a player's actions in Auburn Bay count after joining Mahogany), not by a full residency move
  - [x] screen check on desktop and a phone (card, answered state, newspaper result, write box with the next step) — local server as dev users: desktop (card after the changes panel, answered with counts, newspaper with yesterday's result and the write box) and phone 390×844 (bottom card, answered); visitors' read-only card only in tests
  - [x] user has played it (2026-11-27, and again after the v1.51 fix)
- **Handoff (2026-11-27)**
  - **Decisions:** the day's question is picked on the first read and stored (`questions.days`), because the 60-day rule needs the earlier picks; the same day always gives the same question. The pop-up shows only to players who can still answer in their own community; visitors and players without a community read it in Community News. Closing the card without answering is remembered on the device for that Calgary day (`mct.question.closedDay`, the day comes from the server); an answered card is not remembered, so another player on the same device still gets theirs. Active days count today's action too.
  - **Not tested:** a full residency move with active days (covered by the any-community count), visitors' read-only card on screen, real phone touch, emoji from Unicode 12 or older (not checked automatically).
  - **Gotchas:** after editing `supabase/data/daily_questions.csv` rerun `python3 -I supabase/data/daily_questions_seed.py supabase/migrations/20261127140100_questions_seed.sql` (pre-launch; after launch write a new seed migration); questions already shown are never deleted.
  - **Done:** the operator played M26 and confirmed on 2026-11-27. **Reopened** the same day for v1.51 (answered card closes by itself; thank-you line below 3 answers) on `fix/m26-question-card`; the operator checked the fix the same day; next is M16.

### M27 — Avatar Look 🟨
**Goal:** Players make their own villager (`requirement.md` v1.52 §10.2): age, skin tone, hair, clothes and shirt colour chosen directly, a random start with a 🎲 shuffle, stored with the profile. Built after M26, **before M16**.
- **In scope**
  - [x] server: the look stored with the profile (`identity`), checked on save (known values only; no beard for children), kept when the nickname changes; profiles without a look keep the nickname-based one — `20261127150000_identity_avatar_look.sql` (`identity.profiles.look` jsonb, `look_problem`, `identity_save_profile(p_nickname, p_shirt, p_look)`; null keeps the stored look)
  - [x] renderer: the voxel person drawn from a chosen look (`island-view`), the avatar uses it; mini villagers stay random — `samples.ts` `personLookFrom` / `avatarLookFromSeed`, `VoxelPerson` `look` prop, `Avatar` `look`; shared type `common/avatarLook.ts`
  - [x] first-visit and profile form: live preview, a part picker for each choice, random start, 🎲 shuffle — `identity/ProfileForm.tsx` (age, skin, shirt, hair, hair colour, trousers/skirt, beard, glasses; Child turns the beard off), `avatar/AvatarPreview.tsx` (a small turning figure); both cards scroll on short phones
  - [x] profile button shows my villager's face (operator request 2026-11-27, same v1.52 look) — `avatar/AvatarFace.tsx` (flat 16×16 SVG: skin, hair or headscarf, glasses, beard, shirt; no extra 3D canvas); with a headscarf the colour choice is the scarf's (`SCARF_COLOURS`)
- **Out of scope:** earned cosmetics (hats, accessories, emotes; 13.3 Phase 2), other residents' avatars (10.3)
- **Definition of Done**
  - [x] DB tests: every value range, child + beard refused, look kept on nickname change, old profiles without a look; frontend tests: look checks, shuffle stays in range, the old nickname look maps to the same parts — `identity_profiles.test.sql` (45), `common/avatarLook.test.ts`, `island-view/assets/avatarLook.test.ts` (old nickname looks map to the same parts), identity store test
  - [x] screen check on desktop and a phone (form, preview, shuffle, the avatar on the island for each age) — phone 390×844 on the local server: first-visit form and preview (adult, child, elder, headscarf, beard, skirt), saved look on the server, profile sheet reloads and saves a change (Child), the avatar on the island; desktop not checked separately (same card)
  - [ ] user has played it
- **Handoff (2026-11-27)**
  - **Decisions:** parts, not "race"/"gender" labels; three ages; the form starts from a random look and 🎲 shuffles look and shirt. Profiles saved before v1.52 have no look and keep the nickname-based one until they save the profile (the form opens with that look, `avatarLookFromSeed`). No coat or hat for chosen looks (earned later). Choosing Elder does not change the hair colour by itself.
  - **Also done:** privacy policy updated (villager look, today's question answers, house no longer listed as public; dated Nov 27).
  - **Not tested:** real phone touch, very short phones below 700 px (the cards scroll), the avatar's close-up look on the island (only a small crop seen).
  - **Next:** the operator plays M27; then M16.

### M16 — Deploy & Playtest ⬜
**Goal:** The game runs on makecalgarytalk.com and family/friends have played it.
- **In scope** (`docs/launch.md` has every step; most need the operator's accounts)
  - [ ] production deploy: Supabase project (Canada Central, Free plan) linked and migrated; Cloudflare Pages with env vars; Turnstile; custom domain; email routing; operator added
  - [ ] Google OAuth client (production domain + local redirect); verify Google linking keeps progress and re-join with the same Google account restores the record (moved from M6; code in `frontend/src/modules/identity/`, see M6 Handoff)
  - [ ] production database tzdata is 2026c or newer (`common_calgary_day` tests pass against it; Alberta permanent UTC-6) — SQL check in `docs/launch.md` §2
  - [ ] low-end phone performance pass on a real device (adaptive quality from M14; carried from M1)
  - [ ] deploy with **all communities open**; family/friends playtest; then the public launch reveals the whole city at once (`requirement.md` v1.37 §22.7)
  - [ ] read the dashboard after the playtest (first action %, D1, D7, communities with a single player)
  - [ ] before the public launch: Supabase Pro, Sentry error monitoring (deferred 2026-11-23)
- **Out of scope:** new features (playtest feedback goes to modules as 🔁 or to Phase 2)
- **Definition of Done**
  - [ ] checklist complete
  - [ ] playtest feedback triaged into modules or Phase 2

### M17 — Return Reminders ⬜
**Goal:** Players are reminded when their community needs them (`requirement.md` v1.37 §22.7a.1).
- **In scope**
  - [ ] **email** reminders for players who gave an email (opt-in, §18)
  - [ ] **web push** for players who allow notifications (home-screen web app, iPhone included)
  - [ ] messages from real community state: streak at risk ("2 more helpers today"), built overnight, land grew, weekly result
  - [ ] at most one message a day per player across both channels, never at night (Calgary time), each channel easy to turn off
- **Definition of Done**
  - [ ] messages are correct for streak/built/land/weekly cases (tests), limits respected
  - [ ] D1/D7 compared before and after on the dashboard
  - [ ] user has looked at it

### M18 — Community Association Partnership ⬜
**Goal:** Associations of growing communities help bring neighbours in; their notices appear in the community newspaper (`requirement.md` v1.37 §22.7a.2).
- **In scope**
  - [ ] operator sets the player threshold (e.g. Active Verified Residents) and sees on the dashboard which communities reached it
  - [ ] operator contacts those associations directly: newsletter / social media mention; permission to show notices
  - [ ] operator-maintained feed list (community, association, feed URL, permission)
  - [ ] daily read of the feeds (robots.txt respected), notices stored as title, date, link; simple word filter
  - [ ] "📢 From <association>" lines in the community newspaper, linking to the original
- **Out of scope:** copying notice text, Facebook/Instagram-only associations, associations that did not agree
- **Definition of Done**
  - [ ] only permitted feeds are read; broken feeds do not break the newspaper (tests)
  - [ ] user has looked at it

---

## After launch — checklist for the user to review
**Before opening:** M19 Art Pass → M20 Weather & Time of Day → M21 Living Community → M22 Sound → M23 Art Pass 2 → M16 Deploy & Playtest (all communities open, then the public launch). Everything below comes **after** the launch; nothing here is planned in detail yet. Tick or strike items as you decide; when one is picked, it becomes a module above.

**Growth (already modules)**
- [ ] M17 Return Reminders — email (opted-in players) + web push (`requirement.md` §22.7a.1)
- [ ] M18 Community Association Partnership — contact associations once a community reaches a player threshold; notices in the newspaper (§22.7a.2)

**Phase 2** (§22.2)
- [ ] Art Pass items not taken into M19: styled World Map (animated Bow/Elbow rivers, moving CTrain trains on the map, Calgary landmark buildings, transitions), avatar customization, walk-up-and-tap actions
- [ ] Activity-based signature feature upgrades (e.g. Mahogany's lake → boat dock → lakeside trail, §7.9)
- [ ] Resident board + report moderation screen (list, hide/restore, suspend users, §21)
- [ ] Profile & ranks, avatar growth (rank = level, cosmetic rewards, badge collection, Me tab, §13)
- [ ] Speech bubbles (preset phrases → free text, §15)
- [ ] Requests: mini villager requests, player requests (§16)
- [ ] 5 Vitality mood levels (MVP has 3)

**Phase 3** (§22.3)
- [ ] Seasonal events (Rodeo Season, winter aurora) and collections
- [ ] Visitor mode (interactions when visiting other communities)
- [ ] Community landmark (after the Community hall: 60-day streak + resident photo petition, §7.6 / §16.2)
- [ ] Community petitions (§16.2)
- [ ] Real-time presence (other residents' avatars live on the island, §22.3)
- [ ] Advanced share / celebration events
- [ ] Community marketplace (buy, sell, give away; needs messaging and safety rules first)
- [ ] Enter buildings, decorate my own house (idea)

**Phase 4 — monetization** (§22.4)
- [ ] Local business shops on **Main Street lots** (after the Community hall; operator-approved messages, labelled "Sponsored"; the lots are already reserved in the stored plans)
- [ ] Community coupons, new business news

**Expansion** (§22.5)
- [ ] Other cities (Edmonton → Vancouver, Toronto, …)
- [ ] "Battle of Alberta" Calgary vs Edmonton season
- [ ] Apartments/condos (multi-resident buildings) for very large communities

**Open numbers and wording** (§22.8; starting values, tune with data)
- [ ] Pastel palette and lighting values — palette set in M19 (`ART` in `voxel/samples.ts`); lighting keyframes set in M20 (`scene/sky.ts`)
- [ ] Island shape parameters and lot plan tuning
- [ ] Building tree numbers (conditions, stage multipliers)
- [ ] Vitality smoothing (rise/fall speed)
- [ ] Random surprise types and probabilities
- [ ] Newspaper sentence templates
- [ ] Concrete invite reward items

---

## Change Log

The full change history is in **[`changelog/plan.md`](changelog/plan.md)**, newest first.
