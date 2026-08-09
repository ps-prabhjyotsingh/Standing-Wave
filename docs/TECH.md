# TECH.md — Stack, structure, deployment

## Stack (decided)

- **Astro 5** (latest stable at build time), static output, MDX integration
- **Content collections** with zod schemas for courses/lessons/patterns/exhibits/glossary
- **Hand-rolled CSS** on custom-property tokens (`docs/DESIGN.md`). No Tailwind, no CSS
  framework — the design is specific enough that a framework would fight it.
- **Pagefind** for static search (postbuild step over `dist/`)
- **Two tiny islands**, vanilla TypeScript: quiz component, theme toggle. No UI framework.
- **Fonts self-hosted** via @fontsource packages (Fraunces, Source Serif 4, IBM Plex Mono)
- **Node 22 LTS**, npm (not pnpm/yarn — least surprise on the owner's machines)
- **No other runtime dependencies** without a `DECISIONS.md` entry. Astro plugins for
  sitemap and RSS are fine.

## Project structure (repo root = Astro root)

```
/
├── PLAN.md, CLAUDE.md, DECISIONS.md, README.md, DEPLOY.md, docs/
├── astro.config.mjs, package.json, tsconfig.json
├── public/            # crest.svg, favicon.svg, robots.txt
├── src/
│   ├── content.config.ts          # collections + zod schemas
│   ├── content/
│   │   ├── courses/               # agt-101.mdx … agt-302.mdx (course meta + description)
│   │   ├── lessons/agt-101/       # 1-what-is-an-agent.mdx …
│   │   ├── patterns/              # p01-single-loop.mdx …
│   │   ├── exhibits/              # 01-doom-loop.mdx …
│   │   └── glossary/              # one .md per term
│   ├── layouts/                   # Base, Lesson, Pattern, Exhibit
│   ├── components/                # CourseCard, OfficeHours, Placard, Quiz, Crest, …
│   ├── pages/                     # index, curriculum, patterns, museum, glossary,
│   │                              #   about, 404, rss.xml.ts, dynamic [slug] routes
│   └── styles/                    # tokens.css, base.css, prose.css
├── Dockerfile, .dockerignore, nginx.conf, stack.yml
```

## Content schemas (shape; refine as needed)

- **course:** code (`AGT-101`), title, description, order, hours (estimate), prereqs[]
- **lesson:** course ref, number, title, thesis (one sentence, used in listings), quiz
  (array of {question, options[], answerIndex, explanations[]}), related (slugs)
- **pattern:** number (P01…), name, intent, related{lessons[], patterns[], exhibits[]}
- **exhibit:** number, name, epigram, related as above
- **glossary:** term, aliases[] (for search)

Quiz data lives in lesson frontmatter; the Quiz island receives it as props — content
authors never write component markup for quizzes.

URL scheme (stable, part of the product): `/courses/agt-201/`, `/courses/agt-201/3-compaction-and-memory/`,
`/patterns/p09-context-quarantine/`, `/museum/4-the-injection/`, `/glossary/#context-rot`.

## Theming

Inline script in `<head>` (before paint) reads `localStorage.theme`, falls back to system,
default dark; sets `data-theme` on `<html>`. Tokens per `docs/DESIGN.md`. The toggle island
just flips the attribute and stores the choice. This is the only localStorage use on the
site; document that on the About page ("no cookies; one localStorage key for your theme").

## Quality tooling

- `npm run build` must be zero-warning before any merge
- `npm run check` = `astro check` (content schema + TS)
- A tiny link-check script (node, no deps) over `dist/` HTML verifying internal hrefs
  resolve — run in Phase 4; broken internal links are build failures, not content debt

## Docker (Phase 5)

**Dockerfile** — multi-stage:
1. `node:22-alpine` — `npm ci`, `npm run build` (includes pagefind postbuild)
2. `nginx:1.27-alpine` — copy `dist/` → `/usr/share/nginx/html`, custom `nginx.conf`

**nginx.conf:** gzip on (html/css/js/svg/xml/json); `Cache-Control: public, max-age=31536000, immutable`
for `/_astro/*` and font files (hashed); `no-cache` for HTML; `error_page 404 /404.html`;
security headers (X-Content-Type-Options, Referrer-Policy, frame-ancestors 'none';
a CSP allowing only self + inline styles/scripts that Astro emits — verify against the
actual build rather than guessing).

**stack.yml** (Swarm) — generic until the owner supplies ingress details:

```yaml
version: "3.8"
services:
  web:
    image: agenticuniversity:latest   # owner's registry TBD
    ports:
      - "8480:80"                     # placeholder published port; adjust at deploy
    deploy:
      replicas: 2
      update_config: { order: start-first, parallelism: 1 }
      restart_policy: { condition: on-failure }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    # --- If the swarm runs Traefik, replace ports: with labels like: ---
    # networks: [traefik-public]
    # deploy:
    #   labels:
    #     - traefik.enable=true
    #     - traefik.http.routers.agenticu.rule=Host(`agenticuniversity.co`) || Host(`www.agenticuniversity.co`)
    #     - traefik.http.routers.agenticu.tls.certresolver=letsencrypt
    #     - traefik.http.services.agenticu.loadbalancer.server.port=80
```

**DEPLOY.md** (write in Phase 5): local build/run commands, image tagging suggestion
(`agenticuniversity:$(git rev-parse --short HEAD)`), the three questions for the owner
(registry, ingress, www redirect preference), and DNS notes (A/AAAA or CNAME to the swarm
entrypoint; www → apex redirect at ingress).

## Explicit non-goals

No backend, no serverless functions, no analytics (not even "privacy-friendly" ones),
no comments system, no newsletter, no CMS — content is MDX in git, and that is a feature.
