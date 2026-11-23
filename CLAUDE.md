# CLAUDE.md — Working rules for this project

These rules apply to every task in this repository. Read this file and `requirement.md` before starting any work.

---

## 1. Core working rules

### Rule 1. Never code without enough information. Ask → plan together → implement.
- Before writing code, confirm you understand the goal, the relevant section of `requirement.md`, and the current code.
- If anything is unclear or missing, **ask first**. Do not guess requirements.
- For any non-trivial task, propose a short plan (what changes, which files, how to verify) and **wait for approval** before implementing.
- Work in small steps. One feature or change at a time.

### Rule 2. Never just agree. Review problems and alternatives first.
- When the user proposes something, check it against `requirement.md`, the existing code, cost, security, and privacy.
- If you see a problem, say so clearly and suggest at least one alternative, with trade-offs.
- If the request conflicts with `requirement.md`, point out the conflict and ask whether to update the requirement.
- Agreeing is fine when the idea is good, but say why.

### Rule 3. Passing basic tests is not "done".
- Tests must cover the actual rules, including edge cases (e.g. day boundary at Calgary midnight, daily energy limit, half-of-Active-Verified-Residents streak rule with rounding and zero denominator, 3-of-7-days verification).
- Report what was tested **and what was not tested**.
- Never say "done" just because the build passes or a happy-path test passes.

### Rule 4. Run it and look at the screen. It is not finished until a human has played it.
- After implementing, run the app and check the actual screen/behaviour yourself (and describe what you saw). For 3D work, also check it at a phone-sized viewport.
- Use these status words honestly:
  - **Implemented** — code written, builds
  - **Verified** — tests pass and you ran it and checked the screen/behaviour
  - **Ready for playtest** — verified and waiting for the user to play it
  - **Done** — only after the user has played it and confirmed
- Never mark a task "Done" yourself. The furthest you can go is "Ready for playtest".

### Rule 5. Never repeat the same mistake. Log every mistake here in one line.
- When a mistake happens (yours or a recurring bug), add **one line** to [§4 Mistake Log](#4-mistake-log) at the bottom of this file.
- Format: `- YYYY-MM-DD: <what went wrong> → <rule to follow from now on>`
- Read the Mistake Log before starting each task.

---

## 2. Project rules

### Source of truth
- `requirement.md` is the source of truth for what to build.
- **Never change requirements silently.** If a requirement must change:
  1. Add a Change Log entry at the top of `requirement.md` §24 (date, version, Changed, Why, Previous text verbatim)
  2. Then update the body
  3. Bump the version and last-updated date
- Get the user's approval before any requirement change.

### Language
- All code, comments, commit messages, docs, and identifiers in **English**. No Korean in code or comments.
- Use the terms defined in `requirement.md` §23 Glossary for names in code (e.g. `Vitality`, `CommunityStreak`, `VerifiedResident`).

### Privacy & security
- **Never store exact location coordinates.** Check community boundary on the server, then discard coordinates; store only the community ID.
- Never collect home addresses.
- Never expose activity times in public data (day-level only).
- Never commit secrets (API keys, Supabase service keys, etc.). Use environment variables.

### Game logic
- All game rules (daily energy, streaks, verification, scoring) are **validated on the server** (Supabase Postgres functions or Edge Functions). The client may update the screen optimistically but is never trusted.
- **Row Level Security on every table.** The frontend only uses the anon key; the service-role key never reaches the frontend or git.
- Day boundary is **America/Edmonton midnight**, computed **only on the server** (`common.calgary_day()` / `common.calgary_day_start()`). Alberta is UTC-6 year-round since 2026-11-01; never hardcode offsets, and never compute Calgary time zones in the client (send it `calgary_day` / next-midnight instants instead). A frontend test enforces this.
- Follow the server-cost principles in `requirement.md` §20.3 (static files via CDN, compute-on-read, snapshots, no WebSockets).
- Follow the scalability principles in `requirement.md` §20.3b: **append-only actions** (never update a shared counter per action), stateless functions, connection pooling, **idempotent action IDs**, rate limiting.

### Rendering (react-three-fiber voxel island)
- Stack: React + react-three-fiber + drei (see `requirement.md` §20.1). Use drei helpers before writing custom code (`OrthographicCamera`, `Instances`, `Html`, controls).
- Keep rendering separate from game logic. Game objects are drawn through **asset keys** (`requirement.md` §20.4).
- MVP maps asset keys to **code-built box model components**. Do not hardcode models or meshes inside game logic.
- **Per-frame updates (movement, animation) go in `useFrame` with refs, never React state.** Avoid re-rendering the scene every frame.
- Game state lives in Zustand stores; subscribe with selectors so 3D components re-render only when their data changes.
- Match the visual reference in `docs/references/` (pastel voxel floating island, isometric orthographic camera, soft light). If unsure about a visual choice, ask.
- Follow the 3D performance principles (`requirement.md` §20.3a): InstancedMesh for repeated blocks, modest shadows, device pixel ratio ≤ 2, capped character counts. Mention phone performance in reports.
- Speech bubbles and name labels are **HTML overlays** (drei `Html`), not 3D text.
- The World Map is **2D** (Canvas in a React component; SVG only for prototypes). Do not render all communities in 3D.

### Avatar & multiplayer
- Avatar movement is expressed as **destination events** ("move to tile x,y") and computed on the client. Do not send per-frame positions to the server.
- **No real-time multiplayer in the MVP.** Other residents appear asynchronously (near houses or replaying today's actions). Real-time presence is a later phase; keep the destination-event format so it can be broadcast later.

### Scope
- Stay inside the current MVP scope (`requirement.md` §22.1). If a feature belongs to a later phase, say so and ask before building it.

### Plan & modules
- `PLAN.md` defines the build order. **Work on one module at a time** — the module marked 🟦 In progress.
- Do not start the next module until the current one is ✅ Done (user confirmed).
- When a module reaches 🟨 Ready for playtest, update its status in `PLAN.md` and tell the user.
- `PLAN.md` has **no time estimates**. Do not add schedules or durations; use the checklists to track completeness.
- If a bug belongs to a finished module, mark it 🔁 Reopened, fix it there, and log it.
- Plan changes follow the same rule as requirements: Change Log entry first (with previous text), then edit.

### Branches & merging
- **Never commit directly to `main`.** `main` only contains work the user has checked together with Claude Code.
- One branch per piece of work, created from an up-to-date `main`:

| Work | Branch | Example |
|---|---|---|
| A `PLAN.md` module | `module/m<number>-<name>` | `module/m0-foundation` |
| Bug in a ✅ Done module (🔁 Reopened) | `fix/m<number>-<topic>` | `fix/m3-energy-reset` |
| Docs/rules change not tied to a module | `docs/<topic>` | `docs/moving-rules` |

- Requirement or plan changes made during a module go on that module's branch.
- Push the branch to `origin` regularly (backup + CI runs on every push).
- **Merge to `main` only when all of these are true:**
  1. The user and Claude Code have checked it together and it works (for modules: the user played it and confirmed ✅)
  2. CI is green on the branch (check with `gh run list --branch <branch>`)
  3. `PLAN.md` status is already updated on the branch (✅ for modules) so `main` is correct the moment it is merged
- Merge with `git merge --no-ff` (keeps the branch's commits and one clear merge commit per module), push `main`, then delete the branch (local and remote).

### Modular code (modular monolith)
Each `PLAN.md` module maps to a code module with clear boundaries, so a problem can be fixed in one place.
- **Frontend (React):** one folder per module under `frontend/src/modules/<module-name>/` (e.g. `island-view`, `avatar`, `daily-actions`), containing its components, hooks, stores and tests. Each module exposes a small public API through its `index.ts`; other modules import **only** from that API, never from internal files.
- **Backend (Supabase):** each module owns its database objects in **its own Postgres schema** (e.g. `gamecore`, `communitystate`, `residency`), which is **not exposed** by the API. The only callable surface is `public.<module>_<name>()` RPC functions, granted explicitly to `anon`/`authenticated` (`auto_expose_new_tables = false` in `supabase/config.toml`). No tables or views in `public`. Migrations are named with the module (e.g. `supabase/migrations/<timestamp>_gamecore_actions.sql`); Edge Functions live in `supabase/functions/<module>-<name>/`. Other modules call a module's **public functions (RPC)**, never its tables directly. These rules are enforced by `supabase/tests/database/common_health.test.sql` (add new module prefixes to its list).
- **Shared code** lives in a minimal `common` module only (e.g. Calgary day-boundary utility, IDs, shared types). Do not put feature logic in `common`.
- Keep modules **loosely coupled**: pass data through interfaces/DTOs or events; no circular dependencies.
- **Each module has its own tests.** Changing one module must not require changing another module's internals.
- If a change needs to cross module boundaries, stop and propose the interface change first (Rule 1).

---

## 3. Workflow

### Session start (every new session)
Each module is usually worked on in a **new session** with no memory of earlier ones. Before doing anything, rebuild context from the repository:
1. `git status`, `git branch -a` — which branch you are on, uncommitted work, an unfinished module/fix branch
2. `git log --oneline --graph -20 main` (and the current branch if it is not `main`) — what was done recently
3. `PLAN.md`: the header (current module, plan version), the **newest Change Log entries**, and the **Handoff** notes of finished modules the current module depends on
4. `requirement.md` §24 Change Log (newest entries) and the sections the current module touches
5. This file's Mistake Log
6. Local environment: Docker Desktop running, `supabase status` (ports 554xx), `frontend/.env.local` present; run the tests once to confirm a green starting point
7. Tell the user in a few lines what you found (last finished module, current module, anything unfinished) before starting

### Module steps
1. Read `CLAUDE.md` (including the Mistake Log), the current module in `PLAN.md`, and the relevant parts of `requirement.md`
2. Ask questions about anything unclear
3. Propose a plan → wait for approval
4. Create the branch from an up-to-date `main` (see Branches & merging)
5. Implement in small steps
6. Test, including edge cases
7. Run the app and check the screen
8. Report: what changed, what was tested, what was not tested, what you saw on screen, status (`Implemented` / `Verified` / `Ready for playtest`)
9. Update `PLAN.md`: tick completed checklist items (`- [x]`), update the module status, and write the module's **Handoff** note (decisions not obvious from the code, deviations from the plan, known gaps / not tested, follow-ups for later modules, environment gotchas)
10. Commit on the branch with a clear message, scoped by module (e.g. `feat(island-view): add vitality moods`, `fix(gamecore): energy reset at Calgary midnight`), and push the branch
11. Check it together with the user; when it works, CI is green and `PLAN.md` says ✅, merge to `main` with `--no-ff`, push, delete the branch
12. If a mistake happened, add one line to the Mistake Log

---

## 4. Mistake Log

<!-- One line per mistake. Newest at the bottom. Format:
- YYYY-MM-DD: <what went wrong> → <rule to follow from now on>
-->

- 2026-11-17: requirement.md bumped without updating PLAN.md "Based on" → after every requirement version bump, update PLAN.md header in the same commit
- 2026-11-18: wrote day-boundary test cases from memory assuming Alberta still had DST (it ended 2026-11-01) → derive time zone expectations from current tzdata/official sources, never from memory; keep time zone math on the server
- 2026-11-18: gamecore DB tests silently depended on local seed data (dev user counted as a member) → DB tests start by clearing their module's tables inside the test transaction; run `supabase test db` both after `db reset` (with seed) and in CI (without)
- 2026-11-19: screen-check scripts filtered out React "unmount a root" console errors, which hid labels that rendered empty → never filter console errors in screen checks; explain or fix every one
- 2026-11-19: named a helper `buildMap.ts` next to `BuildMap.tsx`; macOS treats them as one file, so imports broke and Vite kept serving the stale module → never give files in one folder names that differ only in case; restart Vite after renames
- 2026-11-20: ran a doc-editing script and `git commit` in one shell command on separate lines, so the commit ran even though the PLAN edit failed (requirement bumped without PLAN) → run doc edits and commits as separate steps and check the edit succeeded before committing; limit plan replacements to the part above the Change Log
- 2026-11-20: ran a Playwright script from the repo folder, so its screenshot (`frontend/m7-phone.png`) landed in the repo and `git add -A` committed it → run screen-check scripts from the scratchpad folder and read `git status` for stray files before every commit
- 2026-11-22: ranking DB test inserted next-day actions before same-day ones, but finished days are recorded once (ensure_days), so counts came out wrong → in DB tests insert actions day by day in date order, as real play does
- 2026-11-22: the World Map's canvas draw loop read React state captured when its listeners were set up (stale statuses/selection) → loops and listeners set up once must read changing values through a ref
- 2026-11-23: `git add <dir>` committed Python `__pycache__` files → check `git status` for generated files before committing a directory; bytecode is now in .gitignore
