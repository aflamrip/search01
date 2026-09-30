/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type D1Database = import('@cloudflare/workers-types').D1Database;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
type Queue = import('@cloudflare/workers-types').Queue;

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
