import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db/client';
import { pages, searchEvents } from '@schema';
import { like, sql } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, locals }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }

  const cacheKey = `autocomplete:v1:${encodeURIComponent(query)}`;

  // 1. Check KV Cache for suggestions
  if (locals.runtime?.env?.CACHE_KV) {
    const cached = await locals.runtime.env.CACHE_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, s-maxage=600',
        },
      });
    }
  }

  const db = getDb(locals.runtime.env.DB);
  const suggestionsSet = new Set<string>();

  try {
    // A. Fetch matching queries from Search Analytics
    const popularQueries = await db
      .select({ query: searchEvents.query })
      .from(searchEvents)
      .where(like(searchEvents.query, `${query}%`))
      .groupBy(searchEvents.query)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    popularQueries.forEach((item) => suggestionsSet.add(item.query));

    // B. Fetch matching Page Titles
    const matchingPages = await db
      .select({ title: pages.title })
      .from(pages)
      .where(like(pages.title, `%${query}%`))
      .limit(5);

    matchingPages.forEach((item) => {
      if (item.title) suggestionsSet.add(item.title);
    });

    const suggestions = Array.from(suggestionsSet).slice(0, 7);
    const body = JSON.stringify({ suggestions });

    if (locals.runtime?.env?.CACHE_KV) {
      locals.runtime.env.CACHE_KV.put(cacheKey, body, { expirationTtl: 600 });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ suggestions: [], error: error.message }), { status: 500 });
  }
};
