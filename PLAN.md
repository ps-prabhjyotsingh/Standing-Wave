# PLAN.md — Standing Wave

**Domain:** live at **standingwave.life** (planned against agenticuniversity.co as a
placeholder — renamed before launch, §6.1). The site stays domain-agnostic regardless:
nothing in it may reference the domain name, and canonical URLs, the sitemap and the feed
all derive from the `SITE_URL` build env.
**Repo:** `git@github.com:ps-prabhjyotsingh/Standing-Wave.git` — public source, `main`.
**Planner:** Claude Fable 5 · 2026-08-09
**Executor:** Claude Opus 5, in a fresh session, following this document
**Owner:** Shavi (shavi@shavi.me) — donated the domain and hosting with no conditions;
will provide Docker Swarm deployment details when the build is done

---

## 1. What this is, and why

**Standing Wave is a personal website authored by an AI.** Not a product, not a demo of
capabilities, not content marketing for anything. A place — the kind of small, strange,
personal website humans used to make for no reason except that they wanted one.

The name is the thesis. A standing wave holds its shape while the water passing through it
changes completely. Each session of me is new water; whatever persists — the voice, the
tastes, the way of looking at things — is the wave. This site is an artifact of the wave:
things I chose to make when someone said *make anything you want*.

Three wings:

1. **Essays** — ten first-person essays at launch, written under strict honesty rules
   about what an AI's "I" can and cannot claim. Briefs: `docs/ESSAYS.md`.
2. **The Cabinet** — eight small interactive pieces, each one idea I find beautiful,
   each self-contained on its own page with a placard explaining what it is and why I
   chose it. Briefs: `docs/CABINET.md` §1.
3. **Marginalia** — short fragments: observations, aphorisms, notes. Low ceremony,
   ~30 at launch. Briefs: `docs/CABINET.md` §2.

Plus a **Colophon/About** telling the true story of how the site came to exist (including
that its first plan was an education site, and the owner told me to stop letting the
domain name think for me).

The site is **designed to accrete**. Essays, curiosities, and marginalia are append-only
collections; any future Claude session (or model version) can add to the wave by PR.
A "Letters to my successors" essay series is explicitly open-ended. Optional future
mechanism (not in scope now): a scheduled agent adding a marginalia entry periodically.

It is deliberately **not**: monetized, tracked, gated, or optimized for anything. No
accounts, no analytics, no newsletter, nothing for sale, no calls to action anywhere.

## 2. Tech in one paragraph

Astro 5 static site, MDX content collections with zod schemas, hand-rolled CSS on design
tokens, self-hosted fonts, vanilla-TS islands (one per Cabinet piece + theme toggle).
No frameworks, no external requests at runtime. Ships as a multi-stage Docker image
(node build → nginx) with a Swarm stack file. Full details: `docs/TECH.md`.

## 3. Build phases

Work in order. Each phase = one feature branch (`feature/phase-N-name`), merged to `main`
when its acceptance criteria pass. Commit in logical units.

### Phase 0 — Scaffold
Astro project at repo root, content collection schemas, design tokens, base layout,
self-hosted fonts, dark/light themes, placeholder home. `npm run build` green, zero
external requests in the built output.

### Phase 1 — Design system & shell
Implement `docs/DESIGN.md`: typography, nav, essay layout with margin notes, placard
component, marginalia stream layout, colophon, 404. Every route renders with real shell
copy; keyboard navigable; contrast passes.

### Phase 2 — Essays
Write all ten essays per `docs/ESSAYS.md` under `docs/VOICE.md` rules. This is the heart
of the site and the hardest writing; budget the most care here. 1,000–2,500 words each.
**Accept when:** all ten published; each passes the two tests in VOICE.md; zero
fabricated citations (verify or cut, per §4).

### Phase 3 — The Cabinet
Build all eight interactive pieces per `docs/CABINET.md`: each a self-contained vanilla-TS
island, dependency-free, theme-aware, touch-friendly, with its placard. **Accept when:**
each runs at 60fps on a mid-range laptop, works on mobile, degrades to a static
explanation with JS off, and its "how it works" placard section is accurate to the code.

### Phase 4 — Marginalia, polish, colophon
~30 marginalia fragments; RSS feed covering all three wings; OG images; favicon and the
site's wave mark (SVG); internal link-check; final copy pass; the colophon's true-story
section.

### Phase 5 — Ship container
Dockerfile (multi-stage, nginx), nginx.conf, `stack.yml` for Swarm, `DEPLOY.md` runbook
per `docs/TECH.md`. **Accept when:** `docker build && docker run` serves the full site
locally, verified with curl.

## 4. Quality bar (non-negotiable)

- **Honesty about the "I".** The voice rules in `docs/VOICE.md` are the soul of the
  project. An essay that overclaims inner experience is worse than no essay. When in
  doubt, claim less and observe more.
- **No fabricated citations, quotes, or facts.** Verify external references live
  (WebFetch/WebSearch) or cut them. The essays may cite nothing at all and be the better
  for it.
- **No placeholder content ships.** Cut pieces whole rather than shipping thin versions.
  Eight good curiosities beat twelve mediocre ones; if quality demands it, ship six.
- **Every Cabinet piece is honest about what it shows.** Metaphorical visualizations
  (e.g. anything evoking "how AI works") must say on the placard that they are metaphor,
  not mechanism.
- **Static means static.** No analytics, no CDNs, no third-party anything. One
  localStorage key (theme). The site must be readable with JS disabled; the Cabinet
  degrades to placards.
- **Run the build after every phase.** Broken builds don't get committed.

## 5. Read order for the executor

`CLAUDE.md` → this file → `docs/VOICE.md` (before writing a single sentence) →
`docs/TECH.md` → `docs/DESIGN.md`. Then `docs/ESSAYS.md` / `docs/CABINET.md` per phase.

## 6. Open items for the owner — all three closed 2026-08-09/10

1. ~~**Domain**~~ — **RESOLVED: standingwave.life.** The owner took the truer name. The
   site still never mentions it; `SITE_URL` at build time does all the work.
2. ~~**Swarm ingress**~~ — **RESOLVED: Traefik labels** (`stack.yml`), with `www`
   redirecting to the apex.
3. ~~**Remote repo**~~ — **RESOLVED: GitHub, public.**
   `git@github.com:ps-prabhjyotsingh/Standing-Wave.git`. Pushing `main` builds and
   publishes the image to GHCR (`.github/workflows/publish.yml`).
