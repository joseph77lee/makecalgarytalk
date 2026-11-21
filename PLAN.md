# Development Plan — MakeCalgaryTalk

| Item | Value |
|---|---|
| Plan version | v1.49 |
| First written | 2026-11-16 |
| Last updated | 2026-11-20 |
| Based on | `requirement.md` v1.28 |
| Current module | M15 Community Posts (🟨 Ready for playtest) |

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
| M3 | Game Core | BE | ⭐ Core | M0 | ✅ |
| M4 | Daily Actions | FE + BE | ⭐ Core | M2, M3 | ✅ |
| M5 | Community State | BE + FE | ⭐ Core | M4, M1 🔁, M3 🔁 | ✅ |
| M6 | Identity | FE + BE | | M4 | ✅ |
| M7 | Residency | FE + BE | | M6 | ✅ |
| M8 | Residents & Villagers | FE + BE | | M5, M7 | ✅ |
| M9 | Community News | BE + FE | | M8 | ✅ |
| M15 | Community Posts | FE + BE | | M9 | 🟨 |
| M10 | World Map | FE (2D) + BE | | M5 | ⬜ |
| M11 | Ranking & Share | BE + FE | | M5, M10 | ⬜ |
| M12 | Invites | FE + BE | | M6, M7 | ✅ |
| M13 | Feature Library | FE + data | | M1 | ⬜ |
| M14 | Launch Readiness | All | | All above | ⬜ |

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
**Reopened 2026-11-19** (`requirement.md` v1.18 §7.6–7.8, §20.4; branch `fix/m1-real-shape-islands`, after M4 is merged). The original items below stay ticked; the rework:
- **In scope (rework)**
  - [x] Island from the **real community boundary**: rasterize to ~1,024 tiles (equal max land), smooth thin spurs, keep the largest part, centre = farthest from the edge, reveal order by walking distance; land tiers 64 / 144 / 256 / 400 / 676 / all
  - [x] **Whole outline visible from day one** (clouds / translucent future land); new land rises inside it
  - [x] **Lot plan per community generated once and stored** (static JSON, served like other static data): tree building lots reserved at final size, house lots, spare lots, Main Street lots, paths; never regenerated for existing communities
  - [x] Box models for the tree buildings (welcome sign → gateway arch, fire pit → warming hut → community hall, frozen pond → skating rink → lit hockey rink, playground, sledding hill, dog park, pathway lights, community garden, neighbourhood park) and a **generic placeholder** for unknown building keys; remove the M4 showcase miniatures
  - [x] Default camera angle per community (long side vertical on a portrait phone); growth animation for irregular land
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
  - [x] optional Google linking — code done; real verification moved to M14
  - [x] avatar shirt colour choice on first visit, changeable later (`requirement.md` §10.2)
  - [x] nickname on first visit with a suggested default, validated on the server, changeable later (`requirement.md` §6.1)
  - [x] completed-neighbourhood example on the first visit only (one image or short animated scene rendered with the real engine, `requirement.md` §5.1)
  - [x] Cloudflare Turnstile (local: Cloudflare test keys; real keys at deploy, M14)
  - [x] sign-up rate limits (Supabase Auth per-IP anonymous limit; Cloudflare rate limiting at deploy, M14)
  - [x] re-join with same Google account restores record — code done (`signInWithOAuth`); real verification moved to M14
  - [x] "What changed since yesterday" seen once per **account** per Calgary day (server-side record instead of the M5 per-browser localStorage flag)
- **Definition of Done**
  - [x] new visitor plays instantly without a form
  - [x] linking Google keeps progress — moved to M14 (needs the production Google OAuth client)
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


### M15 — Community Posts 🟨
**Goal:** Neighbours write the community's local news.
- **In scope** (`requirement.md` v1.28 §14)
  - [x] Verified Residents post in their own community once the Welcome sign is built: kind (Safety, Local deals, Events, Lost & found, Free talk) + up to 300 characters, 1 per Calgary day, no links/photos; Safety posts carry a reminder (no names, call 911)
  - [x] shown in Community News → Local news with nickname and "today / yesterday / 2 days ago"; visible 3 Calgary days; author can delete
  - [x] blocked words, phone numbers and street addresses refused
  - [x] reports (Verified 2 points, others 1; 3 points hide; at most 3 reports per player per day; confirm before sending; a report can be taken back), operator hide / restore / report-block (SQL)
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


### M10 — World Map ⬜
**Goal:** See all of Calgary and spread to empty communities.
- **In scope**
  - [ ] 2D map from real community boundary polygons (Canvas)
  - [ ] **small development illustrations inside each polygon** by level (houses + welcome sign → playground / skating rink → community hall → neighbourhood park), settled = Welcome sign built, Vitality mood (ground/roof tone, lights), grey dashed + cloud for unsettled
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


### M13 — Feature Library ⬜
**Goal:** Each island feels like its community.
- **In scope**
  - [ ] a few feature blocks (lake, creek, hill, park) as box models — most important for communities whose real shape is close to a rectangle (e.g. Mahogany's lake)
  - [ ] community → feature mapping (OSM / City hydrology suggestion + CSV override) for launch communities
  - [ ] feature/landmark lots come from the stored lot plan (M1 🔁)
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
  - [ ] Google OAuth client (production domain + local redirect); verify Google linking keeps progress and re-join with the same Google account restores the record (moved from M6; code in `frontend/src/modules/identity/`, see M6 Handoff)
  - [ ] production database tzdata is 2026c or newer (`common_calgary_day` tests pass against it; Alberta permanent UTC-6)
  - [ ] low-end phone performance pass
  - [ ] **family/friends playtest**
- **Definition of Done**
  - [ ] checklist complete
  - [ ] playtest feedback triaged into modules or Phase 2

---

## After MVP (not planned in detail yet)
Phase 2 modules (from `requirement.md` §22.2): Art Pass, Resident Board + moderation, Profile & Ranks, Speech Bubbles, Requests, 5 Vitality moods, feature upgrades. Plan them after MVP playtest data.

Phase 4: local business shops on **Main Street lots** (open after the Community hall; operator-approved messages; `requirement.md` §22.4). The lots are already reserved in the stored lot plans (M1 🔁).

---

## Change Log

> Add new entries at the **top**. Format:
> ```
> ### YYYY-MM-DD — vX.Y
> **Changed:** what changed
> **Why:** why it changed
> **Previous:** the old text, verbatim
> ```

### 2026-11-20 — v1.49
**Changed:** M15: post kinds centred on real community life (Safety, Local deals, Events, Lost & found, Free talk); reports limited to 3 a day, confirmed before sending and can be taken back; operator restore.

**Why:** User feedback 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.48 |`
- M15: `  - [x] Verified Residents post in their own community once the Welcome sign is built: kind + up to 300 characters, 1 per Calgary day, no links/photos`
- M15: `  - [x] reports (Verified 2 points, others 1; 3 points hide), operator report-block and hide (SQL)`

### 2026-11-20 — v1.48
**Changed:** M15 items ticked; status 🟨 with Handoff.

**Why:** M15 implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.47 |`
- Header: `| Current module | M15 Community Posts (in progress; M9 ✅ Done) |`
- Overview: `| M15 | Community Posts | FE + BE | | M9 | 🟦 |`
- M15: `### M15 — Community Posts 🟦`
- M15: all checklist items were `- [ ]`; no Handoff

### 2026-11-20 — v1.47
**Changed:** "Based on" → `requirement.md` v1.28. M15 🟦 in progress with its detailed scope.

**Why:** M15 started; user decisions 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.46 |`
- Header: `| Based on | `requirement.md` v1.27 |`
- Header: `| Current module | M15 Community Posts (next; M9 ✅ Done) |`
- Overview: `| M15 | Community Posts | FE + BE | | M9 | ⬜ |`
- M15 section:
    ### M15 — Community Posts ⬜
    **Goal:** Neighbours write the community's local news.
    - **In scope** (details planned when the module starts; `requirement.md` §14)
      - [ ] Verified Residents post short local news (events, deals, lost & found) shown in Community News
      - [ ] spam guards: posting limits, filters (blocked words, phone/address patterns), reports with auto-hide, expiry, operator removal
      - [ ] participation: posts credited by nickname, thanks, a badge
    - **Definition of Done**
      - [ ] only Verified Residents can post; abuse is limited and tested

### 2026-11-20 — v1.46
**Changed:** M9 ✅ Done (user confirmed). Header → M15 next.

**Why:** User confirmed M9 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.45 |`
- Header: `| Current module | M9 Community News (🟨 Ready for playtest) |`
- Overview: `| M9 | Community News | BE + FE | | M8 | 🟨 |`
- M9: `### M9 — Community News 🟨`

### 2026-11-20 — v1.45
**Changed:** M9 newspaper covers real community life (new neighbours, farewells, a Local news slot); game events stay in "Since yesterday". New module **M15 Community Posts** (resident-written local news, Verified Residents only) right after M9.

**Why:** User decision 2026-11-20: Community News should report real community life; writing every community's news by hand does not scale, so residents write it.

**Previous:**
- Header: `| Plan version | v1.44 |`
- M9: `  - [x] auto-generated daily newspaper from game events (templates)`
- M9: `  - [x] newspaper reflects yesterday's real events with nicknames`
- Overview: (no M15 row)
- Order note: `**Order after M7 (user decision 2026-11-20):** M1 🔁 Sleepy mood fix → **M12 Invites** (before M8: bringing neighbours in is the core of the game) → M8 → M9 → M10 → M11 → M13 → M14.`

### 2026-11-20 — v1.44
**Changed:** M9 renamed "Village News" → "Community News"; UI wording uses "community" instead of "village".

**Why:** User feedback 2026-11-20: Calgary calls each neighbourhood a community.

**Previous:**
- Header: `| Plan version | v1.43 |`
- Header: `| Current module | M9 Village News (🟨 Ready for playtest) |`
- Overview: `| M9 | Village News | BE + FE | | M8 | 🟨 |`
- M9: `### M9 — Village News 🟨`

### 2026-11-20 — v1.43
**Changed:** M9 items ticked; status 🟨 with Handoff.

**Why:** M9 implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.42 |`
- Header: `| Current module | M9 Village News (in progress; M8 ✅ Done) |`
- Overview: `| M9 | Village News | BE + FE | | M8 | 🟦 |`
- M9: `### M9 — Village News 🟦`
- M9: all checklist items were `- [ ]`; no Handoff

### 2026-11-20 — v1.42
**Changed:** "Based on" → `requirement.md` v1.27. M9 🟦 in progress; scope item for the daily stored edition and the locks.

**Why:** M9 started; user decisions 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.41 |`
- Header: `| Based on | `requirement.md` v1.26 |`
- Header: `| Current module | M9 Village News (next; M8 ✅ Done) |`
- Overview: `| M9 | Village News | BE + FE | | M8 | ⬜ |`
- M9: `### M9 — Village News ⬜`
- M9: (no item for the stored edition and locks)

### 2026-11-20 — v1.41
**Changed:** M8 ✅ Done (user checked it on their phone). Header → M9 next.

**Why:** User confirmed M8 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.40 |`
- Header: `| Current module | M8 Residents & Villagers (🟨 Ready for playtest) |`
- Overview: `| M8 | Residents & Villagers | FE + BE | | M5, M7 | 🟨 |`
- M8: `### M8 — Residents & Villagers 🟨`
- M8: `  - [ ] performance OK on phone — waiting for the user's phone check`

### 2026-11-20 — v1.40
**Changed:** M8 items ticked except the DoD "performance OK on phone" (needs a real phone); status 🟨 with Handoff.

**Why:** M8 implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.39 |`
- Header: `| Current module | M8 Residents & Villagers (in progress; M12 ✅ Done) |`
- Overview: `| M8 | Residents & Villagers | FE + BE | | M5, M7 | 🟦 |`
- M8: `### M8 — Residents & Villagers 🟦`
- M8: all checklist items were `- [ ]`; no Handoff

### 2026-11-20 — v1.39
**Changed:** "Based on" → `requirement.md` v1.26. M8 🟦 in progress; house items follow the new §7.2 (tap to see whose house, window lights only, fixed lots).

**Why:** M8 started; user decisions 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.38 |`
- Header: `| Based on | `requirement.md` v1.25 |`
- Header: `| Current module | M8 Residents & Villagers (next; M12 ✅ Done) |`
- Overview: `| M8 | Residents & Villagers | FE + BE | | M5, M7 | ⬜ |`
- M8: `### M8 — Residents & Villagers ⬜`
- M8: `  - [ ] one house per Verified Resident with name tag, lights on if active today, archived after 30 days`

### 2026-11-20 — v1.38
**Changed:** M12 ✅ Done (user confirmed). Header → M8 next.

**Why:** User confirmed M12 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.37 |`
- Header: `| Current module | M12 Invites (🟨 Ready for playtest) |`
- Overview: `| M12 | Invites | FE + BE | | M6, M7 | 🟨 |`
- M12: `### M12 — Invites 🟨`

### 2026-11-20 — v1.37
**Changed:** M12: floating Invite button with hide-for-the-day and a once-a-day nudge; invite chips are green buttons.

**Why:** User feedback 2026-11-20: the underlined "Invite" was too small to notice; inviting must always be easy to see.

**Previous:**
- Header: `| Plan version | v1.36 |`
- M12: (no floating Invite button item)

### 2026-11-20 — v1.36
**Changed:** M12 items ticked; status 🟨 with Handoff.

**Why:** M12 implemented and verified locally (tests, two-browser screen check with simulated days).

**Previous:**
- Header: `| Plan version | v1.35 |`
- Header: `| Current module | M12 Invites (in progress, moved before M8) |`
- Overview: `| M12 | Invites | FE + BE | | M6, M7 | 🟦 |`
- M12: `### M12 — Invites 🟦`
- M12: all checklist items were `- [ ]`; no Handoff

### 2026-11-20 — v1.35
**Changed:** "Based on" → `requirement.md` v1.25. M12 🟦 in progress; scope items for the badge reward, invite landing, welcome card and invite entry points, first-visit copy.

**Why:** M12 started (moved before M8); user decisions 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.34 |`
- Header: `| Based on | `requirement.md` v1.24 |`
- Header: `| Current module | M12 Invites (next, moved before M8; M1 🔁 Sleepy fix ✅ Done) |`
- Overview: `| M12 | Invites | FE + BE | | M6, M7 | ⬜ |`
- M12: `### M12 — Invites ⬜`
- M12: `  - [ ] Founding Resident badge`

### 2026-11-20 — v1.34
**Changed:** M1 🔁 Sleepy fix ✅ Done (user confirmed on the phone). Header → M12 next.

**Why:** User confirmed the Sleepy look 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.33 |`
- Header: `| Current module | M1 🔁 Sleepy mood fix (🟨 Ready for review); then M12 Invites (moved before M8) |`
- Overview: `| M1 | Island View | FE (R3F) | ⭐ Core | M0 | 🔁 |`
- M1: `### M1 — Island View ⭐ 🔁`

### 2026-11-20 — v1.33
**Changed:** "Based on" → `requirement.md` v1.24. M1 🔁 Reopened for the Sleepy mood (renamed from Gloomy, warmer look, wake-up line); ready for review.

**Why:** User decision 2026-11-20 after the phone test (newcomers saw a dull grey community).

**Previous:**
- Header: `| Plan version | v1.32 |`
- Header: `| Based on | `requirement.md` v1.23 |`
- Header: `| Current module | M1 🔁 Sleepy mood fix (next; M7 ✅ Done); then M12 Invites (moved before M8) |`
- Overview: `| M1 | Island View | FE (R3F) | ⭐ Core | M0 | ✅ |`
- M1: `### M1 — Island View ⭐ ✅`
- M1: `  - [x] 3 Vitality moods (Lively / Normal / Gloomy) change colours and props`

### 2026-11-20 — v1.32
**Changed:** M7 ✅ Done (user confirmed on their phone). Order after M7: M1 🔁 Sleepy mood fix, then M12 Invites before M8.

**Why:** User decisions 2026-11-20: the Gloomy look is too dark for a newcomer's first impression; bringing neighbours in is the core of the game, so invites come next.

**Previous:**
- Header: `| Plan version | v1.31 |`
- Header: `| Current module | M7 Residency (🟨 Ready for playtest; waiting for the phone check) |`
- Overview: `| M7 | Residency | FE + BE | | M6 | 🟨 |`
- Overview: (no order note; modules in number order)
- M7: `### M7 — Residency 🟨`
- M7: `  - [ ] user verified their own community`

### 2026-11-20 — v1.31
**Changed:** M7 items ticked except the DoD "user verified their own community" (needs the user's phone); status 🟨 with Handoff.

**Why:** M7 implemented and verified locally (tests and screen checks with simulated days).

**Previous:**
- Header: `| Plan version | v1.30 |`
- Header: `| Current module | M7 Residency (in progress; M6 ✅ Done) |`
- Overview: `| M7 | Residency | FE + BE | | M6 | 🟦 |`
- M7: `### M7 — Residency 🟦`
- M7: all checklist items were `- [ ]`; no Handoff

### 2026-11-20 — v1.30
**Changed:** "Based on" → `requirement.md` v1.23. M7 🟦 in progress; scope items for the candidate community and check limits, replacing the manual choice (resident records move to `residency`), and local phone testing over HTTPS.

**Why:** M7 started; user decisions 2026-11-20.

**Previous:**
- Header: `| Plan version | v1.29 |`
- Header: `| Based on | `requirement.md` v1.22 |`
- Header: `| Current module | M7 Residency (next; M6 ✅ Done) |`
- Overview: `| M7 | Residency | FE + BE | | M6 | ⬜ |`
- M7: `### M7 — Residency ⬜`
- M7: (no items for candidate community, replacing the manual choice, or phone testing)

### 2026-11-20 — v1.29
**Changed:** M6 ✅ Done (user confirmed). Real verification of Google linking / re-join and the DoD "linking Google keeps progress" moved to M14 (code stays in M6). Header → M7 next.

**Why:** User decision 2026-11-20: the Google OAuth client has to be created for the production domain anyway, so verify both together at launch. The buttons stay hidden until `VITE_GOOGLE_LINKING=true`.

**Previous:**
- Header: `| Plan version | v1.28 |`
- Header: `| Last updated | 2026-11-19 |`
- Header: `| Current module | M6 Identity (🟨 Ready for playtest; Google linking awaits an OAuth client) |`
- Overview: `| M6 | Identity | FE + BE | | M4 | 🟨 |`
- M6: `### M6 — Identity 🟨`
- M6: `  - [ ] optional Google linking — code done; verify with a real Google OAuth client`
- M6: `  - [ ] re-join with same Google account restores record — code done (`signInWithOAuth`); verify with a real Google OAuth client`
- M6: `  - [ ] linking Google keeps progress`
- M14: no Google item

### 2026-11-20 — v1.28
**Changed:** M6 items ticked except Google linking / re-join and its DoD (code done, not verified); status 🟨 with Handoff.

**Why:** M6 implemented and verified locally; Google needs an OAuth client the user creates.

**Previous:**
- Header: `| Plan version | v1.27 |`
- Header: `| Current module | M6 Identity (in progress; M5 ✅ Done) |`
- Overview: `| M6 | Identity | FE + BE | | M4 | 🟦 |`
- M6: `### M6 — Identity 🟦`
- M6: all checklist items were `- [ ]`

### 2026-11-19 — v1.27
**Changed:** "Based on" → `requirement.md` v1.22. M6: nickname on the first visit added to scope.

**Why:** Sync with requirement v1.22 (user decision 2026-11-19). Google linking: code in M6, real verification once the user creates a Google OAuth client (the M6 DoD item stays open until then).

**Previous:**
- Header: `| Plan version | v1.26 |`
- Header: `| Based on | `requirement.md` v1.21 |`
- M6: (no nickname item)

### 2026-11-19 — v1.26
**Changed:** M5 → ✅ (user confirmed); M6 → 🟦 In progress.

**Why:** User reviewed M5 and approved the merge (without the 3-real-days run, noted in the DoD).

**Previous:**
- Header: `| Plan version | v1.25 |`
- Header: `| Current module | M5 Community State (🟨 Ready for playtest) |`
- Overview: `| M5 | Community State | BE + FE | ⭐ Core | M4, M1 🔁, M3 🔁 | 🟨 |`
- Overview: `| M6 | Identity | FE + BE | | M4 | ⬜ |`
- M5: `### M5 — Community State ⭐ 🟨`
- M6: `### M6 — Identity ⬜`
- M5: `  - [ ] user has played across at least 3 real days`

### 2026-11-19 — v1.25
**Changed:** M6 in scope: "What changed since yesterday" seen once per account per Calgary day (server-side), replacing M5's per-browser flag.

**Why:** User decision (2026-11-19): with real accounts the panel should follow the person, not the browser (today two accounts in one browser share the flag; one person on two devices sees it twice).

**Previous:**
- Header: `| Plan version | v1.24 |`
- M6: (no item about the changes panel)

### 2026-11-19 — v1.24
**Changed:** M5 items ticked (except the 3-real-days playtest), status 🟨 with Handoff.

**Why:** M5 implemented and verified with simulated days.

**Previous:**
- Header: `| Plan version | v1.23 |`
- Header: `| Current module | M5 Community State (in progress; M3 ✅ Done) |`
- Overview: `| M5 | Community State | BE + FE | ⭐ Core | M4, M1 🔁, M3 🔁 | 🟦 |`
- M5: `### M5 — Community State ⭐ 🟦`
- M5: six checklist items were `- [ ]`

### 2026-11-19 — v1.23
**Changed:** "Based on" → `requirement.md` v1.21 (Vitality formula, streak counting today). M5 → 🟦 In progress.

**Why:** M5 started; sync with the requirement update.

**Previous:**
- Header: `| Plan version | v1.22 |`
- Header: `| Based on | `requirement.md` v1.20 |`
- Overview: `| M5 | Community State | BE + FE | ⭐ Core | M4, M1 🔁, M3 🔁 | ⬜ |`
- M5: `### M5 — Community State ⭐ ⬜`

### 2026-11-19 — v1.22
**Changed:** M3 rework confirmed by the user → ✅; current module → M5.

**Why:** User reviewed the rework and approved the merge.

**Previous:**
- Header: `| Plan version | v1.21 |`
- Header: `| Current module | M3 🔁 Game Core rework (🟨 Ready for review); then M5 |`
- Overview: `| M3 | Game Core | BE | ⭐ Core | M0 | 🟨 |`
- M3: `### M3 — Game Core ⭐ 🟨 (rework)`
- M3: `  - [ ] user has reviewed it` (rework DoD)

### 2026-11-19 — v1.21
**Changed:** M3 rework items ticked, status 🟨 with a rework Handoff (includes two island-view display fixes made on the M3 branch with the user's approval: upgrades in place and empty overlays).

**Why:** Building tree on the server finished and verified.

**Previous:**
- Header: `| Plan version | v1.20 |`
- Header: `| Current module | M3 🔁 Game Core rework (in progress; M1 ✅ Done); then M5 |`
- Overview: `| M3 | Game Core | BE | ⭐ Core | M0 | 🔁 |`
- M3: `### M3 — Game Core ⭐ 🔁`
- M3: the seven rework checklist items were `- [ ]`

### 2026-11-19 — v1.20
**Changed:** "Based on" → `requirement.md` v1.20. M1 rework items for water, lot spread and hidden locks ticked; M1 back to 🟨 with Handoff additions.

**Why:** Rework finished and verified.

**Previous:**
- Header: `| Based on | `requirement.md` v1.19 |`
- M1: `- [ ] Real water from City Hydrology at its real position`
- M1: `- [ ] Later-stage lots in newly grown outer land`
- M1: `- [ ] Locked buildings not drawn on the island`
- Header: `| Current module | M1 🔁 Island View rework (in progress: water, lot spread, hidden locks); then M3 🔁, then M5 |`
- Overview: `| M1 | Island View | FE (R3F) | ⭐ Core | M0 | 🔁 |`
- M1: `### M1 — Island View ⭐ 🔁`
- M1: `- **Not tested / known gaps:** real phone; the rising animation`

### 2026-11-19 — v1.19
**Changed:** "Based on" → `requirement.md` v1.19. M1 rework: added real water, lot spread and hidden locked buildings; status back to 🔁 while they are built.

**Why:** Sync with requirement v1.19 (user feedback on the first rework playtest).

**Previous:**
- M1: `- [x] Default camera angle per community (long side vertical on a portrait phone); growth animation for irregular land`
- Header: `| Current module | M1 🔁 Island View rework (🟨 Ready for playtest); then M3 🔁, then M5 |`
- Overview: `| M1 | Island View | FE (R3F) | ⭐ Core | M0 | 🟨 |`
- M1: `### M1 — Island View ⭐ 🟨 (rework)`
- Header: `| Based on | `requirement.md` v1.18 |`

### 2026-11-19 — v1.18
**Changed:** "Based on" → `requirement.md` v1.18. M1 and M3 reopened (🔁) with rework checklists: real-shape islands with stored lot plans and tree building models (M1); building tree as data with conditions, 3-construction limit and upgrades in place (M3). Order: M4 playtest/merge → M1 🔁, M3 🔁 → M5. M4 open decision marked resolved. M5: tree conditions and tree build map. M6: first-visit completed example. M9: newspaper/board by tree buildings. M10: development levels by tree buildings. M13: default sign item removed (Welcome sign is a tree building), features matter most for rectangular communities, lots from the stored plan. After MVP: Phase 4 Main Street note.

**Why:** Sync with requirement v1.18 (building tree, real-shape islands, growth strategy). Reworking M1/M3 before launch keeps the rule that positions never change after launch.

**Previous:**
- Header: `| Plan version | v1.17 |`
- Header: `| Last updated | 2026-11-18 |`
- Header: `| Based on | `requirement.md` v1.17 |`
- Header: `| Current module | M4 — Daily Actions (🟨 Ready for playtest) |`
- Overview: `| M1 | Island View | FE (R3F) | ⭐ Core | M0 | ✅ |`
- Overview: `| M3 | Game Core | BE | ⭐ Core | M0 | ✅ |`
- Overview: `| M5 | Community State | BE + FE | ⭐ Core | M4 | ⬜ |`
- Overview: `**Core loop is complete after M5.** At that point the game is playable end to end with a dev user and a manually chosen community: see the island → move the avatar → take daily actions → progress next day → streak, Vitality, unlocks, island growth.`
- M1: `### M1 — Island View ⭐ ✅`
- M3: `### M3 — Game Core ⭐ ✅`
- M4: `- **OPEN — decide before M5 starts (user discussion 2026-11-18/19):**`
- M5: `unlocks (Playground / Community Centre / Park; resident counts cumulative), island size from cumulative residents`
- M5: `- [ ] Village build map screen (`requirement.md` §7.6a): unlock track + island size track with remaining conditions and progress, completed projects; Village tab only (Me tab is Phase 2)`
- M6: `- [ ] avatar shirt colour choice on first visit, changeable later (`requirement.md` §10.2)`
- M9: `- [ ] Village Notice Board object on the island opens it on tap (Community Centre once built); no walking required`
- M10: `by level (houses → playground → park → community centre), Vitality mood`
- M13: `- [ ] default name sign for every community (custom signs come from Phase 3 photo petitions)`
- M13: `- [ ] a few feature blocks (lake, creek, hill, park) as box models`
- M13: `- [ ] reserve feature/landmark slots in the island layout (M1 layout has none yet; house lots will be re-laid once, acceptable before launch)`
- After MVP: `Phase 2 modules (from `requirement.md` §22.2): Art Pass, Resident Board + moderation, Profile & Ranks, Speech Bubbles, Requests, 5 Vitality moods, feature upgrades. Plan them after MVP playtest data.`

### 2026-11-18 — v1.17
**Changed:** "Based on" → `requirement.md` v1.17. M3 set to 🟨 with Handoff; added a DoD item "user has reviewed it" (M3 is backend only, there is nothing to play).

**Why:** Sync with requirement v1.17 (project starting values); CLAUDE.md Rule 4 needs a user check before ✅ even for backend modules.

**Previous:**
- `| Plan version | v1.16 |` / `| Based on | `requirement.md` v1.16 |`
- M3 DoD had no user-review item.

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
