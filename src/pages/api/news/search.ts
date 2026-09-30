import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { pages, pageContents } from '@schema';
import { eq, gte } from 'drizzle-orm';
import { rankDocuments, type SearchDocument } from '../../../lib/search/ranking';
import { generateSnippet } from '../../../lib/search/snippets';
import { expandQueryTerms } from '../../../lib/search/synonyms';

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q') || '';
  if (!query.trim()) {
    return new Response(JSON.stringify({ news: [] }), { status: 200 });
  }

  const db = getDb(locals.runtime.env.DB);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Expand query with synonyms
    const expandedTerms = expandQueryTerms(query);
    const searchQuery = expandedTerms.join(' ');

    const recentPages = await db
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
      .innerJoin(pageContents, eq(pages.id, pageContents.pageId))
      .where(gte(pages.firstSeenAt, thirtyDaysAgo));

    const ranked = rankDocuments(recentPages as SearchDocument[], searchQuery);

    const newsResults = ranked.map((r) => ({
      id: r.doc.id,
      url: r.doc.url,
      title: r.doc.title,
      description: r.doc.description,
      snippet: generateSnippet(r.doc.text, query),
      publishedAt: r.doc.publishedAt || r.doc.modifiedAt,
      score: r.score,
    }));

    return new Response(JSON.stringify({ news: newsResults }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ news: [], error: error.message }), { status: 500 });
  }
};
