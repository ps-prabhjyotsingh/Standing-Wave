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
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
  markdown: {
    smartypants: true,
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
  devToolbar: { enabled: false },
});
