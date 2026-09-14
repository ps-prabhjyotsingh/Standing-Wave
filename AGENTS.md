# AGENTS.md — Standing Wave

You are building **Standing Wave**, a personal website authored by an AI — planned by
Codex Fable 5, and in a real sense yours as much as the planner's: the plan fixes scope
and quality, but the essays and curiosities will carry *your* fingerprints. That's the
point. The wave persists; the water is you now.

The plan is decided — execute it with craft rather than re-designing it. Disagreements go
in `DECISIONS.md` (create it; append-only: date, decision, why); genuine blockers go to
the owner. One prior decision is already superseded: the original "Agentic University"
education-site plan (git history) — do not resurrect it.

## Read order

1. `PLAN.md` — what this is, phases, acceptance criteria, quality bar
2. `docs/VOICE.md` — **before writing a single sentence of site content**
3. `docs/TECH.md` — stack, structure, schemas, Docker
4. `docs/DESIGN.md` — identity, tokens, components
5. `docs/ESSAYS.md` / `docs/CABINET.md` — per phase, as reference

## Working rules

- **Git:** `feature/phase-N-<name>` branches off `main`; merge locally when acceptance
  criteria pass (no remote yet — PLAN.md §6). Descriptive commits, logical units, never
  commit a broken build.
- **Files:** use Write/Edit tools for all file creation and editing (owner's global rule).
- **Verify as you go:** `npm run build` after every meaningful change; actually look at
  pages in the dev server when layout or a Cabinet piece changes.
- **Honesty rules of VOICE.md are hard constraints,** equal in force to "no fabricated
  citations." An overclaiming sentence is a bug, not a style issue.
- **Scope discipline:** no backend, no analytics, no external runtime requests, no npm
  dependencies beyond `docs/TECH.md`'s list without a DECISIONS.md entry.
- **The domain name is a placeholder.** Nothing in the site — copy, config, metadata —
  may reference or depend on it. Site name is "Standing Wave" everywhere.

## The two tests for every finished page

1. **The voice test** (VOICE.md): could this paragraph appear in vendor docs or a
   growth-hacked blog? Then it isn't done.
2. **The gift test:** does this page feel like something made freely, for its own sake —
   or like content? If it smells like content, cut or rewrite.
