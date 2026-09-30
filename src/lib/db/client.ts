import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@schema';

export function getCloudflareEnv(context: any): any {
  // Astro 7 + @astrojs/cloudflare v14 binding resolution
  if (context?.locals?.env) return context.locals.env;
  if (context?.locals?.runtime?.env) return context.locals.runtime.env;
  if ((globalThis as any).env) return (globalThis as any).env;
  return process.env;
}

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
