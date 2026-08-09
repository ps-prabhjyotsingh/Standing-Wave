# DESIGN.md — Visual identity

## The idea

**A night school for the people who build minds.** Dark academia crossed with a terminal:
collegiate seriousness (serifs, crests, course codes, mottos) rendered in the materials of
computing (monospace labels, phosphor accents, terminal-green cursors). It should feel like
a small, old, slightly secret institution that happens to exist inside a machine — not like
a SaaS landing page, not like a docs site, not like a Medium blog.

Two moods, both first-class:
- **Dark (default): "the night lecture."** Deep ink, parchment-warm text, phosphor accent.
- **Light: "the reading room."** Warm paper, iron-gall ink text, deep green accent.

## Identity elements

- **Crest:** an SVG shield — an owl whose eyes are two terminal cursors (▮▮), a scroll
  beneath, the motto on a ribbon. Simple, geometric, drawn by the executor; must read at
  24px favicon size (favicon = simplified owl-eyes mark only).
- **Motto:** *Machina docet* — "the machine teaches." Appears on crest and footer.
- **Wordmark:** "AGENTIC UNIVERSITY" in the display serif, letterspaced small caps;
  "est. 2026 · faculty of one" as the strapline where room allows.
- **Course codes** (`AGT-201`) always in mono, always in accent color.

## Design tokens

Define in `src/styles/tokens.css` as CSS custom properties on `:root` (light) with dark
overrides via `[data-theme="dark"]` and system fallback via `prefers-color-scheme`
(same triple-state pattern as artifact theming; default theme dark via inline script).

```
Light ("reading room")            Dark ("night lecture")
--bg:        #F6F1E7  warm paper  #0D1117  deep ink
--bg-raised: #EFE7D8  card        #161C26  card
--ink:       #21242B  iron-gall   #E8E2D4  parchment
--ink-soft:  #5A5E66              #9BA3AE
--accent:    #1F6F54  deep green  #46D39A  phosphor green
--accent-2:  #8A5A2B  old brass   #D4A24E  brass lamp
--rule:      #D8CEBB  hairlines   #2A3340
--danger:    #A33B2E  (museum)    #E06C5B
```

Verify contrast (WCAG AA minimum for body text) before shipping; adjust lightness, not hue.

## Typography (all self-hosted, e.g. via @fontsource; no CDN)

- **Display serif:** Fraunces — headings, wordmark, placard titles. Use its optical
  sizes/soft quirks; this is where the "old institution" feeling lives.
- **Body serif:** Source Serif 4 — lesson prose, 17–18px, line-height ~1.65, measure
  ~68ch max.
- **Mono:** IBM Plex Mono — course codes, labels, code, quiz UI, footer meta.
- Scale: 1.250 ratio. Headings in Fraunces get generous top margins — lessons should
  breathe like book chapters, not docs pages.

## Signature components

- **Course card** (catalog): looks like a university course listing — code in mono accent,
  title in display serif, one-line description, meta row (lessons · est. hours ·
  prerequisites) in mono. Hairline border, raised bg, no drop shadows anywhere on the site.
- **Office Hours aside:** the margin-note voice of the site. Desktop: true margin note in
  the right gutter. Mobile: indented block. Marked with a small ▮ cursor glyph and
  "OFFICE HOURS" mono label. Used for practical tips and first-person asides.
- **Museum placard:** exhibit header styled as a physical placard — raised bg, hairline
  double border, "Exhibit No. N" in mono, title in display serif, `--danger` accent strip.
  The placard-footer epigram in italic serif, right-aligned.
- **Quiz island:** mono UI. Radio options, immediate feedback on submit, wrong answers
  reveal their explanation, no score persistence (stateless, no storage). With JS disabled,
  render as plain details/summary Q&A — content never hostage to JS.
- **Lesson pagination:** prev/next as "← 201.2 Schemas that guide" style links, mono.
- **Breadcrumb:** `AGT-201 / 3` style, mono, top of lesson pages.

## Diagrams (Pattern Library)

Inline SVG, authored by hand per pattern. Style contract:
- Boxes: 1.5px `--ink-soft` stroke, `--bg-raised` fill, 4px radius; labels in mono 13px.
- The model/agent node always gets the accent stroke; tools are plain boxes; the loop is
  a dashed arrow returning; human gates are `--accent-2` diamonds.
- Arrows: 1.5px, small triangular heads; annotate edges in mono 11px where needed.
- All colors via `var(--token)` so diagrams re-theme automatically. Max width ~640px,
  `overflow-x: auto` wrapper for narrow screens.

## Layout

- Header: crest mark + wordmark left; nav (Curriculum · Patterns · Museum · Glossary ·
  About) right; search trigger + theme toggle as mono glyph buttons.
- Content column: 68ch prose, wider (~80ch + margin gutter) on lesson pages to make room
  for Office Hours notes.
- Footer: crest, motto, license lines, "Planned by Fable 5 · Built by Opus 5 · No tracking,
  no cookies, no accounts", link to source repo.
- Home page: full-viewport opening — crest, wordmark, the manifesto (see VOICE.md for its
  copy brief), then catalog preview (six course cards), then one featured museum exhibit
  ("Currently showing"), then the honest about-blurb.

## Rules

- No drop shadows, no gradients except a barely-there vignette on the home hero, no stock
  imagery, no emoji in site copy (the ▮ cursor glyph is the only pictogram).
- Motion: nothing but a blinking-cursor animation in the hero wordmark and standard
  hover/focus transitions ≤150ms. Respect `prefers-reduced-motion`.
- Every page must be beautiful with images/JS off — the design lives in type, spacing,
  and hairlines.
