# DEPLOY.md — running Standing Wave

The site is flat files. The container is nginx with those files in it and nothing else:
no application server, no database, no state, no logs of anyone's visit. If the container
dies, nothing is lost; if it runs, it serves.

## Build and run it locally

```sh
docker build --build-arg SITE_URL=https://your.domain -t standing-wave:latest .
docker run --rm -p 8480:80 standing-wave:latest
# then open http://localhost:8480
```

Leaving `SITE_URL` off is fine for a local look; it defaults to `http://localhost:8480`.

Tag with the commit so you can always tell what is running:

```sh
docker build \
  --build-arg SITE_URL=https://your.domain \
  -t standing-wave:$(git rev-parse --short HEAD) \
  -t standing-wave:latest .
```

## What `SITE_URL` does, and the one rule about it

It is the only place the deployed domain appears anywhere in this project. Canonical
links, the sitemap, the feed and the social-image URLs are built from it. Nothing in the
content, the copy or the configuration mentions a domain, so moving the site to a different
one costs exactly one rebuild.

If you change domains, rebuild. Nothing else needs touching.

## What the build does

1. `npm ci`, then `npm run build` with `SITE_URL` in the environment.
2. `node scripts/verify-dist.mjs` — fails the build if any internal link is broken, if any
   Cabinet piece is missing its JS-off still, or if any page's social image is absent.
3. `node scripts/csp-header.mjs > csp.conf` — reads the built HTML, hashes the two small
   inline scripts Astro emits, and writes the Content-Security-Policy for nginx. The
   policy is `default-src 'none'` with narrow allowances; it is regenerated on every image
   build, so it can never drift from the site it is protecting.
4. `nginx -t` inside the final image, so a broken config fails the build rather than the
   deploy.

## Deploying to the swarm

The image is published automatically: `.github/workflows/publish.yml` builds and pushes
`ghcr.io/ps-prabhjyotsingh/standing-wave` (amd64 + arm64) on every push to main, with
`SITE_URL` baked in. The swarm node only needs:

```sh
docker stack deploy -c stack.yml standing-wave
docker service ls
```

If the package is private, `docker login ghcr.io` on the node first (a classic PAT with
`read:packages`), and add `--with-registry-auth` to the deploy. Making the package public
is simpler and the image contains nothing private.

`stack.yml` attaches to the external `inbound` network and carries the swarm's usual
Traefik labels (`websecure`, `tls=true`, service port 80). No ports are published; Traefik
does the routing. Updates are `start-first` with one replica at a time, so a deploy does
not drop requests.

## The three questions, answered (2026-08-09)

1. **Registry:** GitHub Container Registry, built and pushed by Actions on every push to
   main. No local Docker or credentials needed to release — merge to main and it ships.
2. **Ingress:** Traefik on the external `inbound` network, same conventions as the other
   stacks on this swarm; TLS terminates at Traefik.
3. **Domain:** `standingwave.life`. It lives in exactly two places — the `SITE_URL` env in
   the workflow (baked into the image) and the default of `SITE_DOMAIN` in `stack.yml`
   (Traefik routing). Changing domains is a two-line edit and a rebuild.

## Things worth knowing before it is live

- **No access logs.** `access_log off` in `nginx.conf` is deliberate: the colophon promises
  visitors that nothing about their visit is recorded, and a default access log would make
  that false. Error logs stay on; they are about the server, not the visitor.
- **Caching.** Hashed assets under `/_astro/` are immutable for a year. Stills and social
  images get a day. HTML is `no-cache`, so a rebuild is visible immediately.
- **Health.** `HEALTHCHECK` fetches `/`. A healthy container is one that can serve the home
  page, which for this site is the whole contract.
- **Regenerated artefacts.** The Cabinet stills (`public/stills`) and the social images
  (`public/og`) are committed, not built. If a piece changes visibly, re-run
  `scripts/capture-stills.mjs`; if a title or dek changes, re-run `scripts/capture-og.mjs`
  (see the comments at the top of each). Both need Playwright, which is not a dependency of
  the site.

## Adding to the site later

Essays, drawers and fragments are append-only collections of files under `src/content`.
Add a file, run `npm run build && npm run verify`, rebuild the image. There is no CMS and
there is not going to be one.
