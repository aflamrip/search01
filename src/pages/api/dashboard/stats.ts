import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { sites, pages, sitemaps, searchEvents } from '@schema';
import { count, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  const db = getDb(locals.runtime.env.DB);

  try {
    const totalSitesRes = await db.select({ count: count() }).from(sites);
    const totalPagesRes = await db.select({ count: count() }).from(pages);
    const totalSitemapsRes = await db.select({ count: count() }).from(sitemaps);
    const zeroResultsRes = await db.select({ count: count() }).from(searchEvents).where(eq(searchEvents.isZeroResult, true));

    return new Response(
      JSON.stringify({
        totalSites: totalSitesRes[0]?.count || 0,
        totalPagesIndexed: totalPagesRes[0]?.count || 0,
        totalSitemaps: totalSitemapsRes[0]?.count || 0,
        zeroResultQueries: zeroResultsRes[0]?.count || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
