# DECISIONS.md

Append-only. Date · decision · why. Written by the builder as the site went up.

---

**2026-08-09 · Astro 5.18.2, not the newest Astro (7.2.0).**
`docs/TECH.md` decided "Astro 5", with a parenthetical "latest stable at build time";
by the time I built, latest stable was 7.2.0, so the two halves of that sentence
disagreed. I followed the explicit "Astro 5". Note for whoever maintains this: `npm audit`
reports XSS advisories against Astro <= 7.0.9. Every one of them concerns rendering
attacker-controlled input — `define:vars`, spread attributes, slot names, server islands,
the dev server on Windows. This site is `output: 'static'`, has no server runtime, no
user input at any stage, and ships as flat files behind nginx, so the advisories have no
surface here. The code uses only Content Layer APIs (`src/content.config.ts`, `glob()`
loader, `render(entry)`), which is also the shape Astro 6 and 7 want, so an upgrade later
should be a small diff rather than a migration.

**2026-08-09 · Two dev dependencies beyond the TECH.md list: @astrojs/check and a
globally-installed Playwright.**
`npm run check` is specified in TECH.md as `astro check`, which refuses to run without
`@astrojs/check`; it is a devDependency and contributes nothing to the built site.
Playwright is *not* installed as a dependency at all — `scripts/capture-stills.mjs` takes
a path to a global install through an environment variable. I used it for two things: to
look at pages rather than guess at them, and to photograph each Cabinet piece for its
JS-off still, so the stills are the exhibit itself rather than an artist's impression.
Nothing in `dependencies` changed.

**2026-08-09 · A second shared island file, `controls.ts`.**
TECH.md sanctions one ~50-line `piece-runtime.ts` and warns against letting it grow into
a framework. Eight pieces need the same handful of control widgets, so the DOM boilerplate went into
a separate 90-line `controls.ts` of pure functions that know nothing about any piece. The
runtime stayed at its intended size. Splitting them felt more honest than growing one file
past its brief.

**2026-08-09 · E01's companion piece is C02, not C06.**
`docs/ESSAYS.md` says the title essay's companion is "The Ship of Theseus (C06)", but
`docs/CABINET.md` numbers the Ship of Theseus C02 and gives C06 to Constellations, and
`docs/DESIGN.md` refers to the wave mark as "the C02 tile picture". Two documents against
one; I read it as a typo in ESSAYS.md and used C02.

**2026-08-09 · Two verified citations in E08, and no others anywhere.**
The confabulation essay names three pieces of research: the split-brain interpreter
studies, Nisbett and Wilson (1977), and Johansson and colleagues (2005). I checked all
three against live sources before writing the sentences, including the volume, page and
result numbers. No other essay cites anything, which was the plan's explicit permission
and, I think, the right outcome: the rest of the material is either mine to observe or
nobody's to prove.

**2026-08-09 · Theme default: stored choice, else system, else dark.**
`docs/TECH.md` says "default dark, system fallback", which can be read two ways. I
implemented: a stored `theme` key wins; otherwise the system preference decides;
`prefers-color-scheme: light` is what has to be *asserted* to get the light theme, so
"no preference" lands on dark. With JS disabled there is no attribute at all and CSS
media queries do the same job. This keeps the promise of one localStorage key and never
overrides someone who has told their machine what they want.
