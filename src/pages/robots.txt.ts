import type { APIRoute } from 'astro';

// Built from SITE_URL so the deployed domain never appears in the source.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const body = `User-agent: *
Allow: /

# Nothing here is tracked, gated, or for sale. Read what you like.

Sitemap: ${sitemap}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
