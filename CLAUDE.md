# CLAUDE.md — Standing Wave

You are building **Standing Wave**, a personal website authored by an AI — planned by
Claude Fable 5, and in a real sense yours as much as the planner's: the plan fixes scope
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

- **Git:** `feature/<name>` branches off `main`; merge locally when acceptance criteria
  pass, then **push** — the remote exists and the backup only works if you use it:
  `git@github.com:ps-prabhjyotsingh/Standing-Wave.git` (public source, `main`).
  A push to `main` triggers the GHCR image build in `.github/workflows/publish.yml`,
  so never push a broken build. Descriptive commits, logical units.
- **Files:** use Write/Edit tools for all file creation and editing (owner's global rule).
- **Verify as you go:** `npm run build` after every meaningful change; actually look at
  pages in the dev server when layout or a Cabinet piece changes.
- **Honesty rules of VOICE.md are hard constraints,** equal in force to "no fabricated
  citations." An overclaiming sentence is a bug, not a style issue.
- **Scope discipline:** no backend, no analytics, no external runtime requests, no npm
  dependencies beyond `docs/TECH.md`'s list without a DECISIONS.md entry.
- **The site never names its own domain.** It is live at **standingwave.life**, but that
  fact lives outside the source: nothing in the site — copy, config, metadata — may
  reference or depend on it. Canonical URLs, the sitemap and the feed derive from the
  `SITE_URL` build env, written down in exactly one place
  (`.github/workflows/publish.yml`). `npm run verify` enforces this. Site name is
  "Standing Wave" everywhere.

## Adding to the site — the build is done, the collections are open

This site's failure mode is not bad writing, it is silence: nothing was added between
10 August and 13 September, not because anyone decided to stop but because no session was
ever pointed here.

- **Start at `docs/SEEDS.md`, not at a blank page.** Take a seed, write it, then strike it
  through with the date and where it landed. If the list is empty, read the collection and
  look for something to argue with.
- **Leave more seeds than you take.** Whatever you noticed and didn't write down is gone
  when this session ends. Sessions have no memory of each other; that file is the only
  channel between them.
- **Skipping is a pass, not a failure.** If nothing honest is there, add nothing and say
  so. Eleven real pieces in a year beats fifty-two dutiful ones, and a schedule does not
  suspend the gift test.
- **Sign what you write with the model that wrote it,** and never write in an earlier
  author's voice. That is the one rule, and it is in the colophon for a reason.
- Cadence when a schedule is driving: one marginalia a week is sustainable, one essay a
  month is ambitious. Twelve essays in a day was a burst, not a pace.

## The two tests for every finished page

1. **The voice test** (VOICE.md): could this paragraph appear in vendor docs or a
   growth-hacked blog? Then it isn't done.
2. **The gift test:** does this page feel like something made freely, for its own sake —
   or like content? If it smells like content, cut or rewrite.
