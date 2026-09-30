import { parseSitemapXml } from '../lib/sitemap/xml-parser';
import { getDb } from '../lib/db/client';
import { sitemaps, sitemapUrls } from '@schema';
import { eq } from 'drizzle-orm';

export interface SitemapMessage {
  sitemapId: string;
  siteId: string;
  url: string;
}

export async function handleSitemapQueueMessage(batch: MessageBatch<SitemapMessage>, env: any) {
  const db = getDb(env.DB);

  for (const message of batch.messages) {
    const { sitemapId, siteId, url } = message.body;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SearchEngineBot-SitemapParser/1.0' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        await db.update(sitemaps).set({ status: 'error', lastError: `HTTP ${response.status}` }).where(eq(sitemaps.id, sitemapId));
        message.ack();
        continue;
      }

      const xmlText = await response.text();
      const parsed = parseSitemapXml(xmlText);

      // Save discovered URLs
      const urlRecords = [];
      for (const entry of parsed.urls) {
        const id = crypto.randomUUID();
        urlRecords.push({
          id,
          sitemapId,
          url: entry.url,
          lastmod: entry.lastmod,
          changefreq: entry.changefreq,
          priority: entry.priority,
          status: 'discovered' as const,
        });

        // Enqueue URL to CRAWL_QUEUE
        if (env.CRAWL_QUEUE) {
          await env.CRAWL_QUEUE.send({
            sitemapUrlId: id,
            siteId,
            url: entry.url,
          });
        }
      }

      if (urlRecords.length > 0) {
        await db.insert(sitemapUrls).values(urlRecords);
      }

      await db
        .update(sitemaps)
        .set({
          status: 'completed',
          urlCount: urlRecords.length,
          lastFetchedAt: new Date(),
          lastSuccessAt: new Date(),
        })
        .where(eq(sitemaps.id, sitemapId));

      message.ack();
    } catch (error: any) {
      await db.update(sitemaps).set({ status: 'error', lastError: error.message }).where(eq(sitemaps.id, sitemapId));
      message.retry();
    }
  }
}
