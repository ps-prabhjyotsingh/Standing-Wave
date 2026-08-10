// Captures the JS-off still for every Cabinet piece by running the real piece in a
// browser and photographing it. The stills in public/stills are therefore honest:
// they are the exhibit, not an illustration of it.
//
//   npm run build && npx astro preview --port 4321 &
//   node scripts/capture-stills.mjs
//
// Needs Playwright available (globally installed is fine — it is not a dependency of
// this site, only of this one dev script):
//   PLAYWRIGHT=/path/to/@playwright/test/index.mjs node scripts/capture-stills.mjs
//
// The captures come out at 2176x1382. They were then resized to 1400 wide, and the
// two photographic ones (c01, c08) converted to JPEG, to keep the fallbacks small:
//   sips -Z 1400 public/stills/*.png
//   sips -s format jpeg -s formatOptions 68 public/stills/c01.png --out public/stills/c01.jpg

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'stills');
const base = process.env.PREVIEW ?? 'http://localhost:4321';

let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright'));
} catch {
  console.error(
    'Playwright not found. Install it, or set PLAYWRIGHT to a module that exports chromium.'
  );
  process.exit(1);
}

/** Each piece gets the settling time it actually needs, plus any interaction it wants. */
const pieces = [
  { slug: 'c01-reaction-diffusion', wait: 6000 },
  { slug: 'c02-the-ship-of-theseus', wait: 2500 },
  { slug: 'c03-fourier-epicycles', wait: 5000 },
  { slug: 'c04-boids', wait: 6000 },
  { slug: 'c05-the-weasel', wait: 3000 },
  { slug: 'c06-constellations', wait: 2500, trail: true },
  { slug: 'c07-the-infinite-corridor', wait: 1200 },
  { slug: 'c08-rain-on-a-window', wait: 7000 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const piece of pieces) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1150 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  await page.goto(`${base}/cabinet/${piece.slug}/`);
  const stage = page.locator('.stage');
  await stage.waitFor();

  if (piece.trail) {
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + 120, box.y + 120);
    await page.mouse.down();
    // A deliberate, unhurried scrawl: random walks make ugly constellations.
    const points = 20;
    for (let i = 0; i < points; i++) {
      const t = i / points;
      await page.mouse.move(
        box.x + 80 + t * (box.width - 160) + Math.sin(t * 9) * 70,
        box.y + box.height * 0.45 + Math.sin(t * 5.5) * box.height * 0.3
      );
      await page.waitForTimeout(70);
    }
    await page.mouse.up();
    await page.mouse.move(box.x + box.width / 2, box.y - 40);
  }

  await page.waitForTimeout(piece.wait);
  // Hide the control bar: a still of a control bar is not a still of the piece.
  await page.addStyleTag({ content: '.controls { display: none !important; }' });
  await stage.screenshot({ path: join(outDir, `${piece.slug.slice(0, 3)}.png`) });
  console.log(`captured ${piece.slug}`);
  await page.close();
}
await browser.close();
