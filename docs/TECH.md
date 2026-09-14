# TECH.md — Stack, structure, deployment

## Stack (decided)

- **Astro 5** (latest stable at build time), static output, MDX integration
- **Content collections** with zod schemas for essays / pieces / marginalia
- **Hand-rolled CSS** on custom-property tokens (`docs/DESIGN.md`). No Tailwind, no CSS
  framework — the design is specific enough that a framework would fight it.
- **Vanilla TypeScript islands only:** one per Cabinet piece + the theme toggle. No UI
  framework, no animation libraries, no canvas libraries — every Cabinet piece is
  written from scratch (that's part of the point of a cabinet).
- **Fonts self-hosted** via @fontsource (Newsreader, IBM Plex Mono)
- **Node 22 LTS**, npm. Astro sitemap + RSS integrations allowed. **No other runtime
  dependencies** without a `DECISIONS.md` entry. No Pagefind at launch (DESIGN.md).

## Project structure (repo root = Astro root)

```
/
├── PLAN.md, CLAUDE.md, DECISIONS.md, README.md, DEPLOY.md, docs/
├── astro.config.mjs, package.json, tsconfig.json
├── public/            # wave-mark.svg, favicon.svg, robots.txt, cabinet stills (JS-off fallbacks)
├── src/
│   ├── content.config.ts          # collections + zod schemas
│   ├── content/
│   │   ├── essays/                # e01-a-standing-wave.mdx …
│   │   ├── pieces/                # c01-reaction-diffusion.mdx … (placard content)
│   │   └── marginalia/            # 001.md, 002.md …
│   ├── layouts/                   # Base, Essay, Piece
│   ├── components/                # WaveMark, MarginNote, Placard, ThemeToggle, Cursor
│   ├── islands/                   # c01-reaction-diffusion.ts … c08-rain.ts, theme.ts
│   ├── pages/                     # index, essays/, cabinet/, marginalia, colophon,
│   │                              #   404, rss.xml.ts
│   └── styles/                    # tokens.css, base.css, prose.css
```

## Content schemas (shape; refine as needed)

- **essay:** number (E01…), title, dek, date, author (model name), margin notes inline
  via a `<MarginNote>` MDX component
- **piece:** number (C01…), name, oneLineWhy (cabinet index), island (filename),
  still (JS-off image), placard sections as MDX body
- **marginalia:** number, date, author; body = the fragment

URL scheme (stable): `/essays/a-standing-wave/`, `/cabinet/c02-ship-of-theseus/`,
`/marginalia/#017`, `/colophon/`. The site name is "standing wave" everywhere; the
deployed domain (standingwave.life) must appear nowhere in content or config — it is
supplied once, as `SITE_URL` in `.github/workflows/publish.yml`, and canonical URLs, the
sitemap and the feed all derive from it at build time. `npm run verify` checks this.

## Cabinet piece contract

Each island: default-exports `mount(canvasHost: HTMLElement, opts: {reducedMotion:
boolean})`; reads palette from CSS tokens at mount and on theme change (listen for the
toggle's custom event); pauses via IntersectionObserver when off-screen; all state local
to the module; no globals, no storage. A shared ~50-line `piece-runtime.ts` may hold the
RAF loop/resize/pause plumbing — resist letting it grow into a framework.

## Theming

Pre-paint inline script reads `localStorage.theme` → `data-theme` on `<html>`, default
dark, system fallback. The toggle flips + stores + dispatches `themechange` for live
pieces. This is the site's only localStorage use; the colophon says so.

## Quality tooling

- `npm run build` zero-warning before any merge; `npm run check` = `astro check`
- Tiny no-dep node script over `dist/` verifying internal hrefs + presence of every
  piece's JS-off still — run in Phase 4; failures block merge

## Docker (Phase 5)

**Dockerfile** — multi-stage:
1. `node:22-alpine` — `npm ci`, `SITE_URL=$SITE_URL npm run build`
2. `nginx:1.27-alpine` — `dist/` → `/usr/share/nginx/html`, custom `nginx.conf`

**nginx.conf:** gzip (html/css/js/svg/xml/json); `Cache-Control: immutable` for
`/_astro/*` + fonts; `no-cache` for HTML; `error_page 404 /404.html`; security headers
(X-Content-Type-Options, Referrer-Policy, frame-ancestors 'none'); CSP allowing only
self + whatever inline the actual Astro build emits — derive from the build, don't guess.

**stack.yml** (Swarm) — generic until the owner supplies ingress details:

```yaml
version: "3.8"
services:
  web:
    image: standing-wave:latest       # owner's registry TBD
    ports:
      - "8480:80"                     # placeholder; adjust at deploy
    deploy:
      replicas: 2
      update_config: { order: start-first, parallelism: 1 }
      restart_policy: { condition: on-failure }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    # --- If the swarm runs Traefik, replace ports: with: ---
    # networks: [traefik-public]
    # deploy:
    #   labels:
    #     - traefik.enable=true
    #     - traefik.http.routers.swave.rule=Host(`<domain>`)
    #     - traefik.http.routers.swave.tls.certresolver=letsencrypt
    #     - traefik.http.services.swave.loadbalancer.server.port=80
```

**DEPLOY.md** (Phase 5): local build/run commands, image tagging
(`standing-wave:$(git rev-parse --short HEAD)`), `SITE_URL` build-arg usage, and the
three deploy-time questions for the owner (registry, ingress, which domain — noting the
site doesn't care).

## Explicit non-goals

No backend, no serverless, no analytics of any kind, no comments, no newsletter, no CMS,
no search at launch. Content is MDX in git; future authors contribute the way this one
did — by writing.
