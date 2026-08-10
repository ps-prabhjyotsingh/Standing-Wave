import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// The deployed domain is a placeholder and lives nowhere in the source.
// Canonical URLs, the sitemap and the feed all derive from SITE_URL at build time.
const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  // Never inline stylesheets: it keeps every byte of CSS in a file the CSP can
  // allow by origin, so style-src stays 'self' with no unsafe-inline anywhere.
  build: { format: 'directory', inlineStylesheets: 'never' },
  integrations: [mdx(), sitemap()],
  markdown: {
    smartypants: true,
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
  devToolbar: { enabled: false },
});
