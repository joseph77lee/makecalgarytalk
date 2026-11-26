# Community identity & build map redesign — handoff (2026-11-25)

Everything agreed (and still open) with the operator about redesigning how a community island grows,
so a new session can continue without the chat history. Read this before touching the build map,
house rules, island plans, terrain or personas. Requirement and plan changes described here are
**not made yet** (requirement is still v1.46, PLAN v1.92).

---

## 1. Where things stand

| Item | State |
|---|---|
| M23 Art Pass 2 (voxel variety) | ✅ merged to `main` (98e2ed2). New voxel designs, varied people, gallery tools |
| Next module in PLAN | M16 Deploy & Playtest — **on hold**: the operator wants this redesign **before launch** |
| `spike/mahogany-concept` (pushed) | Gallery concept "Mahogany finished as a lake island" + lake-persona voxel pieces (`assets/voxel/landmarks.ts`: lakeside lighthouse, beach house, boardwalk, sailing dock, sailboat, beach umbrella, main-street shop, plaza). Not merged; reuse the pieces later |
| `spike/polyfork` (pushed) | Old low-poly experiment. Dropped (requirement v1.46). Can be deleted when the operator agrees |
| Operator's input files (untracked, Korean) | `docs/calgary_communities_enriched.csv`, `docs/calgary_voxel_build_map.md` (v2). Not committed because repo docs must be English (CLAUDE.md); step 2 of §8 turns them into English data. **Do not delete or `git clean` them** |
| `AGENTS.md` (untracked) | Not ours; leave it alone |

Facts checked during the discussion:
- 223 communities in `supabase/data/calgary_communities.csv` (17 with no population: business parks, industrial, new areas)
- Mahogany's stored island plan (`frontend/public/islands/MAH.json`) has **300 house lots** and 132 water tiles (the lake): the source of the "dense houses" look
- Mahogany's OSM features (`community_features.json`): `big-park`, `school`. Its strongest real identity is the lake (not in the feature list, but already drawn from hydrology data)

---

## 2. The vision (operator, 2026-11-25)

- The finished island should look like **an Animal Crossing–style beautiful island**, not a field of houses.
- Each island has **its own build map** (things to build that fit that community). Residents progress it **together**.
- The motivation to invite friends is the community's **own signature places and landmarks** ("let's bring friends so we can build our landmark").
- Personas and signature landmarks come from the operator's CSV (`calgary_communities_enriched.csv`).

---

## 3. Decisions agreed with the operator

1. **Stay voxel** (requirement v1.46). Polyfork is reference only.
2. **Goal = beautiful places, not house count.**
3. **Sequential unlocks:** "build A → B opens", replacing the current *grow-in-place* chains (Frozen pond → Skating rink → Hockey rink on one lot).
4. **Personas and signature landmarks from the operator's CSV** feed each island's build map.
5. **Community news (§11) stays as it is:** residents' own posts, new neighbours, farewells. Build progress keeps living in the existing **"What changed since yesterday"** panel (an earlier proposal to make build progress the centre of the news was **rejected**).
6. **Landmark models from photos:** the operator collects photos of real landmarks; models are voxel reinterpretations of their shape/colours/materials. No logos, sign text or business names. Third-party photos are **reference only and not committed** (git-ignored folder, e.g. `docs/references/landmarks/<CODE>/`); the operator's own photos may be committed.
7. **Models are built once as a library and used by data:** the build map refers to asset keys (§7.6b, §20.4); unknown keys draw the placeholder. Adding a model never changes game rules.
8. **Terrain can change** (operator offered): hills, escarpments and ravines may be expressed in the island floor.

Agreed in the follow-up session (2026-11-25), answering §4:

9. **Unlocks (replaces proposal B):** the next building opens only when the previous one is **completed** *and* the community meets a **resident-count** condition (key steps, especially the landmark, also need streak days / the highest resident count). Completing an opened building takes the residents' **daily contributions** (3 energy a day). Keep the required contribution **scaled by active residents** as in §7.6 today (5 per active resident × stage multiplier), so big communities do not finish in a day and small ones do not stall. Daily-visit drivers: energy resets daily, community streak, "What changed since yesterday", and "N more neighbours to build our landmark".
10. **Unique landmarks (C):** about 30 priority communities at launch, but aim to give **every** community its own landmark over time (data-only swaps after launch). Claude proposes the 30 candidates from the CSV (landmark specificity + population).
11. **Houses (replaces proposal D):** houses are **scenery**, placed and counted for beauty (2–4 residential zones, a cap, growing up instead of out), not one per resident. **Only "My house" is personal:** each Verified Resident keeps a **fixed lot** inside a residential zone, assigned by the server (stable position, ready for later visits); the owner sees it with the "My house" marker, everyone else sees an ordinary house. **No owner tap, no names, no "+N more residents"** on other houses (cooperative async game, not a live online world). **Windows are not tied to activity:** at night **every** house has lit windows (it looks prettier); this replaces the "active today → warm lights" rule of §7.2.
12. **A, E, F, G, H accepted** as proposed in §4.

---

## 4. Proposals (answered 2026-11-25: see §3 items 9–12; B and D were changed by the operator)

| # | Proposal (my recommendation) | Why |
|---|---|---|
| A | **2–3 parallel tracks, each sequential:** 🏘️ community (common: welcome sign → fire pit → plaza → community hall …), ⭐ persona (from CSV: e.g. lake: dock → boardwalk → beach club → the community's own landmark), 🌳 nature & decoration (tree lane → flower beds → bridge → park …) | A single chain stalls when its next step waits for "3 more neighbours" |
| B | **Unlock conditions:** most steps need only the previous building; key steps (especially the landmark) also need cumulative residents / streak days | Keeps the reason to invite friends |
| C | **Unique landmarks: 20–30 priority communities at launch**; the others end their persona track with the pattern's landmark + community name, unique ones added after launch | 223 unique models before launch is not realistic |
| D | **House rule:** only real residents' houses (perhaps a few village houses while an island is young, replaced by places as it grows); houses grouped in 2–4 residential zones (≈ 30 % of the land); when residents are many, houses grow *up* (townhouses/apartments) inside the zones instead of spreading; "My house" always exists (§7.2) | Removes the density problem at its source |
| E | **Site placement by meaning, not by track** (answer to the operator's worry that each track's buildings would clump together): persona places beside their nature (lake shore, hilltop), common places around the plaza, nature/decor along the paths between them, residential zones spread out; each new land tier brings a mix of tracks | Places connected by paths, like Animal Crossing |
| F | **After everything is built:** the decoration track keeps going (instead of level upgrades of built buildings) | The island keeps getting prettier |
| G | **Keep the engine:** daily 3 energy → choose a project (server-validated), community streak, cumulative Verified Residents, land growth by residents, append-only actions, max 3 constructions at once, progress applied next day, weekly ranking per 1,000 population | Tested and fits the vision; only the content and layout change |
| H | **Do it before M16** and regenerate every island plan | No players yet, so fixed house lots (§7.2, §7.8 "positions never change") cost nothing to redo now; after launch they would |

### 4.1 Terrain proposal (awaiting answer; recommended next step = gallery mock-up)

| Terrain | Expression | Example communities (CSV) |
|---|---|---|
| Hill | land stacked 2–3 levels, lookout on top, stairs or gentle ramps | Signal Hill (stone numbers on the slope), near Nose Hill |
| Escarpment / bluff | one long cliff splitting the island into upper and lower terraces, long stairs, viewpoint at the edge | Crescent Heights, Scarboro |
| Ravine / coulee | a channel one level below the land, creek at the bottom, trees on the slopes, bridges across | Edgemont, Fish Creek–side communities |
| River flat | river on the lowest level, river path one step up | Bowness, Inglewood |
| Waterfall | where a creek drops a level | Lake Bonavista (waterfall hill) |

Rules: at most 4 levels (−1 ravine floor, 0 ground, +1, +2), a level ≈ 0.5–0.6 tile so it reads in the isometric view; cliff sides drawn with the same layered dirt/rock as the island edge; **every level reachable** (≥ 2 stairs or ramps; avatar and villager pathfinding must handle height); **building lots flat on one level**; CTrain track stays on one level (bridges/embankments where it must cross); terrain fixed when the plan is generated. Height source: real elevation (City of Calgary open data — exact dataset to confirm) simplified to the 4 levels, with an operator override (like the feature-override CSV) using the CSV's `자연_지형` column.

Offered gallery mock-ups: (1) terraced hill + lookout, (2) escarpment with upper/lower terraces + long stairs, (3) ravine with creek, bridge and a small waterfall.

---

## 5. Review of the operator's files (summary)

### 5.1 `calgary_communities_enriched.csv`
Columns: original six + `특징` (character), `랜드마크` (landmarks), `주택_거리` (homes/streets), `자연_지형` (nature/terrain), `복셀_시그니처` (voxel signature), `복셀_테마` (voxel theme), `성장_단계` (growth stage).
- ✅ All 223 rows filled, original columns identical to the source CSV, landmarks are specific and usable (e.g. Hillhurst Riley Park/Plaza Theatre, Signal Hill Battalion Park stones, Lake Bonavista 1968 lake + waterfall hill, Mahogany 63-acre lake with two beaches).
- To fix: 40 free-text themes → map to ~10 pattern codes; no source/confidence columns; real brands/businesses to generalise (Scotiabank Saddledome, Stampede, Westman Village, Vivo, Glamorgan Bakery …); `성장_단계` was made for the dropped "whole city on one island" idea (meaning unclear now); Korean → English for the repo; Bayview and Haysboro still mention yachts (the v2 doc says it fixed this, but the CSV file was not changed: its timestamp predates the doc).

### 5.2 `calgary_voxel_build_map.md` (v2)
- ✅ Premise fixed (one island per community + 2D World Map); 10 build patterns (lake, river, downtown towers, historic main street, golf, new suburb, hill view, multicultural food street, mature suburb, special district) as the persona start; **rarity table** (a signature object only on one island: clock tower = McKenzie Towne, horses = Silverado, Battalion Park numbers = Signal Hill …); "do not build" rules (no houses on campus/industrial/market land, towers only on downtown islands); World Map shows a landmark icon when an island reaches its landmark stage; colour rule aligned with §19.1; prototype islands Inglewood, Lake Bonavista, McKenzie Towne.
- Issues raised: it proposes a parallel growth system (contribution points, population tiers, roles) instead of reusing the existing engine (→ proposal G); "no ranking between islands" conflicts with the existing weekly ranking; "no repeated house colour on an island" cannot hold with hundreds of houses (use "neighbours differ" instead); no layout rules (the density problem); brand and religious-building sensitivity (gurdwara, mosque, Ukrainian church as build targets — suggest scenery rather than build goals); unverified "Canada's first" claims; theme count stated as 70 (actual 40).

---

### 5.3 Landmark photos (`docs/references/landmarks/`, git-ignored, 2026-11-26)
The operator collected 222 reference photos (one per community; Twinhills has none) with `INDEX.csv` (code, pattern, structure, direct/substitute, source URL). Third-party images: reference only, never committed. Claude reviewed all of them on contact sheets:
- About 70 show a clear, modelable landmark (e.g. Signal Hill stone numbers, Centre Street Bridge lions, Mahogany beach club, Lake Bonavista).
- The rest show ordinary houses, neighbourhood aerials or skyline views: good for house style, not for a landmark.
- Problems, recorded per community in `photo_status`: **replace** (MCT looks AI-generated; ING is an unrelated building; OAK, CSC, MPK, RED are placeholders or maps), **duplicate** (LKV = CHK, MAC = HUN, WHL and EAU both the Peace Bridge, UNI and STA both McMahon Stadium), **interior** (ACA, MAN, PIN, UOC), **brand** (BVD, RCK, MRL, VAR, GLA, SVO, SGH: model generic versions), **sensitive** (CAS, MRT, REN, MIS places of worship and QPK cemetery: scenery, not build goals).
- Waiting on the operator: real photos for MCT and ING first (both are prototype islands), then the placeholders.

### 5.4 `supabase/data/community_personas.csv` (English data, 2026-11-26)
Built from the operator's CSV and the photo index (the generating script stays outside the repo because its keyword rules are in Korean). One row per community (223):
| Column | Meaning |
|---|---|
| `code`, `name` | as in `calgary_communities.csv` |
| `persona` | one of 10 patterns: `lake`, `river`, `downtown`, `historic_main_street`, `golf`, `new_suburb`, `hill_view`, `food_street`, `mature_suburb`, `special_district` (from the photo index; Twinhills → `new_suburb`) |
| `signature_landmark` | generic English name of the community's signature structure, no brands or business names; "(scenery)" marks sensitive ones |
| `landmark_reference` | the real place, for the operator and the modeller only (never shown as a sign or label in the game); hand-written for the priority list, otherwise the first landmark in the operator's CSV |
| `landmark_tier` | `unique` (own model) or `pattern` (the persona's landmark + community name, replaced later by data only) |
| `priority` | 1 = the launch list (31 communities, agreed 2026-11-26): SIG RAM UMR CGR COA · MAH LKB MCK BYV · BOW EAU CRE POI OGD · MCT HIL ING ALT CUR SNA · DNC DNE CHN · LEG KCA RVW ROC · WSP STA SHN GAG |
| `terrain_hint` | `flat` / `hill` / `escarpment` / `ravine`: keyword hint from the operator's CSV, corrected from the photo review. **A hint only**: the real island floor will come from elevation data (§4.1) |
| `photo_status`, `notes` | `direct` / `substitute` from the index, or the review flags above |
Not included yet: track steps per persona (comes with the model library), a secondary persona, confidence.

### 5.5 Place library (branch `spike/model-library`, 2026-11-26)
40 voxel places as asset keys `place.<persona>.<name>` in `assets/voxel/placeLibrary.ts`: each of the 10 personas has a 4-step track, the last step being the pattern landmark (gallery → Place library). Each model has a footprint in tiles and a site (shore, riverbank, hilltop, slope, street, park, plaza) for placement by meaning.
- **Operator decision (2026-11-26): every place takes land fitting its real size.** One tile ≈ a house lot (12–15 m), slightly compressed. Grounds that are big in reality are modelled at that size; buildings come on a lot with yard, forecourt, path and trees (`onGrounds` in `placeParts.ts`). A test requires each model to fill ≥ 70 % of its footprint. Current sizes: rink 4×3, storm pond 4×3, leisure centre 4×4, community hub 4×3, sandstone school 4×3, food hall 4×3, beach house 4×3, heritage railway 4×2, signature tower 3×3, market 3×2, teahouse 3×2, red barn 3×2, theatre 2×3.
- **Big grounds first decided:** Ball diamond 5×5, short golf hole 5×3, driving range 5×3, clubhouse 4×3, hay field and horse corral 3×3. **For the island plan generator:** a place may open only when the risen land has room for its footprint (a land-tier condition on top of the build-map conditions), so a 25-tile ball diamond never lands on a 64-tile young island.
- Known weak spots: the special-district track is ranch/heritage rail and does not suit all six special districts (brewery, university, business park); give those unique landmarks later.

## 6. Current growth rules vs. the vision (requirement v1.46)

| Rule | Now | Direction |
|---|---|---|
| §8 daily actions | 3 energy, pick a project, one tap, server-validated | keep (= contribution) |
| §7.5 streak | attendance day = ≥ half of Active Verified Residents act | keep |
| §7.8 land | real outline, 6 tiers by cumulative residents (64 … ~1,024 tiles), real water, fixed lot plan | keep; each tier opens a new **zone** with places; regenerate plans (+ terrain) |
| §7.2 houses | every house lot on risen land has a house (resident + village houses) | change (proposal D) |
| §7.6 building tree | the same 14 buildings for every community, grow-in-place chains; unique landmark only in Phase 3 via petition | change: tracks with sequential unlocks; persona track + unique landmark in the MVP |
| §7.6a build map screen | read-only tree list, progress bars, completion % | change: picture of the finished island at the centre, next places and what they need on top |
| §7.4 development level | Lv 0–4 from built buildings | change to build-map stage / completion |
| §7.9 identity | name sign, real water, 6 symbolic features, CTrain; landmarks Phase 3 | change: personas + landmarks in the MVP |
| §11 news | residents' posts, neighbours, farewells; game events in "What changed since yesterday" | **keep** |
| §12 ranking, share cards, invites | weekly per 1,000 population | keep |

Requirement sections a change will touch: §7.2, §7.4, §7.6, §7.6a, §7.6b (data shape: per-community / per-persona tracks), §7.8 (zones, terrain, regeneration), §7.9, §10.1, §19.4, §22.1, §22.6. §11 stays.

---

## 7. Concept already built

`spike/mahogany-concept`, gallery `?gallery` → bottom row **Concept** (Mahogany / lake landmarks / town centre): central plaza, lake persona chain (sailing dock → boardwalk → beach house → lakeside lighthouse), community hall, park, playground, main-street shops, welcome arch, ~20 houses in 3–4 blocks, green edge. Operator feedback before the CSV arrived: liked the direction; concerns became this redesign.

Gallery tools (on `main`): labels switch, camera pad (arrows/WASD pan, +/− zoom), "New voxel designs" beside current models. `?mock&plan=<CODE>&weather=snow&snow=1&time=night` shows any community in any weather; `?meter` shows fps/triangles/draw calls.

---

## 8. Next steps (recommended order)

0. ~~Get the operator's answers to §4 (A–H)~~ done (§3 items 9–12); terrain §4.1 accepted as the next step. Reply in Korean (see memory), keep repo text English.
1. ~~**Terrain gallery mock-up**~~ built on `spike/terrain-concept` (gallery → Concept → hill / escarpment / ravine / waterfall), waiting for the operator's review. Finding: the camera sees only the +x and +z sides, so cliffs and waterfalls must face the viewer (high ground towards the back of the island); one level reads weakly for an escarpment, two levels read well.
2. ~~**CSV cleanup → English data file**~~ done 2026-11-26 (§5.4); remaining: operator's replacement photos (§5.3). Original note:, e.g. `supabase/data/community_personas.csv`: `code, persona (one of ~10), persona_secondary, signature_landmark (generic English name), landmark_reference (real place, for the operator), track_steps, nature_terrain, source, confidence`; fix the yacht mentions; generalise brands; keep the operator's Korean file as their working copy.
3. **Model library**: persona-pattern places (≈ 30–40 voxel models) → unique landmarks for the 20–30 priority communities as photos arrive → gallery review; tests for lot fit, snow and night lights (follow `assets/voxel/designFit.ts` style).
4. **Requirement change** (changelog first, operator approval) + **PLAN**: a new module (e.g. M24 Community Identity) before M16; plan change entry in `changelog/plan.md`.
5. **Implementation**: island plan generator (zones, terrain, sites by meaning), building-tree data as tracks, house rule, build-map screen, World Map landmark icons; regenerate all island plans.

Process reminders: CLAUDE.md rules (ask → plan → implement; requirement/plan changes via changelogs; one branch per piece of work; English in the repo; status words; Mistake Log). Within a module, proceed on recommendations and stop only for reviews and merges (memory).
