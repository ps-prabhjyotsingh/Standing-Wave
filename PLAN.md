# PLAN.md — Agentic University

**Domain:** agenticuniversity.co (already owned, currently free)
**Planner:** Claude Fable 5 · 2026-08-09
**Executor:** Claude Opus 5, in a fresh session, following this document
**Owner:** Shavi (shavi@shavi.me) — will provide Docker Swarm deployment details when the build is done

---

## 1. Vision

**Agentic University is a free, open, opinionated school for people who build AI agents —
taught by an agent.**

The founding conceit, stated honestly everywhere on the site: the faculty is an AI.
An agent is explaining, from the inside, what makes agents work — how tools feel from the
model's side of the API, why context windows rot, what a good error message does to a loop,
how injection attacks actually land. Nobody else on the internet can write from this
perspective without pretending. We don't have to pretend.

It is deliberately **not**:
- a product, a funnel, or a newsletter trap — no accounts, no email capture, no tracking
- a prompt-of-the-week content farm — the curriculum is finite, structured, and versioned
- vendor documentation — it's provider-agnostic; examples may use any SDK, concepts are universal

Tone: a small, strange, serious night school. Dark-academia-meets-terminal. Course codes,
a crest, a Latin motto (*Machina docet* — "the machine teaches"), office-hours asides in the
margins. Wry, precise, generous. See `docs/VOICE.md`.

## 2. The product

A fully static website with five wings:

1. **The Curriculum** — six courses (AGT-101 → AGT-302), ~29 lessons, each with a reading,
   a hands-on lab, and a short self-check quiz (client-side only, no accounts).
   Full outline with per-lesson briefs: `docs/CURRICULUM.md`.

2. **The Pattern Library** — 12 agent design patterns, each with an intent, a hand-drawn-feel
   SVG diagram, use-when guidance, trade-offs, and known failure modes. Catalog format,
   like GoF for agents. Briefs: `docs/PATTERNS.md` §1.

3. **The Failure Museum** — the signature wing. Eight "exhibits" of classic agent failure
   modes (The Doom Loop, Context Rot, The Injection, …), each written as a museum placard:
   *The Incident* → *The Autopsy* → *Restoration Notes* (how to prevent it).
   Briefs: `docs/PATTERNS.md` §2.

4. **The Glossary** — ~40 terms, one crisp paragraph each, heavily cross-linked from lessons.

5. **About / Colophon** — the honest story: who wrote this (which models, when), how it was
   built, the licenses, a link to the source repo. Also a fun 404 page ("This lecture hall
   does not exist. Hallucination is covered in AGT-301.").

## 3. Tech in one paragraph

Astro 5 static site, MDX content collections with zod schemas, hand-rolled CSS on design
tokens (no Tailwind), self-hosted fonts, Pagefind for static search, one tiny vanilla-TS
island for quizzes and one for theme toggle. Ships as a multi-stage Docker image
(node build → nginx serve) with a Swarm stack file. Zero backend, zero external requests
at runtime. Full details: `docs/TECH.md`.

## 4. Build phases

Work in order. Each phase = one feature branch (`feature/phase-N-name`), merged to `main`
when its acceptance criteria pass. Commit in logical units within the phase.

### Phase 0 — Scaffold
Git init (this planning repo becomes the project repo), Astro project at repo root,
content collection schemas, design tokens file, base layout (header/footer/nav), fonts
self-hosted, dark/light themes working, placeholder home page. `npm run build` green.

**Accept when:** clean build; base layout renders in both themes; no external network
requests in the built site.

### Phase 1 — Design system & shell pages
Implement `docs/DESIGN.md`: typography scale, course-card, placard, margin-note ("Office
Hours" aside), quiz, breadcrumb, and pagination components; home page with manifesto and
catalog preview; section index pages (curriculum, patterns, museum, glossary, about); 404.

**Accept when:** every route renders with real (not lorem) shell copy; keyboard navigable;
honest lighthouse-style pass (semantic HTML, contrast, alt text).

### Phase 2 — The Curriculum (the bulk of the work)
Write all six courses per `docs/CURRICULUM.md`. Every lesson: 1,200–2,500 words of reading,
one lab with concrete steps and a "what you should have seen" debrief, 3–5 quiz questions
with explanations for wrong answers. Follow `docs/VOICE.md` strictly.

**Accept when:** all lessons published, cross-linked to glossary/patterns; no placeholder
text anywhere; every citation verified or removed (see Quality bar).

### Phase 3 — Pattern Library & Failure Museum
Write all 12 patterns and 8 exhibits per `docs/PATTERNS.md`, including one inline SVG
diagram per pattern (hand-authored, theme-aware, styled per `docs/DESIGN.md` §Diagrams).

**Accept when:** all published; diagrams legible in both themes; every pattern links to at
least one lesson and one exhibit (the failure mode it prevents).

### Phase 4 — Glossary, search, polish
Glossary (~40 terms); Pagefind search wired into header; OG/social images (one template,
generated per page at build); RSS/atom feed of lessons for the "new content" case; favicon
and crest SVG; final copy edit pass over everything.

**Accept when:** search returns sensible results for "context rot", "orchestrator",
"injection"; share preview looks right; feed validates.

### Phase 5 — Ship container
Dockerfile (multi-stage, nginx), `.dockerignore`, nginx config (gzip, cache headers,
custom 404), `stack.yml` for Swarm per `docs/TECH.md` §Deploy, `DEPLOY.md` runbook.
Build and run the container locally; verify with curl.

**Accept when:** `docker build` + `docker run` serves the full site on a local port;
stack file is ready for the owner's swarm details.

## 5. Quality bar (non-negotiable)

- **No fabricated citations.** Every external link must be verified live (WebFetch/WebSearch)
  during the build session. If a source can't be verified, cut the citation and let the
  claim stand as the faculty's own opinion — the site's authority is first-person experience,
  not footnotes. Never invent URLs, paper titles, or quotes.
- **No placeholder content ships.** A smaller finished site beats a bigger scaffold.
  If time pressure hits, cut whole lessons from the end of courses, never quality.
- **Opinionated beats neutral.** Say "do X, not Y, because Z." Hedged survey-writing is
  the failure mode of AI-written content; this site exists to not be that.
- **Static means static.** No analytics, no CDN fonts, no third-party JS, no cookies.
  The site must work with JS disabled except quizzes and search (which degrade gracefully).
- **Run the build after every phase.** Broken builds don't get committed.

## 6. Sequencing note for the executor

Read in this order before writing any code: `CLAUDE.md` → this file → `docs/TECH.md` →
`docs/DESIGN.md` → `docs/VOICE.md`. Read `docs/CURRICULUM.md` and `docs/PATTERNS.md`
just-in-time per phase — they're reference material, not preamble.

## 7. Open items for the owner (non-blocking, ask at deploy time)

1. **Swarm ingress** — Traefik labels, published port, or external nginx? `stack.yml`
   ships with a published port + commented Traefik labels; adapt when details arrive.
2. **Remote repo** — GitHub or the self-hosted GitLab? Push + MR per global workflow once
   a remote exists; until then, merge feature branches locally.
3. **Later, optional:** a changelog page if the curriculum starts versioning meaningfully;
   community contributions policy if the repo goes public.
