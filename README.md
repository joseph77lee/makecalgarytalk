# MakeCalgaryTalk

A web game where Calgary communities compete by growing their neighbourhood together.

Each real Calgary community (e.g. Mahogany, Bridgeland, Tuscany) is a village on a map of Calgary. Residents verify they live in their community, then take a few quick actions every day to build parks, rinks and community centres together. Active communities look lively; neglected ones turn gloomy. Communities are ranked by how many of their residents take part.

The site itself, **makecalgarytalk.com**, is the game.

## Status

🚧 **Pre-MVP.** Requirements are defined; development has not started yet.

The MVP uses **basic geometric shapes only** (no pixel art) to validate the core loop quickly. Pixel art comes later in the Art Pass.

## Documents

| File | Purpose |
|---|---|
| [`requirement.md`](./requirement.md) | **Source of truth.** Concept, rules, MVP scope, tech stack, roadmap, and the full change history |
| `docs/` | Data model, API, and screen sketches (to be added) |

Read `requirement.md` before starting any work.

## Core loop (MVP)

1. **World Map** — see how developed every Calgary community is; invite friends to empty ones
2. **Community view** — see what changed since yesterday and how lively the community is
3. **Daily actions** — spend 3 energy on community projects
4. **Village news** — read the auto-generated community newspaper
5. **Come back tomorrow** — construction progresses overnight and the community streak must be kept

## Planned tech stack

| Area | Technology |
|---|---|
| Frontend | Angular + PixiJS |
| Backend | Spring Boot |
| Database / Auth | Supabase (PostgreSQL + PostGIS, Anonymous + Google sign-in) |
| Static files / CDN | Cloudflare Pages / R2 |
| Bot protection | Cloudflare Turnstile |
| Data | City of Calgary Open Data (community boundaries, population), OpenStreetMap |

## Repository structure (planned)

```
makecalgarytalk/
├── README.md
├── requirement.md     # source of truth
├── docs/              # data model, API, screen sketches
├── frontend/          # Angular app
└── backend/           # Spring Boot API
```

## Getting started

_To be added once development begins (Step 1 in `requirement.md` §22.6)._

## Updating requirements

`requirement.md` changes over time. **Never edit requirements without logging the change.**

1. Add a new entry at the top of the Change Log (§24) with date, version, what changed, why, and the previous text verbatim
2. Then update the body
3. Bump the document version and last-updated date

## License

Private project. All rights reserved.
