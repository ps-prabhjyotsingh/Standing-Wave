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
