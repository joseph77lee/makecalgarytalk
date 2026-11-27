# PLAN.md — Change Log

History of every change to [`PLAN.md`](../PLAN.md) (moved out of PLAN.md on 2026-11-24 to keep the plan small).

> New entries go at the **top**. Format:
> ```
> ### YYYY-MM-DD — vX.Y
> **Changed:** what changed
> **Why:** why it changed
> **Previous:** the old text, verbatim
> ```
> New sessions: read only the first few entries (the top of this file).


### 2026-11-27 — v2.06
**Changed:** M27 Avatar Look 🟦 → 🟨 Ready for playtest (header, table row, heading); scope and first two DoD items ticked; Handoff added.

**Why:** M27 implemented, tested and screen-checked; waiting for the operator to play it.

**Previous (verbatim):**
- `| Plan version | v2.05 |`
- `| Current module | M27 Avatar Look 🟦 (then M16) |`
- `| M27 | Avatar Look | BE + FE (R3F) | | M26 | 🟦 |`
- `### M27 — Avatar Look 🟦`
- `  - [ ] server: the look stored with the profile (`identity`), checked on save (known values only; no beard for children), kept when the nickname changes; profiles without a look keep the nickname-based one`
- `  - [ ] renderer: the voxel person drawn from a chosen look (`island-view`), the avatar uses it; mini villagers stay random`
- `  - [ ] first-visit and profile form: live preview, a part picker for each choice, random start, 🎲 shuffle`
- `  - [ ] DB tests: every value range, child + beard refused, look kept on nickname change, old profiles without a look; frontend tests: look checks, shuffle stays in range, the old nickname look maps to the same parts`
- `  - [ ] screen check on desktop and a phone (form, preview, shuffle, the avatar on the island for each age)`

### 2026-11-27 — v2.05
**Changed:** New module **M27 Avatar Look** (🟦 In progress) before M16 (table, build order, section); M16 depends on M27. Header: plan version, `Based on` v1.52, current module.

**Why:** Requirement v1.52 (operator: the villager's look should be chosen, not random; before the deploy).

**Previous (verbatim):**
- `| M16 | Deploy & Playtest | All + operator accounts | | M26 | ⬜ |`
- `    (all) ── M14 ── M19 ── M20 ── M21 ── M22 ── M23 ── M24 ── (M25?) ── M26 ── M16 ── M17 ── M18`
- `| Plan version | v2.04 |`
- `| Based on | \`requirement.md\` v1.51 |`
- `| Current module | M16 Deploy & Playtest (next) |`

### 2026-11-27 — v2.04
**Changed:** M26 🟨 → ✅ Done again (header, table row, heading, DoD "user has played it" ticked, Handoff). Header current module: M16 next.

**Why:** The operator checked the v1.51 answered-card fix ("일단 main 병합해줘").

**Previous (verbatim):**
- `| Plan version | v2.03 |`
- `| Current module | M26 🟨 (answered card fix), then M16 Deploy & Playtest |`
- `| M26 | Community News Steps | BE + FE + data | | M24 | 🟨 |`
- `### M26 — Community News Steps 🟨`
- `  - [ ] user has played it (2026-11-27 before the v1.51 fix; again for the answered card)`

### 2026-11-27 — v2.03
**Changed:** M26 ✅ → 🔁 Reopened for requirement v1.51, fixed and back to 🟨 Ready for playtest (header, table row, heading); new scope item (ticked) for the answered card closing by itself; DoD "user has played it" unticked until the fix is checked; Handoff note. Header: plan version, `Based on` v1.51, current module.

**Why:** Playtest feedback (requirement v1.51): the answered question card needed one more tap before playing, and one or two answers made empty-looking bars.

**Previous (verbatim):**
- `| Plan version | v2.02 |`
- `| Based on | \`requirement.md\` v1.50 |`
- `| Current module | M16 Deploy & Playtest (next) |`
- `| M26 | Community News Steps | BE + FE + data | | M24 | ✅ |`
- `### M26 — Community News Steps ✅`
- `  - [x] user has played it (2026-11-27)` (M26 DoD)
- `  - **Done:** the operator played M26 and confirmed on 2026-11-27; next is M16.`

### 2026-11-27 — v2.02
**Changed:** M26 Community News Steps 🟨 → ✅ Done (header, table row, heading, DoD "user has played it" ticked, Handoff "Next"). Header current module: M16 next.

**Why:** The operator played M26 and confirmed ("플레이해봤어. main에 병합하고 M16 시작해줘").

**Previous (verbatim):**
- `| Plan version | v2.01 |`
- `| Current module | M26 Community News Steps 🟨 (then M16) |`
- `| M26 | Community News Steps | BE + FE + data | | M24 | 🟨 |`
- `### M26 — Community News Steps 🟨`
- `  - [ ] user has played it` (M26 DoD)
- `  - **Next:** the operator plays M26 (Ready for playtest); then M16.`

### 2026-11-27 — v2.01
**Changed:** M26 Community News Steps 🟦 → 🟨 Ready for playtest (header, table row, heading); all scope items and the first two DoD items ticked with where they live; Handoff added.

**Why:** M26 implemented, tested and screen-checked; waiting for the operator to play it.

**Previous (verbatim):**
- `| Plan version | v2.00 |`
- `| Current module | M26 Community News Steps 🟦 (then M16) |`
- `| M26 | Community News Steps | BE + FE + data | | M24 | 🟦 |`
- `### M26 — Community News Steps 🟦`
- `  - [ ] one newspaper: the community board (events, roadmap) is part of it from the Welcome sign; the Warming hut lock and its text removed; the Community hall takes the newspaper over once built; leftover `gateway-arch` keys removed from the news code`
- `  - [ ] personal posting steps on the server: a player's step (0 read/Thanks, 1 today's question, 2 Free talk/Lost & found/Safety, 3 Events/Local deals) and total active days computed on read from the action log (no counter; follows the person across moves); post kinds checked on the server; the write box shows the next step and days to go`
- `  - [ ] today's question data: `supabase/data/daily_questions.csv` (from the reviewed operator draft) seeded by a script into the module's schema; a data test for the writing rules (2–4 choices, distinct emoji, ≤ 32 characters, known seasons/situations/categories)`
- `  - [ ] today's question rules: one question per Calgary day for the whole city, deterministic (season by month, weekday/weekend, not shown in the last 60 days, not yesterday's category), an answer RPC (residents of the community they play in, verified or verifying; one per player per Calgary day; idempotent; final), community counts on read (no who-chose-what anywhere)`
- `  - [ ] today's question card on the first open of the day (after the changes panel), counts after answering, visitors read-only; the question and yesterday's result in Community News`
- `  - [ ] DB tests: Calgary day boundary for the question and the one-answer rule, season edges (Mar 31/Apr 1, May 31/Jun 1, Aug 31/Sep 1, Oct 31/Nov 1), weekday/weekend, no repeat within 60 days and never yesterday's category (including a short pool), same question for every community, step 3 at exactly 14 active days (13 is not enough), active days kept after a move, question-only days not counted, visitors and other communities' residents cannot answer, counts never expose who answered`
- `  - [ ] screen check on desktop and a phone (card, answered state, newspaper result, write box with the next step)`
- `  - [ ] user has played it`

### 2026-11-27 — v2.00
**Changed:** M26 Community News Steps ⬜ → 🟦 In progress (header, table row, heading).

**Why:** M24 is done; the operator approved the M26 plan ("응 그대로 진행해줘").

**Previous (verbatim):**
- `| Plan version | v1.99 |`
- `| Current module | M26 Community News Steps (next), then M16 |`
- `| M26 | Community News Steps | BE + FE + data | | M24 | ⬜ |`
- `### M26 — Community News Steps ⬜`

### 2026-11-27 — v1.99
**Changed:** M24 Community Identity 🟨 → ✅ Done (header, table row, heading, DoD "user has played it" ticked, Handoff "Next"). Header current module: M26 next.

**Why:** The operator played M24 and confirmed ("플레이해봤어. main에 병합하고 M26 시작해줘").

**Previous (verbatim):**
- `| Plan version | v1.98 |`
- `| Current module | M24 Community Identity 🟨 (then M26, M16) |`
- `| M24 | Community Identity | BE + FE (R3F) + data | | M23 | 🟨 |`
- `### M24 — Community Identity 🟨`
- `  - [ ] user has played it` (M24 DoD)
- `  - **Next:** the operator plays M24 (Ready for playtest); then M26.`

### 2026-11-27 — v1.98
**Changed:** M24 place library item: the bridge crossing rule is done (requirement v1.50: site `crossing`, all 223 plans regenerated). Header: plan version, `Based on` v1.50.

**Why:** Requirement v1.50 (operator: "A안으로 다리 예외 넣고 다시 만들어줘").

**Previous (verbatim):**
- `| Plan version | v1.97 |`
- `| Based on | \`requirement.md\` v1.49 |`
- M24 place library item text ending `rivers/bridges get a crossing-site rule — **open:** needs a requirement change (§7.8: water never holds buildings) and all plans regenerated; asked the operator),`

### 2026-11-27 — v1.97
**Changed:** M24 Community Identity 🟦 → 🟨 Ready for playtest (header, table row, heading). The bridge crossing rule stays open for an operator decision.

**Why:** M24 scope and DoD checks done except the bridge rule, which needs a requirement change; ready for the operator to play.

**Previous (verbatim):**
- `| Plan version | v1.96 |`
- `| Current module | M24 Community Identity 🟦 (then M26, M16) |`
- `| M24 | Community Identity | BE + FE (R3F) + data | | M23 | 🟦 |`
- `### M24 — Community Identity 🟦`

### 2026-11-26 — v1.96
**Changed:** New module **M26 Community News Steps** (requirement v1.49: one newspaper with the board from the Welcome sign, personal posting steps, today's question), after M24/M25 and before M16; M16 now depends on M26. Header: plan version, `Based on` v1.49, current module line. Dependency diagram.

**Why:** Requirement v1.49 (operator decisions 2026-11-26): "응 v1.49랑 M26 진행해줘".

**Previous (verbatim):**
- `| Plan version | v1.95 |`
- `| Based on | \`requirement.md\` v1.48 |`
- `| Current module | M24 Community Identity 🟦 (then M16) |`
- `| M16 | Deploy & Playtest | All + operator accounts | | M24 | ⬜ |`
- `    (all) ── M14 ── M19 ── M20 ── M21 ── M22 ── M23 ── M24 ── (M25?) ── M16 ── M17 ── M18`
- M26 did not exist.

### 2026-11-26 — v1.95
**Changed:** M24 Community Identity started (🟦): header, table row, heading.

**Why:** User: "응 병합하고 M24 시작해줘" (docs merged to `main` as b809514).

**Previous (verbatim):**
- `| Plan version | v1.94 |`
- `| Current module | M24 Community Identity (next; then M16) |`
- `| M24 | Community Identity | BE + FE (R3F) + data | | M23 | ⬜ |`
- `### M24 — Community Identity ⬜`

### 2026-11-26 — v1.94
**Changed:** M24 scope follows requirement v1.48: the Welcome sign as root, no place twice, persona hall/park designs; plan generator places face their site, pond fallback and a report; models without drawn water and finished on all sides; a new free-camera item; the build map screen as a skill tree. Header: plan version, `Based on` v1.48.

**Why:** Requirement v1.48 (operator decisions 2026-11-26).

**Previous:**
- Header (verbatim): `| Plan version | v1.93 |`
- Header (verbatim):
  > | Based on | `requirement.md` v1.47 |
- M24 scope (verbatim): `  - [ ] build map as data and server rules: three tracks, conditions`
- M24 scope (verbatim): `  - [ ] island plan generator v2: residential zones, place lots by site (shore, riverbank, hilltop, street, park, plaza) and footprint, a zone per land stage, lots reserved to match step conditions; **all 223 plans regenerated**`
- M24 scope (verbatim): `  - [ ] place library and unique landmarks moved from the spike into the island renderer by asset key (rivers/bridges get a crossing-site rule), placeholders for unknown keys`
- M24 scope (verbatim): `  - [ ] build map screen: finished island picture, next step of each track with what it needs, progress, landmarks, completion %`

### 2026-11-26 — v1.93
**Changed:** New module **M24 Community Identity** before M16 (build map of three tracks, personas and landmarks, scenery houses, plan generator v2 with all plans regenerated, build map screen, World Map landmark icon); **M25 Terrain** added after it, to be decided after playing M24; M16 now depends on M24. Header: plan version, `Based on` v1.47, current module; table and diagram.

**Why:** Requirement v1.47 (community identity redesign, operator decisions 2026-11-25/26; approved "셋 다 추천대로 진행해줘").

**Previous:**
- Header (verbatim): `| Plan version | v1.92 |`
- Header (verbatim): `| Last updated | 2026-11-25 |`
- Header (verbatim):
  > | Based on | `requirement.md` v1.46 |
- Header (verbatim): `| Current module | M16 Deploy & Playtest (next; build map and community growth redesign under discussion first) |`
- Table (verbatim): `| M16 | Deploy & Playtest | All + operator accounts | | M23 | ⬜ |`
- Diagram (verbatim): `    (all) ── M14 ── M19 ── M20 ── M21 ── M22 ── M23 ── M16 ── M17 ── M18`
- M16 heading (M24 and M25 sections inserted before it) (verbatim): `### M16 — Deploy & Playtest ⬜`

### 2026-11-25 — v1.92
**Changed:** M23 ✅ (user approved the models, merged to `main`); its DoD ticked with notes. Current module: M16 next, after a discussion of the build map and community growth (the user found the finished community's layout and building tree weak).

**Why:** User confirmation (2026-11-25): "병합해도 돼".

**Previous:**
- Header: `| Plan version | v1.91 |`, `| Current module | M23 Art Pass 2 🟦 (voxel variety; then M16) |`
- Table (verbatim): `| M23 | Art Pass 2 (voxel variety) | FE (R3F) | | M22 | 🟦 |`
- M23 heading: `### M23 — Art Pass 2 (voxel variety) 🟦`
- M23 DoD (verbatim):
  >   - [ ] checked on screen (desktop and phone) for a new, a small and a grown community, suburb and downtown, every weather and time
  >   - [ ] user has looked at it (mock first, 2026-11-25)

### 2026-11-25 — v1.91
**Changed:** M23 reworked from "Polyfork low-poly" to **voxel variety** (title, goal, scope, DoD, handoff rewritten); status back to 🟦 until the user checks the mock. Header: plan version, `Based on` v1.46, current module; table row renamed.

**Why:** Operator decision (2026-11-25) after the gallery review: keep the voxel style and its volumes, take Polyfork shapes as reference only (`requirement.md` v1.46).

**Previous:**
- Header: `| Plan version | v1.90 |`, `| Based on | \`requirement.md\` v1.45 |`, `| Current module | M23 Art Pass 2 🟨 Ready for playtest (then M16) |`
- Table (verbatim): `| M23 | Art Pass 2 (Polyfork) | FE (R3F) | | M22 | 🟨 |`
- M23 section (verbatim):
  > ### M23 — Art Pass 2 (Polyfork low-poly) 🟨
  > **Goal:** Every community looks clean, varied and alive with pastel low-poly models from Polyfork, under the real weather and time (`requirement.md` v1.45 §19.1–19.2). Built after M22, **before M16**. Option B of the `spike/polyfork` comparison (2026-11-25).
  > - **In scope** (decided with the user 2026-11-25; picks shown for review)
  >   - [x] foundation: GLB loading per island (only what it needs, cached), one instanced mesh per model, pastel repaint (roof/wall per house, kit colours mapped to our palette), shader weather (snow on upward faces, lit windows, swaying crowns), triangle budget and low-quality fallback, CC BY credits generated from the files (2026-11-25: `assets/lowpoly/`, `scripts/polyfork_models.py`; low quality drops yard extras, box models only while loading or if a file fails)
  >   - [x] catalogue picks: 82 Polyfork candidates in 12 groups (`docs/polyfork-picks.json`, review page https://claude.ai/artifact/HB5iNMcE1ASturtPeTeza4); the user chose to use **all of them, mixed sensibly per group** (2026-11-25). No goose, cougar or moose in the catalogue: keep ours or request them
  >   - [x] houses with variety: many models and variants (Polyfork remix GLBs), mirrored/turned, yard extras, size mix by community type (suburb / inner city / downtown) (2026-11-25: all 22 house/tower picks pooled per house type, roof/wall per house, mirrored, row-unit pairs, yard trees; remix GLB variants not used yet)
  >   - [x] trees, street props and cars (2026-11-25: trees, parked cars, benches, mailboxes, path lamps with bulbs lit at night and a light pool, a snowman for one snow pile in four; flower beds stay ours)
  >   - [x] buildings of the tree and features (rink, hall, playground, park, school, …); CTrain and Calgary-specific parts stay ours, repainted to match (2026-11-25: Polyfork arch, fire-pit stones, hut, hall, play equipment, park shelter/trees/benches/fountain, garden shed/bed, school, big-park trees on our box-part ground, flames, flags and flowers; rinks, frozen pond, sledding hill, dog park and CTrain stay ours; ice-rink-tile, rink-board-run and movie-theater picks not used yet)
  >   - [x] people (avatar, villagers) and animals with our own walking from the rigs (2026-11-25: all 7 people for villagers, 3 grown-ups for the avatar with the player's shirt colour; deer, buck (reindeer) and jackrabbit (rabbit/hare) posed by our gaits, the files' clips never played; cougar and goose stay ours; farm dog not used yet)
  >   - [x] gallery shows every new model with weather and times (2026-11-25: `?gallery` views Polyfork houses / towers / trees & cars / props / people / lots A–B; `?meter` shows fps, triangles and draw calls on any island)
  > - **Definition of Done**
  >   - [x] checked on screen (desktop and phone) for a new, a small and a grown community, suburb and downtown, every weather and time (2026-11-25: Mahogany new/small at dusk on a phone, grown by day on desktop and phone, Beltline grown at night with snow; every weather and time in the gallery for each model; rain, fog and storms on an island not looked at one by one: they only change the scene, not the models)
  >   - [ ] real-phone frame rate checked with the spike meter (or its successor): open any island with `?meter` (headless desktop: grown Mahogany 761k triangles with shadows before cars/props stopped casting them, Beltline 970k with shadows, low quality 364k; 150–340 draw calls)
  >   - [ ] user has looked at it
  > - **Handoff**
  >   - **Code:** `frontend/src/modules/island-view/assets/lowpoly/` — `catalogue.ts` (every static model: file, category, fit, optional `yaw`/`lamp`; `LP_HEIGHTS` checked against the files by `catalogue.test.ts`; `castsShadow`), `normalise.ts` (merge, door side to +z, fit, pastel repaint, glass/roof/wall flags from colour groups in sRGB, lamp bulbs), `loadModel.ts` (cached loads, null on failure), `material.ts` (shared shader: snow on upward faces, lit windows `aLit` 2/1/0, per-instance roof/wall paint, sway; back-side materials for mirrored copies), `LowpolyMeshes.tsx` (one InstancedMesh per model and mirroring), `lowpolyAsset.tsx` (asset factory: place → placements, box model fallback, optional extra box parts), `islandModels.ts` (houses, trees, cars, benches, mailboxes, lamps + light pool, snowmen), `buildingModels.ts` (tree buildings and features: Polyfork structure on our box surroundings via the `lowpoly` flag in `voxel/buildings.ts` / `voxel/features.ts`), `rigged.ts` + `RiggedFigures.tsx` (people and animals: `Person` / `Animal`, bones posed in the figure's frame by `gaits.ts`).
  >   - **Files:** `frontend/scripts/polyfork_models.py` downloads the picks to `public/models/pf/` (79 GLBs, 24 MB; an island fetches only the models it shows) and writes `CREDITS.md` plus the "3D models" list on `credits.html`; `/models/*` cached a week (`_headers`).
  >   - **Decisions:** colours are judged in sRGB (three's `Color` is linear: dark shades merged and windows were missed); glass must face sideways (slate roofs are dark blue too); every house gets a pastel roof and wall from `ART`; the files' own animation clips are never played (§19.2) — our gaits pose the bones; the avatar keeps the player's shirt colour (commonest colour on chest-bone vertices); label and tap heights come from `LP_HEIGHTS`, so they are a little off while the box model shows during loading.
  >   - **Not used yet / known gaps:** picks `ice-rink-tile`, `rink-board-run`, `movie-theater`, `farm-dog` (rinks, pond, sledding hill, dog park, CTrain, cougar and goose stay ours); Polyfork remix variants; `crossingCottage` windows stay dark (warm dark glass); `city-commuter` has Polyfork's mushroom-shaped head (villagers only, not the avatar); people files are 0.7–1 MB (mostly geometry) and animal files 1.2–1.5 MB (65 % unused clips) — stripping clips is a follow-up if phones load slowly; skinned people are 5–8 draw calls each (20 villagers ≈ 100–160 calls); towers make downtown heavy (≈ 1M triangles with shadows) — if real phones struggle, first ideas: towers without shadows, fewer tower models per island, simpler fallback in low quality.
  >   - **Gallery (`?gallery`):** views Polyfork houses / towers / trees & cars / props / people / lots A–B (every design of each building and feature); `?mock&plan=BLN&weather=snow&snow=1&time=night` shows any community in any weather (dev builds).
  >   - **Tests:** every GLB parsed in node (fit, heights, roof/wall/window/bulbs found, rig bones present), normalise/placement units, island model choices (every catalogue model used, looks fixed per seed, lit windows share, pairs, yard trees in the tile, building pieces turn with the lot), bone posing in the figure frame. 1041 frontend tests.

### 2026-11-25 — v1.90
**Changed:** M23 catalogue-picks item ticked: 82 candidates in 12 groups saved as `docs/polyfork-picks.json`; the user chose to use all of them, mixed sensibly per group.

**Why:** User decision (2026-11-25): "just pick all and mix them well".

**Previous:**
- Header: `| Plan version | v1.89 |`
- M23 (verbatim): `- [ ] catalogue picks: a table of Polyfork candidates per asset key (houses by community type, buildings of the tree, features, trees, props, cars, people, animals)`

### 2026-11-25 — v1.89
**Changed:** New module **M23 Art Pass 2 (Polyfork low-poly)** 🟦 after M22 and before M16 (foundation, catalogue picks, varied houses, trees/props/cars, buildings and features, people and animals, gallery). M16 now depends on M23; header, table, graph and the "Before opening" line updated. Based on `requirement.md` v1.45.

**Why:** Operator decision after the `spike/polyfork` comparison (2026-11-25): option B, pastel low-poly with variety.

**Previous:**
- Header: `| Plan version | v1.88 |`, `| Based on | \`requirement.md\` v1.44 |`, `| Current module | M16 Deploy & Playtest (next; M20 fix ✅) |`
- Module table: `| M16 | Deploy & Playtest | All + operator accounts | | M22 | ⬜ |`
- Graph: `(all) ── M14 ── M19 ── M20 ── M21 ── M22 ── M16 ── M17 ── M18`
- After launch: `M22 Sound → M16 Deploy & Playtest`

### 2026-11-25 — v1.88
**Changed:** M20 ✅ Done again: the lying-snow fix is confirmed (fix item ticked); header current module back to M16.

**Why:** The user approved merging the fix (2026-11-25).

**Previous:**
- Header: `| Plan version | v1.87 |`, `| Current module | M20 🔁 fix (\`fix/m20-snow-settle\`), then M16 Deploy & Playtest |`
- Module table: `| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | 🔁 |`
- M20 title `### M20 — Weather & Time of Day 🔁`; fix item unticked.

### 2026-11-25 — v1.87
**Changed:** M20 Weather & Time of Day 🔁 Reopened (`fix/m20-snow-settle`): new in-scope fix item (lying snow vanished 10 s after opening for 45 s while it kept snowing). Header current module updated.

**Why:** Found during the Polyfork spike (2026-11-25): a snowy island turned green after 10 seconds.

**Previous:**
- Header: `| Plan version | v1.86 |`, `| Current module | M16 Deploy & Playtest (next; M22 ✅ Done) |`
- Module table: `| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | ✅ |`
- M20 title: `### M20 — Weather & Time of Day ✅`; no fix item.

### 2026-11-25 — v1.86
**Changed:** M22 Sound ✅ Done (user confirmed); header "Current module" → M16 Deploy & Playtest.

**Why:** The user listened to M22 and asked to merge it.

**Previous:**
- Header: `| Plan version | v1.85 |`, `| Current module | M22 Sound 🟨 Ready for playtest (then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟨 |`
- M22 title `### M22 — Sound 🟨`; DoD: `  - [ ] user has listened to it`

### 2026-11-25 — v1.85
**Changed:** M22 Sound → 🟨 Ready for playtest again: gallery upgrade ticked, Handoff gains the gallery note.

**Why:** Gallery upgrade finished on `module/m22-sound`.

**Previous:**
- Header: `| Plan version | v1.84 |`, `| Current module | M22 Sound 🟦 (gallery upgrade, then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟦 |`
- M22 title `### M22 — Sound 🟦`; gallery item unticked; no gallery Handoff note.

### 2026-11-25 — v1.84
**Changed:** M22 Sound back to 🟦: new in-scope item, the `?gallery` upgrade (weather, wind, snow and times of day through the game's sky; a sound board; tapping animals and people).

**Why:** Operator request (2026-11-25): checking weather and sounds is easier in the gallery than in the game.

**Previous:**
- Header: `| Plan version | v1.83 |`, `| Current module | M22 Sound 🟨 Ready for playtest (then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟨 |`
- M22 title `### M22 — Sound 🟨`; no gallery item.

### 2026-11-25 — v1.83
**Changed:** M22 Handoff: the animal and villager sound files are delivered; villagers have a female or male hello, fixed per villager.

**Why:** The operator added the files and asked for two villager voices.

**Previous:**
- Header: `| Plan version | v1.82 |`
- M22 Handoff (verbatim): `Optional files `deer-call`, `cougar-growl`, `rabbit-hop`, `villager-hello` are not delivered yet and fall back to `bubble-pop` (catalog `fallback`).`

### 2026-11-25 — v1.82
**Changed:** M22 Sound → 🟨 Ready for playtest again: playtest-fix item ticked, Handoff gains the fixes (portal panel, per-channel switches and sliders, louder footsteps, tapping walkers, optional animal/villager files with a fallback).

**Why:** Playtest fixes finished on `module/m22-sound`.

**Previous:**
- Header: `| Plan version | v1.81 |`, `| Current module | M22 Sound 🟦 (playtest fixes, then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟦 |`
- M22 title `### M22 — Sound 🟦`; playtest-fix item unticked; Handoff tests line (verbatim): `  - **Tests:** \`sound/sound.test.ts\` (mix, music, work sound, settings, every catalogued file exists in \`public/sfx\`). 928 frontend tests.`

### 2026-11-25 — v1.81
**Changed:** M22 Sound back to 🟦 for playtest fixes: new in-scope item (sound panel hidden behind the streak bar, volume sliders for music/ambience/effects, louder footsteps, tapping animals and villagers). Based on `requirement.md` v1.44.

**Why:** Operator playtest on a phone (2026-11-25).

**Previous:**
- Header: `| Plan version | v1.80 |`, `| Based on | \`requirement.md\` v1.43 |`, `| Current module | M22 Sound 🟨 Ready for playtest (then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟨 |`
- M22 title `### M22 — Sound 🟨`, goal "(`requirement.md` v1.43 §10.5)"; no playtest-fix item.

### 2026-11-25 — v1.80
**Changed:** M22 Sound → 🟨 Ready for playtest: in-scope items ticked, the first DoD item reworded to what could be checked without hearing (loading, first tap, switches), Handoff note added.

**Why:** M22 work finished on `module/m22-sound`; waiting for the user to listen.

**Previous:**
- Header: `| Plan version | v1.79 |`, `| Current module | M22 Sound 🟦 (then M16) |`
- Module table: `| M22 | Sound | FE | | M21 | 🟦 |`
- M22 title `### M22 — Sound 🟦`; all boxes unticked; DoD (verbatim): `  - [ ] every sound heard on desktop and a phone, switches remembered, nothing plays before the first tap`; no Handoff.

### 2026-11-25 — v1.79
**Changed:** New module **M22 Sound** 🟦 after M21 and before M16 (sound engine, 🔊 switches, action effects, island ambience by weather and time, World Map sounds, background music, credits). M16 now depends on M22; header, table, graph and the "Before opening" line updated. Based on `requirement.md` v1.43.

**Why:** Operator request (2026-11-25): a full sound design before the playtest; the operator collected the files.

**Previous:**
- Header: `| Plan version | v1.78 |`, `| Based on | \`requirement.md\` v1.42 |`, `| Current module | M16 Deploy & Playtest (next; M21 ✅ Done) |`
- Module table: `| M16 | Deploy & Playtest | All + operator accounts | | M21 | ⬜ |`
- Graph: `(all) ── M14 ── M19 ── M20 ── M21 ── M16 ── M17 ── M18`
- After launch: `M21 Living Community → M16 Deploy & Playtest`

### 2026-11-25 — v1.78
**Changed:** M21 Living Community ✅ Done (user confirmed); header "Current module" → M16 Deploy & Playtest; last updated 2026-11-25.

**Why:** The user looked at M21 and asked to merge it.

**Previous:**
- Header: `| Plan version | v1.77 |`, `| Last updated | 2026-11-24 |`, `| Current module | M21 Living Community 🟨 Ready for playtest |`
- Module table: `| M21 | Living Community | FE + BE | | M20 | 🟨 |`
- M21 title: `### M21 — Living Community 🟨`; DoD: `  - [ ] user has looked at it`

### 2026-11-24 — v1.77
**Changed:** M21 Living Community → 🟨 Ready for playtest: in-scope items and the screen check ticked, Handoff note added. Based on `requirement.md` v1.42.

**Why:** M21 work finished on `module/m21-living-community`; waiting for the user's playtest.

**Previous:**
- Header: `| Plan version | v1.76 |`, `| Based on | \`requirement.md\` v1.41 |`, `| Current module | M21 Living Community 🟦 |`
- Module table: `| M21 | Living Community | FE + BE | | M20 | 🟦 |`
- M21 title `### M21 — Living Community 🟦`, goal "(`requirement.md` v1.41 §7.2–7.4)", all in-scope boxes and the screen check unticked, no Handoff.

### 2026-11-24 — v1.76
**Changed:** M21 Living Community 🟦 In progress; its scope rewritten with the details decided with the user (random villagers by land size, wildlife by location, village houses half lit at night and not tappable, "Lv N" instead of Vitality, today's posts only as bubbles). Based on `requirement.md` v1.41.

**Why:** M21 planning with the user (2026-11-24).

**Previous:**
- Header: `| Plan version | v1.75 |`, `| Based on | \`requirement.md\` v1.40 |`, `| Current module | M21 Living Community (next; M20 ✅ Done) |`
- Module table: `| M21 | Living Community | FE + BE | | M20 | ⬜ |`
- M21 (verbatim):
  > ### M21 — Living Community ⬜
  > **Goal:** Communities look naturally alive whatever the number of players, every resident keeps "My house", and Vitality becomes community development (`requirement.md` v1.40 §22.6 step 6b; the detailed requirement text is written into §7.2–7.4 when the work starts). Built after M20, **before M16**.
  > - **In scope** (decided with the user 2026-11-24; details planned when the work starts)
  >   - [ ] mini villagers appear naturally at random (scaled by island size, fewer at night and in bad weather), not from player counts or activity; never named, never pretending to be players (§7.3); action replay stays real. The smallest islands start with 0–1 villagers (operator feedback 2026-11-24: 3 on a stage-1 island looked like too many; today §7.3 sets a minimum of 2–3)
  >   - [ ] wildlife by where the community is and how big its island is (operator feedback 2026-11-24): downtown and inner-city communities rarely see wild animals (an occasional jackrabbit), communities near the city edge see them often (distance from the city centre, from the community boundaries); small islands get fewer animals; geese and jackrabbits are fewer overall (today: jackrabbits 60 %, ground geese 50 % by water, deer 40 %, wherever the community is)
  >   - [ ] houses fill the land as the community grows (unnamed background houses), and every Verified Resident still has their own house among them with "My house", nickname on tap and lit windows when active (needed later for interior decorating, §22.3)
  >   - [ ] Vitality redefined as community development (new buildings): replaces the sleepy streak text, the Revival effect (→ building completion celebration) and the World Map mood tones
  >   - [ ] walking villagers show residents' recent community posts as speech bubbles: "nickname: text" with the kind icon, about 40 characters, tap opens the post; never Safety posts; hidden, reported and expired posts drop out (same server function as the newspaper); at most 2–3 bubbles at a time
  > - **Definition of Done**
  >   - [ ] requirement §7.2–7.4 (and §9, §11, §12.2 where Vitality appears) updated with changelog entries
  >   - [ ] checked on screen (desktop and phone) for a new, a small and a large community
  >   - [ ] user has looked at it

### 2026-11-24 — v1.75
**Changed:** M20 Weather & Time of Day ✅ Done (user confirmed on an iPad); header "Current module" → M21 Living Community.

**Why:** The user looked at M20 and asked to merge it; the villager-count and wildlife feedback is in M21.

**Previous:**
- Header: `| Plan version | v1.74 |`, `| Current module | M20 Weather & Time of Day 🟨 Ready for playtest (then M21 Living Community) |`
- Module table: `| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | 🟨 |`
- M20 title: `### M20 — Weather & Time of Day 🟨`; DoD: `  - [ ] user has looked at it`

### 2026-11-24 — v1.74
**Changed:** M21 Living Community scope: the mini-villager item adds that the smallest islands start with 0–1 villagers; new item "wildlife by where the community is and how big its island is" (downtown/inner city rarely, near the city edge often, fewer on small islands, fewer geese and jackrabbits overall). M20 (still 🟨): the future-land outline is now nearly invisible at night and dimmer in storms (playtest fix, no plan text change).

**Why:** Operator playtest on an iPad (2026-11-24): 3 villagers on a stage-1 island and many geese/jackrabbits looked like too many; wildlife should depend on the community's location; the translucent future-land tiles stood out at night.

**Previous:**
- Header: `| Plan version | v1.73 |`
- M21 villager item (verbatim): `  - [ ] mini villagers appear naturally at random (scaled by island size, fewer at night and in bad weather), not from player counts or activity; never named, never pretending to be players (§7.3); action replay stays real`
- M21: no wildlife item.

### 2026-11-24 — v1.73
**Changed:** M20 Weather & Time of Day → 🟨 Ready for playtest: in-scope items and the screen check ticked, the dev-override item reworded (overrides in the game, no weather buttons in the gallery), Handoff note added. Header, module table and the lighting open item updated.

**Why:** M20 work finished on `module/m20-weather-time`; waiting for the user's playtest.

**Previous:**
- Header: `| Plan version | v1.72 |`, `| Current module | M20 Weather & Time of Day 🟦 (then M21 Living Community) |`
- Module table: `| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | 🟦 |`
- M20 title: `### M20 — Weather & Time of Day 🟦`; all in-scope boxes unticked; dev item (verbatim): `  - [ ] dev overrides \`?weather=<state>&time=<phase>\` and weather buttons in the \`?gallery\``; DoD screen check unticked; no Handoff.
- After launch (verbatim): `- [ ] Pastel palette and lighting values — palette set in M19 (\`ART\` in \`voxel/samples.ts\`); lighting values in M20`

### 2026-11-24 — v1.72
**Changed:** M20 Weather & Time of Day 🟦 In progress with its scope planned with the user (mood-free scenery, Environment Canada weather module, states and wind, settling snow, weather chip, real sun, night lights, phone budget, dev overrides). New module **M21 Living Community** after M20 and before M16 (random mini villagers, houses fill the land with every resident keeping "My house", Vitality as development, villagers speaking community posts except Safety). M16 now depends on M21; header, table, graph and the "Before opening" line updated. Based on `requirement.md` v1.40.

**Why:** Planning session with the operator (2026-11-24): the sleepy mood's snowy dusk clashed with real weather and time; the villager/house/Vitality redesign is big enough for its own module.

**Previous:**
- Header: `| Plan version | v1.71 |`, `| Based on | `requirement.md` v1.39 |`, `| Current module | M20 Weather & Time of Day (next; M19 ✅ Done) |`
- Module table (verbatim): `| M20 | Weather & Time of Day | BE + FE (R3F) | | M19 | ⬜ |` / `| M16 | Deploy & Playtest | All + operator accounts | | M20 | ⬜ |`
- Graph: `(all) ── M14 ── M19 ── M20 ── M16 ── M17 ── M18`
- After launch: `**Before opening:** M19 Art Pass → M20 Weather & Time of Day → M16 Deploy & Playtest`
- M20 (verbatim):
  > ### M20 — Weather & Time of Day ⬜
  > **Goal:** Each community shows the real Calgary weather and the time of day (`requirement.md` v1.38 §10.4). Built after M19, **before M16**.
  > - **In scope** (details planned with the user before work starts)
  >   - [ ] real weather from the server (city-wide, cached, free public source): rain, snow, wind, overcast
  >   - [ ] snow settles on roofs, trees and ground while it snows (carried over from M19)
  >   - [ ] time of day: light from the sun's real direction (moving shadows), dawn/dusk tints, night sky, street lamps and windows lit at night
  >   - [ ] no time-zone math in the client (§7.5): the server sends the instant / sun data
  >   - [ ] effects within the phone budget (§20.3a), reduced further in low-quality mode
  > - **Definition of Done**
  >   - [ ] each weather state and day/night phase checked on screen (and on a phone)
  >   - [ ] user has looked at it

### 2026-11-24 — v1.71
**Changed:** M19 Art Pass 🔁 Reopened (`fix/m19-props-and-crowds`): new In-scope item "nobody walks through things": street props and mood decorations now block walking (placed only where they cut nobody off, never on paths, the plaza, track or building lots); cars park only beside the road (nose-in in a driveway, else along the road); the avatar, villagers and animals claim tiles so they never walk through each other (the avatar waits, then walks around). Wild flower dots became a few single-colour patches. The gallery's label errors are fixed. Handoff note updated (the street-props line no longer says "never block").

**Why:** Operator request (2026-11-24): flower dots looked noisy, people walked over cars, animals and flower beds, cars must park by houses or the roadside, and the gallery showed console errors.

**Previous:**
- Header: `| Plan version | v1.70 |`, `| Current module | M20 Weather & Time of Day (next; M19 ✅ Done) |`
- Module table: `| M19 | Art Pass | FE (R3F) | | M14 | ✅ |`
- M19 title: `### M19 — Art Pass ✅`
- M19 Handoff, layout (verbatim): `Street props: \`assetKey 'prop'\`, non-blocking, ≤ \`MAX_PROPS = 70\`.`

### 2026-11-24 — v1.70
**Changed:** M19 Art Pass 🔁 Reopened for walking animation (`fix/m19-walk-animation`): new In-scope item "people and animals move like they walk" (avatar and villagers swing arms and legs, sit, cheer, hammer; deer walk and sometimes bound, cougars stalk and sometimes dash, jackrabbits hop, geese waddle; resting deer and geese graze); Handoff note gains the rig/gait code.

**Why:** Operator request (2026-11-24): residents and animals slid around without moving their arms and legs.

**Previous:**
- Header: `| Plan version | v1.69 |`, `| Current module | M20 Weather & Time of Day (next; M19 ✅ Done) |`
- Module table: `| M19 | Art Pass | FE (R3F) | | M14 | ✅ |`
- M19 title: `### M19 — Art Pass ✅`
- M19 In scope: no walking-animation item.
- M19 Handoff: no rig/gait note.

### 2026-11-24 — v1.69
**Changed:** M19 Art Pass 🔁 Reopened for a visual polish (`fix/m19-visual-polish`): calmer construction sites (low cream/pale-terracotta fence, orange only on the gate cones, three scaffold shapes per community), calmer ground (checker contrast halved in every mood palette, no per-tile colour jitter, fewer but bigger grass clumps, fewer stepping stones), clouds tucked against the real island edges (left, right, under the front cliff) instead of floating far away. Handoff note updated.

**Why:** Design review (2026-11-24): the striped fence and repeated scaffolds pulled the eye before houses and people, the grass checker and tiny tufts read as a grid with dot noise, and far-away clouds pulled the eye off the island.

**Previous:**
- Header: `| Plan version | v1.68 |`, `| Current module | M20 Weather & Time of Day (next; M19 ✅ Done) |`
- Module table: `| M19 | Art Pass | FE (R3F) | | M14 | ✅ |`
- M19 title: `### M19 — Art Pass ✅`
- M19 Handoff, island life (verbatim): `Clouds drift beside the island, never over it (they hid houses).`
- M19 Handoff, ground (verbatim): `- **Ground:** \`scene/terrainParts.ts\` — per-tile colour jitter, tufts on ~40 % of grass, stepping stones on ~55 % of path tiles, 4-layer edge soil.`

### 2026-11-24 — v1.68
**Changed:** M19 Art Pass → 🟨 Ready for playtest: scope filled in with what was built (voxel houses per community type, public buildings, features and CTrain, construction sites, trees, one voxel person, street props, island life, ground detail, gallery), Definition of Done ticked except the user check, Handoff note added. Header "Current module" updated. "Based on" → `requirement.md` v1.39 (avatar name always shown, "My house" marker). M20 scope adds "snow settles on roofs, trees and ground" (carried over from M19). After launch: the Art Pass leftovers line drops "(decided when M19 is planned)" (styled World Map, avatar customization, walk-up-and-tap actions stay after launch); the palette item marks the palette as set in M19 (lighting still M20).

**Why:** M19 work finished on `module/m19-art-pass`; waiting for the user's playtest.

**Previous:**
- Header: `| Plan version | v1.67 |`, `| Current module | M19 Art Pass (next; scope to be planned with the user), then M20 |` (Based on was already bumped to v1.39 in eb04d0c)
- Module table: `| M19 | Art Pass | FE (R3F) | | M14 | ⬜ |`
- M19 (verbatim):
  > ### M19 — Art Pass ⬜
  > **Goal:** Every community looks worth playing and feels **busy** before anyone sees it (`requirement.md` v1.38 §19.0, §22.2, §22.6). Built **before M16** (deploy and playtest).
  > - **In scope** (to be planned with the user before work starts)
  >   - [ ] prettier voxel communities: island ground, buildings of the tree, houses, people (avatar, mini villagers) and props, through the existing asset keys (§20.4: no game-logic changes)
  >   - [ ] busier communities: more life on the island (props, activity, villagers) without fake players (§7.3)
  >   - **Priority: looks first** (operator decision 2026-11-24): detail and amounts are chosen for the best look. Performance work is limited to changes that keep the look identical (e.g. merging touching voxels into one box); slow phones are covered by the M14 low-quality mode; one real-phone check before the launch (M16). Rendering cost depends on each player's phone and the island's content, not on the number of players.
  >   - [ ] the details — which assets, style, how they are made, phone performance budget — are decided together first
  > - **Definition of Done** (to be completed when the scope is planned)
  >   - [ ] phone performance stays within §20.3a
  >   - [ ] user has looked at it
- After launch, Phase 2 (verbatim):
  > - [ ] Art Pass items not taken into M19 (decided when M19 is planned): styled World Map (animated Bow/Elbow rivers, moving CTrain trains on the map, Calgary landmark buildings, transitions), avatar customization, walk-up-and-tap actions
- Open numbers (verbatim):
  > - [ ] Pastel palette and lighting values — needed for M19/M20
- M20 In scope: no snow-on-roofs item.

### 2026-11-24 — v1.67
**Changed:** M19: added the "looks first" priority note (best look first; only look-preserving performance changes; M14 low-quality mode as the safety net; one real-phone check before launch in M16).

**Why:** Operator decision (2026-11-24) after reviewing the box counts of the style samples (a new house ≈ 3–4× the old one; a cloud ≈ 700 boxes; a full island ≈ 13–15k boxes vs ≈ 3–4k today).

**Previous:**
- Header: `| Plan version | v1.66 |`
- M19 In scope: no priority note.

### 2026-11-24 — v1.66
**Changed:** Before opening: M19 Art Pass now also aims at busier communities; new **M20 Weather & Time of Day** (real Calgary weather and the sun's real direction, lamps at night) between M19 and M16. "After MVP" replaced by **"After launch — checklist for the user to review"** listing every post-launch item (M17, M18, Phase 2, Phase 3, Phase 4, expansion, open numbers). The Change Log moved out of PLAN.md into `changelog/plan.md` (this file); rule 6 points here. "Based on" → `requirement.md` v1.38.

**Why:** Operator decision (2026-11-24): only Art Pass, weather and time of day go in before the opening; everything else as a list to review. Smaller PLAN.md for new sessions.

**Previous:**
- Header: `| Plan version | v1.65 |`, `| Based on | \`requirement.md\` v1.37 |`
- M19 (verbatim):
  > ### M19 — Art Pass ⬜
  > **Goal:** Every community looks worth playing before anyone sees it (`requirement.md` v1.37 §19.0, §22.2, §22.6). Built **before M16** (deploy and playtest).
  > - **In scope** (to be planned with the user before work starts)
  >   - [ ] prettier buildings of the tree, houses, people (avatar, mini villagers) and props, through the existing asset keys (§20.4: no game-logic changes)
- M16 dep (verbatim):
  > | M16 | Deploy & Playtest | All + operator accounts | | M19 | ⬜ |
- diagram (verbatim):
  >     (all) ── M14 ── M19 ── M16 ── M17 ── M18
- after mvp (verbatim):
  > ## After MVP (not planned in detail yet)
  > Phase 2 modules (from `requirement.md` §22.2): Resident Board + moderation, Profile & Ranks (avatar growth), Speech Bubbles, Requests, 5 Vitality moods, feature upgrades. Plan them after MVP playtest data. (The Art Pass moved before the deploy: M19.)
  > 
  > Phase 4: local business shops on **Main Street lots** (open after the Community hall; operator-approved messages; `requirement.md` §22.4). The lots are already reserved in the stored lot plans (M1 🔁).
- header (verbatim):
  > | Current module | M19 Art Pass (next; scope to be planned with the user) |
- Rule 6: `6. This plan will change. Before changing it, add an entry at the top of the [Change Log](#change-log) (date, version, Changed, Why, Previous text verbatim), then edit the body.`
- Change Log: all entries inline at the end of PLAN.md (now in this file, unchanged).

### 2026-11-24 — v1.65
**Changed:** New **M19 Art Pass** before M16 (scope to be planned with the user). M16: all communities open, public launch reveals the whole city; dashboard review also watches single-player communities. M17: both email and web push. M18: associations contacted once a community reaches a player threshold. Overview, diagram, current module updated. "Based on" → `requirement.md` v1.37.

**Why:** Operator decisions (2026-11-24).

**Previous:**
- After MVP: `Phase 2 modules (from \`requirement.md\` §22.2): Art Pass, Resident Board + moderation, Profile & Ranks, Speech Bubbles, Requests, 5 Vitality moods, feature upgrades. Plan them after MVP playtest data.`
- Header: `| Plan version | v1.64 |`, `| Based on | \`requirement.md\` v1.36 |`
- M16 items (verbatim):
  >   - [ ] **family/friends playtest**, focused on **one pilot community** (e.g. Mahogany) so neighbours actually meet (`requirement.md` v1.36 §22.7)
  >   - [ ] read the dashboard after the playtest (first action %, D1, D7) and decide M17's channel (email digest or web push)
- M17 scope (verbatim):
  > ### M17 — Return Reminders ⬜
  > **Goal:** Players are reminded when their community needs them (`requirement.md` v1.36 §22.7a.1).
  > - **In scope** (details decided after M16's playtest data)
  >   - [ ] one channel: **email digest** (opted-in players, §18) or **web push** (home-screen web app, iPhone included)
- M17 limits (verbatim):
  >   - [ ] at most one message a day, never at night (Calgary time), one-tap turn off
- M18 scope (verbatim):
  > **Goal:** The pilot community's association helps bring neighbours in; its notices appear in the community newspaper (`requirement.md` v1.36 §22.7a.2).
  > - **In scope**
  >   - [ ] operator contacts the pilot association: newsletter / social media mention; permission to show notices
- overview (verbatim):
  > | M16 | Deploy & Playtest | All + operator accounts | | M14 | ⬜ |
- diagram (verbatim):
  >     (all) ── M14 ── M16 ── M17 ── M18
- header (verbatim):
  > | Current module | M16 Deploy & Playtest (next; M14 ✅ Done) |

### 2026-11-23 — v1.64
**Changed:** Growth order after launch: M16 playtest focuses on one pilot community and ends with a dashboard review; new **M17 Return Reminders** (email digest or web push, chosen from the data) and **M18 Community Association Partnership** (newsletter mention + association notices as title/link in the newspaper). Overview and diagram updated. "Based on" → `requirement.md` v1.36.

**Why:** User decision (2026-11-23): this order makes the site active — density first, then reminders, then associations as a distribution channel.

**Previous:**
- Header: `| Plan version | v1.63 |`, `| Based on | \`requirement.md\` v1.35 |`
- M16: `  - [ ] **family/friends playtest**` (no pilot focus, no dashboard review item)
- Overview: no M17/M18 rows; diagram `    (all) ── M14 ── M16`

### 2026-11-23 — v1.63
**Changed:** M14 split: **M14 Launch Prep** ✅ (everything built and checked locally) and new **M16 Deploy & Playtest** ⬜ (production deploy, Google OAuth, production tzdata, real low-end phone, family/friends playtest, Pro + Sentry before the public launch). References to "M14" for deploy-time checks in M0/M1/M6 now say M16; dependency diagram and overview updated.

**Why:** The user wanted the finished launch-prep work on `main` now, while the account-dependent steps wait until the operator is ready. Splitting keeps the merge rule (merge only ✅ modules) intact.

**Previous:**
- Header: `| Plan version | v1.62 |`, `| Current module | M14 Launch Readiness (in progress) |`
- Overview row: `| M14 | Launch Readiness | All | | All above | 🟦 |`; diagram `    (all) ── M14`
- M0/M1/M6 texts: `(M14)`, `the M14 low-end phone pass`, `moved to M14`, `at deploy, M14`
- M14 section (v1.62), verbatim:

  > ### M14 — Launch Readiness 🟦
  > **Goal:** Safe to show the public.
  > - **In scope** (`requirement.md` v1.35 §17, §18, §20, §21, §22.7)
  >   - [x] Terms of Use + Privacy Policy pages (13+, location statement) — plus Credits (OSM ODbL, City of Calgary OGL); linked from the first visit and the profile sheet
  >   - [x] analytics (D1/D7, shares, invites) — own, in Supabase; operator dashboard at `?admin`
  >   - [x] abnormal sign-up flags — verification spike flags on the dashboard (Turnstile and per-IP sign-in limits were already in place)
  >   - [x] optional update-email opt-in (CASL)
  >   - [ ] production deploy — config ready (`frontend/public/_headers`, `docs/launch.md`); waits for the operator's Supabase project and Cloudflare Pages setup
  >   - [ ] Google OAuth client (production domain + local redirect); verify Google linking keeps progress and re-join with the same Google account restores the record (moved from M6; code in `frontend/src/modules/identity/`, see M6 Handoff)
  >   - [ ] production database tzdata is 2026c or newer (`common_calgary_day` tests pass against it; Alberta permanent UTC-6) — SQL check in `docs/launch.md` §2
  >   - [ ] low-end phone performance pass — adaptive quality added (drei `PerformanceMonitor`: 1× pixel ratio, no shadows when frames drop); a real low-end phone check is still needed
  >   - [ ] **family/friends playtest**
  > - **Definition of Done**
  >   - [ ] checklist complete
  >   - [ ] playtest feedback triaged into modules or Phase 2
  > - **Handoff (in progress)**
  >   - **Server:** migrations `20261123130000_gamecore_residency_admin_interface.sql` (`gamecore.acted_between`, `residency.daily_verifications`), `20261123130050_identity_email_updates.sql` (`identity.email_updates`, RPC `identity_get_email_updates` / `identity_set_email_updates`, consent version `2026-11-23` — bump with `EMAIL_CONSENT_TEXT` in `identity/api.ts`), `20261123130100_analytics_admin.sql` (schemas `analytics`: `visits`, `community_views`, append-only `events` capped 50/player/day, RPC `analytics_visit` / `analytics_event`; `admin`: `operators`, spike rule, RPC `admin_dashboard`). New module prefixes `analytics`, `admin` in the health guardrail. Tests `analytics_admin.test.sql` (35). `seed.sql` makes the local dev user an operator.
  >   - **Frontend:** modules `analytics/` (`track.visit/share/inviteVisit`, never throws; App records today's visit + community on screen, invite-link arrivals, card and invite shares) and `admin/` (`AdminDashboard`, `?admin`). `identity/EmailUpdatesSection` + `LegalLinks`; first-visit agreement line. Static pages `frontend/public/{terms,privacy,credits}.html` + `legal.css` (outside the app bundle).
  >   - **Launch steps:** `docs/launch.md` lists every operator step (Supabase project in Canada Central, link + `db push`, auth settings, Cloudflare Pages env vars, Turnstile, Google OAuth, email routing, adding an operator, deletion requests, Pro before public launch).
  >   - **Legal text** is a template-based first version written from what the game actually stores; professional review once revenue starts (§18). If the Supabase region is not Canada, update the Privacy Policy.

### 2026-11-23 — v1.62
**Changed:** M14 🟦 in progress: legal pages, own analytics + operator dashboard, spike flags, email opt-in done locally; deploy config and launch guide ready; adaptive quality for low-end phones; remaining items wait for the operator's accounts. "Based on" → `requirement.md` v1.35.

**Why:** User decisions for M14 (2026-11-23).

**Previous:**
- Header: `| Plan version | v1.62 |`, `| Based on | \`requirement.md\` v1.34 |`, `| Current module | M14 Launch Readiness (next; M13 ✅ Done) |`
- Overview row: `| M14 | Launch Readiness | All | | All above | ⬜ |`
- M14 section (v1.61), verbatim:

  > ### M14 — Launch Readiness ⬜
  > **Goal:** Safe to show the public.
  > - **In scope**
  >   - [ ] Terms of Use + Privacy Policy pages (13+, location statement)
  >   - [ ] analytics (D1/D7, shares, invites)
  >   - [ ] abnormal sign-up flags
  >   - [ ] optional update-email opt-in (CASL)
  >   - [ ] production deploy
  >   - [ ] Google OAuth client (production domain + local redirect); verify Google linking keeps progress and re-join with the same Google account restores the record (moved from M6; code in `frontend/src/modules/identity/`, see M6 Handoff)
  >   - [ ] production database tzdata is 2026c or newer (`common_calgary_day` tests pass against it; Alberta permanent UTC-6)
  >   - [ ] low-end phone performance pass
  >   - [ ] **family/friends playtest**
  > - **Definition of Done**
  >   - [ ] checklist complete
  >   - [ ] playtest feedback triaged into modules or Phase 2

### 2026-11-23 — v1.61
**Changed:** M13 ✅ Done ("user has looked at it" ticked); current module → M14.

**Why:** The user played M13 and confirmed it (2026-11-23); CI green.

**Previous:**
- Header: `| Plan version | v1.60 |`, `| Current module | M13 Feature Library (🟨 Ready for playtest) |`
- Overview row: `| M13 | Feature Library | FE + data | | M1 | 🟨 |`; heading `### M13 — Feature Library 🟨`; DoD `  - [ ] user has looked at it`

### 2026-11-23 — v1.60
**Changed:** M13 scope extended after the user's review: CTrain on the islands (track, stations, train, next-station signs; 46 plans regenerated) and on the World Map; features appear with their land instead of faint previews; build map preview of the next land's features. Handoff rewritten. "Based on" → `requirement.md` v1.34.

**Why:** User review of M13 (2026-11-23), all four recommendations approved.

**Previous:**
- Header: `| Plan version | v1.60 |`, `| Based on | \`requirement.md\` v1.33 |`
- M13 section (v1.59), verbatim:

  > ### M13 — Feature Library 🟨
  > **Goal:** Each island feels like its community.
  > - **In scope** (`requirement.md` v1.33 §7.9)
  >   - [x] 6 feature blocks as box models: CTrain station, pond, hill, creek, big park, school (real water inside the boundary is already drawn since M1 🔁)
  >   - [x] community → feature mapping for **all 223** residential communities: OpenStreetMap suggestions + operator CSV override, at most 3 each in priority order
  >   - [x] features stand on the spare lots of the stored lot plan (M1 🔁); faint on future land from day one, solid once the land rises; labels with public place names
  > - **Definition of Done**
  >   - [x] communities show their features (203 of 223 have at least one; checked on screen: Varsity, Signal Hill, Bowness, Mahogany)
  >   - [x] adding a feature = data change only (edit `community_features_override.csv`, rerun `build_features.py`)
  >   - [ ] user has looked at it
  > - **Handoff**
  >   - **Data:** `supabase/data/build_features.py` (Python, standard library) queries OpenStreetMap through the Overpass API once (`--cache <file>` saves/reuses the answer) and writes `supabase/data/community_features.json` (`communities: { CODE: [{ key, name }] }`, priority order, ≤ 3). Only the derived mapping is stored, never OSM geometry; ODbL attribution is in the file's `about` (add it to the site credits in M14). `community_features_override.csv` (`code,action,feature,name`, action add/remove) is applied after the suggestions; operator additions always survive the cap. Rules are in the script's docstring (station ≤ 150 m, pond ≥ 2 ha within 250 m only if the plan has < 20 water tiles, hill from named peaks / hill-named parks / community names containing hill|heights|ridge|mount|crest, creek ≥ 250 m inside, big park ≥ 6 ha overlap, school inside).
  >   - **Results (2026-11-23):** station 48, pond 31, hill 52, creek 50, big park 110, school 127; 19 communities have none (mostly small inner-city or brand-new ones: e.g. Bankview, Chinatown, Wolf Willow) — add them through the CSV if wanted. The "hill by community name" rule is symbolic (e.g. Hillhurst, Mount Pleasant).
  >   - **Code:** `island-view/plan/features.ts` (`featuresFor(code)`, `FEATURE_INFO`, `featureLabel`, validation that throws listing every problem); `layout.ts` puts features on spare lots in plan order (spare-1 …), `assetKey: 'feature'` with `faint` (lot not on land yet → stage 0, see-through on the mist) or solid (blocks its lot, counted in `usedLots`); unknown-building placeholders get the spare lots left. `buildIslandLayout(plan, state, features = featuresFor(plan.code))` — tests pass `[]` to check behaviour without features. Models in `assets/models.ts` (`FEATURE_MODELS`, `feature()`; faint = ghost layer, own colours, lowered onto the mist), labels in `scene/Labels.tsx` (solid: name chip always, since phones rarely reach the detailed zoom; faint: emoji, plus "Appears as the community grows" when zoomed in).
  >   - **Tests:** `plan/features.test.ts` (every plan has an entry, valid keys, ≤ 3, priority order, names ≤ 60 chars, ≥ 85% of communities have a feature, models inside the 2×2 lot in every mood, faint variant) and feature cases in `layout.test.ts` (spare-lot order, faint → solid, blocking, placeholders after features, Mahogany data).
  >   - **Not tested / known gaps:** real phone; OSM data quality varies (unnamed parks show "Big park", some creeks have no name); features are not tappable (no info sheet); the faint→solid switch has no animation of its own (it appears with the risen land); Activity-based feature upgrades are Phase 2.

### 2026-11-23 — v1.59
**Changed:** M13 scope as decided (6 blocks, all 223 communities, faint from day one; DoD "launch communities" → communities, plus "user has looked at it"); items ticked; status 🟨 with Handoff. "Based on" → `requirement.md` v1.33.

**Why:** User decisions for M13 (2026-11-23); implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.58 |`, `| Based on | \`requirement.md\` v1.32 |`, `| Current module | M13 Feature Library (next; M11 ✅ Done) |`
- Overview row: `| M13 | Feature Library | FE + data | | M1 | ⬜ |`
- M13 In scope: `  - [ ] a few feature blocks (lake, creek, hill, park) as box models — most important for communities whose real shape is close to a rectangle (e.g. Mahogany's lake)` / `  - [ ] community → feature mapping (OSM / City hydrology suggestion + CSV override) for launch communities` / `  - [ ] feature/landmark lots come from the stored lot plan (M1 🔁)`
- M13 DoD: `  - [ ] launch communities show their features` / `  - [ ] adding a feature = data change only`

### 2026-11-23 — v1.58
**Changed:** M11 ✅ Done (DoD "user has played it" added and ticked; Handoff notes on demo data and wording); current module → M13.

**Why:** The user played M11 and confirmed it (2026-11-23); CI green.

**Previous:**
- Header: `| Plan version | v1.57 |`, `| Current module | M11 Ranking & Share (🟨 Ready for playtest) |`
- Overview row: `| M11 | Ranking & Share | BE + FE | | M5, M10 | 🟨 |`; heading `### M11 — Ranking & Share 🟨`

### 2026-11-23 — v1.57
**Changed:** "Based on" → `requirement.md` v1.32 (player-facing text says "community", not "island"); the wording fix ships on the M11 branch.

**Why:** User decision during the M11 review (2026-11-23).

**Previous:**
- Header: `| Plan version | v1.56 |`, `| Last updated | 2026-11-22 |`, `| Based on | \`requirement.md\` v1.31 |`

### 2026-11-22 — v1.56
**Changed:** M11 items ticked; status 🟨 with Handoff.

**Why:** M11 implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.55 |`, `| Current module | M11 Ranking & Share (in progress; M10 ✅ Done) |`
- Overview: `| M11 | Ranking & Share | BE + FE | | M5, M10 | 🟦 |`
- M11: `### M11 — Ranking & Share 🟦`; all checklist items were `- [ ]`; no Handoff

### 2026-11-22 — v1.55
**Changed:** "Based on" → `requirement.md` v1.31. M11 🟦 in progress; scope detailed (cards on the phone, 🏆 sheet on the World Map, Monday announcement, revival effect, crown = last week's #1, site link preview); DoD "social previews" → the site-wide preview image.

**Why:** M11 started; user decisions 2026-11-22.

**Previous:**
- Header: `| Plan version | v1.54 |`, `| Based on | `requirement.md` v1.30 |`, `| Current module | M11 Ranking & Share (next; M10 ✅ Done) |`
- Overview: `| M11 | Ranking & Share | BE + FE | | M5, M10 | ⬜ |`
- M11:
```
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
```

### 2026-11-22 — v1.54
**Changed:** M10 ✅ Done; current module → M11.

**Why:** The user played M10 and confirmed it (2026-11-22); CI green.

**Previous:**
- Header: `| Plan version | v1.53 |`, `| Current module | M10 World Map (🟨 Ready for playtest) |`
- Overview: `| M10 | World Map | FE (2D) + BE | | M5 | 🟨 |`
- M10: `### M10 — World Map 🟨`

### 2026-11-22 — v1.53
**Changed:** "Based on" → `requirement.md` v1.30. M10: new item "island keeps the map's orientation" (ticked) and a Handoff note; M1's per-community camera item marked as replaced.

**Why:** User request 2026-11-22: islands should match the World Map's orientation.

**Previous:**
- Header: `| Plan version | v1.52 |`, `| Last updated | 2026-11-20 |`, `| Based on | `requirement.md` v1.29 |`
- M10: no orientation item; Handoff without "Island orientation"
- M1: `  - [x] Default camera angle per community (long side vertical on a portrait phone); growth animation for irregular land`

### 2026-11-22 — v1.52
**Changed:** M10 items ticked; status 🟨 with Handoff.

**Why:** M10 implemented and verified locally (tests and screen checks).

**Previous:**
- Header: `| Plan version | v1.51 |`
- Header: `| Current module | M10 World Map (in progress; M15 ✅ Done) |`
- Overview: `| M10 | World Map | FE (2D) + BE | | M5 | 🟦 |`
- M10: `### M10 — World Map 🟦`
- M10: all checklist items were `- [ ]`; no Handoff

### 2026-11-22 — v1.51
**Changed:** "Based on" → `requirement.md` v1.29. M10 🟦 in progress; invite uses M12; entry points and search added.

**Why:** M10 started; user decision 2026-11-22.

**Previous:**
- Header: `| Plan version | v1.50 |`
- Header: `| Based on | `requirement.md` v1.28 |`
- Header: `| Current module | M10 World Map (next; M15 ✅ Done) |`
- Overview: `| M10 | World Map | FE (2D) + BE | | M5 | ⬜ |`
- M10: `### M10 — World Map ⬜`
- M10: `  - [ ] empty community → invite prompt (link placeholder until M12). Animated rivers, CTrain and landmarks are Art Pass (`requirement.md` §9)`

### 2026-11-22 — v1.50
**Changed:** M15 ✅ Done (user confirmed). Header → M10 next.

**Why:** User confirmed M15 2026-11-22.

**Previous:**
- Header: `| Plan version | v1.49 |`
- Header: `| Current module | M15 Community Posts (🟨 Ready for playtest) |`
- Overview: `| M15 | Community Posts | FE + BE | | M9 | 🟨 |`
- M15: `### M15 — Community Posts 🟨`

### 2026-11-20 — v1.49
**Changed:** M15: post kinds centred on real community life (Safety, Local deals, Events, Lost & found, Free talk); reports limited to 3 a day, confirmed before sending, can be taken back, and exclude thanks (the reported post folds away for the reporter); operator restore.

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
