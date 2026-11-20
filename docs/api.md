# Server API (Supabase RPC)

The frontend talks to the database **only** through these Postgres functions
(`supabase.rpc('<name>', args)`). Tables live in module schemas that the API does not
expose; Row Level Security is on for every table. All game rules run on the server.

Times: the server owns the Calgary day (America/Edmonton). Responses include
`calgary_day` (date) and `next_day_start` (instant of the next Calgary midnight). The
client never computes time zones; it only counts down to `next_day_start`.

| Function | Who | Purpose |
|---|---|---|
| `common_health()` | anon, authenticated | Connectivity check |
| `gamecore_list_communities()` | anon, authenticated | All game communities |
| `gamecore_get_community_state(p_community_id)` | anon, authenticated | Projects and my energy |
| `gamecore_submit_actions(p_actions)` | authenticated | Spend energy on projects |
| `gamecore_get_me()` | authenticated | My community and energy |
| `gamecore_choose_community(p_community_id)` | authenticated | **Temporary until M7** |

---

## `gamecore_list_communities()`
Residential Calgary communities (City of Calgary Open Data, see `docs/data-sources.md`).

```json
[{ "id": "uuid", "code": "MAH", "name": "Mahogany", "sector": "Southeast", "population": 13860 }]
```
`population` is `null` for brand-new communities without census data.

## `gamecore_get_community_state(p_community_id uuid)`
State on the current Calgary day. Reading it also updates the community's building tree:
newly unlocked buildings are recorded as opened, and new constructions start while fewer
than 3 are active. These rows are written once, when the change happens.

```json
{
  "calgary_day": "2026-12-02",
  "next_day_start": "2026-12-03T06:00:00+00:00",
  "community": { "id": "uuid", "code": "MAH", "name": "Mahogany", "sector": "Southeast", "population": 13860,
                 "residents": 4, "land_stage": 1, "settled": true },
  "buildings": [
    { "key": "welcome-sign", "name": "Welcome sign", "stage": 1, "status": "building", "level": 2, "progress": 0.25, "remaining": null },
    { "key": "frozen-pond", "name": "Frozen pond", "stage": 1, "status": "built", "level": 1, "progress": 1, "remaining": null },
    { "key": "warming-hut", "name": "Warming hut", "stage": 2, "status": "locked", "level": 1, "progress": 0,
      "remaining": { "residents": 0, "streak_days": 3, "requires": ["fire-pit"] } }
  ],
  "projects": [
    { "id": "uuid", "building_key": "welcome-sign", "title": "Welcome sign", "level": 2,
      "required": 4, "progress": 1, "stage": "scaffolding" }
  ],
  "me": { "member": true, "energy_max": 3, "energy_left": 2 }
}
```
- `community.residents`: cumulative residents (**temporary:** players currently in the
  community until M7 brings Verified Residents). `land_stage`: 0–5 from the land tiers.
  `settled`: the first building has been built.
- `buildings`: every building of the tree, in tree order.
  - `status`: `locked` (conditions not met), `opened` (unlocked, waiting for a free
    construction slot), `building` (a construction or upgrade is active), `built`.
  - `level`: the level under construction, or the highest built level.
  - `progress`: 0–1 while building, 1 when built.
  - `remaining`: only for `locked`; what is still missing (`residents` and `streak_days` are
    the shortfall, `requires` the buildings that are not yet built).
- `projects`: the active constructions (at most 3); the ids to send to
  `gamecore_submit_actions`. `progress` counts actions from **before today** (today's
  actions show tomorrow), capped at `required`. `stage`: `scaffolding` below half, `frame`
  from half. A building is `built` the day after its goal was reached.
- `me`: `null` for visitors (not signed in).
- Errors: unknown community → `P0002`.

## `gamecore_submit_actions(p_actions jsonb)`
```json
[{ "id": "client-generated uuid", "project_id": "uuid" }]
```
At most 10 entries per call. Each entry is processed in order and gets a result:

```json
{
  "calgary_day": "2026-12-01", "next_day_start": "2026-12-02T06:00:00+00:00",
  "energy_max": 3, "energy_left": 0,
  "results": [
    { "id": "…", "status": "accepted" },
    { "id": "…", "status": "duplicate" },
    { "id": "…", "status": "rejected", "reason": "no_energy" }
  ]
}
```

| Status / reason | Meaning |
|---|---|
| `accepted` | Stored; one energy spent |
| `duplicate` | This id was already accepted for you (safe retry; no energy spent, even after midnight) |
| `rejected` · `no_energy` | 3 actions already today (Calgary day) |
| `rejected` · `not_member` | You have not joined a community |
| `rejected` · `other_community` | The project (building) belongs to another community |
| `rejected` · `project_not_active` | The construction is finished (goal reached) |
| `rejected` · `project_not_found` | Unknown project id |
| `rejected` · `id_conflict` | Another player already used this id |
| `rejected` · `invalid` | Missing or malformed `id` / `project_id` |

- **Idempotency:** always generate the id once per tap (e.g. `crypto.randomUUID()`) and
  reuse it on retries.
- The action's day is the **server's** Calgary day when it arrives. An action queued
  offline before midnight and sent after midnight counts for the new day.
- Errors: not signed in → `28000`; body not an array or more than 10 entries → `22023`.

## `gamecore_get_me()`
```json
{ "calgary_day": "2026-12-01", "next_day_start": "…", "community_id": "uuid | null", "energy_max": 3, "energy_left": 3 }
```

## `gamecore_choose_community(p_community_id uuid)` — temporary
Joins (or switches to) a community chosen from the list; returns the same shape as
`gamecore_get_me()`. **Residency (M7) replaces this** with location-based verification and
the moving rules (§6.4).

---

## Rules (starting values, `requirement.md` §7.7, §8, §22.8)
- 3 energy per player per Calgary day; enforced by a database constraint (energy slots 1–3).
- Building tree (`supabase/data/building_tree.json`, seeded into `gamecore.building_types`,
  `requirement.md` §7.6b). A building **opens** when its required buildings are built and
  the community has enough cumulative residents and streak days. Openings are recorded once,
  so a building never locks again when residents leave.
- At most 3 constructions at a time. Opened buildings start in tree order; when none is
  waiting, the newest building of each growth chain is upgraded (lowest level first).
- Required actions, frozen when a construction starts:
  `ceil(max(10, 5 × active residents) × stage multiplier × 1.25^(level−1))`, at least 3 for
  stage-1 buildings. Stage multipliers: 1: 0.3, 2: 1, 3: 1.5, 4: 2, 5: 3.
  Active residents = members whose last active day (later of joining and last action) is
  within the last 30 Calgary days.
- Land tiers (cumulative residents → land stage): 0, 3, 6, 11, 26, 51 → 0–5.
- **Temporary:** community streak = 0 until M5, so buildings with a streak condition stay
  locked.
- Actions are append-only; progress and completion are computed from the action log.

## Local development
- `supabase db reset` applies migrations and `supabase/seed.sql`, which creates a **local-only**
  dev user: `dev@makecalgarytalk.local` / `dev-password`, already a member of Mahogany.
