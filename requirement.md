# Requirements — MakeCalgaryTalk (makecalgarytalk.com)

| Item | Value |
|---|---|
| Document version | v1.38 |
| First written | 2026-11-16 |
| Last updated | 2026-11-24 |
| Status | Initial draft for starting MVP development |

---

## 📌 How to update this document

This document will keep changing during development. To never lose the reasons behind changes or past decisions, follow these rules:

1. **The body (Sections 1–23) always contains only the currently valid requirements.**
2. Before changing any requirement in the body, add a new entry at the **top** of **[`changelog/requirement.md`](changelog/requirement.md)** (§24 points there).
3. Every Change Log entry must include:
   - **Date and new version number** (e.g. `### 2026-12-01 — v1.1`)
   - **Changed**: what changed
   - **Why**: why it changed (data, feedback, technical issue, etc.)
   - **Previous**: the old text/numbers **copied verbatim** before the change
4. If a whole section is dropped, remove it from the body and move its full text into the changelog entry's Previous field.
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
- When a community develops, its mini villagers are happy and the scenery becomes beautiful; when neglected, they get sleepy and the scenery turns snowy and quiet.
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
1. Land on the site → a short **completed-neighbourhood example** (one image or a short animated scene, rendered with the real game engine so it shows only what can really be built) → "Let's build ours together" → nickname and shirt. Shown on the first visit only; afterwards the example is available from the build map ("See a finished example"), not on every entry
2. "Which community do you live in?" → allow location. "Just look around first" opens the **Calgary World Map** (9) instead; the map is also always one tap away (🗺 Calgary button)
3. Tap into their community → the community's voxel diorama island appears, with **my avatar** standing in it
4. First action click → **immediate visible change**
   - Empty community: fog clears, "You are the Founding Resident!"
   - Existing community: construction progress bar rises, mini villagers cheer
5. The next goal from the building tree, e.g. "2 more neighbours and the frozen pond becomes a skating rink" + **Invite button**
   - Shown as a **welcome card** right after the first counted check-in ("Welcome to <community>! N more neighbours and the island grows") with Invite neighbours / Look around first; "N more neighbours" goals elsewhere (streak bar, build map) also open the invite
   - A floating **Invite** button is always visible at the bottom right of my community; a small × hides it for the rest of the Calgary day. At good moments (the island or a building is 1–2 neighbours away, something was built, the island grew) it shows a one-line nudge, at most once a day and not on a hidden day
   - The first-visit example says that a community can only be finished together ("You can't finish it alone")

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
- **Nickname on the first visit**, together with the avatar shirt colour (10.2): a suggested nickname is pre-filled (e.g. "Snowy Moose 42") so the player can just continue; 2–16 characters, a basic blocked-words filter, checked on the server; changeable later. Shown on house name tags (7.2) and in the newspaper (11)
- **Link Google account (optional)**: prompt "Link Google to keep your progress" once the community grows or the user becomes verified
- Re-joining with the same Google account **restores the existing record** instead of creating a new one (deleted accounts keep only a hashed identifier)

### 6.2 Location check
- Determine the current community from browser geolocation
- **Never store exact coordinates.** The server checks inside/outside the community boundary, discards the coordinates immediately, and stores only the result (community ID)
- Never collect home addresses
- Show "Please verify residency on your phone" (PCs use Wi-Fi-based location and are inaccurate)
- A check whose reported accuracy is worse than **1 km** is not counted (the player is asked to try on their phone). At most **20 checks per account per Calgary day**
- Only residential communities count; a check outside every residential boundary (or outside Calgary) finds no community

### 6.3 Resident verification
- Open the site from inside the same community on **3 different days within 7 days** → **Verified Resident**
- While verifying (days 1–3)
  - Full gameplay allowed; contributions are stored as "pending"
  - The player plays in their **candidate community** = the community with the most check-in days in the last 7 Calgary days (tie → the most recent check-in); verification happens in whichever community first reaches 3 days
  - A visit from another community (e.g. workplace) doesn't count as a verification day; a visit from home later the same day does
- After verification
  - **No more location checks** (play from anywhere)
  - Pending contributions are applied to the community **from the verification day**: they count toward the construction projects they were given to; earlier days' attendance and Vitality do not change; contributions to a project that already finished are not carried over. Pending contributions given in another community are not applied
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
  - The user can also **cancel the move themselves** at any time before it completes, with the same result as the automatic cancel
- **When the move completes**:
  - Their house moves to the new community and pending contributions are applied there
  - The old community **keeps** its cumulative Verified Resident count, completed buildings and unlocks (7.6, 7.8)
  - The old community's newspaper shows a **farewell line** (11)
  - **Personal records follow the person**: badges (including Founding Resident), total active days and, from Phase 2, profile and rank
  - Invite rewards already granted stay; moving never creates a new invite reward (12.3)
- **Cooldown**: 90 days from the last **completed** move or, before any move, from the **first verification** (cancelled moves do not count)
- **One free correction**: within **14 days of the first verification**, a user may move once without waiting for the cooldown (e.g. verified at their workplace by mistake). Once per account.

---

## 7. Community model (shared growth)

### 7.1 Community states
- **Unsettled**: 0 residents. Covered by fog/clouds on the World Map
- **Settled**: the community's **Welcome sign** (first building of the tree, 7.6) is built → fog clears on the World Map; the first resident (the community's **first Verified Resident**) gets the "Founding Resident" badge. A first resident can build it on their first day

### 7.2 Resident houses
- One house per Verified Resident. **Tapping a house** shows whose it is: "<nickname>'s house", active today or not, and the Founding Resident badge if they have it. No name tags floating over houses; **my own house always has a small marker**, and the labels toggle can show every house's name at once
- Residents active today: **warm window lights** (no chimney smoke: with many houses it would look like factories)
- Residents not active today: lights off
- **Each resident keeps a fixed house lot** in their community: given once, the first free lot in the stored lot plan (lots ordered by land stage, then plan order, so growing the island never moves a house). It stays theirs while their house is archived, unless all lots are taken: then the lots of archived residents go to new residents, and a returning resident gets a free lot. If even active residents exceed the lots, extra houses are not drawn and the village shows "+N more residents". Moving gives a lot in the new community. Lots are assigned while building the shared state (no extra request)
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
  - Days counted are **finished Calgary days** (yesterday and before), so Vitality changes once a day, like construction progress. Only days since the community's first resident are averaged; before the first finished day Vitality is not shown (normal mood), so a new community never starts sleepy
- MVP has 3 mood levels

| Vitality | Mood | Scenery |
|---|---|---|
| 60–100 | Lively | Flowers, lights, clean streets, many mini villagers |
| 30–59 | Normal | Ordinary look |
| 0–29 | Sleepy | A quiet snowy winter evening: fresh snow on the ground and trees, icy water, a soft lavender-pink dusk sky, villagers mostly resting. Pastel, never grey or dark |

- Don't make it too depressing ("cute sleepy"): a newcomer's first look must still be inviting
- While Sleepy, the streak bar says "<Community> is sleepy. Help today to wake it up!", so a quiet community becomes a reason to help
- Sleepy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card
  - Recovered = yesterday's Vitality was Sleepy (0–29) and today's is 30 or more; shown once in the "Since yesterday" panel of that day

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
- **Map orientation:** every island opens with the same diagonal camera angle, keeping the World Map's orientation (east to the lower right, north to the upper right), so a community looks like its outline on the map (9). A small compass shows where north is and turns when the player rotates the view.
- UI shows the next growth goal (e.g. "2 more neighbours until the island grows").

### 7.9 Community identity & feature library
Each community gets its identity from its **real shape** (7.8) and from:
- **Name sign** at the island entrance
  - The **Welcome sign** is the first building of the tree (7.6) and grows into a Gateway arch; every community uses the same voxel models with its own name
  - A **custom sign** comes only from a resident photo petition (16.2, Phase 3): the real entrance sign's shape, colours and materials **reinterpreted in voxel style**, showing only the community name — **no developer logos or branding**
- **Real water** at its real position (7.8)
- **Signature features** from a reusable **feature library** (not real size/position — symbolic; e.g. hills, CTrain station, mall, school, large parks), placed on spare lots:
  - **MVP library (6 blocks):** CTrain station, pond, hill, creek, big park, school. Later blocks (Art Pass / Phase 2): ravine, mall, off-leash dog park and others
  - Which features a community gets: auto-suggested from OpenStreetMap data, supplemented/overridden by a simple CSV maintained by the operator. **Every residential community** gets suggestions (no launch list); **at most 3** per community, in priority order CTrain station → pond → hill → creek → big park → school (operator additions always kept). A pond or creek is suggested only when the island shows little real water (water inside the boundary is already drawn, 7.8); a big park is never the same place as the hill
  - The label shows the public place name when known (e.g. "🌳 Bowness Park"); schools show only "School"
  - **Features appear as the community grows:** they keep their spare lot in the stored plan and appear (blocking the lot) when that land rises; nothing is drawn on land still to come. Features take spare lots before unknown-building placeholders (7.6b). The build map shows what the next land brings ("Coming at 6 neighbours: 🚉 Dalhousie, 🌳 Dale Hodges Park")
- **CTrain** (Calgary's most visible landmark): where the Red or Blue line runs through a community, its island shows the **track at its real position** (one tile wide, drawn along a smoothed line so diagonals look straight), the **stations at their real position** on platforms beside it, a **train** (three cars) that runs along the visible track, stops at the stations, leaves the island and comes back, and a **"Next: <station>" sign** where the track leaves the island
  - Track tiles are never built on but stay walkable (level crossings), so the track never cuts the island apart; over water it is a rail bridge
  - Track that runs along the outline (lines often run in road medians that are community boundaries) is drawn on the edge row
  - A community next to a station but without track inside keeps the symbolic **CTrain station** block; only operating stations count (planned lines are not shown)
  - Track and stations appear with their land, like everything else
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

| Development level | Built buildings (7.6) | Shown inside the polygon |
|---|---|---|
| Unsettled | no Welcome sign | Grey dashed boundary, a cloud, empty ground |
| 1 | Welcome sign | A couple of small houses + welcome sign |
| 2 | + Playground or Skating rink | More houses + playground / skating rink |
| 3 | + Community hall | Houses + community hall with flag |
| 4 | + Neighbourhood park | Dense houses + community hall + neighbourhood park |

  - Level comes from the community's built buildings (same data as the island; 7.6, 7.8); the map loads the shapes as a static file and the levels, moods and resident counts in one request
  - Shown for the 223 residential communities
  - **Vitality is shown through mood**: lively = green ground, window lights, flowers; normal = plain; sleepy = snowy ground and trees under a dusk sky
  - Crown on this week's #1 community
  - **CTrain Red and Blue lines** drawn over the communities with their stations (names when zoomed in), so the map shows how the communities are connected (7.9)
  - Illustrations use the **same designs as the island buildings** so the map and islands feel like one world
- **Layout rules**
  - Icons are placed inside the polygon (point-in-polygon), away from edges, without overlapping
  - **Icon count scales with polygon area** so large and small communities at the same level look equally developed
  - **Zoom-dependent detail**: at city zoom show a few representative icons per community; when zoomed in show more
  - Render with **Canvas** (thousands of small icons) for phone performance; SVG is acceptable for prototypes
- **Interaction**: tap a community → smooth zoom to it + info card (name, level, mood, residents) → "Enter island"; tap an unsettled community → **"Invite a friend from this community"** (pre-filled message)
  - **Any community can be visited** (view only), settled or not, including its Community News (reading, thanks and reports; posting only in your own community). A "Visiting <community> · Back home" bar returns to your own community; the "What changed since yesterday" panel only shows in your own community
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

### 10.4 Living community: real weather and time of day (before launch)
- **Weather follows real Calgary weather**: rain falls when it rains, snow when it snows, trees, flags and smoke move with the wind, clouds when it is overcast. One city-wide reading, fetched on the **server** from a free public weather source and cached (a few times an hour, never per player; 20.3); the island only shows it
- **Time of day follows the real sun**: the light comes from the sun's real direction, so shadows move through the day; dawn and dusk tints; at night the **street lamps and windows light up** and the sky darkens. Time comes from the server (no time-zone math in the client, 7.5); the sun's direction may be computed from the current instant and Calgary's coordinates
- Effects stay within the phone budget (20.3a): particle counts capped, the low-quality mode (M14) reduces them further
- Details (which weather states, look of each effect, data source) are planned with the operator before the work starts

---

## 11. Community news (community newspaper)

- **Available from the MVP**: the newspaper opens from the **Welcome sign**; the **Warming hut** adds the community board (operator announcements, events); the **Community hall** takes both over and expands them (7.6)
  - Opens when the player taps the building; the avatar does not need to walk there
- **Auto-generated community newspaper** (no operator effort)
  - e.g. "Yesterday in Mahogany: 7 residents cleared snow and the playground was completed."
  - The newspaper is about **real community life, not game events**: how many new neighbours joined yesterday (with nicknames), farewells, and **local news written by Verified Residents** (events, deals, lost & found; see 14, built right after this section's first version). Game events (buildings, island growth, who helped, streak) stay in the "What changed since yesterday" panel. No personal streak lines; day-level only, no times
  - Written **once per community per Calgary day** (the first time someone opens it) and then served as stored (no extra cost per reader)
  - Before the Welcome sign is built, tapping its spot says "Build the Welcome sign to open the community newspaper"
  - Shows nicknames of active residents (recognition)
  - Farewell line when a resident moves away (6.4), e.g. "Sarah moved to Bridgeland — thanks for everything, neighbour!" (no times)
- **Upcoming updates (roadmap)**: e.g. "December: Community board opens"
- **Operator announcements (global)**: short notices written by the operator (events, maintenance, rule changes), shown to **all communities** at the top of the newspaper. No per-community announcements in the MVP
  - Always at the top of the newspaper (also before the Warming hut). The **community board** section (events and roadmap) opens with the Warming hut; before that it shows a lock ("Opens with the Warming hut"). MVP: the operator adds announcements with SQL in the Supabase dashboard (an admin screen comes later)
- Locked features are shown with a lock icon + "Coming soon"

---

## 12. Ranking & sharing

### 12.1 Weekly community ranking
- **Score = average daily active Verified Residents per 1,000 population**
  - Formula: (sum of daily active Verified Residents over the week ÷ 7) ÷ max(community population, 1,000) × 1,000
  - "Daily active Verified Residents" = Verified Residents who took at least one action that Calgary day (each person counts at most once per day)
- Only communities with **5+ Verified Residents who took at least one action during that ranking week** (Monday 00:00 – Sunday 23:59, Calgary time) are ranked
- Display: TOP 10 + my community's rank, in a 🏆 sheet on the World Map; tapping a community in the list shows it on the map
  - **Last week** (final, fixed on Monday) on top, **this week so far** below (refreshed every few minutes; the score keeps dividing by 7, so it only grows during the week)
  - Equal scores share a rank (then listed by name); scores shown with two decimals (real scores are small, e.g. 0.37)
  - My community shows its rank, or how many more acting Verified Residents it needs to be ranked ("2 more residents to enter the ranking")
- **Resets every Monday 00:00 (Calgary time)**; last week's results announced on Monday (in the "Since yesterday" panel, with a share card for my community when it was ranked)
- The **crown** on the World Map marks last week's #1 for the whole following week

### 12.2 Share cards
- The image **always includes the community name** (so it spreads in community Facebook groups, etc.)
- Generated on: weekly results, building completion, community revival (random surprises: later)
- MVP: the card image is **made on the phone** (a picture of the island + text) and shared as an image (system share sheet, or saved when sharing files is not supported), with the site link in the text. Link previews use one site-wide preview image; per-community link previews (server-made images) come later

### 12.3 Invites
- Personal invite link
- If the invitee becomes a **Verified Resident of the same community**, both get a reward (rare decoration/badge)
  - MVP reward: the **"Good Neighbour" badge** for both (counted ×N for several invitees); decorations come in Phase 2. "Same community" = the invitee's first verification is in the community the inviter is a Verified Resident of on that day
  - An invite is accepted once per account, only from someone else, and only before the invitee's first verification
  - The invite link shows who invited: "<nickname> invited you to build <community> together" (nickname and community only)
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

## 14. Community posts (resident-written local news, MVP)

- **Verified Residents only**, in their own community. Opens when the community's **Welcome sign** is built (together with the newspaper)
- Shown in the **Local news** section of Community News (11), credited by nickname, newest first
- A post: a kind and up to **300 characters**; **1 post per resident per Calgary day**; **no links or photos**
  - Kinds are about what is really happening in the community: 🚨 **Safety** (e.g. car break-ins overnight), 🏷️ **Local deals** (local store events and sales), 🎉 **Events**, 🔎 **Lost & found**, 💬 **Free talk**
  - Safety posts remind the writer and readers: "Say what happened, not who. No names or photos. In an emergency, call 911"
- Visible for **3 Calgary days** (the posting day and the next two), then gone; the author can delete their own post (no editing)
- Day-level only: posts show "today", "yesterday", "2 days ago", never a time
- **Safety**
  - Blocked-words filter (same list as nicknames); **phone numbers and street addresses are blocked** (e.g. "403 555 1234", "123 Main St")
  - **Reports**: any signed-in player can report a post once, **at most 3 reports per day**; reports from Verified Residents count 2, others 1; **3 points hide the post** (one person alone cannot hide a post). Reporting asks to confirm, and a report can be **taken back** (a mistake), which removes its points and frees that day's report. Thanks and a report exclude each other: reporting takes back my thanks, and a post I reported is folded away for me ("You reported this post · Undo") until I take the report back The operator can hide any post, **restore** a hidden one (a restored post ignores reports), see who reported restored posts, and block an account from reporting
  - Hidden posts stay hidden until they expire
- **Participation**
  - 👍 **Thanks**: any signed-in player, once per post; the count is shown (no ranking)
  - **"Community Reporter" badge** once a resident's posts have received 10 thanks in total
  - The write box suggests what to post (an event, a local deal, something lost or found)
- Paid business ads stay in Phase 4 (22.4); residents may mention a local deal in words (no links)

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
- Provide a contact email: **hello@makecalgarytalk.com** (forwarded by Cloudflare Email Routing)
- Pages: `/terms.html`, `/privacy.html`, `/credits.html` (static; linked from the first visit and the profile sheet). The first-visit screen states "By tapping Start you confirm you are 13 or older and agree to the Terms and Privacy Policy"
- Data is hosted in Canada (Supabase, Canada Central region); account deletion on request by email within 30 days (all game data is deleted with the account)
- Email updates: the profile sheet has an unticked checkbox with the consent wording; the address is asked only after ticking; consent time and wording version are recorded; unticking withdraws at once (the address is deleted, the withdrawal time kept). The MVP only collects; sending comes later
- Data credits: City of Calgary Open Data (Open Government Licence – City of Calgary) and OpenStreetMap (ODbL) on `/credits.html`

---

## 19. Art requirements

### 19.0 MVP art policy
- **The MVP uses only simple shapes, no detailed art.**
  - World Map: flat pastel 2D polygons of community boundaries (Vitality tone; grey = unsettled)
  - Community view: **react-three-fiber (three.js) scene built from coloured boxes** — island tiles, box trees, box houses with box roofs, labelled box buildings, translucent/grey boxes for locked silhouettes, two-box characters for avatar and mini villagers
  - Projects: box construction site + progress bar UI
- Because the target style is voxel (made of boxes), the box-based MVP already looks close to the target. A working proof of concept was built on 2026-11-16 (~100 lines of three.js: floating island, layered dirt, box trees/houses, wandering villagers, HTML speech bubbles, tap-to-move avatar, construction progress, island growth).
- Purpose: ship the full MVP fast and validate the core loop before investing in art.
- Detailed art (19.1–19.4) is applied in the **Art Pass** without changing game logic. The Art Pass is done **before the deploy and playtest** (decided 2026-11-24): communities must look worth playing; its scope is planned with the operator

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
- Day/night: sun direction (shadows), light colour/intensity, sky tint, lamps and windows at night, driven by real Calgary time (10.4)
- Rain, snow: particles; wind: sway of trees, flags, smoke (10.4)
- Water shimmer: animated material colour
- Tree sway, character bounce/head-down: code tweens
- Window lights: emissive boxes at night
- Island growth: new edge tiles rise with a tween

### 19.4 Asset list (draft)
- MVP (code boxes): island tiles (grass, path, snow), dirt layers, trees, resident house (roof/wall colour variants via code), buildings of the tree (7.6: welcome sign → gateway arch, fire pit → warming hut → community hall, frozen pond → skating rink → lit hockey rink, playground, sledding hill, dog park, pathway lights, community garden, neighbourhood park) + construction stages (scaffolding/frame/complete) + silhouettes + generic placeholder, avatar, mini villagers
- Art Pass: refined buildings, feature-library blocks (lake, creek, hill, ravine, dog park, CTrain station, mall, school), props (lamps, fences, fields, stalls, benches), character variants with simple animation, surprise characters (e.g. moose), World Map assets (development icons matching island buildings, animated rivers, moving CTrain trains on the map (the lines themselves are drawn since M13), landmark buildings such as Calgary Tower and Peace Bridge, mountains), crown/flag

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
| Analytics | **Own, in Supabase** (day-level visits, community views, share and invite-visit events; operator dashboard) + **Cloudflare Web Analytics** for page views (no cookies) |
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
- Operator screen at `?admin`, for accounts in the `admin.operators` table (added by hand); the server refuses everyone else
- Daily new verifications per community + spike flags (at least 3 new verifications and more than 3× the community's daily average over the previous 28 days)
- Analytics dashboard (last 28 days): visitors, new visitors (first visit that day), % of new visitors acting on their first day, D1 / D7 retention (share of a day's new visitors who visit again 1 / 7 days later; shown once that day has passed), shares, invite-link visits, visits by community (last 7 days), number of email opt-ins
- Analytics data is day-level only (no times, no location, no device data), capped at 50 events per player per day, and deleted with the account

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
- **Art Pass** and **day/night and weather** — *moved before the deploy and playtest (22.6, 10.4; 2026-11-24)*: refined pastel voxel models and props (Section 19.1–19.4), styled World Map with animated Bow/Elbow rivers, moving CTrain trains, Calgary landmark buildings and transitions, character variants and animations, avatar customization, walk-up-and-tap actions, day/night and weather effects
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
- **Community marketplace** (buy, sell, give away): needs in-app messaging and trade-safety rules first; not in the MVP's community posts (14)
- **Enter buildings and decorate my own house** (idea, not planned yet): tap a building or my house to go inside a small interior scene; residents decorate their own house. The fixed house lot (7.2) is what makes "my house" stable for this

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
| 5 | Legal pages, analytics, email subscription |
| 6 | **Art Pass**: prettier voxel communities, buildings, people and props, and **busier** communities (scope planned with the operator) |
| 6a | **Real weather and time of day** on the islands (10.4) |
| 7 | Deploy with **all communities open** → family/friends playtest → public launch |

### 22.7 Launch
- Supabase **Free** plan for the family/friends playtest; upgrade to **Pro** (no pausing, daily backups) right before the public launch
- **All communities open at once**: the deploy and the family/friends playtest run with every community open, and the public launch reveals the whole city together (operator decision 2026-11-24)
- Decisions after the playtest are made from the operator dashboard (21): low first-action % → first screens/onboarding; low D1 → return reasons and reminders; low D7 → neighbour density (watch for communities with a single player)
- After family/friends testing, post on r/Calgary and community Facebook groups with a "Calgary dev made this" story
- After the initial spark, growth comes from in-game invite/share mechanics

### 22.7a Growth after launch (in this order)
1. **Return reminders**: the game already has reasons to come back (streak, daily energy, overnight construction) but no way to tell players. **Both channels**: an **email** reminder for players who gave an email (opt-in, 18) and **web push** for players who allow notifications (works on phones once the site is added to the home screen, iPhone included). Examples: "Mahogany's 15-day streak needs 2 more helpers today", "The skating rink was finished overnight". At most one message a day per player across both channels, never at night (Calgary time), each easy to turn off
2. **Community association partnership**: when a community reaches a set number of players (threshold chosen by the operator, e.g. Active Verified Residents), the operator contacts its association directly to ask to mention the game in its newsletter / social media; in return the community newspaper (11) shows the association's notices — **title, date and a link to the original only** (no copied text), from an operator-maintained list of feeds (community, association, feed URL, permission), read once a day, respecting robots.txt, with a simple word filter. Only associations whose site has a feed (e.g. WordPress RSS) and that agreed are included; Facebook/Instagram-only associations are out of scope

### 22.8 Open items
- [ ] Pastel palette and lighting values (before the Art Pass); save reference screenshots in `docs/references/`
- [x] Feature library list and community → feature mapping (decided 2026-11-23, see 7.9: 6 blocks, all communities, at most 3 each)
- [ ] Island shape conversion parameters (smoothing, minimum width, centre choice) and lot plan generation per community (tuning)
- [ ] Building tree numbers (conditions, stage multipliers) and models for the new buildings
- [x] Project list and required actions per project (decided 2026-11-18, see 7.7)
- [ ] Vitality smoothing details (rise/fall speed)
- [ ] Random surprise types and probabilities
- [ ] Newspaper sentence templates
- [x] Analytics tool choice (decided 2026-11-23: own in Supabase + Cloudflare Web Analytics, see 20.1 / 21)
- [x] Terms of Use / Privacy Policy wording (first version 2026-11-23, template-based; professional review once revenue starts)
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
| Island / diorama | The floating voxel island in the real shape of one community; its land grows inside the visible outline with cumulative Verified Residents. **Internal term only: player-facing text says "community"** (e.g. "Visit this community", "Back to my community", "Community size") |
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

The full change history (every version with what changed, why, and the previous text verbatim) is in **[`changelog/requirement.md`](changelog/requirement.md)**, newest first.
