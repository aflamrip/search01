import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const sitemapUrl = new URL('sitemap.xml', site || 'https://searchengineplatform.dev').href;

  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${sitemapUrl}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
