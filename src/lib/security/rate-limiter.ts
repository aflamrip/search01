export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export async function checkRateLimit(
  key: string,
  limit: number = 60,
  windowSeconds: number = 60,
  kvCache?: KVNamespace
): Promise<RateLimitResult> {
  if (!kvCache) {
    return { allowed: true, remaining: limit, resetSeconds: windowSeconds };
  }

  const rateKey = `ratelimit:${key}`;

  try {
    const raw = await kvCache.get(rateKey);
    const count = raw ? parseInt(raw, 10) : 0;

    if (count >= limit) {
      return { allowed: false, remaining: 0, resetSeconds: windowSeconds };
    }

    const newCount = count + 1;
    await kvCache.put(rateKey, newCount.toString(), { expirationTtl: windowSeconds });

    return {
      allowed: true,
      remaining: limit - newCount,
      resetSeconds: windowSeconds,
    };
  } catch {
    return { allowed: true, remaining: limit, resetSeconds: windowSeconds };
  }
}
