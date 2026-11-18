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
State on the current Calgary day. Reading it also starts the community's next projects if
fewer than 3 are active (project rows are written once, when they start).

```json
{
  "calgary_day": "2026-12-02",
  "next_day_start": "2026-12-03T06:00:00+00:00",
  "community": { "id": "uuid", "code": "MAH", "name": "Mahogany", "sector": "Southeast", "population": 13860 },
  "projects": [
    { "id": "uuid", "seq": 2, "kind": "flower-path", "title": "Make a flower path", "level": 1,
      "required": 10, "progress": 4, "stage": "scaffolding" }
  ],
  "completed_projects": [
    { "id": "uuid", "seq": 1, "kind": "ice-rink", "title": "Build an ice rink", "level": 1, "completed_on": "2026-12-02" }
  ],
  "me": { "member": true, "energy_max": 3, "energy_left": 2 }
}
```
- `projects`: the 3 active projects in order. `progress` counts actions from **before today**
  (today's actions show tomorrow), capped at `required`. `stage`: `scaffolding` below half,
  `frame` from half. Completed projects move to `completed_projects`.
- `completed_on`: the day the completion became visible (the day after the goal was reached).
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
| `rejected` · `other_community` | The project belongs to another community |
| `rejected` · `project_not_active` | The project is completed (or not started) |
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
- 3 active projects per community. Catalog (in order): ice rink, flower path, holiday
  decorations, snowman garden, lantern street, bird feeders; then the catalog repeats at
  level 2, 3, …
- Required actions, frozen when a project starts: `ceil(max(10, 5 × active residents) × 1.25^(level−1))`.
  Active residents = members whose last active day (later of joining and last action) is
  within the last 30 Calgary days.
- Actions are append-only; progress and completion are computed from the action log.

## Local development
- `supabase db reset` applies migrations and `supabase/seed.sql`, which creates a **local-only**
  dev user: `dev@makecalgarytalk.local` / `dev-password`, already a member of Mahogany.
