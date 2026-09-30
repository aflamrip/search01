/// <reference types="astro/client" />

// Cloudflare Workers type declarations for Astro 7 + @astrojs/cloudflare v14
// The adapter auto-augments App.Locals with `runtime` via its own d.ts
// We only extend it here with our custom bindings.

type D1Database = import('@cloudflare/workers-types').D1Database;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
type Queue<Body = unknown> = import('@cloudflare/workers-types').Queue<Body>;

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        CACHE_KV: KVNamespace;
        STORAGE_R2: R2Bucket;
        SITEMAP_QUEUE: Queue;
        CRAWL_QUEUE: Queue;
        INDEX_QUEUE: Queue;
      };
    };
  }
}
