import robotsParser from 'robots-parser';

export async function isUrlAllowedByRobots(
  targetUrl: string,
  userAgent: string = 'SearchEngineBot/1.0',
  kvCache?: KVNamespace
): Promise<boolean> {
  try {
    const urlObj = new URL(targetUrl);
    const robotsUrl = `${urlObj.protocol}//${urlObj.hostname}/robots.txt`;
    const cacheKey = `robots:${urlObj.hostname}`;

    let robotsTxtContent: string | null = null;

    // 1. Check KV Cache
    if (kvCache) {
      robotsTxtContent = await kvCache.get(cacheKey);
    }

    // 2. Fetch if not cached
    if (robotsTxtContent === null) {
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(5000),
      });

      robotsTxtContent = response.ok ? await response.text() : '';

      // Cache robots.txt for 24 hours
      if (kvCache) {
        await kvCache.put(cacheKey, robotsTxtContent, { expirationTtl: 86400 });
      }
    }

    if (!robotsTxtContent) {
      return true; // Default allow if robots.txt doesn't exist
    }

    const robots = robotsParser(robotsUrl, robotsTxtContent);
    return robots.isAllowed(targetUrl, userAgent) ?? true;
  } catch {
    return true; // Allow by default if fetch fails
  }
}
