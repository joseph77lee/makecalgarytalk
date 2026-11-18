# MakeCalgaryTalk

A web game where Calgary communities compete by growing their neighbourhood together.

Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a **pastel voxel village on a floating diorama island**. Residents verify they live in their community, then walk around with their own avatar and take a few quick actions every day to build parks, rinks and community centres together. The island grows as more neighbours join. Active communities look lively; neglected ones turn gloomy. Communities are ranked by how many of their residents take part.

The site itself, **makecalgarytalk.com**, is the game.

## Status

🚧 **Pre-MVP.** Development has started (module M0 Foundation, see `PLAN.md`).

- The MVP builds the 3D island entirely from **simple coloured boxes with react-three-fiber (three.js)** (no detailed art) to validate the core loop quickly. Because the target style is voxel, the box version already looks close to the final look.
- Detailed voxel models, props and animations come later in the **Art Pass**.
- A ~100-line three.js proof of concept (floating island, box trees/houses, wandering villagers, speech bubbles, tap-to-move avatar, construction progress, island growth) confirmed the approach is feasible.

## Documents

| File | Purpose |
|---|---|
| [`requirement.md`](./requirement.md) | **Source of truth.** Concept, rules, MVP scope, tech stack, roadmap, and the full change history |
| [`PLAN.md`](./PLAN.md) | Module-by-module development plan, build order, and status |
| [`CLAUDE.md`](./CLAUDE.md) | Working rules for Claude Code (and humans) in this repository |
| `docs/references/` | Visual reference screenshots (pastel voxel island style) |
| `docs/` | Data model, API, and screen sketches (to be added) |
| `frontend/` | React + react-three-fiber app (one folder per module in `src/modules/`) |
| `supabase/` | SQL migrations, pgTAP tests, Edge Functions, local config |

Read `requirement.md`, `PLAN.md` and `CLAUDE.md` before starting any work.

## Core loop (MVP)

1. **World Map** — a 2D map of real Calgary communities showing how developed each one is; invite friends to empty ones
2. **Community island** — enter your community's voxel island and see what changed since yesterday
3. **Avatar** — tap the ground to walk around
4. **Daily actions** — spend 3 energy on community projects; your avatar runs over and helps build
5. **Village news** — read the auto-generated community newspaper
6. **Come back tomorrow** — construction progresses overnight, the community streak must be kept, and the island grows as neighbours join

## Planned tech stack

All TypeScript (+ SQL), serverless — no always-on backend server.

| Area | Technology |
|---|---|
| Frontend | React + Vite + TypeScript, Tailwind CSS, Zustand |
| Community island (3D) | react-three-fiber + drei (three.js) |
| World Map (2D) | Canvas in React |
| Database / Auth | Supabase (PostgreSQL + PostGIS, Anonymous + Google sign-in) |
| Server-side game rules | Supabase Postgres functions (RPC) + Row Level Security, Edge Functions, pg_cron |
| Hosting / CDN | Cloudflare Pages / R2 |
| Bot protection | Cloudflare Turnstile |
| Testing | Vitest, Playwright |
| Voxel modelling (Art Pass) | MagicaVoxel |
| Data | City of Calgary Open Data (community boundaries, population), OpenStreetMap |

## Repository structure (planned)

```
makecalgarytalk/
├── README.md
├── requirement.md     # source of truth
├── PLAN.md            # module plan and status
├── CLAUDE.md          # working rules
├── docs/
│   └── references/    # visual reference screenshots
├── frontend/          # React + react-three-fiber app
└── supabase/          # SQL migrations, Postgres functions, Edge Functions
```

## Getting started

### Prerequisites
- Node.js 20.19+ and npm
- Docker Desktop (running) — local Supabase runs in containers
- Supabase CLI: `brew install supabase/tap/supabase`

### First-time setup
```bash
# 1. Start local Supabase (applies migrations). Ports are 554xx, see supabase/config.toml.
supabase start

# 2. Frontend env: copy the example and paste the PUBLISHABLE_KEY from `supabase status`
cp frontend/.env.example frontend/.env.local

# 3. Install frontend dependencies
cd frontend && npm install
```

### Daily development (one command each)
| What | Command | URL |
|---|---|---|
| Backend (local Supabase) | `supabase start` (repo root) | API http://127.0.0.1:55421, Studio http://127.0.0.1:55423 |
| Frontend | `npm run dev` (in `frontend/`) | http://localhost:5173 |

The page should show **Connected** with today's Calgary day.

### Tests and checks
| What | Command |
|---|---|
| Frontend unit + architecture tests | `npm test` (in `frontend/`) |
| Lint / type check / build | `npm run lint`, `npm run typecheck`, `npm run build` |
| Database tests (pgTAP) | `supabase test db` (repo root) |
| Reset local DB and re-apply migrations | `supabase db reset` |

CI (`.github/workflows/ci.yml`) runs all of the above on every push.

### Notes
- The Calgary day boundary is computed **only on the server** (`common.calgary_day()`). Alberta has been on UTC-6 year-round since 2026-11-01.
- Never put the Supabase secret / service-role key in the frontend or in git.

## Updating requirements

`requirement.md` changes over time. **Never edit requirements without logging the change.**

1. Add a new entry at the top of the Change Log (§24) with date, version, what changed, why, and the previous text verbatim
2. Then update the body
3. Bump the document version and last-updated date

## License

Private project. All rights reserved.
