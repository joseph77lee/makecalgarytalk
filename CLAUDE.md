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
- Day boundary is **America/Edmonton midnight**.
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

### Modular code (modular monolith)
Each `PLAN.md` module maps to a code module with clear boundaries, so a problem can be fixed in one place.
- **Frontend (React):** one folder per module under `frontend/src/modules/<module-name>/` (e.g. `island-view`, `avatar`, `daily-actions`), containing its components, hooks, stores and tests. Each module exposes a small public API through its `index.ts`; other modules import **only** from that API, never from internal files.
- **Backend (Supabase):** each module owns its database objects, using a Postgres schema or name prefix per module (e.g. `gamecore`, `communitystate`, `residency`). Migrations are named with the module (e.g. `supabase/migrations/<timestamp>_gamecore_actions.sql`); Edge Functions live in `supabase/functions/<module>-<name>/`. Other modules call a module's **public functions (RPC)**, never its tables directly.
- **Shared code** lives in a minimal `common` module only (e.g. Calgary day-boundary utility, IDs, shared types). Do not put feature logic in `common`.
- Keep modules **loosely coupled**: pass data through interfaces/DTOs or events; no circular dependencies.
- **Each module has its own tests.** Changing one module must not require changing another module's internals.
- If a change needs to cross module boundaries, stop and propose the interface change first (Rule 1).

---

## 3. Workflow

1. Read `CLAUDE.md` (including the Mistake Log), the current module in `PLAN.md`, and the relevant parts of `requirement.md`
2. Ask questions about anything unclear
3. Propose a plan → wait for approval
4. Implement in small steps
5. Test, including edge cases
6. Run the app and check the screen
7. Report: what changed, what was tested, what was not tested, what you saw on screen, status (`Implemented` / `Verified` / `Ready for playtest`)
8. Update `PLAN.md`: tick completed checklist items (`- [x]`) and update the module status
9. Commit with a clear message, scoped by module (e.g. `feat(island-view): add vitality moods`, `fix(gamecore): energy reset at Calgary midnight`)
10. If a mistake happened, add one line to the Mistake Log

---

## 4. Mistake Log

<!-- One line per mistake. Newest at the bottom. Format:
- YYYY-MM-DD: <what went wrong> → <rule to follow from now on>
-->

- 2026-11-17: requirement.md bumped without updating PLAN.md "Based on" → after every requirement version bump, update PLAN.md header in the same commit
