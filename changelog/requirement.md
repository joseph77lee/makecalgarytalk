# requirement.md — Change Log

History of every change to [`requirement.md`](../requirement.md) (moved out of §24 on 2026-11-24 to keep the main document small).

> New entries go at the **top**. Format:
> ```
> ### YYYY-MM-DD — vX.Y
> **Changed:** what changed
> **Why:** why it changed
> **Previous:** the old text, verbatim
> ```
> New sessions: read only the first few entries (the top of this file).


### 2026-11-27 — v1.54
**Changed:** First visit and residency redesigned ("First visit & open residency"). 5.1 the World Map fills the screen behind one "Let's build Calgary together" card with a community name search (and an optional "📍 Find communities near me"); "Start with this community" creates the account with a random villager look and the suggested nickname and opens the island (two taps, no form, no location prompt); invite links pre-pick the inviter's community; a "🏠 Verify I live here" chip that never pops up. 6.2 location is only for suggesting a community and for verification, asked when tapped, then checked automatically on opening until verified (or during a move); PCs may try, the server decides. 6.3 two roles, **Visitor** and **Verified Resident**, with **my community** as a home setting; verification only in my community, a check elsewhere asks to switch; Visitor help counts like a resident's (next day) with no pending step, never for streak, Vitality or ranking, within a **daily visitor help limit of 9 actions per community** (operator setting); a role table. 6.4 one "Change my community" (instant before verification, a move after); during a move help goes to the new community as a Visitor's and Thanks, question and posting stay with the old one; moving out of Calgary keeps the old community. 11 every newspaper is readable by everyone from the first day (no Welcome sign gate; a first-edition line when there is no news). 14 Thanks and today's question move to Verified Residents (posting steps 0–2); a post is hidden at 3 report points only when a Verified Resident of that community reported it. 14.1 visitors get no question pop-up. 1.4, 7.1, 7.6, 9, 10.2, 17, 18, 21, 22.1, 22.6 (6h) and 23 (My community, Visitor, Daily visitor help limit) follow. Header version.

**Why:** First-visit review 2026-11-27: five screens (intro card, villager form, location, welcome card, question) before playing raise drop-off ("스텝이 많으면 이탈률이 높아져"); a first visit away from home recorded the wrong community; a new player's help showed nothing for three days and the newspaper stayed locked. Operator decisions in the same session: pick the community directly, GPS only to suggest and verify ("임의로 선택하고 그 자기 동네에 왔을때 다시 접속해서 인증"); no preview screen; two roles only ("방문자, 인증된 주민. 이렇게 2개만"); visitors may keep helping (option A) with a daily visitor help limit ("하루 방문자 도움 상한이 마음에 드는데"); newspaper readable by all, Thanks and posting for residents; reports stay open to all but visitors alone cannot hide a post; all of Claude's recommendations accepted ("둘 다 추천대로 해줘", "너의 추천대로 할게"). Note: construction still shows on the bar the next day for everyone (7.6); "counts at once" means no waiting for verification.

**Previous (verbatim, every removed line):**
- `| Document version | v1.53 |`
- `1. **Show the finished neighbourhood** → "I want to build that" (a completed example on the first visit, 5.1)`
- `1. Land on the site → a **"Let's build Calgary together" card** (a designed banner and a few words on how neighbours grow their community together; no finished island is shown, so players imagine the final look themselves) → "Let's start" → nickname and how my villager looks (10.2). Shown on the first visit only`
- `2. "Which community do you live in?" → allow location. "Just look around first" opens the **Calgary World Map** (9) instead; the map is also always one tap away (🗺 Calgary button)`
- `3. Tap into their community → the community's voxel diorama island appears, with **my avatar** standing in it`
- `4. First action click → **immediate visible change**`
- `   - Empty community: fog clears, "You are the Founding Resident!"`
- `   - Existing community: construction progress bar rises, mini villagers cheer`
- `   - Shown as a **welcome card** right after the first counted check-in ("Welcome to <community>! N more neighbours and the island grows") with Invite neighbours / Look around first; "N more neighbours" goals elsewhere (streak bar, build map) also open the invite`
- `4. **Community News** (Welcome sign, later the Community hall; 11): answer **today's question** (14.1), read the newspaper with the community board and residents' local news (14)`
- `- **Nickname on the first visit**, together with how the avatar looks (10.2): a suggested nickname is pre-filled (e.g. "Snowy Moose 42") so the player can just continue; 2–16 characters, a basic blocked-words filter, checked on the server; changeable later. Shown on house name tags (7.2) and in the newspaper (11)`
- `- **Link Google account (optional)**: prompt "Link Google to keep your progress" once the community grows or the user becomes verified`
- `- Determine the current community from browser geolocation`
- `- Show "Please verify residency on your phone" (PCs use Wi-Fi-based location and are inaccurate)`
- `- A check whose reported accuracy is worse than **1 km** is not counted (the player is asked to try on their phone). At most **20 checks per account per Calgary day**`
- `- Open the site from inside the same community on **3 different days within 7 days** → **Verified Resident**`
- `- While verifying (days 1–3)`
- `  - Full gameplay allowed; contributions are stored as "pending"`
- `  - The player plays in their **candidate community** = the community with the most check-in days in the last 7 Calgary days (tie → the most recent check-in); verification happens in whichever community first reaches 3 days`
- `  - A visit from another community (e.g. workplace) doesn't count as a verification day; a visit from home later the same day does`
- `  - Pending contributions are applied to the community **from the verification day**: they count toward the construction projects they were given to; earlier days' attendance and Vitality do not change; contributions to a project that already finished are not carried over. Pending contributions given in another community are not applied`
- `- **Changing community**: see 6.4 (moving)`
- `- **Started by the user** ("I moved" in settings). Starts a location check and re-verification in the new community (3 different days within 7 days, same rules as 6.3). Moves cannot be detected automatically because Verified Residents are no longer location-checked.`
- `  - The user stays a Verified Resident of the old community and keeps their house there (no limbo)`
- `  - Their actions are stored as pending contributions for the new community (6.3)`
- `  - Their house moves to the new community and pending contributions are applied there`
- `- **Settled**: the community's **Welcome sign** (the root of the build map, 7.6) is built → fog clears on the World Map; the first resident (the community's **first Verified Resident**) gets the "Founding Resident" badge. A first resident can build it on their first day`
- `- The newspaper (with the community board) opens from the **Welcome sign**; the **Community hall** takes it over once built (11)`
- `- **Interaction**: tap a community → smooth zoom to it + info card (name, level, residents) → "Enter island"; tap an unsettled community → **"Invite a friend from this community"** (pre-filled message)`
- `  - **Any community can be visited** (view only), settled or not, including its Community News (reading, thanks and reports; posting only in your own community). A "Visiting <community> · Back home" bar returns to your own community; the "What changed since yesterday" panel only shows in your own community`
- `- **MVP: the player makes their own villager** on the first visit (changeable later): **age** (adult, child, elder), **skin tone** (6), **hair style** (short, long, bun, curly, ponytail, bald, headscarf), **hair colour** (including greys), **trousers or skirt**, **beard** (not for children), **glasses**, and the **shirt colour**. Parts, not labels: no "race" or "gender" buttons, so anyone can look like themselves. The form opens filled with a random look and a 🎲 button shuffles it, so "Continue" works at once; every part can be changed on its own. The look is stored with the profile (checked on the server) and stays when the nickname changes; mini villagers stay random. More customization (hats, accessories, emotes) is earned through ranks (13.3, Phase 2), never by chance draws`
- `- **Available from the MVP**: the newspaper opens **in full** from the **Welcome sign** (newspaper, operator announcements, the community board with events and roadmap, local news); the **Community hall** takes it over once built (7.6)`
- `  - Opens when the player taps the building; the avatar does not need to walk there`
- `  - Before the Welcome sign is built, tapping its spot says "Build the Welcome sign to open the community newspaper"`
- `  - Always at the top of the newspaper. The **community board** section (events and roadmap) is part of the newspaper from the Welcome sign on. MVP: the operator adds announcements with SQL in the Supabase dashboard (an admin screen comes later)`
- `- Opens when the community's **Welcome sign** is built (together with the newspaper). What a player can do grows in **personal steps** (not community ones, so a small community is never held back); the write box shows the next step and what it needs (e.g. "🎉 Events opens after 14 active days (9 to go)")`
- `| 0 | Anyone signed in (visitors too) | Read, 👍 Thanks, report |`
- `| 1 | Residents of the community they play in (verifying included) | Answer **today's question** (14.1) |`
- `| 2 | Verified Residents, in their own community | Write posts: 💬 Free talk, 🔎 Lost & found, 🚨 Safety |`
- `| 3 | Verified Residents with **14 active days** | Also 🎉 Events and 🏷️ Local deals |`
- `  - Safety comes at step 2 (urgent news must not wait); Events and Local deals wait because they are the kinds most open to promotion and spam`
- `  - **Reports**: any signed-in player can report a post once, **at most 3 reports per day**; reports from Verified Residents count 2, others 1; **3 points hide the post** (one person alone cannot hide a post). Reporting asks to confirm, and a report can be **taken back** (a mistake), which removes its points and frees that day's report. Thanks and a report exclude each other: reporting takes back my thanks, and a post I reported is folded away for me ("You reported this post · Undo") until I take the report back The operator can hide any post, **restore** a hidden one (a restored post ignores reports), see who reported restored posts, and block an account from reporting`
- `  - 👍 **Thanks**: any signed-in player, once per post; the count is shown (no ranking)`
- `- **Who answers**: residents of the community they play in, verified or verifying (14 step 1); **one answer per player per Calgary day**, final (no changing). Visitors see the question and today's counts but cannot answer`
- `- 3-of-7-days location verification`
- `- Pages: \`/terms.html\`, \`/privacy.html\`, \`/credits.html\` (static; linked from the first visit and the profile sheet). The first-visit screen states "By tapping Start you confirm you are 13 or older and agree to the Terms and Privacy Policy"`
- `- Location-based community detection, 3-of-7-days resident verification`
- `- "Let's build Calgary together" card on the first visit (5.1)`
- `- Avatar look: age, skin tone, hair, clothes and shirt colour chosen by the player (10.2)`
- `- Auto community newspaper with the community board (from the Welcome sign) + roadmap notice + "Coming soon"`
- `| Resident | A user who belongs to a community |`
- `| Newcomer | A user who has not finished resident verification |`
- `| Posting steps | What a player can do in Community News, growing with their own progress: read → today's question → posts → Events and Local deals (14) |`
- `| Today's question | One multiple-choice question a day for the whole city, answered by residents, shown as community counts only (14.1) |`

### 2026-11-27 — v1.53
**Changed:** 5.1 the first visit opens with a "Let's build Calgary together" card instead of the finished-neighbourhood example. 7.6a the build map's top shows a banner ("Let's build <community> together", persona icon and name, the next band's places by name) instead of the finished-island picture; the "See a finished example" button is gone; the 2nd and 3rd landmarks stay a "Secret landmark" until ready to build; the decoration steps are one "Decorations (N)" node. 22.1 follows. Header version.

**Why:** Playtest 2026-11-27: the finished-island picture and the example gave no "wow" moment and took away the curiosity ("이걸 보고 '우와~' 모먼트가 없어… 사람들이 최종 모습을 상상하게 만드는거야"); placeholder names ("Landmark 2", "Decoration") looked unfinished; "Coming at 6 neighbours: Big park, School" named things that are not in the tree. Operator: do D, E and the banner now; the starter checklist is postponed to a later session.

**Previous (verbatim):**
- Header: `| Document version | v1.52 |`
- `1. Land on the site → a short **completed-neighbourhood example** (one image or a short animated scene, rendered with the real game engine so it shows only what can really be built) → "Let's build ours together" → nickname and how my villager looks (10.2). Shown on the first visit only; afterwards the example is available from the build map ("See a finished example"), not on every entry`
- `   - The first-visit example says that a community can only be finished together ("You can't finish it alone")`
- `  - **Landmarks** are large gold nodes at the end of the persona lane; locked landmarks still show their name and silhouette (the reason to invite neighbours)`
- `  - The endless decoration steps show the next one or two, then "…"`
- `- At the top: a picture of the community's **finished island** (its own plan with every place built), tap to enlarge; the overall **completion %**`
- `- A "See a finished example" button reopens the completed-neighbourhood example (5.1)`
- `- Completed-neighbourhood example on the first visit (5.1)`
- `- **Build map screen** (7.6a) drawn like a skill tree: three lanes, resident-count bands, node states, landmark nodes; the finished island picture on top`

### 2026-11-27 — v1.52
**Changed:** 10.2 the player makes their own villager on the first visit: age (adult, child, elder), skin tone, hair style and colour, trousers or skirt, beard, glasses and shirt colour; parts, not "race"/"gender" labels; the form starts with a random look and a 🎲 shuffle; stored with the profile and kept when the nickname changes; extra customization stays earned, never by chance draws. 5.1, 6.1 (nickname line) and 22.1 follow. Header version.

**Why:** Playtest 2026-11-27: the villager's skin, hair and even age came from the nickname, so looks felt random (a grown-up could get a child) and changed with the nickname ("현재는 너무 랜덤하게 나오고 있어"). Operator decisions: choose directly with a dice shuffle for a quick start (not a chance draw to chase), three ages, before the deploy ("응 그렇게 하자. 나이는 세 가지로, 배포 전에 진행해줘").

**Previous:**
- Header (verbatim): `| Document version | v1.51 |`
- 5.1 (verbatim): `1. Land on the site → a short **completed-neighbourhood example** (one image or a short animated scene, rendered with the real game engine so it shows only what can really be built) → "Let's build ours together" → nickname and shirt. Shown on the first visit only; afterwards the example is available from the build map ("See a finished example"), not on every entry`
- 6.1 (verbatim): `- **Nickname on the first visit**, together with the avatar shirt colour (10.2): a suggested nickname is pre-filled (e.g. "Snowy Moose 42") so the player can just continue; 2–16 characters, a basic blocked-words filter, checked on the server; changeable later. Shown on house name tags (7.2) and in the newspaper (11)`
- 10.2 (verbatim): `- **MVP: choose a shirt colour** from a small palette on first visit (changeable later); more customization (hats, accessories, emotes) is earned through ranks (13.3, Phase 2)`
- 22.1 (verbatim): `- Avatar shirt colour choice (10.2)`

### 2026-11-27 — v1.51
**Changed:** 14.1 after answering, the card shows the counts in place and closes by itself after a few seconds (a tap closes it sooner); with fewer than 3 answers a thank-you line replaces the bars. The pop-up is only shown while the player can still answer. Header version.

**Why:** Playtest 2026-11-27: the first open of the day already passes the "Since yesterday" panel, and the answered card then needed one more tap (✕) before playing; with only one or two answers the bars say nothing ("굳이 이걸 보여줘야 하나 싶어서"). Operator chose option A ("A안으로 진행해줘"): keep the result, drop the extra step.

**Previous:**
- Header (verbatim): `| Document version | v1.50 |`
- 14.1 (verbatim): `- **Shown** as a small card the first time the player opens the game that Calgary day (after the "What changed since yesterday" panel when that is open); it can be closed and is also in Community News`
- 14.1 (verbatim): `- **After answering**: the community's counts so far (e.g. "Mahogany so far (5 neighbours)", a bar per choice); **counts only, never who chose what**; the final result goes into the next day's newspaper (11)`

### 2026-11-27 — v1.50
**Changed:** 7.6b a new site **crossing**: a bridge place laid across the water with both ends on dry land. 7.8 water never holds buildings **except bridge places**, with the riverbank as the fallback when no water fits. Header version.

**Why:** The bridge landmarks (Crescent Heights, Eau Claire, Point McKay) and the river persona's footbridge stood on the riverbank beside the water instead of crossing it. Operator decision 2026-11-27: "A안으로 다리 예외 넣고 다시 만들어줘" (add the bridge exception and regenerate the island plans before launch).

**Previous:**
- Header (verbatim): `| Document version | v1.49 |`, `| Last updated | 2026-11-26 |`
- 7.6b (verbatim): `and a **site** where it belongs (shore, riverbank, hilltop, slope, street, park, plaza)`
- 7.8 (verbatim): `Water is not walkable and never holds buildings; if water would cut the land apart, a small bridge path keeps every part reachable.`

### 2026-11-26 — v1.49
**Changed:** 11 the newspaper opens **in full** from the Welcome sign (the community board with events and roadmap no longer waits for the Warming hut); the Community hall takes it over once built; the newspaper carries yesterday's today's-question result. 14 posting opens in **personal steps** (read and Thanks → answer today's question → write Free talk, Lost & found, Safety as a Verified Resident → Events and Local deals after 14 active days), rewards for posting stay social. New **14.1 Today's question**: one multiple-choice question a day for the whole city, from a question list kept as data (`supabase/data/daily_questions.csv`), counts only. 5.2, 7.6, 22.1, 22.6 (6g), 23 follow. Header version.

**Why:** Operator decisions 2026-11-26: the two-stage newspaper/board split adds nothing ("두 단계로 나눈게 의미가 없어"); writing should become one of the reasons to visit every day, but giving full writing at once does not motivate, so it comes in steps ("바로 글쓰기를 주면 동기 부여가 안되니깐 어떤 스탭을 줬으면 좋겠어"). Chosen: personal steps (a small community is never held back), today's question as the first step, the last step by active days ("개인 단계로 하고 오늘의 질문도 넣자. 활동일수가 좋을것 같아"); 14 days matches the Neighbour rank (13.2). The operator wrote the question draft (`docs/references/daily-questions.csv`); reviewed version approved ("응 v1.49랑 M26 진행해줘").

**Previous:**
- Header (verbatim): `| Document version | v1.48 |`
- 5.2 (verbatim): `4. **Welcome sign / Warming hut / Community hall** (7.6): read the auto-generated community newspaper and the community board (later: resident posts, coupons, new business news)`
- 7.6 (verbatim): `- The newspaper opens from the **Welcome sign**, the **Warming hut** adds the community board, the **Community hall** takes both over (11)`
- 11 (verbatim): `- **Available from the MVP**: the newspaper opens from the **Welcome sign**; the **Warming hut** adds the community board (operator announcements, events); the **Community hall** takes both over and expands them (7.6)`
- 11 (verbatim): `  - Always at the top of the newspaper (also before the Warming hut). The **community board** section (events and roadmap) opens with the Warming hut; before that it shows a lock ("Opens with the Warming hut"). MVP: the operator adds announcements with SQL in the Supabase dashboard (an admin screen comes later)`
- 14 (verbatim): `- **Verified Residents only**, in their own community. Opens when the community's **Welcome sign** is built (together with the newspaper)`
- 22.1 (verbatim): `- Auto community newspaper + roadmap notice + "Coming soon"`
- 22.1 (verbatim): `5. Community newspaper with my name (recognition)`
- 14.1, 22.6 row 6g and the glossary rows "Active day", "Today's question", "Posting steps" did not exist.


### 2026-11-26 — v1.48
**Changed:** 7.6 the build map gets **one root** (the Welcome sign, first day) that opens the three tracks (the community track starts at the Fire pit); **a place appears at most once** on a community's build map; the **Community hall and Neighbourhood park take a persona design**. 7.6a the build map screen is drawn **like an RPG skill tree** (root, three lanes, resident-count bands, node states, gold landmark nodes, pre-rendered node pictures, no branch choices, visitors read-only). 10.1 the camera **turns all the way round**, zooms in closer and pans while zoomed in; 7.8 the compass resets the view and places face their site, not the camera; 19.1 every model finished on all sides. 7.1, 7.9, 22.1, 22.6 (6e), 23 follow. Header version.

**Why:** Operator decisions 2026-11-26 after the build-map preview in the gallery: residents should see their community's build map like a skill tree ("rpg 게임 처럼 기술 해금 하는 것처럼"); there is no need to start with three branches (a solo resident can only finish one place on day one anyway, and one root reads more like a skill tree); people should zoom in and look around freely ("사람들이 줌인해서 자유롭게 보길 원해"); the ACA preview showed the same places twice (garden, rink). Approved: "응 네 가지 다 추천대로 반영해줘".

**Previous:**
- Header (verbatim): `| Document version | v1.47 |`
- 7.1 (verbatim): `the community's **Welcome sign** (first place of the community track, 7.6) is built`
- 7.6 (verbatim): `Community places and construction projects are **one build map** of **three tracks**, each built **in order**: a step opens when the step before it in the same track is built and the community meets the step's conditions;`
- 7.6 (verbatim): `| 🏘️ **Community** (every community) | Welcome sign → Fire pit → Warming hut → Skating rink → Community hall → Neighbourhood park |`
- 7.6 (verbatim): `The Gateway arch and Lit hockey rink models stay in the library for later steps.`
- 7.6 (verbatim): `**Conditions** (previous step of the same track built, plus):`
- 7.6 (verbatim): `- **Required actions** = base × step multiplier; base = **5 per active resident, minimum 10** (active resident = last active day within the last 30 Calgary days, 7.4); step 1 needs at least 3, so **a single resident finishes a first place on day one** (shown the next morning)`
- 7.6a (verbatim):
  > ### 7.6a Build map screen (MVP)
  > - A screen opened from the community view with **a picture of the community's finished island** in the middle (its own plan with every place built, drawn from the same data), so residents see what they are building towards
  > - On top: the **next step of each track** with what it still needs ("2 more neighbours", "1 more streak day", "Build the Warming hut first", "Needs more land: 3 more neighbours"), the constructions in progress with their progress bars, the island size track ("N more neighbours"), the community's landmarks (generic names, silhouettes until built) and an overall **completion %**
  > - A "See a finished example" button reopens the completed-neighbourhood example (5.1)
  > - Read-only, built from server-computed values (streak, cumulative Verified Residents, step status); no game rules on the client
  > - Shares one screen with the personal growth view (13.3, Phase 2) as tabs: **Village | Me**
- 7.8 (verbatim): `- **Map orientation:** every island opens with the same diagonal camera angle, keeping the World Map's orientation (east to the lower right, north to the upper right), so a community looks like its outline on the map (9). A small compass shows where north is and turns when the player rotates the view.`
- 7.9 (verbatim): `  - The **Welcome sign** is the first place of the community track (7.6); every community uses the same voxel model with its own name`
- 10.1 (verbatim): `- **Isometric view** (orthographic camera); user can rotate/zoom within limits`
- 19.1 (verbatim):
  > - **Isometric orthographic view**
- 22.1 (verbatim): `- Community streak, **build map** (7.6: three tracks built in order, persona places, up to 3 landmarks per community), ready-to-build silhouettes`
- 22.1 (verbatim): `- **Build map screen** (7.6a): the finished island picture, the next step of each track and its remaining conditions`
- 22.6 (verbatim): `| 6e | **Community identity** (decided with the operator 2026-11-25/26, details in 7.2, 7.6–7.9): a build map of three tracks built in order (community, persona, nature & leisure), personas and up to 3 landmarks per community (31 unique signature landmarks at launch), houses as scenery with only my own house personal, places laid out by meaning and every island plan regenerated |`
- 23 (verbatim): `| Build map | The data-driven community places in three tracks (community, persona, nature & leisure), each built in order: the previous step plus residents, streak and land open a step, residents build it (7.6) |`

### 2026-11-26 — v1.47
**Changed:** Community identity redesign. 7.6 **build map** of three tracks built in order (community, persona, nature & leisure) replaces the building tree (no more grow-in-place chains or upgrades in place; each step on its own lot; conditions = previous step + residents/streak + land that fits the footprint); 7.6a build map screen with the finished island picture and the next step of each track; 7.6b places and personas/landmarks as data, real-size footprints and sites; 7.2 houses become scenery in 2–4 residential zones, only "My house" is personal (fixed lot, seen only by its owner, lots shared when full), no names or "+N", every house lit at night; 7.4 development levels from the build map; 7.8 places laid out by meaning, one plan regeneration before launch, terrain later; 7.9 personas (10 patterns) and **up to 3 landmarks per community**, one landmark = one real building, 31 unique signature landmarks at launch (moved from Phase 3); 9 levels and landmark icon; 10.1/10.4, 19.4, 22.1, 22.3, 22.6 (steps 6e community identity, 6f terrain), 22.8, 23 follow. 1, 5, 7.1, 7.7 wording. Header.

**Why:** Operator decisions 2026-11-25/26 (handoff `docs/community-identity-handoff.md` §3): the finished island should be a beautiful, Animal Crossing–like place with the community's own signature places, not a field of houses; sequential unlocks with resident counts keep the reason to invite neighbours and visit daily; a community has several real landmarks, each its own model ("캘거리 타워, 그리고 유리 타워 따로"); the recommended starting values, at most 3 landmarks and terrain as a separate later step were approved ("셋 다 추천대로 진행해줘").

**Previous:**
- Header (verbatim): `| Document version | v1.46 |`
- Header (verbatim): `| Last updated | 2026-11-25 |`
- 1 (verbatim): `The **building tree (7.6) connects every step.**`
- 5 (verbatim): `5. The next goal from the building tree, e.g. "2 more neighbours and the frozen pond becomes a skating rink" + **Invite button**`
- 7.1 (verbatim): `- **Settled**: the community's **Welcome sign** (first building of the tree, 7.6) is built`
- 7.2 (verbatim):
  > ### 7.2 Houses: resident houses among the village houses
  > - **Houses fill the land as the community grows** (operator decision 2026-11-24): every house lot on the risen land (7.8) has a house, so a community never looks empty however many people play. The houses are not a count of players
  > - **Every Verified Resident has their own house among them** ("My house"), the base for decorating its interior later (22.3). **Tapping a resident's house** shows whose it is: "<nickname>'s house", active today or not, and the Founding Resident badge if they have it. No name tags floating over houses; **my own house always has a small "My house" marker**, and the labels toggle can show every resident house's name at once
  > - The other houses are **village houses** with no owner: no name, nothing happens when tapped (they never pretend to be players, like mini villagers in 7.3)
  > - Residents active today: **warm window lights** (no chimney smoke: with many houses it would look like factories); residents not active today: lights off. At night about half of the village houses have lit windows too (10.4), so the village looks cosy
  > - **Each resident keeps a fixed house lot** in their community: given once, the first free lot in the stored lot plan (lots ordered by land stage, then plan order, so growing the island never moves a house). It stays theirs while their house is archived, unless all lots are taken: then the lots of archived residents go to new residents, and a returning resident gets a free lot. If even active residents exceed the lots, extra houses are not drawn and the village shows "+N more residents". Moving gives a lot in the new community. Lots are assigned while building the shared state (no extra request)
  > - **Last active day** = the later of the resident's last action day and their verification day (so a newly verified resident who has not acted yet still has a house)
  > - **No activity for 30+ days** (last active day is not within the last 30 Calgary days, including today): the house becomes an ordinary village house (archived: no name, not lit); it becomes theirs again when they return
  > - Houses are not something individuals grow; they show "I live in this community"
  > - Houses have **no relation to real addresses/locations**
- 7.4 (verbatim): `- **Players see their community's development, not an activity score** (operator decision 2026-11-24): the **development level 0–4** from built buildings (the same level as the World Map, 9) is shown next to the community name, e.g. "Mahogany · Lv 2". It never goes down; development means new buildings (7.6) and, later, things to do inside them (22.3)`
- 7.4 (verbatim): `- No mood levels, no sleepy text and no "Community Revival" effect any more: quiet communities are shown by the streak (7.5) and dark resident houses (7.2), and a new building is what gets celebrated (12.2)`
- 7.6 (verbatim):
  > ### 7.6 Building tree (MVP)
  > Community unlock buildings and construction projects are **one building tree**. Each building: conditions met → a construction project everyone helps with → built (stays where it was built, forever) → opens its children. Starting values; the tree is **data** (see 7.6b) and grows after launch.
  >
  > **Three seeds that grow in place** (a later building replaces the earlier one on the same lot, which is reserved at its final size) **plus branches** (new lots):
  >
  > | Stage (actions ×) | Building | Opens when | On the island | Lot |
  > |---|---|---|---|---|
  > | 1. First day (×0.3) | Welcome sign | From the start | Community name at the entrance; community becomes Settled on the World Map (7.1) | Entrance |
  > | | Fire pit | From the start | Villagers gather to warm up; first meeting spot | Lot A |
  > | | Frozen pond | From the start | Villagers slide on the ice | Lot B |
  > | 2. First week (×1) | Warming hut | Fire pit + 3-day streak | Smoke from the hut, villagers come and go; **community board** (operator announcements, events, 11) | Lot A (grows) |
  > | | Playground | Welcome sign + 3-day streak | Kids swing and slide | New lot |
  > | | Sledding hill | Frozen pond + 3-day streak | Villagers sled down the hill | New lot |
  > | 3. Together (×1.5) | Skating rink | Frozen pond + 3 residents | Villagers skate; **the avatar glides on the ice** | Lot B (grows) |
  > | | Gateway arch | Welcome sign + 3 residents | Grand entrance arch | Entrance (grows) |
  > | | Off-leash dog park | Playground + 3 residents | Dogs run around | New lot |
  > | | Pathway lights | Gateway arch + 5-day streak | The paths glow; the community glows on the World Map at night | Along paths |
  > | 4. Community (×2) | Community hall | Warming hut + 5 residents + 7-day streak | **Newspaper and board move in**, events; opens the Main Street (22.4) | Lot A (grows) |
  > | | Lit hockey rink | Skating rink + 6 residents + 7-day streak | Evening hockey with villager fans | Lot B (grows) |
  > | | Community garden | Warming hut + 5 residents + 5-day streak | A garden that changes with the seasons | New lot |
  > | 5. Pride (×3) | Neighbourhood park | Community hall + 10 residents + 30-day streak | Picnics and festivals; park icon on the World Map | New lot (large) |
  > | Phase 3 | Landmark / custom sign | Community hall + 60-day streak + resident photo petition (16.2) | The community's own building | New lot |
  >
  > - **Required actions** = base × stage multiplier; base = **5 per active resident, minimum 10** (active resident = last active day within the last 30 Calgary days, 7.4); stage 1 needs at least 3, so **a single resident finishes a first building on day one** (shown the next morning)
  > - Resident counts are **cumulative Verified Residents** (same basis as island size, 7.8); built buildings and opened conditions never re-lock
  > - **At most 3 constructions at a time**; other opened buildings wait in tree order
  > - When every opened building is built, projects **upgrade built buildings in place** (Lv 2, 3, …; ×1.25 per level), so there is always something to do
  > - Construction progress is **applied the next day**; visuals: scaffolding → frame → complete
  > - Each stage adds one new kind of condition: actions → streak → residents → residents + streak → long-term
  > - **Locked buildings are not drawn on the island** (their lot is plain, walkable land, so the island stays tidy and new buildings are a surprise); the build map (7.6a) shows them with what is missing (e.g. "2 more neighbours", "1 more streak day", "Build the Frozen pond first"). A building whose conditions are met appears on its lot as a faded silhouette marked ✨ "Ready to build"
  > - Names are generic (no trademarks)
  > - Community level is permanent (separate from the weekly ranking)
- 7.6a (verbatim):
  > ### 7.6a Village build map (MVP)
  > - A screen opened from the community view that shows the **building tree** with done / building / opened / locked, **remaining conditions and progress bars**, the island size track ("N more neighbours"), and an overall **completion %** of the community
  > - A "See a finished example" button reopens the completed-neighbourhood example (5.1)
  > - Read-only, built from server-computed values (streak, cumulative Verified Residents, building status); no game rules on the client
  > - Shares one screen with the personal growth view (13.3, Phase 2) as tabs: **Village | Me**
- 7.6b (verbatim):
  > ### 7.6b Extensible buildings
  > - The tree (buildings, stages, conditions, multipliers, footprints) is **data in the database**; adding a building = a data row + a model, no rule code changes
  > - A client that does not know a building yet draws a **generic placeholder model**, never an error
  > - Every island keeps **spare lots for future buildings** and separate **Main Street lots** (22.4)
- 7.7 (verbatim): `- A project is the construction (or upgrade) of one building of the tree (7.6); residents **choose** which active project to help with each action`
- 7.8 (verbatim): `- **The island never shrinks.** Inactivity is shown by the streak and dark resident houses (7.2, 7.5), not by size or scenery.`
- 7.8 (verbatim): `- **Positions never change.** Each community's lot plan (building lots, house lots, spare lots, Main Street lots, paths) is generated **once** and stored; later algorithm changes apply only to new communities or newly added lots.`
- 7.8 (verbatim): `- Buildings opened by the tree always have land: their resident conditions match the land available at that resident count.
- First-stage buildings sit around the plaza (a cosy village centre); later buildings get lots in the **newly grown outer land, spread in different directions**, so every growth brings new building spots.`
- 7.9 (verbatim): `  - The **Welcome sign** is the first building of the tree (7.6) and grows into a Gateway arch; every community uses the same voxel models with its own name`
- 7.9 (verbatim): `- **Community landmarks** (Phase 3): a community-specific landmark model (e.g. a lakeside clubhouse), made only from a resident photo petition (16.2); until then communities use shared library blocks only`
- 9 (verbatim):
  > | Development level | Built buildings (7.6) | Shown inside the polygon |
  > |---|---|---|
  > | Unsettled | no Welcome sign | Grey dashed boundary, a cloud, empty ground |
  > | 1 | Welcome sign | A couple of small houses + welcome sign |
  > | 2 | + Playground or Skating rink | More houses + playground / skating rink |
  > | 3 | + Community hall | Houses + community hall with flag |
  > | 4 | + Neighbourhood park | Dense houses + community hall + neighbourhood park |
  >
  >   - Level comes from the community's built buildings (same data as the island; 7.6, 7.8)
- 10.1 (verbatim): `- Contents: buildings of the tree (7.6) and their construction sites, locked-building silhouettes, resident houses, mini villagers, signature features (7.9), Main Street shops (22.4, Phase 4)`
- 10.4 (verbatim): `  - At night the **street lamps and public buildings' windows light up**, about half of the village houses too; residents' houses light their windows only when the resident was active today (7.2)`
- 19.4 (verbatim): `- MVP (code boxes): island tiles (grass, path, snow), dirt layers, trees, resident house (roof/wall colour variants via code), buildings of the tree (7.6: welcome sign → gateway arch, fire pit → warming hut → community hall, frozen pond → skating rink → lit hockey rink, playground, sledding hill, dog park, pathway lights, community garden, neighbourhood park) + construction stages (scaffolding/frame/complete) + silhouettes + generic placeholder, avatar, mini villagers`
- 22.1 (verbatim): `- Community view as a **box-built three.js voxel diorama island in the community's real shape** (outline from day one, land growth by residents, building tree, resident houses, mini villagers, 3 Vitality levels, action replay with speech bubbles, a few signature features from the feature library)`
- 22.1 (verbatim): `- Community streak, **building tree** (7.6: three seeds, branches, upgrades in place), locked-building silhouettes`
- 22.1 (verbatim): `- **Village build map** (7.6a): the whole growth path with remaining conditions`
- 22.3 (verbatim): `- Community landmark (building tree stage after the Community hall: 60-day streak + resident photo petition, 7.6 / 16.2)`
- 22.6 (verbatim): `| 7 | Deploy with **all communities open** → family/friends playtest → public launch |`
- 22.8 (verbatim): `- [ ] Building tree numbers (conditions, stage multipliers) and models for the new buildings`
- 23 (verbatim): `| House | One per Verified Resident in the community view; a presence marker, not something the user grows |`
- 23 (verbatim): `| Project | The construction or upgrade of one building of the tree, which residents contribute actions to |`
- 23 (verbatim): `| Development level | 0–4 from built buildings; shown next to the community name and on the World Map (7.4, 9) |`
- 23 (verbatim): `| Village house | A house with no owner that fills a house lot on the risen land (7.2) |`
- 23 (verbatim): `| Building tree | The data-driven tree of community buildings: conditions (parent building, residents, streak) open a building, residents build it, it opens the next ones (7.6) |`
- 23 (verbatim): `| Unlock | A building of the tree whose conditions are met (it can now be built) |`
- 23 (verbatim): `| Silhouette | Faded preview of a locked building |`
- 10.1 (verbatim): `  - A **labels toggle** shows or hides all island overlays (speech bubbles, name tags, construction progress, locked-building hints) so the scene can be viewed without clutter. On by default; the choice is remembered on the device. My own avatar's name tag and my house marker always stay visible, so I can find myself`
- 10.1 (verbatim): `- Tap a building/resident house to see info (e.g. Welcome sign / Community hall → newspaper; house → resident nickname and streak)`
- 19.4 (verbatim): `- MVP (code boxes): island tiles (grass, path, snow), dirt layers, trees, resident house (roof/wall colour variants via code), places of the build map (7.6: community and nature tracks, a place library of 10 persona tracks, each place sized to its real footprint) and unique landmark models (7.9) + construction stages (scaffolding/frame/complete) + silhouettes + generic placeholder, avatar, mini villagers`

### 2026-11-25 — v1.46
**Changed:** 19.1/19.2 art policy back to the **pastel voxel style**, with variety: more voxel designs per house type and for buildings, trees, cars and props (shapes may take ideas from catalogues such as Polyfork, redrawn in voxels and sized like today's models), varied people (ages, skin tones, hair, clothes). No external model files. 10.1, the 20.1 stack row and 22.6 step 6d follow. Header date updated.

**Why:** Operator decision (2026-11-25) after reviewing the low-poly Polyfork version in the asset gallery: the existing voxel models and their volumes look better. Variety stays a rule; the Polyfork shapes are kept only as reference. Also lighter (no model downloads, about the triangles of today's islands).

**Previous:**
- Header: `| Document version | v1.45 |`, `| Last updated | 2026-11-24 |`
- 10.1 (verbatim): `- **Pastel colours, flat-shaded low-poly models on a tiled island** (19.1), soft shadows`
- 20.1 (verbatim): `| 3D models | Polyfork low-poly GLB models (CC BY 4.0), repainted in our palette (19.2) |`
- 22.6 (verbatim): `| 6d | **Art Pass 2** (19.1, 19.2): pastel low-poly models from Polyfork for houses, buildings, trees, cars, people and animals, varied and weather-aware |`
- 19.1–19.2 (verbatim):
  > ### 19.1 Style guide (target)
  > - **Pastel low-poly style** (operator decision 2026-11-25, after comparing voxel, voxelised and low-poly versions of a grown community): houses, buildings, trees, cars, people and animals are flat-shaded **low-poly models**, repainted in our pastel palette; the island ground stays tiles (the diorama look). Fantasy touches are welcome: it is a playful virtual Calgary
  > - **Floating diorama island** with layered dirt underneath, soft pastel sky background
  > - **Isometric orthographic view**
  > - **One pastel palette** for everything: every model is repainted from its own colours into ours (roofs and walls picked per house), so models from different kits look like one world
  > - **A grown community looks varied, never patterned**: many house models and variants, per-house roof and wall colours, mirrored and turned plans, yard extras (garage, fence, tree, car, play equipment), a mix of sizes by community type
  > - Weather and time apply to every model (10.4): snow settles on upward faces, windows light at night, crowns sway in the wind
  > - Light from the sun's real direction (10.4), gentle ambient light, no harsh contrast
  > - Small, cute characters with HTML speech bubbles and name labels
  > - **Launch theme: winter** (snow-covered island, window lights)
  > - Reference: `docs/references/` (VibeBase "Voxel Village" screenshots, for mood and layout)
  >
  > ### 19.2 Production
  > - No outsourcing; made in-house
  > - **Models come from Polyfork** (polyfork.dev, free low-poly models, CC BY 4.0 for the mesh files): only the GLB mesh files are used and hosted with the game, each credited on the credits page (generated from the credit inside each file); Polyfork's code modules (.mjs) are never copied or hosted. Animation (walking people and animals) is our own code using the models' rigs
  > - **Calgary-specific things Polyfork does not have** (CTrain, Calgary landmarks) are made in code or requested from Polyfork, in the same pastel style
  > - Other free/CC0 asset packs may be used — **check licences for commercial use**
  > - AI is used for concepts/ideas only
  > - Test consistency with a small set first, then scale (done 2026-11-25: `spike/polyfork`)

### 2026-11-25 — v1.45
**Changed:** 19.1/19.2 art policy: pastel **low-poly** models from Polyfork (repainted in our palette, varied, weather-aware; GLB mesh files only, CC BY credits generated; animation our own; Calgary-specific things made in code or requested) instead of the pastel voxel style; the island ground stays tiles. 10.1 and the 20.1 stack follow. 22.6 gains step 6d Art Pass 2.

**Why:** Operator decision (2026-11-25) after the `spike/polyfork` comparison of a grown community (our voxels, voxelised Polyfork, low-poly Polyfork): low-poly looked cleanest, was lighter than voxelised (≈ 2× vs 5.5× today's triangles), and Polyfork's kits cover people, animals and many buildings. The voxel houses looked patterned; variety becomes a rule.

**Previous:**
- Header: `| Document version | v1.44 |`
- 10.1 (verbatim): `- **Pastel colours, flat-shaded voxel/box objects**, soft shadows`
- 20.1 (verbatim): `| Voxel modelling | MagicaVoxel |`
- 22.6: no step 6d
- 19.1–19.2 (verbatim):
  > ### 19.1 Style guide (target)
  > - **Pastel voxel style**: everything built from blocks/boxes, flat-shaded, soft shadows
  > - **Floating square diorama island** with layered dirt underneath, soft pastel sky background
  > - **Isometric orthographic view**
  > - **One fixed pastel palette** (to be defined; e.g. soft greens for grass, warm sand paths, coral/lavender/sky-blue roofs)
  > - Light from the sun's real direction (10.4), gentle ambient light, no harsh contrast
  > - Small, cute characters with HTML speech bubbles and name labels
  > - **Launch theme: winter** (snow-covered island, chimney smoke, window lights)
  > - Reference: `docs/references/` (VibeBase "Voxel Village" screenshots)
  >
  > ### 19.2 Production
  > - No outsourcing; made in-house
  > - **Simple objects built in code** from boxes (trees, houses, stalls, fences, lamps)
  > - **Detailed objects** made in **MagicaVoxel** (free) and exported (e.g. `.glb`/`.obj`)
  > - Free/CC0 voxel or low-poly asset packs may be used — **check licences for commercial use**
  > - AI is used for concepts/ideas only (AI is weak at clean voxel 3D models)
  > - Test consistency with a small set first, then scale

### 2026-11-25 — v1.44
**Changed:** 10.5: the sound panel has music, ambience and effects each with an on/off switch and a volume slider (was: music and effects switches only); tapping an animal or a mini villager makes it hop and play its sound.

**Why:** Operator playtest on a phone (2026-11-25): wanted volume control per kind of sound, and expected animals to make a sound when tapped.

**Previous:**
- Header: `| Document version | v1.43 |`
- 10.5 (verbatim): `- **Sound settings**: a 🔊 button turns **music** and **effects** (with ambience) on and off separately; remembered on the device; both on by default (music quiet). Sound starts only after the first tap (browser rules) and pauses while the page is hidden`

### 2026-11-25 — v1.43
**Changed:** New 10.5 Sound (effects for player actions, island ambience following weather and time, World Map sounds, quiet background music by time and weather, separate music/effects switches, on by default, loaded only when needed, credits for CC BY files). 22.6 gains step 6c Sound before the deploy.

**Why:** Operator request (2026-11-25): a full sound design before the playtest; the operator collected the sound and music files (`frontend/public/sfx/`).

**Previous:**
- Header: `| Document version | v1.42 |`
- No 10.5 section; 22.6 had no step 6c (sound was only "short sound effect" in 8).

### 2026-11-24 — v1.42
**Changed:** 7.3: always one mini villager per real story (today's action replay, today's posts), even on the smallest islands.

**Why:** Screen check (M21): on a stage-0 island the only villager was busy replaying an action, so today's posts never showed.

**Previous:**
- Header: `| Document version | v1.41 |`
- 7.3 (verbatim): `- **Count: natural and random**, chosen on the device for each visit and **scaled by the size of the walkable land**: the smallest islands have 0–1, the largest up to 20 (20.3a); fewer at night (about 40 %) and in rain or snow (about half). Not based on player counts or activity`

### 2026-11-24 — v1.41
**Changed:** 7.2 houses fill every house lot on the risen land; every Verified Resident still has their own house among them ("My house"); the others are unnamed village houses (no tap; about half lit at night); archived residents' houses become village houses. 7.3 mini villagers: random count by island size (0–1 on the smallest islands, up to 20; fewer at night and in rain/snow), behaviour by time and weather, today's local posts (never Safety) as credited speech bubbles, wildlife by community location and island size. 7.4: players see the development level (0–4, as on the World Map) instead of Vitality; Vitality stays an internal operator metric; no moods, sleepy text or Community Revival. 2, 7.8, 9, 10.4, 12.2, 19.0, 22.2, 22.6, 22.8 and the glossary follow.

**Why:** Operator decisions (2026-11-24, M21 planning and an iPad playtest): communities should look lived in whatever the number of players, without house or villager counts revealing it; 3 villagers and many animals on a tiny island looked like too many and wildlife should depend on location; development, not an activity score, is what players should see; "My house" stays for interior decorating.

**Previous:**
- Header: `| Document version | v1.40 |`
- (verbatim): `- When a community develops, its mini villagers are happy and new buildings rise; when neglected, its mini villagers get sleepy. The scenery always looks its best and follows Calgary's real weather and time of day (10.4).`
- (verbatim): `2. **My community**: "What changed since yesterday" summary + mini villagers' mood`
- (verbatim): `- **The island never shrinks.** Inactivity is shown through Vitality (the mini villagers' mood, 7.3), not size or scenery.`
- (verbatim): `- **Vitality is shown through mood**: lively = green ground, window lights, flowers; normal = plain; sleepy = snowy ground and trees under a dusk sky`
- (verbatim): `the levels, moods and resident counts in one request`
- (verbatim): `info card (name, level, mood, residents)`
- (verbatim): `- Generated on: weekly results, building completion, community revival (random surprises: later)`
- (verbatim): `(Vitality tone; grey = unsettled)`
- (verbatim): `- 5 Vitality mood levels`
- (verbatim): `| 6b | **Living community** (decided with the operator 2026-11-24, details written into 7.2–7.4 when the work starts):`
- (verbatim): `- [ ] Vitality smoothing details (rise/fall speed)`
- (verbatim): `| Mini villager | Ambient voxel character showing the community's mood; never represents or impersonates a real player |`
- (verbatim): `| Vitality | 0–100 score of recent community activity that drives mood and scenery |`
- 10.4 (verbatim): `- At night the **street lamps and public buildings' windows light up**; residents' houses light their windows only when the resident was active today (7.2)`
- 7.2 (verbatim):
  > ### 7.2 Resident houses
  > - One house per Verified Resident. **Tapping a house** shows whose it is: "<nickname>'s house", active today or not, and the Founding Resident badge if they have it. No name tags floating over houses; **my own house always has a small "My house" marker**, and the labels toggle can show every house's name at once
  > - Residents active today: **warm window lights** (no chimney smoke: with many houses it would look like factories)
  > - Residents not active today: lights off
  > - **Each resident keeps a fixed house lot** in their community: given once, the first free lot in the stored lot plan (lots ordered by land stage, then plan order, so growing the island never moves a house). It stays theirs while their house is archived, unless all lots are taken: then the lots of archived residents go to new residents, and a returning resident gets a free lot. If even active residents exceed the lots, extra houses are not drawn and the village shows "+N more residents". Moving gives a lot in the new community. Lots are assigned while building the shared state (no extra request)
  > - **Last active day** = the later of the resident's last action day and their verification day (so a newly verified resident who has not acted yet still has a house)
  > - **No activity for 30+ days** (last active day is not within the last 30 Calgary days, including today): house is temporarily removed from the village (archived); it reappears when they return
  > - Houses are not something individuals grow; they show "I live in this community"
  > - Houses and buildings fill the island from the centre outward; the island itself grows with residents (see 7.8)
  > - Houses have **no relation to real addresses/locations**
- 7.3 (verbatim):
  > ### 7.3 Mini villagers (ambient characters)
  > - **Ambient characters that show the community's mood**; they never pretend to be real players (no names, not counted as residents)
  > - Count: based on resident count and Vitality. **Min 2–3, max 20**
  > - Behaviour/expressions change with Vitality (running and cheering ↔ sitting with heads down)
  > - **Action replay**: mini villagers replay real actions residents took today, with a system speech bubble
  >   - e.g. a mini villager shovels snow with "Sarah cleared the snow"
  >   - Always based on real records (nothing fake)
- 7.4 (verbatim):
  > ### 7.4 Community Vitality (0–100)
  > - Definition: 7-day average of the "daily active resident ratio" × 100
  >   - Daily active resident ratio = (Verified Residents who acted that day) ÷ (**Verified Residents whose last active day (7.2) is within the last 30 Calgary days, including that day**, i.e. residents whose houses are shown, excluding residents with a move in progress, 6.4); the ratio therefore never exceeds 1; 0 if the denominator is 0
  >   - This intentionally differs from the streak denominator (7.5, 7-day Active Verified Residents): the streak rewards regular players and must not be blocked by dormant residents, while Vitality honestly reflects the whole community — many dark houses make the community look gloomier, which motivates waking up neighbours
  > - Tuned to **fall slowly and rise quickly**: Vitality = 100 × **max(average ratio of the last 3 days, average ratio of the last 7 days)**, rounded. A burst of activity lifts the 3-day average fast; when activity stops, the 7-day average holds it up and it falls by about 1/7 per day
  >   - Days counted are **finished Calgary days** (yesterday and before), so Vitality changes once a day, like construction progress. Only days since the community's first resident are averaged; before the first finished day Vitality is not shown (normal mood), so a new community never starts sleepy
  > - MVP has 3 mood levels
  >
  > | Vitality | Mood | Mini villagers |
  > |---|---|---|
  > | 60–100 | Lively | Many mini villagers, walking briskly and cheering |
  > | 30–59 | Normal | Ordinary pace |
  > | 0–29 | Sleepy | Villagers mostly resting. Pastel, never grey or dark |
  >
  > - **The island scenery does not follow the mood** (operator decision 2026-11-24): every island shows the same full look (deep green grass, flowers, street lamps), changed only by the real weather and time of day (10.4). The World Map keeps its mood tones for now (9); Vitality is being redesigned as community development (22.6 step 6b)
  >
  > - Don't make it too depressing ("cute sleepy"): a newcomer's first look must still be inviting
  > - While Sleepy, the streak bar says "<Community> is sleepy. Help today to wake it up!", so a quiet community becomes a reason to help
  > - Sleepy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card
  >   - Recovered = yesterday's Vitality was Sleepy (0–29) and today's is 30 or more; shown once in the "Since yesterday" panel of that day

### 2026-11-24 — v1.40
**Changed:** 10.4 filled in with the details planned with the operator: Environment Canada as the weather source (server, every 15 minutes, attribution), the weather states and wind levels, snow that settles and melts with warmth or rain, a weather chip, the sun computed from the server instant with phases by sun height and a minimum drawn height, lamps and public windows lit at night (houses only when active today), particle caps. 7.4: the island scenery no longer follows the Vitality mood (every island has the same full look, changed only by weather and time); the mood now drives the mini villagers; 2 and 7.8 follow. 19.1 light comes from the real sun. 22.3: decorating my house's interior with activity rewards (so "My house" must always exist). 22.6: new step 6b Living community (random mini villagers, houses fill the land with every resident keeping "My house", Vitality as development, villagers speaking community posts except Safety).

**Why:** Operator decisions (2026-11-24): a snowy dusk for sleepy communities clashed with the real weather and time; every community should look its best and change with the weather. Mini villagers, houses and Vitality get their own module (M21) after M20. "My house" stays because it gives belonging and will hold interior decorating.

**Previous:**
- Header: `| Document version | v1.39 |`
- 2 (verbatim): `- When a community develops, its mini villagers are happy and the scenery becomes beautiful; when neglected, they get sleepy and the scenery turns snowy and quiet.`
- 7.8 (verbatim): `- **The island never shrinks.** Inactivity is shown through Vitality (mood/scenery), not size.`
- 7.4 table (verbatim):
  > | Vitality | Mood | Scenery |
  > |---|---|---|
  > | 60–100 | Lively | Flowers, lights, clean streets, many mini villagers |
  > | 30–59 | Normal | Ordinary look |
  > | 0–29 | Sleepy | A quiet snowy winter evening: fresh snow on the ground and trees, icy water, a soft lavender-pink dusk sky, villagers mostly resting. Pastel, never grey or dark |
- 19.1 (verbatim): `- Light from top-left, gentle ambient light, no harsh contrast`
- 22.3 (verbatim): `- **Enter buildings and decorate my own house** (idea, not planned yet): tap a building or my house to go inside a small interior scene; residents decorate their own house. The fixed house lot (7.2) is what makes "my house" stable for this`
- 22.6 step 6a (verbatim): `| 6a | **Real weather and time of day** on the islands (10.4) |`
- 10.4 (verbatim):
  > ### 10.4 Living community: real weather and time of day (before launch)
  > - **Weather follows real Calgary weather**: rain falls when it rains, snow when it snows, trees, flags and smoke move with the wind, clouds when it is overcast. One city-wide reading, fetched on the **server** from a free public weather source and cached (a few times an hour, never per player; 20.3); the island only shows it
  > - **Time of day follows the real sun**: the light comes from the sun's real direction, so shadows move through the day; dawn and dusk tints; at night the **street lamps and windows light up** and the sky darkens. Time comes from the server (no time-zone math in the client, 7.5); the sun's direction may be computed from the current instant and Calgary's coordinates
  > - Effects stay within the phone budget (20.3a): particle counts capped, the low-quality mode (M14) reduces them further
  > - Details (which weather states, look of each effect, data source) are planned with the operator before the work starts

### 2026-11-24 — v1.39
**Changed:** 7.2 my own house's marker reads "My house". 10.1 labels toggle: my own avatar's name tag and my house marker always stay visible; the toggle hides everything else.

**Why:** Operator feedback (2026-11-24): with labels off, the "Me" marker sat on the house while my avatar had nothing, so "me" pointed at the wrong thing. My avatar now always carries my name, and the house says "My house".

**Previous:**
- 10.1 (verbatim):
  > - A **labels toggle** shows or hides all island overlays (speech bubbles, name tags, construction progress, locked-building hints) so the scene can be viewed without clutter. On by default; the choice is remembered on the device
- 7.2 (verbatim):
  > - One house per Verified Resident. **Tapping a house** shows whose it is: "<nickname>'s house", active today or not, and the Founding Resident badge if they have it. No name tags floating over houses; **my own house always has a small marker**, and the labels toggle can show every house's name at once

### 2026-11-24 — v1.38
**Changed:** New 10.4 Living community: real Calgary weather (rain, snow, wind, overcast) and time of day (real sun direction and shadows, dawn/dusk, lamps and windows at night) shown on the islands, before launch. 19.3 effects updated; 22.6 adds step 6a and the Art Pass aims at busier communities too; 22.2 notes that day/night and weather also moved before launch. §24 now points to `changelog/requirement.md` (this file); the "How to update" rules point here.

**Why:** Operator decision (2026-11-24): before opening, communities should be prettier, busier and alive with the real weather and time. The change history moved to its own file so new sessions read about 40% fewer tokens.

**Previous:**
- 10.3 end (verbatim):
  > - Real-time presence of other online residents is a later phase (22.3)
  > 
  > ---
  > 
  > ## 11. Community news
- 19.3 day/night (verbatim):
  > - Day/night: light colour/intensity + sky tint driven by real Calgary time
  > - Snow: particles
- 22.6 step 6 (verbatim):
  > | 6 | **Art Pass**: prettier buildings, people and props for every community (scope planned with the operator) |
- 22.2 art (verbatim):
  > - **Art Pass** — *moved before the deploy and playtest (22.6, 2026-11-24)*: 
- §24: held all entries inline (now in this file, unchanged).

### 2026-11-24 — v1.37
**Changed:** Art Pass moved before the deploy and playtest (19.0, 22.2, 22.6; scope to be planned). 22.7: all communities open at once instead of a pilot community. 22.7a.1: both email (opted-in players) and web push reminders, one message a day at most across both. 22.7a.2: association contact once a community reaches a player threshold.

**Why:** Operator decisions (2026-11-24): communities must look worth playing before anyone sees them; the whole city is revealed together. Risk noted: with everything open, many early players may be alone in their community — watch single-player communities on the dashboard.

**Previous:**
- 19.0: `- Detailed art (19.1–19.4) is applied in the **Art Pass** (22.2) without changing game logic.`
- 22.2: `- **Art Pass**: refined pastel voxel models and props (Section 19.1–19.4), styled World Map with animated Bow/Elbow rivers, moving CTrain trains, Calgary landmark buildings and transitions, character variants and animations, avatar customization, walk-up-and-tap actions, day/night and weather effects`
- 22.6: `| 5 | Legal pages, analytics, email subscription, polish → family/friends test |`
- 22.7 pilot (verbatim):
  > - **Pilot community first**: the game is only fun with neighbours, so the playtest and the first push focus on **one or two pilot communities** (e.g. Mahogany) until their islands visibly grow; other communities then see them on the World Map. Opening the whole city at once leaves most islands empty
  > - Decisions after the playtest are made from the operator dashboard (21): low first-action % → first screens/onboarding; low D1 → return reasons and reminders; low D7 → neighbour density
- 22.7a.1: `1. **Return reminders** (right after the playtest): the game already has reasons to come back (streak, daily energy, overnight construction) but no way to tell players. Either an **email digest** for players who opted in (18) — e.g. "Mahogany's 15-day streak needs 2 more helpers today", "The skating rink was finished overnight" — or **web push** (works on phones once the site is added to the home screen, iPhone included). Which one is decided from the playtest data; at most one message a day, easy to turn off, never at night`
- 22.7a.2: `2. **Community association partnership** (pilot community first): ask the association`

### 2026-11-23 — v1.36
**Changed:** 22.7: pilot community first; post-playtest decisions from the dashboard. New 22.7a Growth after launch: 1. return reminders (email digest or web push, chosen from playtest data), 2. community association partnership with association notices (title + link) in the newspaper.

**Why:** User discussion (2026-11-23) on how to make the site active: neighbour density, a way to remind players, and associations as a distribution channel matter more than scraping notices on their own (low volume, sends players away).

**Previous:**
- 22.7 (verbatim):
  > ### 22.7 Launch
  > - Supabase **Free** plan for the family/friends playtest; upgrade to **Pro** (no pausing, daily backups) right before the public launch
  > - After family/friends testing, post on r/Calgary and community Facebook groups with a "Calgary dev made this" story
  > - After the initial spark, growth comes from in-game invite/share mechanics
- 22.7a: (none)

### 2026-11-23 — v1.35
**Changed:** 18: contact email, legal page paths, first-visit agreement line, data hosted in Canada, deletion on request within 30 days, email opt-in details (CASL), data credits. 20.1: analytics = own in Supabase + Cloudflare Web Analytics. 21: operator screen and access, spike rule, dashboard figures and definitions, analytics data limits. 22.7: Supabase Free during the playtest, Pro before the public launch. 22.8: analytics tool and legal wording closed.

**Why:** User decisions for M14 (2026-11-23): own analytics (free, no cookies, no third party), domain already on Cloudflare, hello@makecalgarytalk.com as the public address, Free then Pro.

**Previous:**
- 18: `- Provide a contact email`
- 20.1: `| Analytics | Plausible or PostHog |`
- 21: `- Daily new verifications per community + spike flags` / `- Analytics dashboard` / `  - Daily new visitors, % reaching the first action` / `  - D1 / D7 retention` / `  - Share-card shares, invite-link visits` / `  - Visits by community`
- 22.7: (no plan line)
- 22.8: `- [ ] Analytics tool choice (Plausible vs PostHog)` / `- [ ] Terms of Use / Privacy Policy wording`

### 2026-11-23 — v1.34
**Changed:** 7.9: CTrain track, stations, a running train and next-station signs at their real position on the islands of communities the Red/Blue lines run through (track walkable, never built on; edge track on the edge row); the symbolic station block only for communities next to a station without track, operating stations only; features no longer drawn faint on future land — they appear with their land, and the build map previews what the next land brings; pond and creek only where the island shows little real water; big park never the same place as the hill. 9: CTrain lines and stations on the World Map. Art Pass: the map's CTrain lines are already drawn (moving trains stay Art Pass).

**Why:** User review of M13 (2026-11-23): a station alone looked odd; the CTrain is Calgary's most visible feature and should show the real track and how communities connect; faint buildings on unseen land were unnecessary — features appearing with growth feel like a reward.

**Previous:**
- 7.9: `  - Which features a community gets: auto-suggested from OpenStreetMap data, supplemented/overridden by a simple CSV maintained by the operator. **Every residential community** gets suggestions (no launch list); **at most 3** per community, in priority order CTrain station → pond → hill → creek → big park → school (operator additions always kept). A pond is suggested only for a lake next to the community when the island shows little real water (water inside the boundary is already drawn, 7.8)`
- 7.9: `  - The label shows the public place name when known (e.g. "🚉 Dalhousie", "🌳 Bowness Park"); schools show only "School"`
- 7.9: `  - **Visible from day one:** features stand on the spare lots of the stored plan; while a lot is still future land the feature is drawn faint on the mist ("Appears as the community grows") and becomes solid, blocking its lot, once that land rises. Features take spare lots before unknown-building placeholders (7.6b)`
- 9: (no CTrain line)
- 19 Art Pass: `… World Map assets (development icons matching island buildings, animated rivers, CTrain trains and lines, landmark buildings …`

### 2026-11-23 — v1.33
**Changed:** 7.9: MVP feature library = 6 blocks (CTrain station, pond, hill, creek, big park, school); suggestions for every residential community (not only launch communities), at most 3 each in a fixed priority; pond only where the island shows little real water; labels with public place names (not for schools); features visible faint from day one on future land, solid once the land rises; features take spare lots before unknown-building placeholders. 22.8: feature library open item closed.

**Why:** User decisions for M13 (2026-11-23): six recognizable blocks, all 223 communities automatically (no launch list exists), identity from day one without changing stored lot plans.

**Previous:**
- 7.9: `  - Example blocks: lake/pond, creek/river, hill, ravine, large park, off-leash dog park, ice rink, CTrain station, mall, school`
- 7.9: `  - Which features a community gets: auto-suggested from OpenStreetMap data, supplemented/overridden by a simple CSV maintained by the operator`
- 22.8: `- [ ] Feature library list and community → feature mapping for launch communities`

### 2026-11-23 — v1.32
**Changed:** 23 Glossary, Island / diorama: "island" is an internal term; player-facing text says "community".

**Why:** User decision (2026-11-23): players think of their community, not an island; "Visit the island" / "Island size" felt off.

**Previous:**
- 23: `| Island / diorama | The floating voxel island in the real shape of one community; its land grows inside the visible outline with cumulative Verified Residents |`

### 2026-11-22 — v1.31
**Changed:** 12.1: ranking shown in a 🏆 sheet on the World Map with last week (final) and this week so far; shared ranks for equal scores; two-decimal scores; "N more residents to enter the ranking"; Monday announcement in "Since yesterday"; the crown marks last week's #1. 12.2: cards made on the phone and shared as images; one site-wide link preview (per-community previews later); random surprises later. 7.4: "recovered" defined.

**Why:** User decisions for M11 (2026-11-22): cards on the phone (no server cost), ranking inside the World Map, last week + this week, revival effect built in M11.

**Previous:**
- 12.1: `- Display: TOP 10 + my community's rank`
- 12.1: `- **Resets every Monday 00:00 (Calgary time)**; last week's results announced on Monday`
- 12.2: `- Generated on: weekly results, building completion, community revival, random surprises`
- 7.4: only `- Sleepy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card`

### 2026-11-22 — v1.30
**Changed:** 7.8: the island's default camera angle is the same for every community and keeps the World Map's orientation (instead of turning each community so its long side is vertical); a compass shows north.

**Why:** User request (2026-11-22): a community should look on its island the way it looks on the World Map (e.g. Bayview runs east–west on the map but stood north–south on the island).

**Previous:**
- 7.8: `- Default camera angle per community fits its shape on a portrait phone (long side vertical).`

### 2026-11-22 — v1.29
**Changed:** 5.1: the first visit goes example → nickname → find my community; the World Map opens from "Just look around first" and the 🗺 Calgary button (not as a first-visit step). 9: levels defined by built buildings; shapes as a static file, levels in one request; residential communities only; any community can be visited (view only) with its newspaper, with a "Back home" bar.

**Why:** User decision for M10 (2026-11-22): keep the first visit short; levels need an exact definition.

**Previous:**
- 5.1: `1. Land on the site → a short **completed-neighbourhood example** (one image or a short animated scene, rendered with the real game engine so it shows only what can really be built) → "Let's build ours together" → snowy pastel **Calgary World Map**. Shown on the first visit only; afterwards it is available from the build map ("See a finished example"), not on every entry`
- 5.1: `2. "Which community do you live in?" → allow location`
- 9: level table without building conditions; `  - Level is derived from cumulative Verified Residents and unlocked buildings (same data as the island; 7.6, 7.8)`

### 2026-11-20 — v1.28
**Changed:** 14 rewritten as **Community posts** for the MVP: Verified Residents only, opens with the Welcome sign, 1 post a day, 300 characters, 4 kinds, no links/photos, 3-day visibility, own-post delete, phone/address blocking, report points (Verified 2, others 1, 3 hides), operator blocks, thanks and the Community Reporter badge (10 thanks).

Kinds: Safety, Local deals, Events, Lost & found, Free talk (Safety posts carry a reminder); reports limited to 3 a day, confirmed before sending, can be taken back, and exclude thanks (a reported post folds away for the reporter); the operator can restore a post. 22.3: community marketplace added as a later idea.

**Why:** M15 needs exact rules (user decisions 2026-11-20: open with the Welcome sign, no links; kinds centred on real community life; marketplace later; report limit and restore).

**Previous:**
    ## 14. Resident board (MVP, next module after Community news; details decided when it starts)

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

### 2026-11-20 — v1.27
**Changed:** 11: newspaper lines listed (no personal streak lines; the example no longer mentions one); written once per community per day; locked until the Welcome sign is built; announcements always at the top, the community board section (events, roadmap) opens with the Warming hut; MVP announcements via SQL.

Section renamed "Village news" → "Community news" (Calgary calls each neighbourhood a community); the newspaper is titled "Community News". The newspaper covers real community life (new neighbours, farewells, resident-written local news) instead of game events; resident posts (14) move from Phase 2 into the MVP as the next module, Verified Residents only.

**Why:** M9 needs exact rules; announcements were listed both at the top of the newspaper and on the Warming hut board (user decisions 2026-11-20).

**Previous:**
- 11: `## 11. Village news (community newspaper)`
- 14: `## 14. Resident board (Phase 2, communities with a Community hall)`
- 11: `  - e.g. "Yesterday in Mahogany: 7 residents cleared snow and the playground was completed. Sarah hit a 7-day streak!"`
- 11: (no line list, generation rule, lock text, board/announcement split or announcement tooling)

### 2026-11-20 — v1.26
**Changed:** 7.2: houses show whose they are when tapped (no floating name tags; my house marked; labels toggle shows all); active houses get window lights only (no chimney smoke); each resident keeps a fixed house lot (assignment, reuse of archived residents' lots when full, "+N more residents" overflow). 22.3: idea of entering buildings and decorating my own house.

**Why:** User decisions for M8 (2026-11-20): smoke on every house would look like factories; floating names clutter the island; a stable "my house" prepares interiors later. Lot assignment adds no server requests.

**Previous:**
- 7.2: `- One house per Verified Resident, with a **name tag (nickname)**`
- 7.2: `- Residents active today: lights on + chimney smoke`
- 7.2: (no house lot rule)
- 22.3: (no interiors idea)

### 2026-11-20 — v1.25
**Changed:** 12.3: MVP invite reward = "Good Neighbour" badge for both (decorations in Phase 2); what "same community" means; accept rules; the invite link shows the inviter's nickname and community. 7.1: Founding Resident = the community's first Verified Resident. 5.1: welcome card with the invite after the first check-in; "N more neighbours" goals open the invite; an always-visible floating Invite button (hide for the day) with a once-a-day nudge at good moments; first-visit copy stresses building together.

**Why:** M12 needs exact rules; bringing neighbours in must be clear from the first visit (user decisions 2026-11-20).

**Previous:**
- 12.3: (no MVP reward, matching or accept rules; no invite landing text)
- 7.1: `- **Settled**: the community's **Welcome sign** (first building of the tree, 7.6) is built → fog clears on the World Map; the first resident gets the "Founding Resident" badge.`
- 5.1: (no welcome card or invite entry points beyond the Invite button)

### 2026-11-20 — v1.24
**Changed:** 7.4: the lowest mood is renamed **Gloomy → Sleepy** and looks like a quiet snowy winter evening (pastel, never grey); while Sleepy the streak bar invites players to wake the community up. Wording in 5 (overview), 7.4, 10 and 19 updated to "sleepy".

**Why:** On the phone test a newcomer's first look at a quiet community was too dull and grey (user decision 2026-11-20).

**Previous:**
- 5: `when neglected, they look gloomy and the scenery turns bleak.`
- 7.4: `so a new community never starts gloomy`
- 7.4: `| 0–29 | Gloomy | Piled snow, wilted trees, greyish tint, few mini villagers |`
- 7.4: `- Don't make it too depressing ("cute gloomy")`
- 7.4: `- Gloomy → recovered triggers a **"Community Revival" effect** (cheering, flowers bloom) + a share card`
- 10: `normal = plain; gloomy = greyish ground, roofs and trees`
- 19: `- A few mini villager types × actions (walk 2–4 frames, idle, cheer, gloomy, work)`

### 2026-11-20 — v1.23
**Changed:** 6.2: checks with accuracy worse than 1 km are not counted; at most 20 checks per account per day; only residential communities count. 6.3: candidate community while verifying (most check-in days in the last 7, tie → most recent); pending contributions apply from the verification day to the projects they were given to (past days unchanged; finished projects and other communities not carried over).

6.4: the cooldown also starts at the first verification (so the free correction is the only way to move within 90 days of it); the user can cancel a move themselves.

**Why:** M7 needs exact rules (user decisions 2026-11-20). Read literally, the first move had no cooldown, which made the free correction meaningless.

**Previous:**
- 6.4: `- **Cooldown**: 90 days from the last **completed** move (cancelled moves do not count)`
- 6.4: (no user cancel)
- 6.2: (no accuracy, rate-limit or residential-only rule)
- 6.3: (no candidate-community rule)
- 6.3: `  - Pending contributions are applied to the community`

### 2026-11-19 — v1.22
**Changed:** 6.1: nickname chosen on the first visit with the shirt colour (suggested nickname pre-filled, 2–16 characters, blocked-words filter, changeable later).

**Why:** Nicknames are used on house name tags and in the newspaper but no step chose them (user decision for M6, 2026-11-19).

**Previous:**
- 6.1: (no rule for choosing a nickname)

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
- A few mini villager types × actions (walk 2–4 frames, idle, cheer, sleepy, work)
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
