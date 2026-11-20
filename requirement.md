# Requirements — MakeCalgaryTalk (makecalgarytalk.com)

| Item | Value |
|---|---|
| Document version | v1.21 |
| First written | 2026-11-16 |
| Last updated | 2026-11-19 |
| Status | Initial draft for starting MVP development |

---

## 📌 How to update this document

This document will keep changing during development. To never lose the reasons behind changes or past decisions, follow these rules:

1. **The body (Sections 1–23) always contains only the currently valid requirements.**
2. Before changing any requirement in the body, add a new entry at the **top** of **[24. Change Log]**.
3. Every Change Log entry must include:
   - **Date and new version number** (e.g. `### 2026-12-01 — v1.1`)
   - **Changed**: what changed
   - **Why**: why it changed (data, feedback, technical issue, etc.)
   - **Previous**: the old text/numbers **copied verbatim** before the change
4. If a whole section is dropped, remove it from the body and move its full text into the Change Log entry's Previous field.
5. Update `Document version` and `Last updated` at the top.
6. Versioning: rule/feature changes → `v1.x`; major change to MVP scope or concept → `v2.0`.

---

## 1. Goals

### 1.1 Business goals
- Generate side income; long-term, earn more than a full-time salary
- **Minimal operator involvement**: no direct sales or marketing; users come on their own and bring friends
- Validate in Calgary, then **replicate to other cities**

### 1.2 Product goals
- A first-time visitor feels the fun **within 60 seconds**
- Anyone who visits once always has **a reason to come back the next day**
- The game rules themselves **drive acquisition** (invites and sharing)

### 1.3 Success metrics (MVP)
- D1 retention (return the next day), D7 retention
- Number of share-card shares, number of visits via invite links
- Number of active communities (at least 1 verified resident)

### 1.4 Growth strategy (product principle)
The service grows in this order; features are judged by how they serve it. The **building tree (7.6) connects every step.**
1. **Show the finished neighbourhood** → "I want to build that" (a completed example on the first visit, 5.1)
2. **Daily visit + one action**, repeated, to complete it (near goals, next-day reveals, streaks)
3. **Fun and useful local information** once people visit often (newspaper, notices, events; unlocked by buildings, 7.6 / 11)
4. **Local business placements** once traffic is steady (Main Street lots, 22.4)

---

## 2. Concept

**A web game where Calgary communities compete by growing their neighbourhood together.**

- **The game has no separate name. The site itself (makecalgarytalk.com) is the game.**
- Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a **pastel voxel village on a floating diorama island** that grows as more residents join.
- Visual reference: `docs/references/` (VibeBase "Voxel Village" screenshots — floating voxel island, isometric view, pastel colours, small characters with speech bubbles).
- Residents take short daily actions **together** to **grow the community itself** (this is not a game about growing your own personal plot).
- When a community develops, its mini villagers are happy and the scenery becomes beautiful; when neglected, they look gloomy and the scenery turns bleak.
- Communities compete on development/participation.
- Long-term, it expands into a **neighbourhood platform** (community news, local business coupons).

---

## 3. Target users
- Calgary residents aged 13+
- Primary device: smartphone (mobile-first)
- Usage pattern: 1–2 minutes a day

---

## 4. Platform
- **Website**: makecalgarytalk.com (not an app-store app)
- **Mobile-first**: portrait layout by default, thumb-friendly controls (main buttons at the bottom), fast first load
- **PWA**: can be added to the home screen
- Do not rely on push notifications (iOS limitations). Retention comes from in-game mechanics plus optional email updates.

---

## 5. Core user flows

### 5.1 First visit (60 seconds)
1. Land on the site → a short **completed-neighbourhood example** (one image or a short animated scene, rendered with the real game engine so it shows only what can really be built) → "Let's build ours together" → snowy pastel **Calgary World Map**. Shown on the first visit only; afterwards it is available from the build map ("See a finished example"), not on every entry
2. "Which community do you live in?" → allow location
3. Tap into their community → the community's voxel diorama island appears, with **my avatar** standing in it
4. First action click → **immediate visible change**
   - Empty community: fog clears, "You are the Founding Resident!"
   - Existing community: construction progress bar rises, mini villagers cheer
5. The next goal from the building tree, e.g. "2 more neighbours and the frozen pond becomes a skating rink" + **Invite button**

### 5.2 Daily routine
1. **World Map**: see how developed all of Calgary is. Tap an empty community to invite a friend who lives there
2. **My community**: "What changed since yesterday" summary + mini villagers' mood
3. **Today's 3 actions**: pick one of the active projects and click
4. **Welcome sign / Warming hut / Community hall** (7.6): read the auto-generated community newspaper and the community board (later: resident posts, coupons, new business news)

---

## 6. Sign-up & resident verification

### 6.1 Sign-up
- **Anonymous account auto-created** on first visit (Supabase Anonymous Sign-in). No email/password
- **Bot protection**: Cloudflare Turnstile
- **Sign-up rate limit**: cap accounts created per IP/device per day
- **Link Google account (optional)**: prompt "Link Google to keep your progress" once the community grows or the user becomes verified
- Re-joining with the same Google account **restores the existing record** instead of creating a new one (deleted accounts keep only a hashed identifier)

### 6.2 Location check
- Determine the current community from browser geolocation
- **Never store exact coordinates.** The server checks inside/outside the community boundary, discards the coordinates immediately, and stores only the result (community ID)
- Never collect home addresses
- Show "Please verify residency on your phone" (PCs use Wi-Fi-based location and are inaccurate)

### 6.3 Resident verification
- Open the site from inside the same community on **3 different days within 7 days** → **Verified Resident**
- While verifying (days 1–3)
  - Full gameplay allowed; contributions are stored as "pending"
  - A visit from another community (e.g. workplace) doesn't count as a verification day; a visit from home later the same day does
- After verification
  - **No more location checks** (play from anywhere)
  - Pending contributions are applied to the community
- **Changing community**: see 6.4 (moving)
- Users getting verified in their workplace community are allowed in the MVP (keep rules simple); a free correction is available (6.4)

### 6.4 Moving to another community
Goal: moving never punishes the person who moves or the residents who stay.
- **Started by the user** ("I moved" in settings). Starts a location check and re-verification in the new community (3 different days within 7 days, same rules as 6.3). Moves cannot be detected automatically because Verified Residents are no longer location-checked.
- **During a move** (until re-verification completes):
  - The user stays a Verified Resident of the old community and keeps their house there (no limbo)
  - From the moment the move starts, they are **excluded from the old community's streak and Vitality denominators** (7.4, 7.5), so they cannot break its streak or drag its mood down
  - Their actions are stored as pending contributions for the new community (6.3)
  - If re-verification is not completed within **7 days** of starting, the move is **cancelled automatically**: nothing is lost, they count normally in the old community again, the cooldown is not used, and they can start again at any time
- **When the move completes**:
  - Their house moves to the new community and pending contributions are applied there
  - The old community **keeps** its cumulative Verified Resident count, completed buildings and unlocks (7.6, 7.8)
  - The old community's newspaper shows a **farewell line** (11)
  - **Personal records follow the person**: badges (including Founding Resident), total active days and, from Phase 2, profile and rank
  - Invite rewards already granted stay; moving never creates a new invite reward (12.3)
- **Cooldown**: 90 days from the last **completed** move (cancelled moves do not count)
- **One free correction**: within **14 days of the first verification**, a user may move once without waiting for the cooldown (e.g. verified at their workplace by mistake). Once per account.

---

## 7. Community model (shared growth)

### 7.1 Community states
- **Unsettled**: 0 residents. Covered by fog/clouds on the World Map
- **Settled**: the community's **Welcome sign** (first building of the tree, 7.6) is built → fog clears on the World Map; the first resident gets the "Founding Resident" badge. A first resident can build it on their first day

### 7.2 Resident houses
- One house per Verified Resident, with a **name tag (nickname)**
- Residents active today: lights on + chimney smoke
- Residents not active today: lights off
- **Last active day** = the later of the resident's last action day and their verification day (so a newly verified resident who has not acted yet still has a house)
- **No activity for 30+ days** (last active day is not within the last 30 Calgary days, including today): house is temporarily removed from the village (archived); it reappears when they return
- Houses are not something individuals grow; they show "I live in this community"
- Houses and buildings fill the island from the centre outward; the island itself grows with residents (see 7.8)
- Houses have **no relation to real addresses/locations**

### 7.3 Mini villagers (ambient characters)
- **Ambient characters that show the community's mood**; they never pretend to be real players (no names, not counted as residents)
- Count: based on resident count and Vitality. **Min 2–3, max 20**
- Behaviour/expressions change with Vitality (running and cheering ↔ sitting with heads down)
- **Action replay**: mini villagers replay real actions residents took today, with a system speech bubble
  - e.g. a mini villager shovels snow with "Sarah cleared the snow"
  - Always based on real records (nothing fake)

### 7.4 Community Vitality (0–100)
- Definition: 7-day average of the "daily active resident ratio" × 100
  - Daily active resident ratio = (Verified Residents who acted that day) ÷ (**Verified Residents whose last active day (7.2) is within the last 30 Calgary days, including that day**, i.e. residents whose houses are shown, excluding residents with a move in progress, 6.4); the ratio therefore never exceeds 1; 0 if the denominator is 0
  - This intentionally differs from the streak denominator (7.5, 7-day Active Verified Residents): the streak rewards regular players and must not be blocked by dormant residents, while Vitality honestly reflects the whole community — many dark houses make the community look gloomier, which motivates waking up neighbours
- Tuned to **fall slowly and rise quickly**: Vitality = 100 × **max(average ratio of the last 3 days, average ratio of the last 7 days)**, rounded. A burst of activity lifts the 3-day average fast; when activity stops, the 7-day average holds it up and it falls by about 1/7 per day
  - Days counted are **finished Calgary days** (yesterday and before), so Vitality changes once a day, like construction progress. Days before the community's first resident count as 0
- MVP has 3 mood levels

| Vitality | Mood | Scenery |
|---|---|---|
| 60–100 | Lively | Flowers, lights, clean streets, many mini villagers |
| 30–59 | Normal | Ordinary look |
| 0–29 | Gloomy | Piled snow, wilted trees, greyish tint, few mini villagers |

- Don't make it too depressing ("cute gloomy")
- Gloomy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card

### 7.5 Community Streak
- **Active Verified Resident (7-day)** = a Verified Resident who took at least one action within the **last 7 Calgary days, including today**. Residents inactive longer (including those whose houses are archived after 30 days) are **not** counted, so dormant residents cannot make the streak impossible.
  - Only **actions** count here; the verification day does not (unlike the house/Vitality "last active day" in 7.2), so newly verified residents who have not acted yet do not raise the bar for the streak.
  - Residents with a move in progress (6.4) are excluded from the old community's Active Verified Residents.
- **Community attendance day** = a day when **at least half of the Active Verified Residents** take an action
  - Half is rounded up (e.g. 6 active → 3 needed; 5 active → 3 needed); with 1 Active Verified Resident, that 1 person is enough
  - If there are 0 Active Verified Residents, the day does not count (streak breaks)
- **Streak length** = consecutive attendance days up to yesterday, **+1 as soon as today becomes an attendance day** (today never breaks it before midnight); the UI shows today's progress live
- Day boundary: Calgary time (America/Edmonton) midnight
  - Alberta's Official Time Act (2026) ended daylight saving time: no fall-back on 2026-11-01, UTC-6 year-round from then on. Always use the IANA zone `America/Edmonton` from up-to-date tzdata (2026c+); never hardcode UTC offsets
  - The boundary is computed **only on the server**; clients receive the current Calgary day and the next midnight instant from the server (browser tzdata may be outdated)
- UI example: "Mahogany 5-day streak! Today 2/6 active residents — 1 more keeps it going" (6 = Active Verified Residents)

### 7.6 Building tree (MVP)
Community unlock buildings and construction projects are **one building tree**. Each building: conditions met → a construction project everyone helps with → built (stays where it was built, forever) → opens its children. Starting values; the tree is **data** (see 7.6b) and grows after launch.

**Three seeds that grow in place** (a later building replaces the earlier one on the same lot, which is reserved at its final size) **plus branches** (new lots):

| Stage (actions ×) | Building | Opens when | On the island | Lot |
|---|---|---|---|---|
| 1. First day (×0.3) | Welcome sign | From the start | Community name at the entrance; community becomes Settled on the World Map (7.1) | Entrance |
| | Fire pit | From the start | Villagers gather to warm up; first meeting spot | Lot A |
| | Frozen pond | From the start | Villagers slide on the ice | Lot B |
| 2. First week (×1) | Warming hut | Fire pit + 3-day streak | Smoke from the hut, villagers come and go; **community board** (operator announcements, events, 11) | Lot A (grows) |
| | Playground | Welcome sign + 3-day streak | Kids swing and slide | New lot |
| | Sledding hill | Frozen pond + 3-day streak | Villagers sled down the hill | New lot |
| 3. Together (×1.5) | Skating rink | Frozen pond + 3 residents | Villagers skate; **the avatar glides on the ice** | Lot B (grows) |
| | Gateway arch | Welcome sign + 3 residents | Grand entrance arch | Entrance (grows) |
| | Off-leash dog park | Playground + 3 residents | Dogs run around | New lot |
| | Pathway lights | Gateway arch + 5-day streak | The paths glow; the community glows on the World Map at night | Along paths |
| 4. Community (×2) | Community hall | Warming hut + 5 residents + 7-day streak | **Newspaper and board move in**, events; opens the Main Street (22.4) | Lot A (grows) |
| | Lit hockey rink | Skating rink + 6 residents + 7-day streak | Evening hockey with villager fans | Lot B (grows) |
| | Community garden | Warming hut + 5 residents + 5-day streak | A garden that changes with the seasons | New lot |
| 5. Pride (×3) | Neighbourhood park | Community hall + 10 residents + 30-day streak | Picnics and festivals; park icon on the World Map | New lot (large) |
| Phase 3 | Landmark / custom sign | Community hall + 60-day streak + resident photo petition (16.2) | The community's own building | New lot |

- **Required actions** = base × stage multiplier; base = **5 per active resident, minimum 10** (active resident = last active day within the last 30 Calgary days, 7.4); stage 1 needs at least 3, so **a single resident finishes a first building on day one** (shown the next morning)
- Resident counts are **cumulative Verified Residents** (same basis as island size, 7.8); built buildings and opened conditions never re-lock
- **At most 3 constructions at a time**; other opened buildings wait in tree order
- When every opened building is built, projects **upgrade built buildings in place** (Lv 2, 3, …; ×1.25 per level), so there is always something to do
- Construction progress is **applied the next day**; visuals: scaffolding → frame → complete
- Each stage adds one new kind of condition: actions → streak → residents → residents + streak → long-term
- **Locked buildings are not drawn on the island** (their lot is plain, walkable land, so the island stays tidy and new buildings are a surprise); the build map (7.6a) shows them with what is missing (e.g. "2 more neighbours", "1 more streak day", "Build the Frozen pond first"). A building whose conditions are met appears on its lot as a faded silhouette marked ✨ "Ready to build"
- Names are generic (no trademarks)
- Community level is permanent (separate from the weekly ranking)

### 7.6a Village build map (MVP)
- A screen opened from the community view that shows the **building tree** with done / building / opened / locked, **remaining conditions and progress bars**, the island size track ("N more neighbours"), and an overall **completion %** of the community
- A "See a finished example" button reopens the completed-neighbourhood example (5.1)
- Read-only, built from server-computed values (streak, cumulative Verified Residents, building status); no game rules on the client
- Shares one screen with the personal growth view (13.3, Phase 2) as tabs: **Village | Me**

### 7.6b Extensible buildings
- The tree (buildings, stages, conditions, multipliers, footprints) is **data in the database**; adding a building = a data row + a model, no rule code changes
- A client that does not know a building yet draws a **generic placeholder model**, never an error
- Every island keeps **spare lots for future buildings** and separate **Main Street lots** (22.4)

### 7.7 Projects (construction)
- A project is the construction (or upgrade) of one building of the tree (7.6); residents **choose** which active project to help with each action
- Progress is counted from the append-only action log (never a stored counter)

### 7.8 Island shape and size (grows with residents)
- Each island has the **shape of the real community** (City of Calgary boundary), converted to tiles and scaled so every community has the **same maximum land** (about 1,024 tiles, like 32×32). Thin spurs are smoothed away and the largest connected part is used.
- The **whole outline is visible from day one** as clouds / translucent "future land"; real land rises inside it as the community grows, starting from the community's centre (the point farthest from the edge) and spreading by walking distance, so every stage is one connected island.
- Land grows with the **cumulative number of Verified Residents**:
  - Cumulative = **distinct people who have ever been Verified Residents of this community**. Residents who moved away (6.4) stay counted; a person who leaves and later returns is not counted again

| Cumulative Verified Residents | Land shown (tiles) |
|---|---|
| 1–2 | 64 |
| 3–5 | 144 |
| 6–10 | 256 |
| 11–25 | 400 |
| 26–50 | 676 |
| 51+ | all (~1,024) |

- Growth effect: new land **rises at the island edge**, mini villagers cheer, share card generated.
- **The island never shrinks.** Inactivity is shown through Vitality (mood/scenery), not size.
- **Positions never change.** Each community's lot plan (building lots, house lots, spare lots, Main Street lots, paths) is generated **once** and stored; later algorithm changes apply only to new communities or newly added lots.
- Buildings opened by the tree always have land: their resident conditions match the land available at that resident count.
- First-stage buildings sit around the plaza (a cosy village centre); later buildings get lots in the **newly grown outer land, spread in different directions**, so every growth brings new building spots.
- **Real water** (lakes, ponds, wetlands, creeks; City of Calgary Hydrology) is placed at its real position and shape inside the island when the plan is generated (e.g. Mahogany Lake). Water is not walkable and never holds buildings; if water would cut the land apart, a small bridge path keeps every part reachable. Land amounts count dry land only; where water sits next to the plaza, the first two stages get a little more dry land (up to 112 / 176 tiles) so the first buildings and Main Street fit.
- Default camera angle per community fits its shape on a portrait phone (long side vertical).
- UI shows the next growth goal (e.g. "2 more neighbours until the island grows").

### 7.9 Community identity & feature library
Each community gets its identity from its **real shape** (7.8) and from:
- **Name sign** at the island entrance
  - The **Welcome sign** is the first building of the tree (7.6) and grows into a Gateway arch; every community uses the same voxel models with its own name
  - A **custom sign** comes only from a resident photo petition (16.2, Phase 3): the real entrance sign's shape, colours and materials **reinterpreted in voxel style**, showing only the community name — **no developer logos or branding**
- **Real water** at its real position (7.8)
- **Signature features** from a reusable **feature library** (not real size/position — symbolic; e.g. hills, CTrain station, mall, school, large parks), placed on spare lots:
  - Example blocks: lake/pond, creek/river, hill, ravine, large park, off-leash dog park, ice rink, CTrain station, mall, school
  - Which features a community gets: auto-suggested from OpenStreetMap data, supplemented/overridden by a simple CSV maintained by the operator
- **Community landmarks** (Phase 3): a community-specific landmark model (e.g. a lakeside clubhouse), made only from a resident photo petition (16.2); until then communities use shared library blocks only
- Source data for feature suggestions: City of Calgary Open Data (e.g. hydrology water bodies) and OpenStreetMap; features stay symbolic (presence, not real size/position)
- **Activity-based feature upgrades** (Phase 2): features evolve with activity (e.g. Mahogany's lake → boat dock → lakeside trail)
- **Resident petitions** (Phase 3): see 16.2
- The real location/shape of each community is shown on the **World Map** (Section 9); the island is the cute, playable view.

---

## 8. Daily actions

- **3 energy per day** (resets at Calgary midnight)
- Action = choose one active project and **click once** (themes: clear snow, plant trees/flowers, help construction)
- Satisfying feedback is required: mini villager runs over, short sound effect, progress bar animation
- Occasional **random surprises** (e.g. "A moose wandered into the village!") — only a few types in the MVP
- No matter how much one person plays in a day, they count as **at most 1 person per day** for community score (ranking fairness)
- Always validate on the server (prevents tampering with daily limits)

---

## 9. Calgary World Map (city view)

- A **top-down, stylized 2D map of Calgary** drawn from the **real community boundary polygons** (City of Calgary Open Data), so users instantly recognise where their community is. The 3D island (Section 10) is the playable view.
- Not 3D: rendering ~200 islands at once is too heavy for phones. Keeps the first screen light.
- **Each community polygon shows its development with small illustrations inside it**, not just a colour (prototype demo built 2026-11-16):

| Development level | Shown inside the polygon |
|---|---|
| Unsettled | Grey dashed boundary, a cloud, empty ground |
| 1 | A couple of small houses + welcome sign |
| 2 | More houses + playground / skating rink |
| 3 | Houses + community hall with flag |
| 4 | Dense houses + community hall + neighbourhood park |

  - Level is derived from cumulative Verified Residents and unlocked buildings (same data as the island; 7.6, 7.8)
  - **Vitality is shown through mood**: lively = green ground, window lights, flowers; normal = plain; gloomy = greyish ground, roofs and trees
  - Crown on this week's #1 community
  - Illustrations use the **same designs as the island buildings** so the map and islands feel like one world
- **Layout rules**
  - Icons are placed inside the polygon (point-in-polygon), away from edges, without overlapping
  - **Icon count scales with polygon area** so large and small communities at the same level look equally developed
  - **Zoom-dependent detail**: at city zoom show a few representative icons per community; when zoomed in show more
  - Render with **Canvas** (thousands of small icons) for phone performance; SVG is acceptable for prototypes
- **Interaction**: tap a community → smooth zoom to it + info card (name, level, mood, residents) → "Enter island"; tap an unsettled community → **"Invite a friend from this community"** (pre-filled message)
- **Art Pass / later enhancements** (target design):
  - **Animated Bow and Elbow rivers** (flowing water), Glenmore Reservoir, major parks (Nose Hill, Fish Creek)
  - **CTrain lines with moving trains** along the real Red and Blue line routes (decorative animation, not a live schedule)
  - **Calgary landmarks** as special voxel-style buildings (e.g. Calgary Tower, Peace Bridge and other city symbols); no official logos or trademarks
  - Rocky Mountains on the western horizon, day/night tint and snow from real Calgary time/weather
  - Tapping a community plays a short transition into its diorama island
- Generated programmatically from data (community boundaries, OSM rivers/parks/major roads, CTrain routes/stations) → replicable to other cities

---

## 10. Community view (voxel diorama island)

### 10.1 Scene
- A **floating island in the community's real shape** (7.8; outline visible from day one, land grows inside it) with visible layered dirt underneath, on a soft pastel sky background
- **Isometric view** (orthographic camera); user can rotate/zoom within limits
- **Pastel colours, flat-shaded voxel/box objects**, soft shadows
- Contents: buildings of the tree (7.6) and their construction sites, locked-building silhouettes, resident houses, mini villagers, signature features (7.9), Main Street shops (22.4, Phase 4)
- Speech bubbles and name labels are **HTML overlays** positioned over 3D objects (crisp text, Korean/English supported)
  - A **labels toggle** shows or hides all island overlays (speech bubbles, name tags, construction progress, locked-building hints) so the scene can be viewed without clutter. On by default; the choice is remembered on the device
  - Mini villagers stroll slowly, each with its own pace and resting habits (not in lockstep)
- On entry, show **"What changed since yesterday"** (construction progress, new residents, trees planted, etc.)
- Show community streak status, remaining conditions for the next unlock, and the next island growth goal
- Users can visit and view other communities (actions only in their own community)

### 10.2 My avatar
- Each user has an avatar in **their own community's island**
- **Mobile: tap the ground to move** (pathfinding on the island grid, avoiding buildings/trees). **PC: click to move + WASD/arrow keys**
- No virtual joystick (conflicts with camera drag on phones)
- Camera gently follows the avatar
- **Action buttons stay at the bottom**: pressing an action makes the avatar run to the related spot (e.g. construction site) and perform it. Walking up and tapping the spot directly is also allowed (Art Pass polish)
- Tap a building/resident house to see info (e.g. Welcome sign / Community hall → newspaper; house → resident nickname and streak)
- **MVP: choose a shirt colour** from a small palette on first visit (changeable later); more customization (hats, accessories, emotes) is earned through ranks (13.3, Phase 2)
- Movement is driven by **destination events** ("avatar X moves to tile (5,7)"), not per-frame positions, so the same events can be broadcast for real-time presence later (22.3)

### 10.3 Other residents' avatars (asynchronous)
- In the MVP, **only my avatar moves under my control**; other residents are **not shown in real time**
- Other active residents appear standing near their houses or **replaying today's actions** (with system speech bubbles)
- Residents not active today are "indoors" (not shown)
- Real-time presence of other online residents is a later phase (22.3)

---

## 11. Village news (community newspaper)

- **Available from the MVP**: the newspaper opens from the **Welcome sign**; the **Warming hut** adds the community board (operator announcements, events); the **Community hall** takes both over and expands them (7.6)
  - Opens when the player taps the building; the avatar does not need to walk there
- **Auto-generated community newspaper** (no operator effort)
  - e.g. "Yesterday in Mahogany: 7 residents cleared snow and the playground was completed. Sarah hit a 7-day streak!"
  - Shows nicknames of active residents (recognition)
  - Farewell line when a resident moves away (6.4), e.g. "Sarah moved to Bridgeland — thanks for everything, neighbour!" (no times)
- **Upcoming updates (roadmap)**: e.g. "December: Community board opens"
- **Operator announcements (global)**: short notices written by the operator (events, maintenance, rule changes), shown to **all communities** at the top of the newspaper. No per-community announcements in the MVP
- Locked features are shown with a lock icon + "Coming soon"

---

## 12. Ranking & sharing

### 12.1 Weekly community ranking
- **Score = average daily active Verified Residents per 1,000 population**
  - Formula: (sum of daily active Verified Residents over the week ÷ 7) ÷ max(community population, 1,000) × 1,000
  - "Daily active Verified Residents" = Verified Residents who took at least one action that Calgary day (each person counts at most once per day)
- Only communities with **5+ Verified Residents who took at least one action during that ranking week** (Monday 00:00 – Sunday 23:59, Calgary time) are ranked
- Display: TOP 10 + my community's rank
- **Resets every Monday 00:00 (Calgary time)**; last week's results announced on Monday

### 12.2 Share cards
- The image **always includes the community name** (so it spreads in community Facebook groups, etc.)
- Generated on: weekly results, building completion, community revival, random surprises

### 12.3 Invites
- Personal invite link
- If the invitee becomes a **Verified Resident of the same community**, both get a reward (rare decoration/badge)
- If my invite brings the **first resident to an empty community**, I get the "Pioneer Sponsor" badge
- Rewards already granted are kept when either person moves (6.4); an invitee moving to another community never triggers a new reward

---

## 13. Resident profile & ranks (Phase 2)

### 13.1 Profile
- Nickname, community, rank, current streak, total active days
- Contributions per project, requests helped, badges
- **Public profiles never show activity times** (day-level only). Detailed history visible only to the owner

### 13.2 Ranks (example)

| Rank | Condition | Unlocks |
|---|---|---|
| Newcomer | Sign-up | Basic actions |
| Verified Resident | 3 of 7 days in community | Counts toward community score, longer board posts |
| Neighbour | 14 active days | Speech bubbles |
| Regular Neighbour | 30 active days | Post requests, bubble styles |
| Local Legend | 90 active days | Special badge, house decoration items |

### 13.3 Avatar growth (Phase 2)
- **Rank = avatar level.** One system, not two; ranks rise with **active days** (not action counts), so nobody can grind ahead and daily play stays the core
- **Rewards are cosmetic only** (hats, outfit colours, name tag frames, emotes, house decorations, a small companion such as a moose calf at Local Legend). Never gameplay advantages: daily energy stays 3 for everyone
- **Community-linked rewards**: when the community unlocks a building, residents who contributed during that period get a matching cosmetic (e.g. "Park Builder" hat), so village growth and avatar growth push each other
- **Contribution badge collection** per project type (e.g. "Snow Shoveler", "Gardener")
- **Me tab** of the build map (7.6a): next rank, active days remaining, and what it unlocks
- If paid cosmetics come later (22.4), earned and purchased items stay clearly separated

---

## 14. Resident board (Phase 2, communities with a Community hall)

| Rule | Newcomer | Verified Resident |
|---|---|---|
| Character limit | 100 | 300 |
| Posts per day | 1 | 1 |
| Links / photos | None | None |
| Label | "Newcomer" | "Verified Resident" badge |
| Visible for | 1 day | 3 days |

- Short notice-style posts
- Auto-hidden after 3 reports (reports from Verified Residents count double)
- Accounts abusing reports lose reporting ability
- Hidden posts are kept until auto-deletion at the end of their visibility period
- Profanity filter; warn/block phone number and address patterns

---

## 15. Speech bubbles (Phase 2)
- **"Neighbour" rank and above**
- 40 characters, 1 per day, disappears after 24 hours
- **Own community only** (visitors can only view)
- Start with **preset phrases** → open free text based on response
- Profanity filter + auto-hide on reports (same as the board)

## 16. Requests & petitions

### 16.1 Requests (Phase 2)
- **Mini villager requests**: "!" above a mini villager → help with one click → recorded in the newspaper
- **Player requests** ("Regular Neighbour" and above): other residents help with a click
- Requests are **in-game only, chosen from a preset list** (no real-world meetups or favours)

### 16.2 Community petitions (Phase 3)
- Residents petition to add a feature to their island
- **Start with choices from the feature library** (no free-text requests at first)
- Eligible for operator review only when supported by **≥30% of the community's Verified Residents or at least 10**, whichever applies
- The operator decides; **1–3 petitions granted per month** at a fixed cadence, announced as a "Petition results" event in the newspaper
- Keeps operator workload predictable
- **Photo petitions for a custom sign or landmark** (Phase 3, part of the petition system):
  - **Unlock:** the community has its Community hall (7.6), and the requester is **Regular Neighbour** (13.2) or above
  - A resident uploads a photo of the community's entrance sign or a public landmark with a short description; other Verified Residents support it; the same support threshold applies (≥30% or at least 10)
  - The operator recreates it in voxel style (no logos/branding, community name only); granted photo petitions count towards the same **1–3 per month**
  - The newspaper credits the requester by nickname (e.g. "Mahogany's new entrance sign, made from Sarah's photo!")
  - **Photo rules:** public places only (signs, parks, public buildings; **no homes, people or licence plates**); location metadata (EXIF/GPS) is removed on upload; originals are **never shown publicly**, are seen only by the operator, and are **deleted after the decision**; uploads are limited per resident; the uploader agrees the photo may be used as reference for the voxel model

---

## 17. Abuse prevention

### MVP
- Turnstile, per-IP/device sign-up rate limits
- 3-of-7-days location verification
- Community score counts each person at most 1 per day
- Flag on admin screen when a community's daily new verifications exceed 3× its usual level
- Server-side validation of daily action limits

### Add if needed
- Trust ramp (new accounts' contributions weighted less; full weight after 2–3 weeks)
- Phone number verification
- Mutual vouching by Verified Residents
- Count a mover toward a community's cumulative Verified Residents only after they have stayed **14+ days** (if community hopping to inflate island size/unlocks becomes a problem; 6.4 already limits it to physical 3-of-7-day visits and a 90-day cooldown)

---

## 18. Privacy & legal
- Terms of Use, Privacy Policy (start from templates; professional review once revenue starts)
- Location: state "used only to determine community; coordinates are not stored"
- **Ages 13+** only
- Clause allowing the operator to remove inappropriate content
- Email updates: send **only with explicit opt-in** (CASL)
- Ads: must be labelled "Ad/Sponsored"
- Trademarks: do not use official names/logos like "Calgary Stampede" → use generic terms like "Rodeo Season"
- Never expose activity times in public information
- Petition photos (16.2): location metadata stripped on upload, never published, operator-only, deleted after the decision
- Provide a contact email

---

## 19. Art requirements

### 19.0 MVP art policy
- **The MVP uses only simple shapes, no detailed art.**
  - World Map: flat pastel 2D polygons of community boundaries (Vitality tone; grey = unsettled)
  - Community view: **react-three-fiber (three.js) scene built from coloured boxes** — island tiles, box trees, box houses with box roofs, labelled box buildings, translucent/grey boxes for locked silhouettes, two-box characters for avatar and mini villagers
  - Projects: box construction site + progress bar UI
- Because the target style is voxel (made of boxes), the box-based MVP already looks close to the target. A working proof of concept was built on 2026-11-16 (~100 lines of three.js: floating island, layered dirt, box trees/houses, wandering villagers, HTML speech bubbles, tap-to-move avatar, construction progress, island growth).
- Purpose: ship the full MVP fast and validate the core loop before investing in art.
- Detailed art (19.1–19.4) is applied in the **Art Pass** (22.2) without changing game logic.

### 19.1 Style guide (target)
- **Pastel voxel style**: everything built from blocks/boxes, flat-shaded, soft shadows
- **Floating square diorama island** with layered dirt underneath, soft pastel sky background
- **Isometric orthographic view**
- **One fixed pastel palette** (to be defined; e.g. soft greens for grass, warm sand paths, coral/lavender/sky-blue roofs)
- Light from top-left, gentle ambient light, no harsh contrast
- Small, cute characters with HTML speech bubbles and name labels
- **Launch theme: winter** (snow-covered island, chimney smoke, window lights)
- Reference: `docs/references/` (VibeBase "Voxel Village" screenshots)

### 19.2 Production
- No outsourcing; made in-house
- **Simple objects built in code** from boxes (trees, houses, stalls, fences, lamps)
- **Detailed objects** made in **MagicaVoxel** (free) and exported (e.g. `.glb`/`.obj`)
- Free/CC0 voxel or low-poly asset packs may be used — **check licences for commercial use**
- AI is used for concepts/ideas only (AI is weak at clean voxel 3D models)
- Test consistency with a small set first, then scale

### 19.3 Effects handled in code
- Day/night: light colour/intensity + sky tint driven by real Calgary time
- Snow: particles
- Water shimmer: animated material colour
- Tree sway, character bounce/head-down: code tweens
- Window lights: emissive boxes at night
- Island growth: new edge tiles rise with a tween

### 19.4 Asset list (draft)
- MVP (code boxes): island tiles (grass, path, snow), dirt layers, trees, resident house (roof/wall colour variants via code), buildings of the tree (7.6: welcome sign → gateway arch, fire pit → warming hut → community hall, frozen pond → skating rink → lit hockey rink, playground, sledding hill, dog park, pathway lights, community garden, neighbourhood park) + construction stages (scaffolding/frame/complete) + silhouettes + generic placeholder, avatar, mini villagers
- Art Pass: refined buildings, feature-library blocks (lake, creek, hill, ravine, dog park, CTrain station, mall, school), props (lamps, fences, fields, stalls, benches), character variants with simple animation, surprise characters (e.g. moose), World Map assets (development icons matching island buildings, animated rivers, CTrain trains and lines, landmark buildings such as Calgary Tower and Peace Bridge, mountains), crown/flag

---

## 20. Technical requirements

### 20.1 Stack

**All TypeScript (+ SQL), serverless. No always-on backend server.**

| Area | Technology |
|---|---|
| Frontend app | **React + Vite + TypeScript** (SPA) |
| Community view (3D voxel diorama) | **react-three-fiber** (React renderer for three.js) + **drei** helpers (`OrthographicCamera`, `Instances` for repeated blocks, `Html` for speech bubbles/labels, controls, shadows) |
| World Map (2D) | **Canvas** rendered in a React component (community boundary polygons + thousands of small development icons); SVG acceptable for prototypes |
| State management | **Zustand** |
| UI styling | **Tailwind CSS** |
| Database | Supabase PostgreSQL + PostGIS |
| Auth | Supabase Auth (Anonymous + Google linking) |
| Game rules (server-side) | **Supabase Postgres functions (RPC)** with Row Level Security; **Supabase Edge Functions** (TypeScript) for location check, share cards, and logic too complex for SQL |
| Scheduled jobs | **pg_cron** (snapshots every 5–10 min, Monday ranking reset) |
| Real-time (later phase) | Supabase Realtime |
| Hosting / static files / snapshots | Cloudflare Pages / R2 (CDN) |
| Bot protection & rate limiting | Cloudflare Turnstile + Cloudflare rate limiting |
| Testing | **Vitest** (unit), **Playwright** (end-to-end, phone viewport), database tests against local Supabase |
| Error monitoring | Sentry (before launch) |
| Analytics | Plausible or PostHog |
| Voxel modelling | MagicaVoxel |

### 20.2 Data
- City of Calgary Open Data: **community boundaries**, **population per community**
- OpenStreetMap: rivers, parks, major roads, CTrain routes/stations (for generating the World Map base) and suggesting each community's signature features (7.9)
- Feature mapping CSV: operator-maintained overrides of community → feature-library blocks

### 20.3 Server cost principles
1. Anything that doesn't change (art, World Map base, community boundaries) is served as **static files via CDN**
2. Growth/progress is **computed from stored timestamps + rules** (no bulk updates of all records)
3. Daily actions update the screen immediately and are sent to the server in batches (**validation on the server**)
4. Community state and rankings are built as **JSON snapshots every 5–10 minutes** and served via CDN
5. No real-time connections (WebSocket) in the MVP. "Recently active" info is included in snapshots
6. Avatar movement is computed on the client and **not sent to the server** in the MVP (only actions are). Movement uses destination events so real-time presence can be added later by broadcasting them
- Target: **2–3 server calls per player per day**

### 20.3a 3D performance principles
- Use **instanced rendering** (drei `Instances` / InstancedMesh) for repeated blocks (tiles, trees) to keep draw calls low
- Per-frame updates (avatar/villager movement) run in `useFrame` with refs, **not React state**, to avoid re-rendering every frame
- Keep block counts and shadow map sizes modest; cap device pixel ratio at 2
- Cap visible characters per island (MVP: mini villagers ≤ 20)
- **Test on a low-end phone early** and regularly

### 20.3b Scalability principles (target: 10,000 concurrent users without redesign)
1. **Actions are append-only records.** Never update a shared counter (e.g. project progress) on every action; insert a row into the action log and aggregate when building snapshots. Avoids row-lock contention in popular communities.
2. **Stateless server logic.** No in-memory state in functions; everything lives in the database or snapshots, so capacity scales by plan/instances.
3. **Connection pooling** to the database from day one (Supabase pooler).
4. **Idempotent action submission.** Every action carries a client-generated unique ID; duplicates are ignored (prevents double energy spend on flaky networks).
5. **Rate limiting at the edge** (Cloudflare) per IP, plus per-user limits in server logic.
- Later, as traffic grows: upgrade Supabase plan and auth rate limits, cache share-card images per event, add monitoring/alerts, load test (e.g. k6) before big launches. Real-time presence (22.3) needs its own capacity plan (cap ~30 visible avatars per island, split popular communities into rooms).

### 20.4 Swappable rendering layer
- Game objects (community, house, building, silhouette, mini villager, project) are rendered through a **visual layer referenced by asset keys**, separate from game logic.
- MVP maps each asset key to a code-built box model (a React component); the Art Pass maps the same keys to refined voxel models. No game-logic changes required.
- Unknown asset keys (a building added on the server before the client has its model, 7.6b) render as a generic placeholder model.

### 20.5 Designed for city replication
- City boundary, community boundaries, population, and World Map base are separated as **per-city data**
- New city = swap data + add landmark art + feature mapping CSV

---

## 21. Admin tools & analytics

### MVP
- Daily new verifications per community + spike flags
- Analytics dashboard
  - Daily new visitors, % reaching the first action
  - D1 / D7 retention
  - Share-card shares, invite-link visits
  - Visits by community

### Phase 2
- Report moderation screen (list, hide/restore, suspend users)

---

## 22. Release phases & scope

### 22.1 MVP (winter launch theme)

**Included**
- Anonymous account + Turnstile + Google linking
- Location-based community detection, 3-of-7-days resident verification
- Calgary World Map from **real community boundary polygons**, each showing **small development illustrations** (houses, welcome sign, playground, community hall, park by level) with Vitality mood, #1 crown, tap-to-zoom and invite for unsettled communities
- Community view as a **box-built three.js voxel diorama island in the community's real shape** (outline from day one, land growth by residents, building tree, resident houses, mini villagers, 3 Vitality levels, action replay with speech bubbles, a few signature features from the feature library)
- Completed-neighbourhood example on the first visit (5.1)
- **My avatar**: tap/click to move with pathfinding; action buttons make the avatar run to the spot and act
- 3 daily energy + project choice + satisfying click feedback + a few surprises
- Community streak, **building tree** (7.6: three seeds, branches, upgrades in place), locked-building silhouettes
- **Village build map** (7.6a): the whole growth path with remaining conditions
- Avatar shirt colour choice (10.2)
- Next-day construction progress + "What changed since yesterday"
- Auto community newspaper + roadmap notice + "Coming soon"
- Weekly ranking (basic) + share cards
- Invite link + invite rewards + Pioneer Sponsor badge
- Update email subscription (optional, CASL opt-in)
- Terms of Use, Privacy Policy
- Analytics integration, abnormal sign-up flags

**MVP retention engine (must work)**
1. Community changes overnight (construction progress)
2. Community streak (sense of responsibility)
3. Silhouette of the next building (anticipation)
4. Real weather/time (novelty)
5. Community newspaper with my name (recognition)

### 22.2 Phase 2
- **Art Pass**: refined pastel voxel models and props (Section 19.1–19.4), styled World Map with animated Bow/Elbow rivers, moving CTrain trains, Calgary landmark buildings and transitions, character variants and animations, avatar customization, walk-up-and-tap actions, day/night and weather effects
- Activity-based signature feature upgrades (7.9)
- Resident board + report moderation screen
- Profile & ranks, **avatar growth** (rank = level, cosmetic rewards, community-linked rewards, badge collection, Me tab; 13.3)
- Speech bubbles (preset phrases → free text)
- Mini villager requests, player requests
- 5 Vitality mood levels

### 22.3 Phase 3
- Seasonal events (Rodeo Season, winter aurora, etc.), collections
- Visitor mode (interactions when visiting other communities)
- Community landmark (building tree stage after the Community hall: 60-day streak + resident photo petition, 7.6 / 16.2)
- Aurora events
- **Real-time presence**: other online residents' avatars visible and moving in the same island (broadcast destination events per community channel, e.g. Supabase Realtime; cap ~30 visible avatars per island; distinct label colour for online residents; simple emoji greetings)
- Community petitions (16.2)
- Advanced share/update celebration events

### 22.4 Phase 4 (monetization)
- **Local business buildings as ads** (e.g. a sushi restaurant in Mahogany shows its shop and "50% off sushi this month" on the Mahogany island)
  - Shops stand on **Main Street lots** (reserved along the entrance path, separate from community lots), which open once the community has built its **Community hall** (7.6): businesses advertise only where people really visit, and residents see shops arriving as a reward
  - The shop (voxel, shop name on the sign) shows the month's message as a bubble/banner; tapping opens an offer card (later: coupons). Real business names/logos only under a contract with that business
  - Messages are **approved by the operator** before they appear; shops disappear when the period ends (Main Street lots are temporary by design, so community buildings never move)
  - Self-serve purchase page (choose community and period, card payment, choose building art)
  - Must be labelled "Ad/Sponsored"; no effect on game outcomes
  - Pricing based on each community's active resident count
- Community coupons, new business news
- Open only after there is traffic

### 22.5 Expansion
- Replicate to other cities (Edmonton → Vancouver, Toronto, etc.)
- "Battle of Alberta" Calgary vs Edmonton season
- Apartments/condos (multi-resident buildings) once communities get very large

### 22.6 Development order

> High-level summary only. The detailed, module-based build order, scope checklist and status live in **`PLAN.md`** (which takes precedence for ordering). No time estimates are kept: with AI-assisted coding, durations are unpredictable.

| Step | Work |
|---|---|
| 1 | Load community boundary/population data, anonymous login, location → community, resident verification |
| 2 | react-three-fiber box-built diorama island (island growth, buildings, houses, mini villagers, Vitality, speech bubbles) + avatar tap-to-move with pathfinding + swappable rendering layer |
| 3 | Daily actions, projects, community streak, unlocks, action replay, newspaper |
| 4 | World Map, weekly ranking, share cards, invites |
| 5 | Legal pages, analytics, email subscription, polish → family/friends test |

### 22.7 Launch
- After family/friends testing, post on r/Calgary and community Facebook groups with a "Calgary dev made this" story
- After the initial spark, growth comes from in-game invite/share mechanics

### 22.8 Open items
- [ ] Pastel palette and lighting values (before the Art Pass); save reference screenshots in `docs/references/`
- [ ] Feature library list and community → feature mapping for launch communities
- [ ] Island shape conversion parameters (smoothing, minimum width, centre choice) and lot plan generation per community (tuning)
- [ ] Building tree numbers (conditions, stage multipliers) and models for the new buildings
- [x] Project list and required actions per project (decided 2026-11-18, see 7.7)
- [ ] Vitality smoothing details (rise/fall speed)
- [ ] Random surprise types and probabilities
- [ ] Newspaper sentence templates
- [ ] Analytics tool choice (Plausible vs PostHog)
- [ ] Terms of Use / Privacy Policy wording
- [ ] Concrete invite reward items
- All numbers are **starting values** to be tuned with post-launch data

---

## 23. Glossary

| Term | Meaning |
|---|---|
| Community | A real City of Calgary community (neighbourhood), e.g. Mahogany. The team unit of the game |
| Resident | A user who belongs to a community |
| Newcomer | A user who has not finished resident verification |
| Verified Resident | A user who opened the site from inside their community on 3 different days within 7 days |
| House | One per Verified Resident in the community view; a presence marker, not something the user grows |
| Mini villager | Ambient voxel character showing the community's mood; never represents or impersonates a real player |
| Avatar | The user's own controllable character in their community's island (tap/click to move) |
| Destination event | Avatar movement expressed as "move to tile (x, y)"; local-only in the MVP, broadcastable for real-time presence later |
| Island / diorama | The floating voxel island in the real shape of one community; its land grows inside the visible outline with cumulative Verified Residents |
| Feature library | Reusable signature blocks (lake, creek, hill, park, etc.) assigned to communities for identity |
| Petition | Residents' request to add a feature-library block to their island; operator decides monthly |
| Action replay | Mini villagers re-enacting real actions residents took today, with a system speech bubble |
| Energy | Daily action allowance (3 per day) |
| Project | The construction or upgrade of one building of the tree, which residents contribute actions to |
| Vitality | 0–100 score of recent community activity that drives mood and scenery |
| Community Streak | Consecutive days on which at least half of the Active Verified Residents took an action |
| Active Verified Resident | A Verified Resident who took at least one action within the last 7 Calgary days (including today); denominator for the streak (Vitality uses the 30-day basis, 7.4) |
| Last active day | The later of a Verified Resident's last action day and verification day; decides whether their house is shown (30 days) and the Vitality denominator |
| Move | A Verified Resident changing community: user-started, re-verification in the new community, no limbo, auto-cancel after 7 days, 90-day cooldown, one free correction within 14 days of first verification (6.4) |
| Cumulative Verified Residents | Distinct people who have ever been Verified Residents of a community; never decreases (movers stay counted, returners are not counted twice) |
| Building tree | The data-driven tree of community buildings: conditions (parent building, residents, streak) open a building, residents build it, it opens the next ones (7.6) |
| Unlock | A building of the tree whose conditions are met (it can now be built) |
| Main Street | Reserved temporary lots for local business shops (Phase 4, 22.4) |
| Silhouette | Faded preview of a locked building |
| World Map | Top-down 2D map of real Calgary community boundaries showing each community's development |
| Community view | The 3D voxel diorama island screen of a single community |
| Village Notice Board / Community newspaper | Auto-generated daily news of what happened in the community |
| Share card | Shareable image that always includes the community name |
| Founding Resident | Badge for the first resident of an unsettled community |
| Pioneer Sponsor | Badge for inviting the first resident of an empty community |
| Snapshot | Pre-computed JSON of community state/ranking, refreshed every 5–10 minutes and served via CDN |

---

## 24. Change Log

> Always add new entries at the **top** of this section. Format:
> ```
> ### YYYY-MM-DD — vX.Y
> **Changed:** what changed
> **Why:** why it changed
> **Previous:** the old text, verbatim
> ```

### 2026-11-19 — v1.21
**Changed:** 7.4: Vitality formula (max of 3-day and 7-day averages of finished days). 7.5: streak length counts up to yesterday plus today once today is an attendance day.

**Why:** M5 needs exact rules; "fall slowly, rise quickly" had no formula (user chose these options, 2026-11-19).

**Previous:**
- 7.4: `- Tuned to **fall slowly and rise quickly**`
- 7.5: (no rule for streak length or for counting today)

### 2026-11-19 — v1.20
**Changed:** 7.8: land amounts count dry land only; communities with water next to the plaza get a little more first/second-stage land.

**Why:** Found while generating plans with real water (M1 rework): in 13 of 223 communities a central lake left no room for the first buildings or Main Street in the standard first-stage land.

**Previous:**
- 7.8: `if water would cut the land apart, a small bridge path keeps every part reachable.`

### 2026-11-19 — v1.19
**Changed:** 7.6: locked buildings are no longer drawn on the island (shown in the build map); opened buildings appear as ✨ silhouettes. 7.8: first-stage buildings around the plaza, later buildings in newly grown outer land spread in different directions; real water (City Hydrology) placed at its real position with bridges if needed. 7.9: real water listed; the feature library stays symbolic for other features.

**Why:** User decisions during the M1 rework (2026-11-19): showing every future building as a lock clutters the island; lots were all crowded in the middle; communities should keep their real terrain character from the start (water data is available and precise; hills have no city elevation data, so they stay symbolic for now).

**Previous:**
- 7.6: `- Locked buildings appear as **faded silhouettes** on their lots with what is missing (e.g. "2 more neighbours", "1 more streak day", "Build the Frozen pond first")`
- 7.8: `- Buildings opened by the tree always have land: their resident conditions match the land available at that resident count.`
- 7.9: `- **Signature features** from a reusable **feature library** (not real size/position — symbolic). They matter most for communities whose real shape is close to a rectangle (e.g. Mahogany, whose lake is not part of the boundary):`

### 2026-11-19 — v1.18
**Changed:** Added 1.4 Growth strategy (finished example → daily action → local information → business placements). 5.1: completed-neighbourhood example on the first visit; next goal from the tree. 7.1: Settled when the Welcome sign is built. 7.6 / 7.6a / 7.7: unlocks and the project catalog replaced by one **building tree** (three seeds that grow in place, branches, stage multipliers, upgrades in place); build map shows the tree and completion %; new 7.6b extensible buildings (tree as data, placeholder models, spare and Main Street lots). 7.8: islands take the **real community shape** with equal maximum land, outline visible from day one, land grows with residents, lot plan generated once and stored. 7.9, 10.1, 11, 20.4, 22.1, 22.3, 22.4 (Main Street opens after the Community hall; operator-approved shop messages), 22.8, 23 updated to match. Old building names elsewhere (5.2, 9 development levels, 10.2, 14, 16.2, 19.4, 22.1) renamed to the tree's buildings.

**Why:** User decisions (2026-11-18/19): buildings must stay where they are built; growing participation must grow the island; first buildings must be quick, visibly meaningful seeds of bigger facilities; the tree must carry the growth strategy from motivation to local information to business placements; islands should look like the real community (preview showed distinctive shapes are recognizable; showing the outline from day one fixes identical early islands).

**Previous:**
- 1.3 (verbatim):
```
- Number of active communities (at least 1 verified resident)

---
```
- 5.1: `1. Land on the site → snowy pastel **Calgary World Map**`
- 5.1: `5. "N more neighbours / N more streak days until the playground" + **Invite button**`
- 7.1: `- **Settled**: first resident arrives → fog clears; the first resident gets the "Founding Resident" badge`
- 7.6-7.7 (verbatim):
```
### 7.6 Community unlocks (MVP)

| Condition | Unlocks |
|---|---|
| 3-day community streak | Playground |
| 7-day streak + 5 Verified Residents (cumulative) | Community Centre (resident board feature opens in Phase 2) |
| 30-day streak | Park |

- Resident counts in unlock conditions are **cumulative Verified Residents** (same basis as island size, 7.8); an unlocked building never re-locks
- Locked buildings appear as **faded silhouettes** with "1 more streak day until the Playground"
- Community level is permanent (separate from the weekly ranking)

### 7.6a Village build map (MVP)
- A screen opened from the community view that shows the **whole growth path at a glance**, so residents know what can still be built:
  - Unlock track: Settled → Playground → Community Centre → Park → later content as "Coming soon" (e.g. Community landmark, Phase 3)
  - Island size track: current tier → next tier with "N more neighbours"
  - Each step shows done / next / locked, with **remaining conditions and progress bars** (e.g. "Community Centre: streak 3/7 days · residents 4/5")
  - Completed projects list
- Read-only, built from the same server-computed values as the community state (streak, cumulative Verified Residents, unlock status); no extra game rules on the client
- Shares one screen with the personal growth view (13.3, Phase 2) as tabs: **Village | Me**

### 7.7 Projects (construction)
- A community has **2–3 active projects** at a time (e.g. Build an ice rink / Make a flower path / Holiday decorations)
- When acting, residents **choose** which project to contribute to
- Construction progress is **applied the next day** (progress overnight → a reason to check tomorrow)
- Construction visuals: scaffolding → frame → complete
- Project list and required amounts (starting values, tune after launch):
  - **3 active projects** at a time; when one completes, the next one starts on the day its completion becomes visible
  - Catalog in order: Build an ice rink → Make a flower path → Holiday decorations → Build a snowman garden → Light up a lantern street → Hang bird feeders; after the sixth, the catalog repeats at **level 2, 3, …**
  - Required actions, fixed when the project starts: **5 per active resident, minimum 10**, ×1.25 per level (active resident = last active day within the last 30 Calgary days, same basis as the Vitality denominator, 7.4). About 3 days when half the residents act
```
- 7.8 (verbatim):
```
### 7.8 Island size (grows with residents)
- Every community is shown as the **same square floating island**, regardless of the real community's size or shape.
- The island grows with the **cumulative number of Verified Residents**:
  - Cumulative = **distinct people who have ever been Verified Residents of this community**. Residents who moved away (6.4) stay counted; a person who leaves and later returns is not counted again

| Cumulative Verified Residents | Island size (tiles) |
|---|---|
| 1–2 | 8×8 |
| 3–5 | 12×12 |
| 6–10 | 16×16 |
| 11–25 | 20×20 |
| 26–50 | 26×26 |
| 51+ | 32×32 (max) |

- Growth effect: a new ring of land **rises at the island edge**, mini villagers cheer, share card generated.
- **The island never shrinks.** Inactivity is shown through Vitality (mood/scenery), not size.
- Existing buildings stay in place; new ones fill the new outer area. Building positions follow a fixed layout template per size tier.
- UI shows the next growth goal (e.g. "2 more neighbours until the island grows").
```
- 7.9 (verbatim):
```
Because every island has the same shape, each community gets its identity from:
- **Name sign** at the island entrance
  - **All communities start with the default sign** (community name on a shared voxel sign), including launch communities
```
- 7.9: `- **Signature features** from a reusable **feature library** (not real size/position — symbolic):`
- 10.1: `- A **floating square island** (size per 7.8) with visible layered dirt underneath, on a soft pastel sky background`
- 10.1: `- Contents: community buildings (playground, community centre, park, etc.), resident houses, mini villagers, signature features (7.9), project construction sites, locked-building silhouettes, name sign`
- 11 (verbatim):
```
- **Available from the MVP** (Village Notice Board). Moves into/expands at the Community Centre once built
  - Opens when the player taps the Village Notice Board (or the Community Centre once built); the avatar does not need to walk there
```
- 20.4: `- MVP maps each asset key to a code-built box model (a React component); the Art Pass maps the same keys to refined voxel models. No game-logic changes required.`
- 22.1: `- Community view as a **box-built three.js voxel diorama island** (island growth by residents, buildings, resident houses, mini villagers, 3 Vitality levels, action replay with speech bubbles, name sign, a few signature features from the feature library)`
- 22.1: `- Community streak, unlocks (Playground / Community Centre / Park), locked-building silhouettes`
- 22.3: `- Community landmark (60-day streak, chosen by resident vote; custom landmarks come from photo petitions, 16.2)`
- 22.4 (verbatim):
```
- **Local business buildings as ads**
  - Self-serve purchase page (choose community and period, card payment, choose building art)
```
- 22.8: `- [ ] Island size tiers and building layout templates per tier (tuning)`
- 23: `| Island / diorama | The floating square voxel island representing one community; grows with cumulative Verified Residents |`
- 23: `| Project | A community construction/beautification goal residents contribute actions to |`
- 23: `| Unlock | A community building/feature that opens when streak/resident conditions are met |`
- 5.2: `4. **Village Notice Board / Community Centre**: read the auto-generated community newspaper (later: resident posts, coupons, new business news)`
- 9 (verbatim):
```
| 1 | A couple of small houses |
| 2 | More houses + playground |
| 3 | Houses + playground + park |
| 4 | Dense houses + playground + park + community centre with flag |
```
- 10.2: `- Tap a building/resident house to see info (e.g. Community Centre → newspaper; house → resident nickname and streak)`
- 14: `## 14. Resident board (Phase 2, communities with Community Centre)`
- 16.2: `- **Unlock:** the community has its Community Centre (7.6), and the requester is **Regular Neighbour** (13.2) or above`
- 19.4: `project buildings (playground, community centre, park, ice rink) + construction stages (scaffolding/frame/complete) + silhouettes, name sign,`
- 22.1: `each showing **small development illustrations** (houses, playground, park, community centre by level)`

### 2026-11-18 — v1.17
**Changed:** 7.7: replaced the pointer to open items with the decided starting values (3 active projects, 6-kind catalog repeating with levels, required actions = 5 per active resident, min 10, ×1.25 per level, fixed at project start). 22.8: project list item marked decided.

**Why:** User decisions during M3 (2026-11-18): scaling with active residents keeps projects fair for 1-resident and 200-resident communities; six kinds plus levels avoid repetition without many new models.

**Previous:**
- 7.7: `- Project list and required amounts: see [22.8 Open Items]`
- 22.8: `- [ ] Project list and required actions per project`

### 2026-11-18 — v1.16
**Changed:** Added 7.6a Village build map (MVP). 10.2: MVP shirt colour choice; further customization via ranks. Added 13.3 Avatar growth (Phase 2: rank = level by active days, cosmetic-only rewards, community-linked rewards, badge collection, Me tab). 22.1 MVP list: build map and shirt colour. 22.2 Phase 2: avatar growth.

**Why:** User idea (2026-11-18): residents are more motivated when they can see what can be built (village build-up) and when their avatar grows too (avatar build-up). Cosmetic-only, active-day-based growth keeps play fair and community-first.

**Previous:**
- 10.2: `- Avatar customization (colours, hat): Art Pass / rewards`
- 22.2: `- Profile & ranks`
- 7.6a, 13.3 and the two 22.1 lines did not exist.

### 2026-11-18 — v1.15
**Changed:** 7.9: all communities (including launch communities) start with the default sign; custom signs and community landmarks come only from resident photo petitions (Phase 3). 16.2: added photo petitions (unlock: Community Centre + Regular Neighbour; same support threshold and 1–3/month cadence; newspaper credit; photo privacy rules). 22.3: landmark line links to photo petitions. 18: petition photo privacy line.

**Why:** User decision (2026-11-18): residents, not the operator, should drive custom signs and landmarks to encourage participation; fits the existing petition system and keeps operator work predictable. Photos can carry location metadata, faces, homes and plates, so strict handling is required.

**Previous:**
- 7.9 sign note: `  - Inspired by the community's real entrance sign (operator photos are reference only, never shipped): shape, colours and materials **reinterpreted in voxel style**, showing only the community name — **no developer logos or branding**. Communities without a custom sign use the default sign`
- 7.9: `- **Community landmarks (optional, launch communities only)**: a community-specific landmark model (e.g. a lakeside clubhouse) added on top of the shared feature library for the launch communities; all other communities use shared library blocks only`
- 22.3: `- Community landmark (60-day streak, chosen by resident vote)`
- 16.2 photo petitions and the 18 photo line did not exist.

### 2026-11-18 — v1.14
**Changed:** 11: the newspaper opens on tap of the Village Notice Board / Community Centre without the avatar walking there (clarification); added global operator announcements shown to all communities at the top of the newspaper (no per-community announcements in the MVP).

**Why:** User decisions (2026-11-18): tapping the building is enough; operator notices should be one global feed to keep operation effort low.

**Previous:** 11: `- **Available from the MVP** (Village Notice Board). Moves into/expands at the Community Centre once built` (no sub-note); the operator announcements item did not exist.

### 2026-11-18 — v1.13
**Changed:** 7.9: name sign is a voxel reinterpretation of the real entrance sign (photos reference only, community name only, no developer logos); added optional community-specific landmarks for launch communities only; named City of Calgary Open Data hydrology + OpenStreetMap as feature-suggestion sources. Timing unchanged (M13).

**Why:** User discussion after the M1 first look: communities should feel like themselves (e.g. Mahogany's lake, its entrance sign, a representative building). Photos of real signs would clash with the voxel style and may carry developer trademarks; unique landmarks for 200+ communities are too costly, so only launch communities get them.

**Previous:** 7.9: `- **Name sign** at the island entrance` (no sub-note); the landmark and source-data items did not exist.

### 2026-11-18 — v1.12
**Changed:** 10.1: added two notes under the HTML overlay item: a labels toggle (show/hide all island overlays, on by default, remembered on the device) and mini villagers strolling slowly with individual pace.

**Why:** User feedback after the M1 first look: bubbles, construction progress and lock hints shown together look cluttered; villagers moved too fast and bounced in lockstep.

**Previous:** 10.1: `- Speech bubbles and name labels are **HTML overlays** positioned over 3D objects (crisp text, Korean/English supported)` (no sub-notes)

### 2026-11-18 — v1.11
**Changed:** 7.5: added two notes under "Day boundary": Alberta has been on UTC-6 year-round since 2026-11-01 (use up-to-date `America/Edmonton` tzdata, never hardcode offsets), and the boundary is computed only on the server. The rule itself (Calgary midnight) is unchanged.

**Why:** Found during M0: Alberta's Official Time Act (passed 2026-06-18, IANA tzdata 2026c) ended DST. The local Postgres (tzdata 2026f) follows it, but Node 20 (tzdata 2025a) and older browsers still switch back to UTC-7, which would put the client's day boundary one hour off from the server's.

**Previous:** 7.5: `- Day boundary: Calgary time (America/Edmonton) midnight` (no notes)

### 2026-11-17 — v1.10
**Changed:** Defined how moving to another community works, choosing the most user-friendly approach.
- 6.3: "Changing community" now points to 6.4; workplace line mentions the free correction
- 6.4 (new): user-started move; stays in the old community until re-verified (no limbo); excluded from the old community's streak/Vitality denominators during the move; auto-cancel after 7 days with nothing lost; old community keeps cumulative count/buildings/unlocks; farewell line; personal records follow the person; 90-day cooldown from the last completed move; one free correction within 14 days of first verification
- 7.4, 7.5: denominators exclude residents with a move in progress (cross-reference to 6.4)
- 7.8: cumulative Verified Residents = distinct people ever verified in the community (movers stay counted, returners not counted twice)
- 11: farewell line in the newspaper
- 12.3: invite rewards kept on move; no new reward from moving
- 17 (Add if needed): 14-day stay before a mover counts toward cumulative
- 23: added Move, Cumulative Verified Residents

**Why:** Review found the old rule ("once every 90 days, requires re-verification") left gaps: membership during re-verification was undefined, a mover stayed in the old community's 7-day streak denominator and could break its streak, a user verified at their workplace by mistake had to wait 90 days, and what happens to badges/contributions was undefined. Making the island depend on current residents was rejected because islands would shrink and punish the residents who stay. The abuse risk of inflating cumulative counts by hopping is small (physical 3-of-7-day visits, 90-day cooldown → at most ~4 communities/year), so it is accepted and monitored, with a stricter rule ready in §17.

**Previous:**
- 6.3:
```
- **Changing community**: once every 90 days (requires re-verification)
- Users getting verified in their workplace community are allowed in the MVP (keep rules simple)
```
- 6.4: did not exist
- 7.4: `... (**Verified Residents whose last active day (7.2) is within the last 30 Calgary days, including that day**, i.e. residents whose houses are shown); the ratio therefore never exceeds 1`
- 7.5: (move exclusion line did not exist)
- 7.8: `- The island grows with the **cumulative number of Verified Residents**:` (no definition line)
- 11: (farewell line did not exist)
- 12.3: (move rule did not exist)
- 17 Add if needed: (14-day stay rule did not exist)
- 23: (Move, Cumulative Verified Residents did not exist)

### 2026-11-17 — v1.9
**Changed:**
- 7.2: defined **Last active day** = later of last action day and verification day; archive rule uses it with "within the last 30 Calgary days, including today"
- 7.4: Vitality denominator uses the last active day and explicitly includes that day (ratio never exceeds 1)
- 7.5: clarified that only actions count for the 7-day Active Verified Resident (verification day does not)
- 23: added Last active day

**Why:** Review found (1) the 30-day window did not say "including today", so a resident returning after 31 days would be in the numerator but not the denominator (ratio > 1); (2) verification is based on visits, not actions, so a newly verified resident with no actions would immediately have no house and be excluded from Vitality. Counting the verification day fixes the house/Vitality case; the streak stays action-only so it rewards actual play and is not made harder by residents who have not acted yet.

**Previous:**
- 7.2: `- **Inactive 30+ days**: house is temporarily removed from the village (archived); it reappears when they return`
- 7.4: `  - Daily active resident ratio = (Verified Residents who acted that day) ÷ (**Verified Residents active within the last 30 Calgary days** that day, i.e. residents whose houses are shown, see 7.2); 0 if the denominator is 0`
- 7.5: (action-only note did not exist)
- 23: (Last active day did not exist)

### 2026-11-17 — v1.8
**Changed:**
- 7.4: Vitality denominator is now Verified Residents active within the last 30 Calgary days (residents whose houses are shown), not the 7-day Active Verified Residents
- 7.6: resident counts in unlock conditions are cumulative; unlocked buildings never re-lock
- 23: Active Verified Resident definition clarified (streak only)

**Why:** Review found that with the 7-day denominator, 1 daily player out of 50 Verified Residents would show Vitality 100 (Lively), which misrepresents how alive the community is. The 30-day basis matches the houses on screen (dark houses → gloomier community) and motivates waking neighbours, while the streak keeps the 7-day basis so dormant residents cannot block it. Unlock counts were ambiguous; cumulative matches island size and the "never shrink" principle.

**Previous:**
- 7.4: `  - Daily active resident ratio = (Verified Residents who acted that day) ÷ (**Active Verified Residents** that day, see 7.5); 0 if the denominator is 0`
- 7.6 table: `| 7-day streak + 5 Verified Residents | Community Centre (resident board feature opens in Phase 2) |`
- 7.6 note: `(did not exist)`
- 23: `| Active Verified Resident | A Verified Resident who took at least one action within the last 7 Calgary days (including today); denominator for the streak and Vitality |`

### 2026-11-17 — v1.7
**Changed:** Resolved inconsistencies and ambiguities found while reviewing documents before M0.
- 7.4: daily active resident ratio uses Active Verified Residents as the denominator
- 7.5: defined **Active Verified Resident (7-day)**; streak = at least half (rounded up) of Active Verified Residents; 0 active → day does not count; UI example clarified
- 12.1: defined "daily active Verified Residents"; ranking eligibility = 5+ Verified Residents who acted during the ranking week (Mon–Sun, Calgary time)
- 20.1: World Map rendering is Canvas (matches §9 and PLAN.md M10)
- 20.3a / 20.3b: blocks reordered so 20.3a comes before 20.3b (numbers unchanged because CLAUDE.md references them)
- 23: Community Streak updated; Active Verified Resident added

**Why:** Review in VS Code found: (1) World Map was Canvas in §9/PLAN but SVG in §20.1/README/CLAUDE; (3) the streak "half" denominator was undefined — counting dormant/archived residents would make streaks nearly impossible; (4) "active" in ranking eligibility had no time window; (5) section order 20.3 → 20.3b → 20.3a. The 7-day window counts residents who actually play regularly, keeping streaks achievable, and the same denominator keeps Vitality consistent.

**Previous:**
- 7.4: `- Definition: 7-day average of the "daily active resident ratio" × 100`
- 7.5 rule:
```
- **Community attendance day** = a day when **at least half** of Verified Residents take an action
  - In a community with only 1 Verified Resident, that 1 person is enough
```
- 7.5 UI: `- UI example: "Mahogany 5-day streak! Today 2/6 — 3 residents keep it going"`
- 12.1:
```
  - Formula: (sum of daily active Verified Residents over the week ÷ 7) ÷ max(community population, 1,000) × 1,000
- Only communities with **5+ active Verified Residents** are ranked
```
- 20.1: `| World Map (2D) | SVG rendered by React (community boundary polygons) |`
- 23: `| Community Streak | Consecutive days on which at least half of Verified Residents took an action |`
- Section order was 20.3 → 20.3b → 20.3a (content unchanged)

### 2026-11-16 — v1.6
**Changed:** Removed time estimates and target dates. 22.1 heading no longer has a target date; 22.6 heading and table no longer have durations; 22.6 note says `PLAN.md` takes precedence for ordering (not estimates) and that no time estimates are kept.

**Why:** User decision: with vibe coding, work may finish faster or slower, so the plan is for checking completeness and progress, not schedule.

**Previous:**
- `### 22.1 MVP (target: late Jan – Feb 2027, winter theme)`
- 22.6 (verbatim):
```
### 22.6 Development order (~10 hours/week, ~10–12 weeks)

> High-level summary only. The detailed, module-based build order, scope and status live in **`PLAN.md`** (which takes precedence for ordering and estimates).

| Step | Work | Duration |
|---|---|---|
| 1 | Load community boundary/population data, anonymous login, location → community, resident verification | 2 weeks |
| 2 | react-three-fiber box-built diorama island (island growth, buildings, houses, mini villagers, Vitality, speech bubbles) + avatar tap-to-move with pathfinding + swappable rendering layer; includes time to learn React + react-three-fiber | 3–4 weeks |
| 3 | Daily actions, projects, community streak, unlocks, action replay, newspaper | 2 weeks |
| 4 | World Map, weekly ranking, share cards, invites | 2 weeks |
| 5 | Legal pages, analytics, email subscription, polish → family/friends test | 1–2 weeks |
```

### 2026-11-16 — v1.5
**Changed:** World Map design refined after a prototype demo: real community boundary polygons, each showing **small development illustrations** (houses → playground → park → community centre by level) instead of colour only; Vitality shown as mood; layout rules (area-scaled icon count, zoom-dependent detail, Canvas rendering); tap-to-zoom interaction. Later enhancements added: animated Bow/Elbow rivers, moving CTrain trains on real routes, Calgary landmark buildings.
- 9: rewritten
- 19.4: World Map Art Pass assets expanded
- 20.2: OSM also used for CTrain routes/stations
- 22.1: MVP World Map line updated
- 22.2: Art Pass World Map items expanded

**Why:** The user compared three demo styles (polygons, hex tiles, island icons) and chose real boundary polygons because residents can intuitively find their community. Colour alone felt plain; showing houses, parks and community centres growing inside each polygon makes development visible and prettier, and ties the map to the island world. Rivers, CTrain and landmarks make the map unmistakably Calgary.

**Previous:**
- 9 (body, verbatim):
```
- A **top-down, stylized 2D map of Calgary** made from the **real community boundaries** (City of Calgary Open Data). It shows *where* each community is; the 3D island (Section 10) is the playable view.
- Not 3D: rendering ~200 islands at once is too heavy for phones. Keeps the first screen light.
- **MVP**: flat pastel polygons per community
  - Colour tone = Vitality; grey = unsettled
  - Label/icon showing development tier (unsettled + 3 tiers)
  - Flag/crown on this week's #1 community
- **Art Pass** (target design):
  - Pastel styling consistent with the voxel islands; Bow and Elbow rivers, downtown/Calgary Tower icon, Rocky Mountains on the western horizon, major parks (Nose Hill, Fish Creek, Glenmore Reservoir)
  - Small development icons per community, day/night tint and snow from real Calgary time/weather
  - Tapping a community plays a short transition into its diorama island
- Tap an empty community → **"Invite a friend from this community"** (pre-filled message)
- Generated programmatically from data (community boundaries, OSM rivers/parks/major roads) → replicable to other cities
```
- 19.4: `... World Map icons (rivers, mountains, Calgary Tower), crown/flag`
- 20.2: `- OpenStreetMap: rivers, parks, major roads (for generating the World Map base) and suggesting each community's signature features (7.9)`
- 22.1: `- Calgary World Map as **flat pastel 2D polygons** (Vitality colour tones, grey for unsettled, tier label, #1 flag)`
- 22.2: `... styled World Map with landmarks and transitions, ...`

### 2026-11-16 — v1.4
**Changed:** Tech stack switched to the best-fit combination for this project, regardless of the developer's existing experience: **React + Vite + TypeScript + react-three-fiber + drei + Zustand + Tailwind** on the frontend, and **Supabase only (Postgres functions/RLS, Edge Functions, pg_cron)** instead of a Spring Boot server. Added scalability principles.
- 19.0: community view described as react-three-fiber scene
- 20.1: stack table rewritten (serverless, all TypeScript + SQL; testing, monitoring added)
- 20.3a: instanced rendering via drei/InstancedMesh; per-frame updates in `useFrame` with refs
- 20.3b (new): scalability principles (append-only actions, stateless logic, connection pooling, idempotent actions, edge rate limiting)
- 20.4: asset keys map to React components
- 22.6: Step 2 uses react-three-fiber and includes learning React; 3–4 weeks; total 10–12 weeks

**Why:** Development is done mostly by AI (vibe coding), so the stack was chosen for the project rather than for familiarity. react-three-fiber + drei is the largest web-3D ecosystem with ready-made parts (HTML bubbles, instancing, cameras) and the most examples for AI code generation. Removing the always-on Spring Boot server cuts hosting cost and operations to near zero, keeps one language end to end, and Supabase Realtime is available for later presence. Trade-off accepted: the developer must learn React/R3F, and complex rules in SQL functions are harder to test (move them to Edge Functions if they grow). Scalability principles were added after reviewing what a 10,000-concurrent-user success would require; they cost little now but are expensive to retrofit.

**Previous:**
- 19.0: `  - Community view: **three.js scene built from coloured boxes** — ...` (rest of line unchanged)
- 20.1 table:
```
| Area | Technology |
|---|---|
| Web UI (menus, news, login, etc.) | Angular |
| Community view (3D voxel diorama) | three.js (orthographic camera, InstancedMesh for tiles, CSS2D/HTML overlays for bubbles and labels) |
| World Map (2D) | SVG or Canvas rendering of community boundary polygons |
| Backend API | Spring Boot |
| Database | Supabase PostgreSQL + PostGIS |
| Auth | Supabase Auth (Anonymous + Google linking) |
| Static files / snapshots | Cloudflare Pages / R2 |
| Bot protection | Cloudflare Turnstile |
| Analytics | Plausible or PostHog |
| Voxel modelling | MagicaVoxel |
```
- 20.3a first bullet: `- Use **InstancedMesh** for repeated blocks (tiles, trees) to keep draw calls low`
- 20.3b: did not exist
- 20.4: `- MVP maps each asset key to a code-built box model; the Art Pass maps the same keys to refined voxel models. No game-logic changes required.`
- 22.6 heading: `### 22.6 Development order (~10 hours/week, ~9–11 weeks)`
- 22.6 Step 2: `| 2 | three.js box-built diorama island (island growth, buildings, houses, mini villagers, Vitality, speech bubbles) + avatar tap-to-move with pathfinding + swappable rendering layer; includes time to learn three.js | 2–3 weeks |`

### 2026-11-16 — v1.3
**Changed:** 22.6 now notes that `PLAN.md` holds the detailed module-based build order, scope and status, and takes precedence for ordering and estimates.

**Why:** A separate, frequently changing development plan (`PLAN.md`, modules M0–M14, core-first) was created. Avoids keeping two detailed schedules in sync.

**Previous:** 22.6 had no reference to `PLAN.md` (the summary table itself is unchanged).

### 2026-11-16 — v1.2
**Changed:** Visual direction switched from **2D pixel art (PixiJS)** to **pastel voxel diorama islands (three.js)**, based on the VibeBase "Voxel Village" reference. Added island growth, community identity/feature library, user avatar, and petitions.
- 2: community = pastel voxel village on a floating diorama island; reference images in `docs/references/`
- 5.1: World Map no longer pixel-art; entering a community shows the island and my avatar
- 7.2: village fill rule references island growth
- 7.8 (new): same square island for all communities, grows with cumulative Verified Residents (8×8 → 32×32), never shrinks
- 7.9 (new): identity via name sign + feature library (OSM + CSV), activity upgrades (Phase 2), petitions (Phase 3)
- 9: World Map is a top-down 2D map of real community boundaries (not pixel-art, not 3D)
- 10: rewritten as voxel diorama island + my avatar (tap/click to move, action buttons make avatar run) + asynchronous other residents
- 16: renamed to "Requests & petitions"; added 16.2 community petitions
- 19: rewritten for voxel style (code-built boxes for MVP, MagicaVoxel for detail)
- 20.1: PixiJS → three.js (community view) + SVG/Canvas (World Map); Aseprite → MagicaVoxel
- 20.2: OSM also used for feature suggestions; feature mapping CSV
- 20.3: principle 5 scoped to MVP; new principle 6 (client-side avatar movement via destination events); new 20.3a (3D performance)
- 20.4: Art Pass maps asset keys to voxel models instead of pixel sprites
- 20.5: replication includes feature mapping CSV
- 22.1, 22.2, 22.3, 22.6, 22.8: updated for voxel/three.js, avatar, real-time presence later, petitions; estimate 9–11 weeks
- 23: glossary updated (World Map, Community view, Mini villager) and new terms (Avatar, Destination event, Island/diorama, Feature library, Petition)

**Why:** The user found a reference (pastel voxel floating island, isometric, small characters with speech bubbles, controllable character) that matches the desired look. A three.js proof of concept (~100 lines) confirmed it is feasible. Voxel style is built from boxes, so the box-based MVP already resembles the target and art needs less drawing skill than pixel art. Same-shape islands that grow with residents make growth visible and drive invites, while the World Map keeps real geography. Real-time avatars are deferred to keep server cost near zero until there are enough users.

**Previous:**
- 2: `- Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a pixel-art village.`
- 5.1: `1. Land on the site → snowy pixel-art **Calgary World Map**` / `3. Zoom into their community`
- 7.2: `- The village fills from the centre (Community Centre site) outward`
- 7.8, 7.9, 10.2, 10.3, 16.2, 20.3a: did not exist
- 9 (full):
```
## 9. Calgary World Map (city view)

> MVP renders this with basic shapes (see 19.0). The description below is the target design for the Art Pass.

- Not a real map (e.g. MapLibre) but a **pixel-art world map of Calgary**
- Elements
  - Bow River and Elbow River (shimmering), downtown with Calgary Tower, Rocky Mountains on the western horizon
  - Major landforms: Nose Hill, Fish Creek Park, Glenmore Reservoir, etc.
- A **miniature of each community's development** at its location (MVP: unsettled fog + 3 tiers)
- Colour tone reflects Vitality
- Reflects real Calgary **time (day/night)** and **weather (snow)**
- Flag/crown on this week's #1 community
- Tap an empty community → **"Invite a friend from this community"** (pre-filled message)
- Zooming in transitions smoothly to the community view
- The base is **generated programmatically** from data (community boundaries, OSM rivers/parks/major roads) onto a pixel grid; only landmarks are hand-drawn → replicable to other cities
```
- 10 (full):
```
## 10. Community view

> MVP renders this with basic shapes (see 19.0); pixel art comes in the Art Pass.

- Square-grid pixel village
- Contents: community buildings (playground, community centre, park, etc.), resident houses, mini villagers, project construction sites, locked-building silhouettes
- On entry, show **"What changed since yesterday"** (construction progress, new residents, trees planted, etc.)
- Show community streak status and remaining conditions for the next unlock
- Users can visit and view other communities (actions only in their own community)
```
- 16 (full):
```
## 16. Requests (Phase 2)
- **Mini villager requests**: "!" above a mini villager → help with one click → recorded in the newspaper
- **Player requests** ("Regular Neighbour" and above): other residents help with a click
- Requests are **in-game only, chosen from a preset list** (no real-world meetups or favours)
```
- 19.0–19.4 (full):
```
### 19.0 MVP art policy
- **The MVP uses only basic geometric shapes** (rectangles, circles, polygons, text labels, simple colours). No pixel art in the MVP.
  - World Map: community boundary polygons filled with flat colours (Vitality tone; grey = unsettled)
  - Community view: square grid; houses = small squares (lit/active vs grey/inactive), buildings = labelled rectangles, locked buildings = grey dashed outlines (silhouettes), mini villagers = small circles/dots
  - Projects: labelled shapes + progress bars
- Purpose: ship the full MVP fast and validate the core loop before investing in art.
- Pixel art (19.1–19.4) is applied later in the **Art Pass** phase (see 22.2), replacing shapes without changing game logic.

### 19.1 Style guide
- **Pixel art**, square grid
- Tiles **32×32**, mini villagers **16×16**
- **One fixed ~32-colour palette** (e.g. from Lospec)
- Slightly top-down view, **light from top-left**
- **Launch theme: winter** (cozy snow-covered village, chimney smoke, window lights)

### 19.2 Production
- No outsourcing; made in-house with **AI + post-processing script + Aseprite**
- Pick 2–3 reference images and use them as references for every generation
- Post-processing script: resize to exact pixel grid, force palette, transparent background
- When using pixel-art AI tools, **check commercial-use terms**
- Test consistency with a small set first, then scale

### 19.3 Effects handled in code (fewer drawings)
- Day/night: global colour tint
- Snow/rain: particles
- River shimmer: palette cycling
- Tree sway: tilt animation
- Window lights: shown at night
- Mini villager bounce/head-down: code tweens

### 19.4 MVP asset list (draft)
- Ground, road, snow, tree, flower tiles
- Resident house (base; roof/wall colour variants via code)
- Project buildings: playground, community centre, park, ice rink, etc. + construction stages (scaffolding/frame/complete) + silhouettes
- A few mini villager types × actions (walk 2–4 frames, idle, cheer, gloomy, work)
- World Map: rivers, Rocky Mountains, landmarks like Calgary Tower, community miniatures (fog + 3 tiers), crown/flag
- Surprise characters such as a moose
```
- 20.1: `| World Map + pixel community view | PixiJS (consider a viewport plugin for zoom/pan) |` / `| Pixel editing | Aseprite |`
- 20.2: `- OpenStreetMap: rivers, parks, major roads (for generating the World Map base)`
- 20.3: `5. No real-time connections (WebSocket). "Recently active" info is included in snapshots`
- 20.4: `- MVP maps each asset key to a basic shape; the Art Pass maps the same keys to pixel sprites. No game-logic changes required.`
- 20.5: `- New city = swap data + add landmark art`
- 22.1: `- Calgary World Map **in basic shapes** (community polygons, Vitality colour tones, grey for unsettled; day/night tint and snow are optional nice-to-haves)` / `- Community view **in basic shapes** (buildings, resident houses, mini villagers as dots, 3 Vitality levels, action replay as text/simple motion)`
- 22.2: `- **Art Pass**: replace basic shapes with pixel art (Section 19.1–19.4), pixel World Map with landmarks, mini villager animations, day/night and weather effects`
- 22.3: `- Aurora events, real-time presence indicator`
- 22.6: `### 22.6 Development order (~10 hours/week, ~8–10 weeks)` / `| 2 | Shape-based community view (buildings, houses, mini villagers, Vitality) + swappable rendering layer | 1–2 weeks |`
- 22.8: `- [ ] Art style references, palette, reference images (before the Art Pass)`
- 23: `| Mini villager | Ambient pixel character showing the community's mood; never represents or impersonates a real player |` / `| World Map | Pixel-art map of all of Calgary showing each community's development |` / `| Community view | Pixel village screen of a single community |`

### 2026-11-16 — v1.1
**Changed:** The MVP is built with basic geometric shapes only; pixel art moves to a new **Art Pass** in Phase 2.
- Added 19.0 (MVP art policy) and 20.4 (swappable rendering layer); former 20.4 renumbered to 20.5
- 22.1: World Map and community view are shape-based
- 22.2: Art Pass added at the top of Phase 2
- 22.6: Step 2 changed to shape-based view; total estimate 8–10 weeks
- 22.8: art style open item due before the Art Pass
- Sections 9 and 10: added a note that the MVP renders them with basic shapes

**Why:** Ship the full MVP faster and validate the core loop (World Map → community view → actions → returning next day) before spending time on art. Art becomes a skin layer that can be swapped in later.

**Previous:**
- 22.1: `- Pixel-art Calgary World Map (fog/miniatures in 3 tiers, Vitality tones, day/night, snow)`
- 22.1: `- Community view (buildings, resident houses, mini villagers, 3 Vitality levels, action replay)`
- 22.6 heading: `### 22.6 Development order (~10 hours/week, ~9–11 weeks)`
- 22.6 Step 2: `| 2 | First pixel art set + community view (buildings, houses, mini villagers, Vitality) | 2–3 weeks |`
- 22.8: `- [ ] Art style references, palette, reference images (before Step 2)`
- Sections 19.0 and 20.4 (rendering layer) did not exist; replication section was numbered 20.4.

### 2026-11-16 — v1.0 (initial version)
**Changed:** Initial requirements written based on idea discussions from 2026-11-14 to 2026-11-16.

**Why:** A reference document is needed to start MVP development.

**Previous:** None (initial version). The key decisions and rejected options that led to this version are recorded below.

#### Decision history (discussions before v1.0)

| Date | Earlier option | Decision | Reason |
|---|---|---|---|
| 11-14 | Virtual rest space like Korea's viral "online temple" (Alberta winter ice fishing + aurora) | On hold | Low viral probability, weak revenue model |
| 11-14 | Online prayer space targeting Muslims | Rejected | Religious sensitivity, cannot replace real worship, backlash risk |
| 11-14 | Elementary school (Grades 1–6) competition | Rejected | Child privacy/safety burden, requires recruiting teachers/parents |
| 11-14 | Tools for clippers (GTA 6 clips, chat-spike detection) | Rejected | English market saturated; Korean market (CHZZK/SOOP) profitability uncertain |
| 11-14 | Businesses competing for territory via receipt-verified reviews | Pivoted | Required business recruiting and marketing; conflicts with the "users come on their own" goal |
| 11-14 | — | Goal set | Side income → beyond main income, minimal operator involvement, organic acquisition |
| 11-16 | Each user grows a personal plot | **Shared community growth** | User's original intent. Stronger belonging and invite motivation; removes 1,000-plot layout and ghost-town problems; less art |
| 11-16 | 4 quadrant teams (NE/NW/SE/SW) | **Community (neighbourhood) teams** | Quadrants too large to feel like "our neighbourhood" |
| 11-16 | Ranking by community total score | **Ranking by participation per population** | Prevents large communities dominating; motivates inviting neighbours |
| 11-16 | Real-time multiplayer | **Asynchronous shared world + action replay** | 1–2 min/day play makes simultaneous presence unlikely; lower server cost |
| 11-16 | Fake players to look lively | **Forbidden; ambient mini villagers only** | Protect trust. Mini villagers never pretend to be players |
| 11-16 | Hexagon grid (H3) | **Square grid** | Most pixel-art assets are square-based |
| 11-16 | Display on a real map (MapLibre) | **Pixel-art Calgary World Map** | Consistent style, eye-catching first screen; a plain coloured map isn't special |
| 11-16 | 3D / 2.5D | **2D pixel art** | Solo-producible, fits the map, performance |
| 11-16 | Outsource key art | **Make art in-house with AI** | User decision; cost saving |
| 11-16 | Verification: 3 *consecutive* days in the same community | **3 of 7 days** | Avoids resets due to travel/nights away |
| 11-16 | Strict verification (phone, postcard, etc.) | **Location + bot protection only (MVP)** | Minimize entry barrier; tighten if problems occur |
| 11-16 | Board: Verified Residents only | **Anyone can post, with rank-based limits** | Keep participation high; no links/photos + 1 post/day blocks spam |
| 11-16 | Board visibility 3 days for everyone | **Newcomer 1 day / Verified Resident 3 days** | Motivates verification |
| 11-16 | Daily actions: plain watering/building clicks | **Project choice + satisfying feedback + surprises** | Feedback that plain clicking isn't fun |
| 11-16 | Profile, ranks, bubbles, requests in MVP | **Moved to Phase 2** | MVP scope grew and risked delay. Minimal MVP + staged update announcements to build anticipation |
| 11-16 | 5 community mood levels | **3 levels in MVP** | Less art/implementation |
| 11-16 | Separate mobile app | **makecalgarytalk.com website + PWA** | One link to join (better for invites); reuse existing Supabase login |
| 11-16 | Separate game name (working title "Cowtown Builders") | **No separate name; the site itself is the game** | User decision |
| 11-16 | Korean-language requirements | **English requirements** | Consistent with code/commits for GitHub; easier for AI tools and collaborators |
