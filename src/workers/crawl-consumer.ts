import { normalizeUrl } from '../lib/crawler/url-normalizer';
import { computeContentHash } from '../lib/indexing/hash';
import { getDb } from '../lib/db/client';
import { pages, pageContents, sitemapUrls } from '@schema';
import { eq } from 'drizzle-orm';

export interface CrawlMessage {
  sitemapUrlId?: string;
  siteId: string;
  url: string;
}

export async function handleCrawlQueueMessage(batch: MessageBatch<CrawlMessage>, env: any) {
  const db = getDb(env.DB);

  for (const message of batch.messages) {
    const { sitemapUrlId, siteId, url: rawUrl } = message.body;
    const normalizedUrl = normalizeUrl(rawUrl);

    if (!normalizedUrl) {
      if (sitemapUrlId) {
        await db.update(sitemapUrls).set({ status: 'ignored' }).where(eq(sitemapUrls.id, sitemapUrlId));
      }
      message.ack();
      continue;
    }

    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'SearchEngineBot-Crawler/1.0 (+https://searchengineplatform.dev/bot)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
        if (sitemapUrlId) {
          await db.update(sitemapUrls).set({ status: 'failed' }).where(eq(sitemapUrls.id, sitemapUrlId));
        }
        message.ack();
        continue;
      }

      const html = await response.text();

      // Extract basic title & description
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : null;

      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const description = metaDescMatch ? metaDescMatch[1].trim() : null;

      // Extract body text (simplistic clean-up)
      const cleanText = html
        .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const contentHash = await computeContentHash(cleanText);
      const pageId = crypto.randomUUID();

      // Save page metadata
      await db.insert(pages).values({
        id: pageId,
        siteId,
        url: normalizedUrl,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || 'text/html',
        title,
        description,
        wordCount: cleanText.split(/\s+/).length,
        contentHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        lastCrawledAt: new Date(),
      });

      // Save page text content
      await db.insert(pageContents).values({
        pageId,
        text: cleanText,
        headings: JSON.stringify([]),
      });

      if (sitemapUrlId) {
        await db.update(sitemapUrls).set({ status: 'indexed' }).where(eq(sitemapUrls.id, sitemapUrlId));
      }

      message.ack();
    } catch (error: any) {
      if (sitemapUrlId) {
        await db.update(sitemapUrls).set({ status: 'failed' }).where(eq(sitemapUrls.id, sitemapUrlId));
      }
      message.retry();
    }
  }
}
