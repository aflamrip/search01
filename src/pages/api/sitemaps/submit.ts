import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { sitemaps, sites } from '@schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { siteId, sitemapUrl } = await request.json();

    if (!siteId || !sitemapUrl) {
      return new Response(JSON.stringify({ error: 'معرف الموقع ورابط خريطة الموقع مطلوبان' }), { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);
    const siteRows = await db.select().from(sites).where(eq(sites.id, siteId));
    if (siteRows.length === 0) {
      return new Response(JSON.stringify({ error: 'الموقع غير موجود' }), { status: 404 });
    }

    const sitemapId = crypto.randomUUID();

    // Insert Sitemap record
    await db.insert(sitemaps).values({
      id: sitemapId,
      siteId,
      url: sitemapUrl,
      type: 'sitemap',
      status: 'pending',
    });

    // Send async job message to Cloudflare Queue (SITEMAP_QUEUE)
    if (locals.runtime?.env?.SITEMAP_QUEUE) {
      await locals.runtime.env.SITEMAP_QUEUE.send({
        sitemapId,
        siteId,
        url: sitemapUrl,
        timestamp: Date.now(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إضافة خريطة الموقع وبدء معالجتها في الخلفية بواسطة Cloudflare Queues',
        sitemapId,
      }),
      { status: 202 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
