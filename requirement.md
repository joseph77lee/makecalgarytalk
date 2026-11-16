# Requirements — MakeCalgaryTalk (makecalgarytalk.com)

| Item | Value |
|---|---|
| Document version | v1.1 |
| First written | 2026-11-16 |
| Last updated | 2026-11-16 |
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

---

## 2. Concept

**A web game where Calgary communities compete by growing their neighbourhood together.**

- **The game has no separate name. The site itself (makecalgarytalk.com) is the game.**
- Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a pixel-art village.
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
1. Land on the site → snowy pixel-art **Calgary World Map**
2. "Which community do you live in?" → allow location
3. Zoom into their community
4. First action click → **immediate visible change**
   - Empty community: fog clears, "You are the Founding Resident!"
   - Existing community: construction progress bar rises, mini villagers cheer
5. "N more neighbours / N more streak days until the playground" + **Invite button**

### 5.2 Daily routine
1. **World Map**: see how developed all of Calgary is. Tap an empty community to invite a friend who lives there
2. **My community**: "What changed since yesterday" summary + mini villagers' mood
3. **Today's 3 actions**: pick one of the active projects and click
4. **Village Notice Board / Community Centre**: read the auto-generated community newspaper (later: resident posts, coupons, new business news)

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
- **Changing community**: once every 90 days (requires re-verification)
- Users getting verified in their workplace community are allowed in the MVP (keep rules simple)

---

## 7. Community model (shared growth)

### 7.1 Community states
- **Unsettled**: 0 residents. Covered by fog/clouds on the World Map
- **Settled**: first resident arrives → fog clears; the first resident gets the "Founding Resident" badge

### 7.2 Resident houses
- One house per Verified Resident, with a **name tag (nickname)**
- Residents active today: lights on + chimney smoke
- Residents not active today: lights off
- **Inactive 30+ days**: house is temporarily removed from the village (archived); it reappears when they return
- Houses are not something individuals grow; they show "I live in this community"
- The village fills from the centre (Community Centre site) outward
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
- Tuned to **fall slowly and rise quickly**
- MVP has 3 mood levels

| Vitality | Mood | Scenery |
|---|---|---|
| 60–100 | Lively | Flowers, lights, clean streets, many mini villagers |
| 30–59 | Normal | Ordinary look |
| 0–29 | Gloomy | Piled snow, wilted trees, greyish tint, few mini villagers |

- Don't make it too depressing ("cute gloomy")
- Gloomy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card

### 7.5 Community Streak
- **Community attendance day** = a day when **at least half** of Verified Residents take an action
  - In a community with only 1 Verified Resident, that 1 person is enough
- Day boundary: Calgary time (America/Edmonton) midnight
- UI example: "Mahogany 5-day streak! Today 2/6 — 3 residents keep it going"

### 7.6 Community unlocks (MVP)

| Condition | Unlocks |
|---|---|
| 3-day community streak | Playground |
| 7-day streak + 5 Verified Residents | Community Centre (resident board feature opens in Phase 2) |
| 30-day streak | Park |

- Locked buildings appear as **faded silhouettes** with "1 more streak day until the Playground"
- Community level is permanent (separate from the weekly ranking)

### 7.7 Projects (construction)
- A community has **2–3 active projects** at a time (e.g. Build an ice rink / Make a flower path / Holiday decorations)
- When acting, residents **choose** which project to contribute to
- Construction progress is **applied the next day** (progress overnight → a reason to check tomorrow)
- Construction visuals: scaffolding → frame → complete
- Project list and required amounts: see [22.8 Open Items]

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

---

## 10. Community view

> MVP renders this with basic shapes (see 19.0); pixel art comes in the Art Pass.

- Square-grid pixel village
- Contents: community buildings (playground, community centre, park, etc.), resident houses, mini villagers, project construction sites, locked-building silhouettes
- On entry, show **"What changed since yesterday"** (construction progress, new residents, trees planted, etc.)
- Show community streak status and remaining conditions for the next unlock
- Users can visit and view other communities (actions only in their own community)

---

## 11. Village news (community newspaper)

- **Available from the MVP** (Village Notice Board). Moves into/expands at the Community Centre once built
- **Auto-generated community newspaper** (no operator effort)
  - e.g. "Yesterday in Mahogany: 7 residents cleared snow and the playground was completed. Sarah hit a 7-day streak!"
  - Shows nicknames of active residents (recognition)
- **Upcoming updates (roadmap)**: e.g. "December: Community board opens"
- Locked features are shown with a lock icon + "Coming soon"

---

## 12. Ranking & sharing

### 12.1 Weekly community ranking
- **Score = average daily active Verified Residents per 1,000 population**
  - Formula: (sum of daily active Verified Residents over the week ÷ 7) ÷ max(community population, 1,000) × 1,000
- Only communities with **5+ active Verified Residents** are ranked
- Display: TOP 10 + my community's rank
- **Resets every Monday 00:00 (Calgary time)**; last week's results announced on Monday

### 12.2 Share cards
- The image **always includes the community name** (so it spreads in community Facebook groups, etc.)
- Generated on: weekly results, building completion, community revival, random surprises

### 12.3 Invites
- Personal invite link
- If the invitee becomes a **Verified Resident of the same community**, both get a reward (rare decoration/badge)
- If my invite brings the **first resident to an empty community**, I get the "Pioneer Sponsor" badge

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

---

## 14. Resident board (Phase 2, communities with Community Centre)

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

## 16. Requests (Phase 2)
- **Mini villager requests**: "!" above a mini villager → help with one click → recorded in the newspaper
- **Player requests** ("Regular Neighbour" and above): other residents help with a click
- Requests are **in-game only, chosen from a preset list** (no real-world meetups or favours)

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
- Provide a contact email

---

## 19. Art requirements

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

---

## 20. Technical requirements

### 20.1 Stack

| Area | Technology |
|---|---|
| Web UI (menus, news, login, etc.) | Angular |
| World Map + pixel community view | PixiJS (consider a viewport plugin for zoom/pan) |
| Backend API | Spring Boot |
| Database | Supabase PostgreSQL + PostGIS |
| Auth | Supabase Auth (Anonymous + Google linking) |
| Static files / snapshots | Cloudflare Pages / R2 |
| Bot protection | Cloudflare Turnstile |
| Analytics | Plausible or PostHog |
| Pixel editing | Aseprite |

### 20.2 Data
- City of Calgary Open Data: **community boundaries**, **population per community**
- OpenStreetMap: rivers, parks, major roads (for generating the World Map base)

### 20.3 Server cost principles
1. Anything that doesn't change (art, World Map base, community boundaries) is served as **static files via CDN**
2. Growth/progress is **computed from stored timestamps + rules** (no bulk updates of all records)
3. Daily actions update the screen immediately and are sent to the server in batches (**validation on the server**)
4. Community state and rankings are built as **JSON snapshots every 5–10 minutes** and served via CDN
5. No real-time connections (WebSocket). "Recently active" info is included in snapshots
- Target: **2–3 server calls per player per day**

### 20.4 Swappable rendering layer
- Game objects (community, house, building, silhouette, mini villager, project) are rendered through a **visual layer referenced by asset keys**, separate from game logic.
- MVP maps each asset key to a basic shape; the Art Pass maps the same keys to pixel sprites. No game-logic changes required.

### 20.5 Designed for city replication
- City boundary, community boundaries, population, and World Map base are separated as **per-city data**
- New city = swap data + add landmark art

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

### 22.1 MVP (target: late Jan – Feb 2027, winter theme)

**Included**
- Anonymous account + Turnstile + Google linking
- Location-based community detection, 3-of-7-days resident verification
- Calgary World Map **in basic shapes** (community polygons, Vitality colour tones, grey for unsettled; day/night tint and snow are optional nice-to-haves)
- Community view **in basic shapes** (buildings, resident houses, mini villagers as dots, 3 Vitality levels, action replay as text/simple motion)
- 3 daily energy + project choice + satisfying click feedback + a few surprises
- Community streak, unlocks (Playground / Community Centre / Park), locked-building silhouettes
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
- **Art Pass**: replace basic shapes with pixel art (Section 19.1–19.4), pixel World Map with landmarks, mini villager animations, day/night and weather effects
- Resident board + report moderation screen
- Profile & ranks
- Speech bubbles (preset phrases → free text)
- Mini villager requests, player requests
- 5 Vitality mood levels

### 22.3 Phase 3
- Seasonal events (Rodeo Season, winter aurora, etc.), collections
- Visitor mode (interactions when visiting other communities)
- Community landmark (60-day streak, chosen by resident vote)
- Aurora events, real-time presence indicator
- Advanced share/update celebration events

### 22.4 Phase 4 (monetization)
- **Local business buildings as ads**
  - Self-serve purchase page (choose community and period, card payment, choose building art)
  - Must be labelled "Ad/Sponsored"; no effect on game outcomes
  - Pricing based on each community's active resident count
- Community coupons, new business news
- Open only after there is traffic

### 22.5 Expansion
- Replicate to other cities (Edmonton → Vancouver, Toronto, etc.)
- "Battle of Alberta" Calgary vs Edmonton season
- Apartments/condos (multi-resident buildings) once communities get very large

### 22.6 Development order (~10 hours/week, ~8–10 weeks)

| Step | Work | Duration |
|---|---|---|
| 1 | Load community boundary/population data, anonymous login, location → community, resident verification | 2 weeks |
| 2 | Shape-based community view (buildings, houses, mini villagers, Vitality) + swappable rendering layer | 1–2 weeks |
| 3 | Daily actions, projects, community streak, unlocks, action replay, newspaper | 2 weeks |
| 4 | World Map, weekly ranking, share cards, invites | 2 weeks |
| 5 | Legal pages, analytics, email subscription, polish → family/friends test | 1–2 weeks |

### 22.7 Launch
- After family/friends testing, post on r/Calgary and community Facebook groups with a "Calgary dev made this" story
- After the initial spark, growth comes from in-game invite/share mechanics

### 22.8 Open items
- [ ] Art style references, palette, reference images (before the Art Pass)
- [ ] Project list and required actions per project
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
| Mini villager | Ambient pixel character showing the community's mood; never represents or impersonates a real player |
| Action replay | Mini villagers re-enacting real actions residents took today, with a system speech bubble |
| Energy | Daily action allowance (3 per day) |
| Project | A community construction/beautification goal residents contribute actions to |
| Vitality | 0–100 score of recent community activity that drives mood and scenery |
| Community Streak | Consecutive days on which at least half of Verified Residents took an action |
| Unlock | A community building/feature that opens when streak/resident conditions are met |
| Silhouette | Faded preview of a locked building |
| World Map | Pixel-art map of all of Calgary showing each community's development |
| Community view | Pixel village screen of a single community |
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
