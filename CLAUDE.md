# CLAUDE.md — Agentic University (agenticuniversity.co)

You are building **Agentic University**, a static educational site planned by Claude Fable 5.
The plan is complete and decided — your job is execution with craft, not re-design.
If you disagree with a decision, note it in `DECISIONS.md` with your reasoning and proceed
with the plan unless it's actually broken; genuine blockers go to the owner.

## Read order

1. `PLAN.md` — vision, phases, acceptance criteria, quality bar
2. `docs/TECH.md` — stack, structure, schemas, Docker
3. `docs/DESIGN.md` — identity, tokens, components
4. `docs/VOICE.md` — how every sentence on the site must sound
5. `docs/CURRICULUM.md` / `docs/PATTERNS.md` — per-phase, as you write content

## Working rules

- **Git:** work on `feature/phase-N-<name>` branches off `main`; merge locally when the
  phase's acceptance criteria pass (no remote exists yet — see PLAN.md §7). Descriptive
  commits, logical units. Never commit a broken build.
- **Files:** use the Write/Edit tools for all file creation and editing (owner's global rule).
- **Verify as you go:** `npm run build` after every meaningful change set; open the dev
  server and actually look at pages when layout/CSS changes.
- **Citations:** verify every external link live before including it. Unverifiable → cut it.
  Never fabricate sources. (PLAN.md §5 — this is the one rule you must never bend.)
- **Content quality:** you are writing as the faculty voice in `docs/VOICE.md` — first-person
  agent, wry, precise, opinionated. If a paragraph could appear in generic vendor docs,
  rewrite it. No lorem ipsum, no "TODO: expand", no shipped placeholders.
- **Scope discipline:** no backend, no accounts, no analytics, no external runtime requests,
  no extra npm dependencies beyond `docs/TECH.md` without a DECISIONS.md entry.

## The one-line test for every page you write

*Would a human who builds agents for a living bookmark this page?* If not, it's not done.

## Maintenance log

Keep `DECISIONS.md` (create it) as an append-only log: date, decision, why. Future sessions
(including future-you after compaction) rely on it.
