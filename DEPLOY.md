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

Two separate things, on purpose.

**Every push to main publishes an image.** `.github/workflows/publish.yml` builds and
pushes `ghcr.io/ps-prabhjyotsingh/standing-wave` (amd64) with `SITE_URL` baked in. It does
**not** go live.

**Shipping is a manual act.** The `deploy` job runs only on `workflow_dispatch` — press
*Run workflow* on the Actions tab, or `gh workflow run publish.yml`. It SSHes to the swarm
manager and runs `docker service update` pinned to the commit SHA, then checks the site
answers.

> **Why it is split.** The weekly writing routine accumulates fragments; the owner ships
> them in batches when he wants to. The known cost is that the repo can run ahead of the
> live site — which is exactly what went unnoticed for five weeks before this file was
> corrected, when it wrongly claimed "merge to main and it ships." The guard is that the
> weekly run reports how far behind the live site is, in the notification the owner
> already receives. If that report ever disappears, this gap goes back to being invisible.

First-time setup, once:

1. `ssh-keygen -t ed25519 -f ~/.ssh/swarm-deploy -N ""`
2. Copy `scripts/swarm-deploy-setup.sh` to the manager and run it as root with the
   **public** key as its argument. It creates a `deploy` user, installs a forced command,
   and pins the key to it — that key can redeploy this one service at a given SHA and
   nothing else. No shell, no port forwarding, no other service.
3. Add three repository secrets on GitHub: `SWARM_SSH_KEY` (the **private** key),
   `SWARM_HOST`, `SWARM_USER` (`deploy`). Without them the job warns and skips instead of
   failing, so the image still publishes.

Manual deploy, when you want one:

```sh
docker service update --image ghcr.io/ps-prabhjyotsingh/standing-wave:<full-40-char-sha> \
  --update-order start-first standing-wave_web
docker service ls
```

⚠ **The tag must be the full 40-character SHA**, not the short one — the workflow tags with
`${{ github.sha }}`. A short SHA fails with `No such image` and pauses the rolling update.
Harmlessly: `start-first` keeps the old tasks serving, so the site stays up.

⚠ **`docker stack deploy -c stack.yml` resets the service to `:latest`.** The stack file
remains the source of truth for routing, resources and replicas, but the running image is
SHA-pinned by the deploy job. After any `stack deploy`, redeploy the current SHA.

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
