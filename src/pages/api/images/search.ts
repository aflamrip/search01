import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { media, pages } from '@schema';
import { eq, like } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, locals }) => {
  const query = url.searchParams.get('q') || '';
  if (!query.trim()) {
    return new Response(JSON.stringify({ images: [] }), { status: 200 });
  }

  const db = getDb(locals.runtime.env.DB);

  try {
    const results = await db
      .select({
        id: media.id,
        url: media.url,
        title: media.title,
        alt: media.alt,
        thumbnailUrl: media.thumbnailUrl,
        pageUrl: pages.url,
        pageTitle: pages.title,
      })
      .from(media)
      .innerJoin(pages, eq(media.pageId, pages.id))
      .where(like(media.title, `%${query}%`))
      .limit(20);

    return new Response(JSON.stringify({ images: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ images: [], error: error.message }), { status: 500 });
  }
};
