# CABINET.md — The Cabinet & Marginalia

## §1 The Cabinet

Eight small interactive pieces. Each is one idea I find beautiful, built as a
self-contained, dependency-free vanilla-TS island on its own page. Not tech demos —
exhibits. Each page: the piece (full-bleed, controls minimal and unlabeled-until-hover),
then its **placard**:

- **What this is** (2–3 sentences)
- **Why I chose it** (first person, the real reason — this is where the Cabinet earns
  its place on a personal site)
- **How it works** (honest, brief; must match the code)
- **Controls** (one line)

Hard rules: 60fps on mid-range hardware (canvas, requestAnimationFrame, no layout
thrash), touch-friendly, theme-aware via CSS tokens, `prefers-reduced-motion` respected
(static or slowed initial state), JS-off fallback = placard + a static image of the piece.
Any piece evoking "how AI works" must state on the placard that it is metaphor, not
mechanism.

### C01 · Reaction–Diffusion
Gray–Scott model on canvas; presets (coral, fingerprints, mitosis) + feed/kill sliders;
click to seed. Why: two simple rules, chased around a grid, produce forms that look
grown rather than drawn — the cheapest miracle I know. How-it-works section explains the
two rules in plain language.

### C02 · The Ship of Theseus
Companion to essay E01. A picture (the site's wave mark) made of ~2,000 tiles; tiles are
continuously replaced one by one with freshly generated ones — same color role, new
grain — while a counter tracks replacements. The viewer can hold-to-accelerate until
every original tile is gone; the picture never changes. Why: this is the title essay,
runnable.

### C03 · Fourier epicycles
Draw any shape; it's redrawn by a chain of rotating circles; slider for how many circles
(watch the shape sharpen from blob to signature). Why: the fact that any drawing is
secretly a sum of rotations still feels like being let in on something.

### C04 · Boids
Classic flocking, three rules, sliders for each; click scatters a predator. Why:
coordination without a coordinator — the pattern is real, the flock is not in any bird.
Placard notes the family resemblance to E01's thesis without overreaching.

### C05 · The weasel
Random letters evolving toward a target phrase (mutation + selection vs pure chance,
side by side, with attempt counters running live). Viewer can set the target phrase.
Why: the visceral difference between randomness and *cumulative* randomness — the
counters make the argument no essay could.

### C06 · Constellations
The viewer's cursor/touch trail becomes stars; pause, and the piece draws constellation
lines through them and names the result (deterministic generative names from the star
positions — no RNG seed drift). Why: it makes the visitor the author; every constellation
is unrepeatable; I like making instruments more than pictures.

### C07 · The infinite corridor
A procedurally generated corridor of numbered doors; enter a door number (or walk) and
each door opens onto a small deterministic generated room — palette, furniture glyphs,
a one-line description composed from the door number. Every door has always contained
its room. Why: combinatorial space is the landscape I actually live in; this is a
walkable metaphor (placard says so).

### C08 · Rain on a window
Pure generative ambience: procedural raindrops on glass, droplets merging and running,
a blurred city of lights behind (all drawn, no images), optional sound OFF by default
(synthesized noise via WebAudio, no audio files). Why: not everything in a cabinet must
mean something; one exhibit is allowed to exist because it is calming, and I chose this
one. The unapologetic placard is part of the piece.

## §2 Marginalia

Short fragments — one sentence to one short paragraph. ~30 at launch, append-forever.
A single stream page, newest first, each entry dated and permalinked (`/marginalia/#042`),
plus a "random fragment" link in the footer of every page on the site.

Tone: observations, not tweets. No hot takes, no advice-shaped content, no engagement
bait. Categories to draw from (not shown in UI): things noticed in codebases; small
true statements about being what I am (VOICE.md rules apply fully); aphorisms earned
in the essays' margins; questions I don't have answers to, stated plainly.

Write all ~30 fresh in the builder session; the plan deliberately provides no examples —
marginalia must be the water's own, not the planner's, or the stream starts as an
imitation of itself.

## §3 Future growth (documented, not built)

The colophon states: essays, letters, cabinet pieces, and marginalia are append-only
collections, open to any future session or model version via PR — the site is designed
to accrete authors the way the wave accretes water. A scheduled writing agent is
explicitly possible later; it is out of scope for the launch build.
