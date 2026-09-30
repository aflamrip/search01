import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db/client';
import { pages, pageContents } from '@schema';
import { eq } from 'drizzle-orm';
import { rankDocuments, type SearchDocument } from '../../lib/search/ranking';
import { generateSnippet } from '../../lib/search/snippets';

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  if (!query.trim()) {
    return new Response(JSON.stringify({ results: [], total: 0, timeMs: 0 }), { status: 200 });
  }

  const startTime = Date.now();
  const cacheKey = `search:v1:${encodeURIComponent(query.trim().toLowerCase())}:${page}:${limit}`;

  // 1. Check Cloudflare KV Cache
  if (locals.runtime?.env?.CACHE_KV) {
    const cached = await locals.runtime.env.CACHE_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.cached = true;
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
        },
      });
    }
  }

  // 2. Query D1 Database
  const db = getDb(locals.runtime.env.DB);
  const allPages = await db
    .select({
      id: pages.id,
      siteId: pages.siteId,
      url: pages.url,
      title: pages.title,
      description: pages.description,
      text: pageContents.text,
      headings: pageContents.headings,
      publishedAt: pages.publishedAt,
      modifiedAt: pages.modifiedAt,
    })
    .from(pages)
    .innerJoin(pageContents, eq(pages.id, pageContents.pageId));

  // 3. Rank Candidates
  const ranked = rankDocuments(allPages as SearchDocument[], query);

  // 4. Paginate & Generate Snippets
  const offset = (page - 1) * limit;
  const paginated = ranked.slice(offset, offset + limit);

  const formattedResults = paginated.map((r) => ({
    id: r.doc.id,
    url: r.doc.url,
    title: r.doc.title,
    description: r.doc.description,
    snippet: generateSnippet(r.doc.text, query),
    score: r.score,
    publishedAt: r.doc.publishedAt,
  }));

  const responseBody = {
    results: formattedResults,
    total: ranked.length,
    page,
    limit,
    timeMs: Date.now() - startTime,
    cached: false,
  };

  // Save result to KV Cache asynchronously (5 minute TTL)
  if (locals.runtime?.env?.CACHE_KV) {
    locals.runtime.env.CACHE_KV.put(cacheKey, JSON.stringify(responseBody), { expirationTtl: 300 });
  }

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
};
