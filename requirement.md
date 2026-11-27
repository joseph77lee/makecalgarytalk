# Requirements — MakeCalgaryTalk (makecalgarytalk.com)

| Item | Value |
|---|---|
| Document version | v1.54 |
| First written | 2026-11-16 |
| Last updated | 2026-11-27 |
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
The service grows in this order; features are judged by how they serve it. The **build map (7.6) connects every step.**
1. **Pick your community and see what it could become** → "I want to build that" (the island in two taps and the build map's next places, 5.1, 7.6a)
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
- When a community develops, new buildings rise and its island grows; mini villagers and wildlife wander naturally whatever the number of players. The scenery always looks its best and follows Calgary's real weather and time of day (10.4).
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
Goal: the player reaches their community's island in **two taps**, with no form, no location prompt and no sign-up first (operator decision 2026-11-27).
1. Land on the site → the **Calgary World Map** (9) fills the screen behind **one card**: "Let's build Calgary together" (a few words on how neighbours grow their community together; no finished island is shown, so players imagine the final look themselves), a **community name search** (type-ahead over the residential communities) and a small "📍 Find communities near me". Tapping a community on the map works too. Shown until the player has a community
2. Picking a community shows a short sheet (name, neighbours, the next place and what it needs, e.g. "1 more neighbour for the skating rink") → **"Start with this community"**; the 13+ and Terms line sits under this button (18)
3. Starting creates the anonymous account (6.1), gives a **random villager look and the suggested nickname** (both changeable any time from the profile button, 6.1, 10.2) and makes the picked community **my community** (6.3) → its voxel diorama island appears, with **my avatar** standing in it
   - "📍 Find communities near me" asks for location only when tapped (6.2) and suggests the community the player is in; starting from it counts that check as the **first verification day** (6.3), so the player is not asked again. When location fails (permission denied, accuracy worse than 1 km) it says so, with "Computers locate by Wi-Fi and are often wrong: try your phone", and returns to the search
   - An **invite link** opens the card with the inviter's community already picked (12.3)
4. A short **welcome card**: "Welcome to <community>! N neighbours live here" (or "Nobody lives here yet: you are the first!") and the next goal from the build map ("N more neighbours and the island grows") with Invite neighbours / Look around first. Then the action bar: the first help shows "+1 today" at once and the bar rises the next morning, like everyone's help (7.6, 8)
5. The next goal from the build map, e.g. "2 more neighbours to build our skating rink" or "11 neighbours to build our landmark" + **Invite button**
   - "N more neighbours" goals (welcome card, streak bar, build map) open the invite
   - A floating **Invite** button is always visible at the bottom right of my community; a small × hides it for the rest of the Calgary day. At good moments (the island or a building is 1–2 neighbours away, something was built, the island grew) it shows a one-line nudge, at most once a day and not on a hidden day
   - The first-visit card says that a community can only be built together ("You can't finish it alone")
6. A small **"🏠 Verify I live here (N/3)"** chip stays on my community until the player is verified; it never pops up by itself (6.3)

### 5.2 Daily routine
1. **World Map**: see how developed all of Calgary is. Tap an empty community to invite a friend who lives there
2. **My community**: "What changed since yesterday" summary + life on the island (mini villagers, today's local posts)
3. **Today's 3 actions**: pick one of the active projects and click
4. **Community News** (11, open from the first day): read the newspaper with the community board and residents' local news (14); Verified Residents also answer **today's question** (14.1)

---

## 6. Sign-up & resident verification

### 6.1 Sign-up
- **Anonymous account auto-created** on first visit (Supabase Anonymous Sign-in). No email/password
- **Bot protection**: Cloudflare Turnstile
- **Sign-up rate limit**: cap accounts created per IP/device per day
- **Nickname**: the first visit gives a suggested nickname (e.g. "Snowy Moose 42") together with a random villager look (10.2), with no form (5.1); both can be changed any time from the profile button; 2–16 characters, a basic blocked-words filter, checked on the server. Shown on house name tags (7.2) and in the newspaper (11)
- **Link Google account (optional)**: prompt "Link Google to keep your progress" once the community grows or the user becomes verified; never as a step of verification or of the first visit
- Re-joining with the same Google account **restores the existing record** instead of creating a new one (deleted accounts keep only a hashed identifier)

### 6.2 Location check
- Location is used for two things only: **suggesting a community** ("📍 Find communities near me" on the first-visit card and in "Change my community") and **resident verification** in my community (6.3). Picking a community never needs it (5.1)
- The browser's location permission is asked only when the player taps one of those. Once it is granted, a check runs **automatically when the game opens** while the player is not yet verified or has a move in progress (6.4); never after that
- **Never store exact coordinates.** The server checks inside/outside the community boundary, discards the coordinates immediately, and stores only the result (community ID)
- Never collect home addresses
- Computers may try too; the server decides. A check whose reported accuracy is worse than **1 km** is not counted, and only then the player sees "Location is not accurate here: try on your phone" (PCs use Wi-Fi-based location and are often wrong). At most **20 checks per account per Calgary day**
- Only residential communities count; a check outside every residential boundary (or outside Calgary) finds no community

### 6.3 Resident verification
- **Two roles only** (operator decision 2026-11-27): **Visitor** (everyone who is not a Verified Resident of that community, including a player who picked it but is not verified yet) and **Verified Resident**. **My community** is the community the player picked (5.1); it is a home setting, not a role: the island the game opens on, where the player's daily help goes and where verification is counted
- A check from inside **my community** on **3 different days within 7 days** → **Verified Resident** of it
  - The check runs from the "🏠 Verify I live here" chip, or automatically when the game opens once location is allowed (6.2); at most one verification day per Calgary day
  - A check from **another** residential community asks "You are in <community>. Make it your community?": yes changes my community (free before verification, 6.4) and counts the check as its first day; no records nothing, and automatic checks do not ask again for 7 days (the chip still works). A check outside every residential community says so and records nothing
  - Check days from a community that is no longer my community do not carry over
- **What each role can do**

| | Visitor | Verified Resident (in their community) |
|---|---|---|
| See any island and build map, read any community's newspaper (11) | ✅ | ✅ |
| Report a post (14) | ✅ (1 point) | ✅ (2 points) |
| Help build with the daily energy (8) | ✅ in my community only, within the community's **daily visitor help limit** | ✅ |
| 👍 Thanks, answer today's question, write posts (14) | — | ✅ |
| Counted as a neighbour (cumulative Verified Residents: unlocks, island growth, 7.6, 7.8), my house (7.2), streak (7.5), Vitality (7.4), ranking (12.1) | — | ✅ |

- **Visitor help** counts toward construction exactly like a resident's (shown as "+1 today", on the bar the next day, 7.6), with no waiting for verification, and a Visitor may keep helping without ever verifying (e.g. a former resident cheering on their old community). It never counts for the streak, Vitality or ranking
- **Daily visitor help limit**: all Visitors together give at most **9 actions per community per Calgary day** (an operator setting, not code). When it is reached, a Visitor's action is refused without using energy: "Today's visitor help in <community> is full. Thanks! 🏠 Verified Residents can always help". The operator dashboard lists the communities that reached it (21)
- After verification
  - A celebration ("Welcome home, <community> resident!"), my house appears (7.2) and the community counts one more neighbour; Thanks, today's question and posting open
  - **No more location checks** (play from anywhere)
- **Changing community**: "Change my community" in the profile (6.4)
- Users getting verified in their workplace community are allowed in the MVP (keep rules simple); a free correction is available (6.4)

### 6.4 Moving to another community
Goal: moving never punishes the person who moves or the residents who stay.
- **Started by the user** with "Change my community" in the profile (community search or "📍 near me"). **Before verification** it simply changes my community, with no rules (help already given stays where it was given). **For a Verified Resident** it starts a move: location checks and re-verification in the new community (3 different days within 7 days, same rules as 6.3). Moves cannot be detected automatically because Verified Residents are no longer location-checked.
- **During a move** (until re-verification completes):
  - The user stays a Verified Resident of the old community and keeps their house there (no limbo); Thanks, today's question and posting stay with the old community until the move completes
  - The game opens on the new community; location checks run automatically again when the game opens (6.2)
  - From the moment the move starts, they are **excluded from the old community's streak and Vitality denominators** (7.4, 7.5), so they cannot break its streak or drag its mood down
  - Their daily help goes to the new community as a Visitor's (counts the next day, within its daily visitor help limit, 6.3)
  - If re-verification is not completed within **7 days** of starting, the move is **cancelled automatically**: nothing is lost, they count normally in the old community again, the cooldown is not used, and they can start again at any time
  - The user can also **cancel the move themselves** at any time before it completes, with the same result as the automatic cancel
- **When the move completes**:
  - Their house moves to the new community and they count there as a neighbour
  - The old community **keeps** its cumulative Verified Resident count, completed buildings and unlocks (7.6, 7.8)
  - The old community's newspaper shows a **farewell line** (11)
  - **Personal records follow the person**: badges (including Founding Resident), total active days and, from Phase 2, profile and rank
  - Invite rewards already granted stay; moving never creates a new invite reward (12.3)
- **Cooldown**: 90 days from the last **completed** move or, before any move, from the **first verification** (cancelled moves do not count)
- **One free correction**: within **14 days of the first verification**, a user may move once without waiting for the cooldown (e.g. verified at their workplace by mistake). Once per account.
- **Moving out of Calgary**: MVP has no "leave community"; the player stays a Verified Resident of their community and simply drops out of the streak and Vitality when inactive (7.4, 7.5). Leaving a community comes later

---

## 7. Community model (shared growth)

### 7.1 Community states
- **Unsettled**: 0 residents. Covered by fog/clouds on the World Map
- **Settled**: the community's **Welcome sign** (the root of the build map, 7.6) is built → fog clears on the World Map; the first resident (the community's **first Verified Resident**) gets the "Founding Resident" badge. A first player can build it on their first day (Visitors too, 6.3)

### 7.2 Houses: scenery, and my own house
- **Houses are scenery** (operator decision 2026-11-25): they are placed to make a beautiful island, not one per resident, and never stand for players. They stand in **2–4 residential zones** of the island plan (7.8), together at most about 30 % of the land, each zone filling as its land rises. As the community grows, houses grow **up** inside the zones (townhouses, small apartments) instead of spreading over the island
- **My house:** every Verified Resident has a **fixed lot** inside a residential zone, assigned once by the server while building the shared state (the first free lot in the stored plan, lots ordered by land stage then plan order, so growing the island never moves a house). **Only the owner sees it as theirs**, with the small "My house" marker that always stays visible; to everyone else it is an ordinary house. It is the base for decorating its interior later (22.3). Moving gives a lot in the new community
- **No owners shown on other houses:** no tap, no names, no labels, no "+N more residents" (a cooperative game played at different times, not a live online world)
- When every lot of the risen zones has an owner, new residents **share** lots: the house is drawn once and each owner sees their own marker on it (no one sees whose house it is, so nothing looks wrong). Lots are never taken back
- **At night every house lights its windows** (10.4): it looks prettiest that way. Lights do not follow activity; quiet communities show in the streak (7.5)
- **Last active day** = the later of the resident's last action day and their verification day (used by Vitality, 7.4)
- Houses are not something individuals grow; they have **no relation to real addresses/locations**

### 7.3 Mini villagers and wildlife (ambient life)
- **Ambient characters that make every island feel lived in**, whatever the number of players (operator decision 2026-11-24); they never pretend to be real players (no names, not counted as residents)
- **Count: natural and random**, chosen on the device for each visit and **scaled by the size of the walkable land**: the smallest islands have 0–1, the largest up to 20 (20.3a); fewer at night (about 40 %) and in rain or snow (about half). Not based on player counts or activity. There is always one villager per real story to tell (today's action replay, today's posts), so a tiny island still shows them
- Behaviour follows the time and weather (strolling, resting, cheering when someone helps), each with its own pace (10.1)
- **Action replay**: mini villagers replay real actions residents took today, with a system speech bubble
  - e.g. a mini villager shovels snow with "Sarah cleared the snow"
  - Always based on real records (nothing fake)
- **Today's local posts**: walking mini villagers carry residents' posts from today (14) as speech bubbles: "💬 <nickname>: <first ~40 characters>…" with the kind icon, credited to the writer so the villager never looks like the author. **Never Safety posts**; hidden, reported (for me) and deleted posts drop out (same server function as the newspaper). At most 2 post bubbles at a time, taking turns; tapping one opens the post in Community News
- **Wildlife** (jackrabbits, deer, Canada geese, rarely a cougar) **depends on where the community is**: downtown and inner-city communities rarely see wild animals (an occasional jackrabbit), communities near the city edge often do (measured by the distance of the community from the city centre); small islands get fewer animals. Deer and cougars need a park, hill, creek or water nearby; geese need water

### 7.4 Community development (Vitality is internal)
- **Players see their community's development, not an activity score** (operator decision 2026-11-24): the **development level 0–4** from the build map (7.6; the same level as the World Map, 9) is shown next to the community name, e.g. "Mahogany · Lv 2": **1** Welcome sign built, **2** the first persona place built, **3** Community hall built, **4** the signature landmark built. It never goes down; development means new places (7.6) and, later, things to do inside them (22.3)
- **Vitality stays as an internal operator metric** (dashboard, 21), not shown to players and not changing the island:
  - Definition: 7-day average of the "daily active resident ratio" × 100
  - Daily active resident ratio = (Verified Residents who acted that day) ÷ (**Verified Residents whose last active day (7.2) is within the last 30 Calgary days, including that day**, excluding residents with a move in progress, 6.4); the ratio therefore never exceeds 1; 0 if the denominator is 0
  - Vitality = 100 × **max(average ratio of the last 3 days, average ratio of the last 7 days)**, rounded; finished Calgary days only, days since the community's first resident
- No mood levels, no sleepy text and no "Community Revival" effect any more: quiet communities are shown by the streak (7.5), and a new place is what gets celebrated (12.2)

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

### 7.6 Build map (MVP)
Community places and construction projects are **one build map**, shaped like a skill tree: **one root, the Welcome sign**, built on the first day, opens **three tracks**, each built **in order**: a step opens when the step before it in the same track is built and the community meets the step's conditions; residents build it together with their daily actions (8); it stays where it was built, forever, on **its own lot** (no building replaces another on the same lot). The tracks run side by side, so a track waiting for neighbours never stops the others. Starting values; the build map is **data** (7.6b) and grows after launch.

| Track | Steps (starting content) |
|---|---|
| 🌱 **Root** | Welcome sign (from the start; all three tracks open when it is built) |
| 🏘️ **Community** (every community) | Fire pit → Warming hut → Skating rink → Community hall → Neighbourhood park |
| ⭐ **Persona** (from the community's persona, 7.9) | 4 places of its persona (the 4th is the persona's landmark, replaced by the community's own signature landmark where it has one), then the community's **further landmarks** (7.9) |
| 🌳 **Nature & leisure** (every community) | Playground → Sledding hill → Off-leash dog park → Community garden → Pathway lights → then **decoration steps that keep going** (tree lanes, flower beds, benches, small gardens), so there is always something to build |

The Gateway arch and Lit hockey rink models stay in the library for later steps.

- **A place appears at most once on a community's build map:** a persona track never repeats a community or nature place (e.g. the mature-suburb persona gets a curling rink, not a second skating rink or garden)
- The **Community hall** and **Neighbourhood park** take a **design matching the persona** (e.g. a lakeside pavilion hall on a lake island, a plaza park downtown); the other community and nature places use the shared designs

**Conditions** (the Welcome sign, ×0.3, needs nothing; then the previous step of the same track built, plus):

| Step | Actions × | Community and Nature tracks | Persona track |
|---|---|---|---|
| 1 | ×0.3 | — | — |
| 2 | ×1 | 3-day streak | 3-day streak |
| 3 | ×1.5 | 3 residents | 3 residents |
| 4 | ×2 | 6 residents + 7-day streak | 6 residents + 7-day streak |
| 5 | ×2.5 | 10 residents + 14-day streak | ⭐ **signature landmark** (×3): 11 residents + 14-day streak |
| 6 | ×3 | 20 residents + 30-day streak | ⭐ 2nd landmark (×3): 26 residents + 21-day streak |
| 7+ | ×3 | decoration steps: no new condition | ⭐ 3rd landmark (×3): 51 residents + 30-day streak |

- **Every step also needs land:** it opens only when the risen land (7.8) has a free lot that fits its footprint and site, so a big ground (e.g. a 5 × 5 ball diamond) never lands on a young island
- **Required actions** = base × step multiplier; base = **5 per active resident, minimum 10** (active resident = last active day within the last 30 Calgary days, 7.4); the Welcome sign and each step 1 need at least 3, so **a single resident finishes the Welcome sign on day one** (shown the next morning) and a first place of each track on the following days
- Resident counts are **cumulative Verified Residents** (same basis as island size, 7.8); built places and opened steps never re-lock
- **At most 3 constructions at a time**; other opened steps wait, taking turns between the tracks
- Construction progress is **applied the next day**; visuals: scaffolding → frame → complete
- The newspaper (with the community board) is open to read from the first day; tapping the **Welcome sign**, and once built the **Community hall**, opens it (11)
- **Locked steps are not drawn on the island** (their lot is plain, walkable land, so the island stays tidy and new places are a surprise); the build map screen (7.6a) shows them with what is missing (e.g. "2 more neighbours", "1 more streak day", "Build the Warming hut first"). A step whose conditions are met appears on its lot as a faded silhouette marked ✨ "Ready to build"
- Names are generic (no trademarks); landmark rules in 7.9
- Community level is permanent (separate from the weekly ranking)

### 7.6a Build map screen (MVP)
- Every resident (and visitors, read-only) can open their community's build map, drawn **like an RPG skill tree**:
  - The **Welcome sign** at the top as the root, then **three vertical lanes** (community, persona, nature & leisure) read top to bottom on a phone; vertical scrolling only
  - **Horizontal bands for the resident counts** that open steps (1, 3, 6, 11, 26, 51 neighbours; they also match the land stages, 7.8), with "N more neighbours" on the next band, so the whole tree reads as a progress bar
  - **Nodes** with a small picture of each place (pre-rendered images served as static files, not live 3D) in four states: built ✅ (colour), building 🔨 (progress ring), ready to build ✨ (glowing), locked 🔒 (grey silhouette with the missing conditions: 👥 neighbours, 🔥 streak days, 🗺️ land)
  - **Landmarks** are large gold nodes at the end of the persona lane; a locked landmark shows its name and silhouette (the reason to invite neighbours), except the **2nd and 3rd landmarks**, which stay a **"⭐ Secret landmark"** with a question-mark silhouette until their step is ready to build (curiosity, and their models come later)
  - The endless decoration steps are **one node, "Decorations (N)"**, showing how many are built and what the next one needs
  - Tapping a node shows what the place is, each condition's progress, "See it on the island", and **"Help build it today"** while it is under construction
- At the top: a **banner** "Let's build <community> together" with the persona's icon and name (e.g. 🛶 Lake life) and the next band's places by name ("Next at 3 neighbours: Skating rink · Beach house · Off-leash dog park"); the overall **completion %**. No finished-island picture (players imagine the final look)
- No branch choices (every resident fills the same tree; the daily choice is which construction to help, 7.7)
- Read-only, built from server-computed values (streak, cumulative Verified Residents, step status); no game rules on the client
- Shares one screen with the personal growth view (13.3, Phase 2) as tabs: **Village | Me**

### 7.6b Extensible places
- The build map (tracks, steps, conditions, multipliers, footprints, sites) and **each community's persona and landmark list** (7.9; source `supabase/data/community_personas.csv`) are **data in the database**; adding a place or a landmark = a data row + a model, no rule code changes
- Every place has a **footprint in tiles fitting its real size** (one tile ≈ a house lot, 12–15 m, slightly compressed; big grounds take their real share, buildings come with their yard, forecourt and trees) and a **site** where it belongs (shore, riverbank, crossing, hilltop, slope, street, park, plaza); a **crossing** place is a bridge (a footbridge, a landmark bridge) laid across the water with both ends on dry land (7.8)
- A client that does not know a place yet draws a **generic placeholder model**, never an error
- Every island keeps **spare lots for future places** and separate **Main Street lots** (22.4)

### 7.7 Projects (construction)
- A project is the construction of one step of the build map (7.6); residents **choose** which active project to help with each action
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
- **The island never shrinks.** Inactivity is shown by the streak (7.5), not by size or scenery.
- **Positions never change.** Each community's lot plan (place lots, residential zones and house lots, spare lots, Main Street lots, paths) is generated **once** and stored; later algorithm changes apply only to new communities or newly added lots. **One exception before launch:** every plan is regenerated once for the build map (7.6) and the new house rule (7.2), since no player has a house yet (operator decision 2026-11-25).
- **Places are laid out by meaning**, not by track: community places around the plaza (a cosy village centre), persona places beside their nature (lake shore, riverbank, hilltop, main street), nature and decoration along the paths between them, residential zones spread out. Each land stage opens a new **zone** with a mix of tracks, so every growth brings new spots in different directions. The plan reserves lots so that each step's resident condition (7.6) matches the land risen at that count.
- **Terrain** (hills, escarpments, ravines as levels of the island floor) is a later step (22.6); MVP islands are flat apart from real water.
- **Real water** (lakes, ponds, wetlands, creeks; City of Calgary Hydrology) is placed at its real position and shape inside the island when the plan is generated (e.g. Mahogany Lake). Water is not walkable and never holds buildings, **except bridge places** (site crossing, 7.6b), which span the water with both ends on dry land (when an island has no water a bridge can span, it stands on the riverbank instead); if water would cut the land apart, a small bridge path keeps every part reachable. Land amounts count dry land only; where water sits next to the plaza, the first two stages get a little more dry land (up to 112 / 176 tiles) so the first buildings and Main Street fit.
- **Map orientation:** every island opens with the same diagonal camera angle, keeping the World Map's orientation (east to the lower right, north to the upper right), so a community looks like its outline on the map (9). Players can then turn it all the way round (10.1); a small compass shows where north is, turns with the view and brings the default angle back when tapped. Places face their site (the water, the street, the plaza), not the camera.
- UI shows the next growth goal (e.g. "2 more neighbours until the island grows").

### 7.9 Community identity & feature library
Each community gets its identity from its **real shape** (7.8) and from:
- **Name sign** at the island entrance
  - The **Welcome sign** is the root of the build map (7.6); every community uses the same voxel model with its own name
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
- **Persona and landmarks (MVP**, operator decisions 2026-11-25/26):
  - Every community has a **persona**, one of 10 patterns: lake, river, downtown, historic main street, golf, new suburb, hill view, food street, mature suburb, special district. It picks the community's persona track (7.6)
  - Every community has a **list of landmarks, at most 3** (more would leave no land for houses and places): order 1 is its **signature landmark** (shown on the World Map, 9, and on share cards), 2 and 3 come later on the persona track (7.6)
  - **One landmark = one real building or place.** Two real landmarks are never bundled into one model; streets or shops around a landmark are only its lot's dressing
  - Landmark models are **voxel reinterpretations from reference photos** (shape, colours, materials); **no logos, sign text or business names**. Third-party photos are reference only and never committed
  - **Each landmark belongs to one community only** (a landmark on a boundary goes to one of them; the other uses its next landmark)
  - At launch the **31 priority communities** have a unique model for their signature landmark; every other landmark without a model yet uses the persona's landmark with the community name, replaced later by data only (7.6b). The aim is a unique landmark for every community over time
  - Places of worship and cemeteries may appear as scenery but are **never build goals**
  - Resident photo petitions (16.2, Phase 3) can propose landmarks later
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

| Development level | Build map (7.4, 7.6) | Shown inside the polygon |
|---|---|---|
| Unsettled | no Welcome sign | Grey dashed boundary, a cloud, empty ground |
| 1 | Welcome sign | A couple of small houses + welcome sign |
| 2 | + first persona place | More houses + that persona place |
| 3 | + Community hall | Houses + community hall with flag |
| 4 | + signature landmark | Houses + community hall + the community's **landmark icon** |

  - Level comes from the community's built places (same data as the island; 7.6, 7.8); the map loads the shapes as a static file and the levels and resident counts in one request
  - Shown for the 223 residential communities
  - **Colour tone follows the level** (more developed = richer green); grey = unsettled. No mood tones (7.4)
  - Crown on this week's #1 community
  - **CTrain Red and Blue lines** drawn over the communities with their stations (names when zoomed in), so the map shows how the communities are connected (7.9)
  - Illustrations use the **same designs as the island buildings** so the map and islands feel like one world
- **Layout rules**
  - Icons are placed inside the polygon (point-in-polygon), away from edges, without overlapping
  - **Icon count scales with polygon area** so large and small communities at the same level look equally developed
  - **Zoom-dependent detail**: at city zoom show a few representative icons per community; when zoomed in show more
  - Render with **Canvas** (thousands of small icons) for phone performance; SVG is acceptable for prototypes
- **Interaction**: tap a community → smooth zoom to it + info card (name, level, residents) → "Enter island"; tap an unsettled community → **"Invite a friend from this community"** (pre-filled message). Before the player has a community, the info card offers **"Start with this community"** instead (5.1)
  - **Any community can be visited** (view only), settled or not, including its Community News (reading and reports; Thanks, today's question and posting only for Verified Residents of their own community, 6.3). A "Visiting <community> · Back home" bar returns to your own community; the "What changed since yesterday" panel only shows in your own community
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
- **Isometric view** (orthographic camera) that players explore freely: **turn all the way round (360°)**, tilt within limits, **zoom in close** to see people and details, and **pan** (two fingers, or right-drag on a computer) while zoomed in, kept within the island. The view follows my avatar when it moves and stops following while the player pans
- **Pastel colours, flat-shaded voxel/box objects on a tiled island** (19.1), soft shadows
- Contents: places of the build map (7.6) and their construction sites, ready-to-build silhouettes, landmarks (7.9), houses (scenery, my own house marked, 7.2), mini villagers, signature features (7.9), Main Street shops (22.4, Phase 4)
- Speech bubbles and name labels are **HTML overlays** positioned over 3D objects (crisp text, Korean/English supported)
  - A **labels toggle** shows or hides all island overlays (speech bubbles, name tags, construction progress, ready-to-build hints) so the scene can be viewed without clutter. On by default; the choice is remembered on the device. My own avatar's name tag and my house marker always stay visible, so I can find myself
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
- Tap a place to see info (e.g. Welcome sign / Community hall → newspaper); other houses do nothing when tapped (7.2)
- **MVP: the player chooses their own villager's look** from the profile button (the first visit starts with a random look, 5.1; changeable any time): **age** (adult, child, elder), **skin tone** (6), **hair style** (short, long, bun, curly, ponytail, bald, headscarf), **hair colour** (including greys), **trousers or skirt**, **beard** (not for children), **glasses**, and the **shirt colour**. Parts, not labels: no "race" or "gender" buttons, so anyone can look like themselves. The form opens filled with a random look and a 🎲 button shuffles it, so "Continue" works at once; every part can be changed on its own. The look is stored with the profile (checked on the server) and stays when the nickname changes; mini villagers stay random. More customization (hats, accessories, emotes) is earned through ranks (13.3, Phase 2), never by chance draws
- Movement is driven by **destination events** ("avatar X moves to tile (5,7)"), not per-frame positions, so the same events can be broadcast for real-time presence later (22.3)

### 10.3 Other residents' avatars (asynchronous)
- In the MVP, **only my avatar moves under my control**; other residents are **not shown in real time**
- Other active residents appear standing near their houses or **replaying today's actions** (with system speech bubbles)
- Residents not active today are "indoors" (not shown)
- Real-time presence of other online residents is a later phase (22.3)

### 10.4 Living community: real weather and time of day (before launch)
- **Weather follows real Calgary weather**: one city-wide reading of Calgary's current conditions from **Environment and Climate Change Canada** (free public data, commercial use allowed with the attribution "Data source: Environment and Climate Change Canada"), fetched on the **server** every 15 minutes and stored (never per player; 20.3); the island only shows it. Without a reading from the last 3 hours the island shows clear weather
  - States: **clear, partly cloudy, overcast, rain, snow, rain and snow, fog, thunderstorm** (heavy rain with lightning flashes). Wind: **calm, breezy, windy**: rain and snow slant with it, trees and flags sway, clouds drift faster. Clouds, rain, snow and fog dim the light and grey the sky a little
  - **Snow settles** on roofs, trees and ground while it snows and stays after it stops, like real Calgary snow; it melts after about 6 hours above +5 °C (e.g. a chinook) or when it rains. Flowers hide under the snow
  - A small **weather chip** on the island shows the condition icon and temperature; tapping it shows the attribution
- **Time of day follows the real sun**: the light comes from the sun's real direction, so shadows move through the day; dawn and dusk tints; at night the sky darkens to a soft starry night (pastel, never black)
  - The sun's direction is computed from the **server's current instant** and Calgary's coordinates (no time zones, 7.5). Phases come from the sun's height: **day**, **dawn/dusk** (sun within 6° of the horizon), **night**
  - The drawn sun is kept at least about 22° high so low winter sun does not shade the whole island; only its direction is real
  - At night the **street lamps, public buildings' and every house's windows light up** (7.2)
- Effects stay within the phone budget (20.3a): rain and snow particles capped (about 1,500), the low-quality mode (M14) reduces them further (about 400) and drops lightning


### 10.5 Sound (before launch)
- **Effects for what the player does**: tapping a project, the avatar working at the site (hammer for buildings, shovel for ice and snow places, broom for parks and gardens), success and error, footsteps (grass or snow), tapping a house (a knock), opening Community News (a page turn), a post bubble appearing (a soft pop), a new building (fanfare and cheering), the island growing (a rising sparkle and cheering)
- **Island ambience follows the real world** (10.4): birds by day, wind by its strength, rain, a quiet winter night, water where the community has water, the campfire and construction sites, the CTrain passing, Canada geese flying over, a distant plane, sometimes an owl at night, thunder with the lightning. At most 3 ambience loops at once, quiet under the effects
- **World Map**: tapping a community, entering an island and opening/closing the map have soft sounds; panning and zooming are silent
- **Background music**, quiet, by time and weather: a day tune, a night tune, a snow tune; it keeps playing across the island and the map and crossfades when it changes
- **Sound settings**: a 🔊 button opens a small panel where **music**, **ambience** and **effects** each have an on/off switch and a **volume slider**; remembered on the device; all on by default (music quiet). Sound starts only after the first tap (browser rules) and pauses while the page is hidden
- **Tapping an animal or a mini villager**: it hops and makes its sound (geese honk, a deer call, a cougar growl, a jackrabbit rustle, a villager's friendly greeting); a soft pop stands in while a file is missing
- Files are static (no server cost) and loaded only when needed; a missing file is skipped silently. Sources and licences are listed on the credits page (CC BY files are credited there)

---

## 11. Community news (community newspaper)

- **Available from the MVP, open from the first day** (operator decision 2026-11-27): every community's newspaper can be **read by everyone**, visitors included (newspaper, operator announcements, the community board with events and roadmap, local news); Thanks, today's question and posting are for Verified Residents of that community (6.3, 14)
  - Opens from the Community button, and by tapping the **Welcome sign** or, once built, the **Community hall** (7.6); the avatar does not need to walk there
- **Auto-generated community newspaper** (no operator effort)
  - e.g. "Yesterday in Mahogany: 7 residents cleared snow and the playground was completed."
  - The newspaper is about **real community life, not game events**: how many new neighbours joined yesterday (with nicknames), farewells, and **local news written by Verified Residents** (events, deals, lost & found; see 14, built right after this section's first version). Game events (buildings, island growth, who helped, streak) stay in the "What changed since yesterday" panel. No personal streak lines; day-level only, no times
  - Written **once per community per Calgary day** (the first time someone opens it) and then served as stored (no extra cost per reader)
  - A community with no news yet shows a first-edition line instead of an empty page, e.g. "<community>'s newspaper is waiting for its first neighbours. Verified Residents can write local news here", under the operator announcements
  - Shows nicknames of active residents (recognition)
  - Yesterday's **today's question** result for the community (14.1), e.g. "Yesterday 3 of 5 neighbours went with 🧅 Layers" (counts only, never who chose what)
  - Farewell line when a resident moves away (6.4), e.g. "Sarah moved to Bridgeland — thanks for everything, neighbour!" (no times)
- **Upcoming updates (roadmap)**: e.g. "December: Community board opens"
- **Operator announcements (global)**: short notices written by the operator (events, maintenance, rule changes), shown to **all communities** at the top of the newspaper. No per-community announcements in the MVP
  - Always at the top of the newspaper. The **community board** section (events and roadmap) is always part of the newspaper. MVP: the operator adds announcements with SQL in the Supabase dashboard (an admin screen comes later)
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
- Generated on: weekly results, building completion (random surprises: later)
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

- Part of the newspaper from the first day (11). What a player can do grows in **personal steps** (not community ones, so a small community is never held back); the write box shows the next step and what it needs (e.g. "🎉 Events opens after 14 active days (9 to go)")

| Step | Who | Can do |
|---|---|---|
| 0 | Anyone signed in (visitors too), in any community | Read, report |
| 1 | Verified Residents, in their own community | 👍 Thanks, answer **today's question** (14.1), write posts: 💬 Free talk, 🔎 Lost & found, 🚨 Safety |
| 2 | Verified Residents with **14 active days** | Also 🎉 Events and 🏷️ Local deals |

  - **Active day** = a Calgary day on which the player took at least one daily action (answering today's question alone does not count); total active days follow the person across moves (6.4) and are the same count the ranks use (13.2: 14 = Neighbour). Computed on the server from the action log (no counter), checked on the server when posting
  - Safety comes at step 1 (urgent news must not wait); Events and Local deals wait because they are the kinds most open to promotion and spam
  - Rewards for posting are **social only** (Thanks, the nickname credit, the post riding a mini villager's bubble, the Community Reporter badge), never energy or construction progress
- Shown in the **Local news** section of Community News (11), credited by nickname, newest first
- A post: a kind and up to **300 characters**; **1 post per resident per Calgary day**; **no links or photos**
  - Kinds are about what is really happening in the community: 🚨 **Safety** (e.g. car break-ins overnight), 🏷️ **Local deals** (local store events and sales), 🎉 **Events**, 🔎 **Lost & found**, 💬 **Free talk**
  - Safety posts remind the writer and readers: "Say what happened, not who. No names or photos. In an emergency, call 911"
- Visible for **3 Calgary days** (the posting day and the next two), then gone; the author can delete their own post (no editing)
- Day-level only: posts show "today", "yesterday", "2 days ago", never a time
- **Safety**
  - Blocked-words filter (same list as nicknames); **phone numbers and street addresses are blocked** (e.g. "403 555 1234", "123 Main St")
  - **Reports**: any signed-in player can report a post once, **at most 3 reports per day**; reports from Verified Residents of that community count 2, others 1; **3 points hide the post, and only when at least one of the reports is from a Verified Resident of that community** (one person alone cannot hide a post, and visitors alone never can: their reports go to the operator, 21). Reporting asks to confirm, and a report can be **taken back** (a mistake), which removes its points and frees that day's report. Thanks and a report exclude each other: reporting takes back my thanks, and a post I reported is folded away for me ("You reported this post · Undo") until I take the report back The operator can hide any post, **restore** a hidden one (a restored post ignores reports), see who reported restored posts, and block an account from reporting
  - Hidden posts stay hidden until they expire
- **Participation**
  - 👍 **Thanks**: Verified Residents of that community, once per post; the count is shown (no ranking)
  - **"Community Reporter" badge** once a resident's posts have received 10 thanks in total
  - The write box suggests what to post (an event, a local deal, something lost or found)
- Paid business ads stay in Phase 4 (22.4); residents may mention a local deal in words (no links)

### 14.1 Today's question (MVP)
- **One multiple-choice question a day for the whole city**: a question and 2–4 choices, each an emoji and a short text; one tap and it is done (no free text, so nothing to moderate). A daily reason to visit and the first posting step (14)
- **Who answers**: Verified Residents of their own community (14 step 1); **one answer per player per Calgary day**, final (no changing). Visitors (including players not verified yet) see the question and today's counts in Community News with "🏠 Verified Residents answer here", but cannot answer and get no pop-up
- **Shown** as a small card the first time the player opens the game that Calgary day (after the "What changed since yesterday" panel when that is open), only while the player can still answer; it can be closed and is also in Community News
- **After answering**: the card turns into the community's counts so far in place (e.g. "Mahogany so far (5 neighbours)", a bar per choice) and **closes by itself after a few seconds** (a tap anywhere closes it sooner; no extra step to start playing). With **fewer than 3 answers** the bars are replaced by "Thanks! See what neighbours chose in tomorrow's paper" (a lone "1 neighbour" says nothing). **Counts only, never who chose what**; the final result goes into the next day's newspaper (11)
- **Questions are data** (`supabase/data/daily_questions.csv`, seeded into the database): id, category, season, situation, question, up to 4 choices (emoji + text). Writing rules: 2–4 choices, every emoji different within a question, choice text at most 32 characters, one choice anyone can pick (e.g. "🤷 Never tried it"), emoji from Unicode 12 or older and no flags (older phones, Windows); no politics, religion or income, no alcohol as the subject (players are 13+), nothing that reveals where someone lives or when they are out (2)
- **Picking** (server, deterministic from the Calgary day, so the whole city gets the same question): from the current season's questions (winter Nov–Mar, spring Apr–May, summer Jun–Aug, fall Sep–Oct) plus year-round ones, matching the day (`weekday` / `weekend` questions only on those days; other situations are stored but not used yet), leaving out questions shown in the last 60 days and the previous day's category
- Answers are append-only rows (one per player per day, idempotent); counts are computed on read (20.3)

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
- 3-of-7-days location verification for everything that counts people (6.3)
- Daily visitor help limit per community (6.3); visitors' reports alone never hide a post (14)
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
- Pages: `/terms.html`, `/privacy.html`, `/credits.html` (static; linked from the first visit and the profile sheet). The first-visit card states, under "Start with this community", "By tapping Start you confirm you are 13 or older and agree to the Terms and Privacy Policy"
- Data is hosted in Canada (Supabase, Canada Central region); account deletion on request by email within 30 days (all game data is deleted with the account)
- Email updates: the profile sheet has an unticked checkbox with the consent wording; the address is asked only after ticking; consent time and wording version are recorded; unticking withdraws at once (the address is deleted, the withdrawal time kept). The MVP only collects; sending comes later
- Data credits: City of Calgary Open Data (Open Government Licence – City of Calgary) and OpenStreetMap (ODbL) on `/credits.html`

---

## 19. Art requirements

### 19.0 MVP art policy
- **The MVP uses only simple shapes, no detailed art.**
  - World Map: flat pastel 2D polygons of community boundaries (level tone; grey = unsettled)
  - Community view: **react-three-fiber (three.js) scene built from coloured boxes** — island tiles, box trees, box houses with box roofs, labelled box buildings, translucent/grey boxes for locked silhouettes, two-box characters for avatar and mini villagers
  - Projects: box construction site + progress bar UI
- Because the target style is voxel (made of boxes), the box-based MVP already looks close to the target. A working proof of concept was built on 2026-11-16 (~100 lines of three.js: floating island, layered dirt, box trees/houses, wandering villagers, HTML speech bubbles, tap-to-move avatar, construction progress, island growth).
- Purpose: ship the full MVP fast and validate the core loop before investing in art.
- Detailed art (19.1–19.4) is applied in the **Art Pass** without changing game logic. The Art Pass is done **before the deploy and playtest** (decided 2026-11-24): communities must look worth playing; its scope is planned with the operator

### 19.1 Style guide (target)
- **Pastel voxel style** (kept by operator decision 2026-11-25 after reviewing the low-poly Polyfork version in the gallery: the voxel look and its volumes read better): houses, buildings, trees, cars, people and animals are built from blocks/boxes, flat-shaded, soft shadows. Fantasy touches are welcome: it is a playful virtual Calgary
- **Floating diorama island** with layered dirt underneath, soft pastel sky background
- **Isometric orthographic view**, turnable all the way round (10.1): every house, place and landmark is **finished on all sides** (windows, doors, details), not only the sides the default angle shows
- **One pastel palette** for everything (roofs and walls picked per house)
- **A grown community looks varied, never patterned**: many house designs per house type (shapes may take ideas from free model catalogues such as Polyfork, redrawn in voxels), per-house roof and wall colours, mirrored plans, a mix of sizes by community type; new designs keep the **volume of the existing voxel models** (same footprint and height class, checked by tests)
- **People look like Calgary**: adults, children and elders, many skin tones, hair styles (headscarves included) and clothes
- Weather and time apply to every model (10.4): snow settles on roofs, windows light at night, crowns sway in the wind
- Light from the sun's real direction (10.4), gentle ambient light, no harsh contrast
- Small, cute characters with HTML speech bubbles and name labels
- **Launch theme: winter** (snow-covered island, window lights)
- Reference: `docs/references/` (VibeBase "Voxel Village" screenshots, for mood and layout)

### 19.2 Production
- No outsourcing; made in-house
- **Every model is built in code from boxes** (voxels, 12 per tile); shapes from other catalogues are used only as reference, never as files
- Calgary-specific things (CTrain, landmarks) are made in code in the same style
- Other free/CC0 asset packs may be used — **check licences for commercial use**
- AI is used for concepts/ideas only
- Test consistency with a small set first, then scale (done 2026-11-25: `spike/polyfork`, then the gallery's "New voxel designs")

### 19.3 Effects handled in code
- Day/night: sun direction (shadows), light colour/intensity, sky tint, lamps and windows at night, driven by real Calgary time (10.4)
- Rain, snow: particles; wind: sway of trees, flags, smoke (10.4)
- Water shimmer: animated material colour
- Tree sway, character bounce/head-down: code tweens
- Window lights: emissive boxes at night
- Island growth: new edge tiles rise with a tween

### 19.4 Asset list (draft)
- MVP (code boxes): island tiles (grass, path, snow), dirt layers, trees, houses (roof/wall colour variants via code), places of the build map (7.6: community and nature tracks, a place library of 10 persona tracks, each place sized to its real footprint) and unique landmark models (7.9) + construction stages (scaffolding/frame/complete) + silhouettes + generic placeholder, avatar, mini villagers
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
| 3D models | Voxel models built in code from boxes (19.2) |

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
- Communities that reached the daily visitor help limit (6.3), and posts with 3+ report points from visitors only (14); the limit itself is an operator setting
- Analytics dashboard (last 28 days): visitors, new visitors (first visit that day), % of new visitors acting on their first day, D1 / D7 retention (share of a day's new visitors who visit again 1 / 7 days later; shown once that day has passed), shares, invite-link visits, visits by community (last 7 days), number of email opt-ins
- Analytics data is day-level only (no times, no location, no device data), capped at 50 events per player per day, and deleted with the account

### Phase 2
- Report moderation screen (list, hide/restore, suspend users)

---

## 22. Release phases & scope

### 22.1 MVP (winter launch theme)

**Included**
- Anonymous account + Turnstile + Google linking
- Community picked by the player (search, World Map, optional "near me"); 3-of-7-days resident verification in it; Visitor / Verified Resident roles with a daily visitor help limit (6.3)
- Calgary World Map from **real community boundary polygons**, each showing **small development illustrations** (houses, welcome sign, playground, community hall, park by level) with Vitality mood, #1 crown, tap-to-zoom and invite for unsettled communities
- Community view as a **box-built three.js voxel diorama island in the community's real shape** (outline from day one, land growth by residents, build map, houses as scenery with my own house, persona places and landmarks, mini villagers, 3 Vitality levels, action replay with speech bubbles, a few signature features from the feature library)
- First visit: the World Map behind one "Let's build Calgary together" card with community search, island in two taps (5.1)
- **My avatar**: tap/click to move with pathfinding; action buttons make the avatar run to the spot and act
- 3 daily energy + project choice + satisfying click feedback + a few surprises
- Community streak, **build map** (7.6: the Welcome sign as root, three tracks built in order, persona places, up to 3 landmarks per community, no place twice), ready-to-build silhouettes
- **Build map screen** (7.6a) drawn like a skill tree: three lanes, resident-count bands, node states, landmark nodes; the "Let's build <community> together" banner on top
- Avatar look: random at first, then age, skin tone, hair, clothes and shirt colour chosen by the player (10.2)
- Next-day construction progress + "What changed since yesterday"
- Auto community newspaper with the community board (open to read from the first day) + roadmap notice + "Coming soon"
- **Today's question** (14.1) and resident posts opening in personal steps (14)
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
6. Today's question (a small, new reason to open the game every day)

### 22.2 Phase 2
- **Art Pass** and **day/night and weather** — *moved before the deploy and playtest (22.6, 10.4; 2026-11-24)*: refined pastel voxel models and props (Section 19.1–19.4), styled World Map with animated Bow/Elbow rivers, moving CTrain trains, Calgary landmark buildings and transitions, character variants and animations, avatar customization, walk-up-and-tap actions, day/night and weather effects
- Activity-based signature feature upgrades (7.9)
- Resident board + report moderation screen
- Profile & ranks, **avatar growth** (rank = level, cosmetic rewards, community-linked rewards, badge collection, Me tab; 13.3)
- Speech bubbles (preset phrases → free text)
- Mini villager requests, player requests

### 22.3 Phase 3
- Seasonal events (Rodeo Season, winter aurora, etc.), collections
- Visitor mode (interactions when visiting other communities)
- More landmarks proposed by residents through photo petitions (7.9 / 16.2); landmarks themselves are in the MVP (7.9)
- Aurora events
- **Real-time presence**: other online residents' avatars visible and moving in the same island (broadcast destination events per community channel, e.g. Supabase Realtime; cap ~30 visible avatars per island; distinct label colour for online residents; simple emoji greetings)
- Community petitions (16.2)
- Advanced share/update celebration events
- **Community marketplace** (buy, sell, give away): needs in-app messaging and trade-safety rules first; not in the MVP's community posts (14)
- **Enter buildings and decorate my own house** (idea, not planned yet): tap a building or my house to go inside a small interior scene; residents decorate their own house's interior with **rewards earned by their activity** (operator plan 2026-11-24), and buildings may hold mini games or other actions. "My house" must therefore always exist (7.2); the fixed house lot is what makes it stable

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
| 6a | **Real weather and time of day** on the islands (10.4); island scenery no longer follows the Vitality mood |
| 6b | **Living community** (decided with the operator 2026-11-24, details in 7.2–7.4): mini villagers appear naturally at random instead of from player counts; houses fill the land as the community grows, and every Verified Resident still has their own house among them ("My house"); Vitality is redefined as community development (new buildings); walking villagers show residents' recent community posts (14; never Safety posts) as speech bubbles credited by nickname |
| 6c | **Sound** (10.5): effects, island ambience by weather and time, World Map sounds, background music, music/effects on-off |
| 6d | **Art Pass 2** (19.1, 19.2): more voxel designs (shapes after free catalogues such as Polyfork, sized like today's models) for houses, buildings, trees, cars and props, and varied people, weather-aware |
| 6e | **Community identity** (decided with the operator 2026-11-25/26, details in 7.2, 7.6–7.9): a build map with the Welcome sign as root and three tracks built in order (community, persona, nature & leisure), shown as a skill tree, personas and up to 3 landmarks per community (31 unique signature landmarks at launch), houses as scenery with only my own house personal, places laid out by meaning and every island plan regenerated, a camera that turns all the way round and zooms in close |
| 6f | **Terrain** (hills, escarpments, ravines as island levels): a separate step after 6e; whether it comes before the launch is decided after playing 6e |
| 6g | **Community News steps** (decided with the operator 2026-11-26, details in 11, 14, 14.1): one newspaper with the community board from the Welcome sign, posting in personal steps (the last by active days), today's question for the whole city; before the launch |
| 6h | **First visit & open residency** (decided with the operator 2026-11-27, details in 5.1, 6.2–6.4, 11, 14): the World Map behind one card, community picked by search or map, the island in two taps with a random villager; Visitor / Verified Resident roles, visitor help counted with a daily limit, verification in my community, newspaper readable from the first day; before the launch |
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
- [ ] Build map numbers (conditions, step multipliers, footprints), the landmark list of each community and the models still missing
- [x] Project list and required actions per project (decided 2026-11-18, see 7.7)
- [x] Vitality smoothing details (2026-11-24: Vitality is no longer shown to players, 7.4)
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
| My community | The community a player picked (5.1); the island the game opens on, where their daily help goes and where verification counts. A home setting, not a role (6.3) |
| Visitor | Anyone who is not a Verified Resident of a community, including a player who picked it but is not verified yet; can read, report and help build their own community within the daily visitor help limit (6.3) |
| Verified Resident | A user who opened the site from inside their community on 3 different days within 7 days |
| Daily visitor help limit | The most actions all Visitors together can give one community in a Calgary day (9 at launch, an operator setting, 6.3) |
| House | Scenery in the residential zones of an island (7.2); only "My house" is personal, and only its owner sees it as theirs |
| Mini villager | Ambient voxel character that makes the island feel lived in (random count by island size); never represents or impersonates a real player |
| Avatar | The user's own controllable character in their community's island (tap/click to move) |
| Destination event | Avatar movement expressed as "move to tile (x, y)"; local-only in the MVP, broadcastable for real-time presence later |
| Island / diorama | The floating voxel island in the real shape of one community; its land grows inside the visible outline with cumulative Verified Residents. **Internal term only: player-facing text says "community"** (e.g. "Visit this community", "Back to my community", "Community size") |
| Feature library | Reusable signature blocks (lake, creek, hill, park, etc.) assigned to communities for identity |
| Petition | Residents' request to add a feature-library block to their island; operator decides monthly |
| Action replay | Mini villagers re-enacting real actions residents took today, with a system speech bubble |
| Energy | Daily action allowance (3 per day) |
| Project | The construction of one step of the build map, which residents contribute actions to |
| Vitality | 0–100 score of recent community activity; internal operator metric, not shown to players (7.4) |
| Development level | 0–4 from the build map (Welcome sign, first persona place, Community hall, signature landmark); shown next to the community name and on the World Map (7.4, 9) |
| Persona | One of 10 community patterns (lake, river, downtown, …) that picks a community's persona track (7.9) |
| Landmark | One real building or place of a community, reinterpreted in voxels; at most 3 per community, order 1 is the signature landmark (7.9) |
| Community Streak | Consecutive days on which at least half of the Active Verified Residents took an action |
| Active Verified Resident | A Verified Resident who took at least one action within the last 7 Calgary days (including today); denominator for the streak (Vitality uses the 30-day basis, 7.4) |
| Last active day | The later of a Verified Resident's last action day and verification day; decides whether their house is shown (30 days) and the Vitality denominator |
| Move | A Verified Resident changing community: user-started, re-verification in the new community, no limbo, auto-cancel after 7 days, 90-day cooldown, one free correction within 14 days of first verification (6.4) |
| Cumulative Verified Residents | Distinct people who have ever been Verified Residents of a community; never decreases (movers stay counted, returners are not counted twice) |
| Build map | The data-driven community places, shaped like a skill tree: the Welcome sign as root, then three tracks (community, persona, nature & leisure), each built in order: the previous step plus residents, streak and land open a step, residents build it (7.6) |
| Active day | A Calgary day on which a player took at least one daily action; counted per person across moves; opens posting step 3 at 14 (14) and the ranks (13.2) |
| Posting steps | What a player can do in Community News, growing with their own progress: read and report → (Verified Resident) Thanks, today's question and posts → Events and Local deals (14) |
| Today's question | One multiple-choice question a day for the whole city, answered by Verified Residents, shown as community counts only (14.1) |
| Unlock | A build map step whose conditions are met (it can now be built) |
| Main Street | Reserved temporary lots for local business shops (Phase 4, 22.4) |
| Silhouette | Faded preview of a step that is ready to build |
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
