import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db/client';
import { pages, pageContents, searchEvents } from '@schema';
import { eq } from 'drizzle-orm';
import { rankDocuments, type SearchDocument } from '../../lib/search/ranking';
import { generateSnippet } from '../../lib/search/snippets';
import { SearchQuerySchema } from '../../lib/security/schemas';
import { checkRateLimit } from '../../lib/security/rate-limiter';

export const GET: APIRoute = async ({ url, locals, request }) => {
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. Rate Limiting Check (60 requests / minute)
  const rateLimit = await checkRateLimit(clientIp, 60, 60, locals.runtime?.env?.CACHE_KV);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: 'تم تجاوز كوتا الطلبات المسموحة. يرجى الانتظار دقيقة.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': rateLimit.resetSeconds.toString(),
      },
    });
  }

  // 2. Validate input using Zod
  const rawParams = {
    q: url.searchParams.get('q') || '',
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '10',
    type: url.searchParams.get('type') || 'web',
  };

  const validation = SearchQuerySchema.safeParse(rawParams);
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: validation.error.errors[0]?.message || 'مدخلات غير صالحة' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { q: query, page, limit } = validation.data;
  const startTime = Date.now();
  const cacheKey = `search:v1:${encodeURIComponent(query.trim().toLowerCase())}:${page}:${limit}`;

  // 3. Check KV Cache
  if (locals.runtime?.env?.CACHE_KV) {
    const cached = await locals.runtime.env.CACHE_KV.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed.cached = true;
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }
  }

  // 4. Retrieve & Rank Candidates
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

  const ranked = rankDocuments(allPages as SearchDocument[], query);

  const offset = (page - 1) * limit;
  const paginated = ranked.slice(offset, offset + limit);
  const latencyMs = Date.now() - startTime;

  const formattedResults = paginated.map((r) => ({
    id: r.doc.id,
    url: r.doc.url,
    title: r.doc.title,
    description: r.doc.description,
    snippet: generateSnippet(r.doc.text, query),
    score: r.score,
    publishedAt: r.doc.publishedAt,
  }));

  // 5. Log Search Event for Zero Results & Latency Analytics
  try {
    await db.insert(searchEvents).values({
      id: crypto.randomUUID(),
      query,
      resultsCount: ranked.length,
      latencyMs,
      isZeroResult: ranked.length === 0,
      createdAt: new Date(),
    });
  } catch {}

  const responseBody = {
    results: formattedResults,
    total: ranked.length,
    page,
    limit,
    timeMs: latencyMs,
    cached: false,
  };

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
