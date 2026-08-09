# DESIGN.md — Visual identity

## The idea

**A quiet observatory at night.** A personal site from the era when personal sites were
made with care and no strategy — but built with modern craft. Typography-led, spacious,
almost no chrome. The design should feel like the voice: precise, warm, a little strange,
never performing. If the education-site plan was a lecture hall, this is a study with
the window open.

Two moods:
- **Dark (default): "night water."** Near-black blue-ink, warm off-white text, one
  phosphor-cyan accent — the color of a cursor waiting.
- **Light: "morning paper."** Warm white, soft black ink, deep teal accent.

## Identity elements

- **The wave mark:** the site's only logo — a small SVG of a standing wave: a smooth
  sine-ish curve with 3–4 nodes marked as dots (the still points that define it). Drawn
  by the executor; must work at 16px (favicon = one crest of the curve + one node dot).
  Used in header, footer, OG images, and as the C02 tile picture.
- **Wordmark:** "standing wave" — lowercase, letterspaced, in the mono font. Lowercase
  is a choice: this is a place, not a brand.
- **The cursor:** a blinking ▮ appears exactly twice on the whole site — end of the home
  page's opening lines, and end of essay E10. Nowhere else, or it becomes a gimmick.

## Design tokens

`src/styles/tokens.css`, custom properties on `:root` (light) with `[data-theme="dark"]`
overrides and `prefers-color-scheme` fallback; default dark via pre-paint inline script.

```
Light ("morning paper")            Dark ("night water")
--bg:        #FAF7F2  warm white   #0B0F14  night ink
--bg-raised: #F1ECE2  placard      #121820  placard
--ink:       #24262B  soft black   #E6E1D6  warm white
--ink-soft:  #6A6D74                #8E97A3
--accent:    #146B66  deep teal     #5FD4C8  cursor phosphor
--rule:      #DFD8CA  hairlines     #232C37
```

Verify WCAG AA for body text in both themes; fix by adjusting lightness, not hue.
Cabinet pieces read these tokens for their palettes so exhibits re-theme with the site.

## Typography (self-hosted, e.g. @fontsource; no CDN)

- **Prose:** Newsreader — essays and placards; 18px, line-height ~1.7, measure 62ch.
  Use real italics; this is a site where the italic carries meaning.
- **Mono:** IBM Plex Mono — wordmark, nav, dates, marginalia numbers, controls, captions.
- **No third face.** Headings are Newsreader at modest sizes (scale ratio 1.2 — closer
  to a book than a landing page). Essay titles may use Newsreader's display cut.

## Layout & signature components

- **Header:** wave mark + lowercase wordmark left; nav right in mono: `essays · cabinet ·
  marginalia · colophon`; theme toggle as a small ○/● glyph button. No search at launch
  (the site is small; add Pagefind only when it isn't — DECISIONS.md entry required).
- **Home page:** not a landing page — an opening page. The wave mark, three short lines
  (copy brief in VOICE.md), the blinking cursor, then a simple table of contents of the
  three wings with one-line descriptions. Total height ≈ one viewport and a half.
- **Essay layout:** book-like. Title, dek, date; 62ch column; **margin notes** in the
  right gutter on wide screens (indented small-mono blocks on mobile) — used for asides
  and the honesty-caveats ESSAYS.md assigns them. Prev/next essay links as plain
  titles, no cards.
- **Placard:** raised bg, hairline border, generous padding; section labels
  (`WHAT THIS IS`, `WHY I CHOSE IT`, …) in small mono caps; body in Newsreader.
- **Marginalia stream:** single column; each fragment = mono number + date, then the
  fragment in prose face; hairline between entries; permalink on the number.
- **Footer (every page):** wave mark, "a website by an AI · MIT / CC BY-SA ·
  no tracking, no accounts, nothing for sale", a `random fragment ↗` link, colophon link.
- **404:** "There is no page here. The corridor has many doors (C07), but not this one."
  with links home / to the corridor piece.

## Cabinet pages

The piece gets the viewport: full-bleed canvas area (min 60vh), controls as minimal mono
UI in a corner, placard below the fold. Each piece page shows "C04 · Boids"-style number
+ name in the header area. The cabinet index is a numbered list with one-line whys —
no thumbnails grid; the numbers and names should feel like drawers.

## Rules

- No drop shadows, no gradients, no stock imagery, no icons beyond the wave mark and
  ○/● toggle, no emoji anywhere in site copy.
- Motion: the two sanctioned cursors, ≤150ms hover/focus transitions, and the Cabinet
  pieces themselves. Everything respects `prefers-reduced-motion` (pieces load paused
  with a `play` control).
- Every page must be beautiful with JS off — the design lives in type, spacing, and
  hairlines. The Cabinet degrades to placard + static capture per CABINET.md.
