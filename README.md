# MakeCalgaryTalk

A web game where Calgary communities compete by growing their neighbourhood together.

Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a **pastel voxel village on a floating diorama island**. Residents verify they live in their community, then walk around with their own avatar and take a few quick actions every day to build parks, rinks and community centres together. The island grows as more neighbours join. Active communities look lively; neglected ones turn gloomy. Communities are ranked by how many of their residents take part.

The site itself, **makecalgarytalk.com**, is the game.

## Status

🚧 **Pre-MVP.** Requirements are defined; development has not started yet.

- The MVP builds the 3D island entirely from **simple coloured boxes in three.js** (no detailed art) to validate the core loop quickly. Because the target style is voxel, the box version already looks close to the final look.
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

Read `requirement.md`, `PLAN.md` and `CLAUDE.md` before starting any work.

## Core loop (MVP)

1. **World Map** — a 2D map of real Calgary communities showing how developed each one is; invite friends to empty ones
2. **Community island** — enter your community's voxel island and see what changed since yesterday
3. **Avatar** — tap the ground to walk around
4. **Daily actions** — spend 3 energy on community projects; your avatar runs over and helps build
5. **Village news** — read the auto-generated community newspaper
6. **Come back tomorrow** — construction progresses overnight, the community streak must be kept, and the island grows as neighbours join

## Planned tech stack

| Area | Technology |
|---|---|
| Web UI | Angular |
| Community island (3D) | three.js |
| World Map (2D) | SVG / Canvas |
| Backend | Spring Boot |
| Database / Auth | Supabase (PostgreSQL + PostGIS, Anonymous + Google sign-in) |
| Static files / CDN | Cloudflare Pages / R2 |
| Bot protection | Cloudflare Turnstile |
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
├── frontend/          # Angular + three.js app
└── backend/           # Spring Boot API
```

## Getting started

_To be added once development begins (module M0 in `PLAN.md`)._

## Updating requirements

`requirement.md` changes over time. **Never edit requirements without logging the change.**

1. Add a new entry at the top of the Change Log (§24) with date, version, what changed, why, and the previous text verbatim
2. Then update the body
3. Bump the document version and last-updated date

## License

Private project. All rights reserved.
