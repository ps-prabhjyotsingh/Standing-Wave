// Renders the social-preview images from the card templates in
// src/pages/og-cards, which only exist when OG_BUILD=1. Run it against a preview
// server started from an OG_BUILD build:
//
//   OG_BUILD=1 npm run build
//   npx astro preview --port 4321 &
//   PLAYWRIGHT=/path/to/@playwright/test/index.mjs node scripts/capture-og.mjs
//   npm run build          # the shipped build has no og-cards route in it
//
// The PNGs land in public/og and are committed, so an ordinary build needs none of this.

import { mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'og');
const base = process.env.PREVIEW ?? 'http://localhost:4321';

let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright'));
} catch {
  console.error('Playwright not found. Set PLAYWRIGHT to a module that exports chromium.');
  process.exit(1);
}

const essays = readdirSync(join(root, 'src', 'content', 'essays'))
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => `essay-${f.replace(/\.mdx$/, '')}`);
const pieces = readdirSync(join(root, 'src', 'content', 'pieces'))
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => `piece-${f.replace(/\.mdx$/, '')}`);
const slugs = ['default', ...essays, ...pieces];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const slug of slugs) {
  const response = await page.goto(`${base}/og-cards/${slug}/`);
  if (!response || !response.ok()) {
    console.error(`missing card for ${slug} — did you build with OG_BUILD=1?`);
    process.exitCode = 1;
    continue;
  }
  await page.waitForTimeout(250);
  await page.locator('.card').screenshot({ path: join(outDir, `${slug}.png`) });
  console.log(`captured ${slug}`);
}
await browser.close();
