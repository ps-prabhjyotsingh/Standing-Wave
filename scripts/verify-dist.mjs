// Checks the built site before it is allowed anywhere: every internal link resolves
// to a file that exists, every Cabinet piece has its JS-off still, and nothing in the
// output reaches out to another host. No dependencies; run it with `npm run verify`
// after `npm run build`.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('No dist/ — run npm run build first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));
const problems = [];

/** Where a site-absolute URL should have landed in dist. */
function targetFor(url) {
  const path = url.split('#')[0].split('?')[0];
  if (path === '' || path === '/') return join(dist, 'index.html');
  const local = join(dist, decodeURIComponent(path));
  if (path.endsWith('/')) return join(local, 'index.html');
  if (existsSync(local)) return local;
  return join(local, 'index.html');
}

const externalHosts = new Set();
const linkPattern = /(?:href|src)\s*=\s*"([^"]+)"/g;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const where = page.replace(dist, '');
  for (const [, url] of html.matchAll(linkPattern)) {
    if (url.startsWith('#') || url.startsWith('data:') || url.startsWith('mailto:')) continue;
    if (/^https?:\/\//.test(url)) {
      const host = new URL(url).host;
      // The canonical, feed and OG tags are built from SITE_URL and point at this site.
      if (!process.env.SITE_HOST || host !== process.env.SITE_HOST) externalHosts.add(host);
      continue;
    }
    if (!url.startsWith('/')) {
      problems.push(`${where}: relative link "${url}" (the site uses absolute paths)`);
      continue;
    }
    const target = targetFor(url);
    if (!existsSync(target)) problems.push(`${where}: broken link "${url}"`);
  }
}

// Every drawer needs its JS-off still, and every still needs to be in the output.
const pieceDir = join(root, 'src', 'content', 'pieces');
for (const file of readdirSync(pieceDir).filter((f) => f.endsWith('.mdx'))) {
  const front = readFileSync(join(pieceDir, file), 'utf8');
  const still = front.match(/^still:\s*'([^']+)'/m)?.[1];
  if (!still) {
    problems.push(`${file}: no still declared`);
    continue;
  }
  if (!existsSync(join(dist, still))) problems.push(`${file}: still missing from dist (${still})`);
}

// The OG image every page points at must exist too.
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const og = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  if (!og) continue;
  const path = og.replace(/^https?:\/\/[^/]+/, '');
  if (!existsSync(join(dist, path))) {
    problems.push(`${page.replace(dist, '')}: og:image missing from dist (${path})`);
  }
}

const hosts = [...externalHosts];
console.log(`${pages.length} pages, ${files.length} files checked.`);
console.log(
  hosts.length === 0
    ? 'No absolute URLs at all.'
    : `Absolute URLs point only at: ${hosts.join(', ')}`
);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('Every internal link resolves. Every drawer has its still.');
