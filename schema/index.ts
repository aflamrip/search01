import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// 1. Users Table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['super_admin', 'admin', 'webmaster'] }).default('webmaster').notNull(),
  status: text('status', { enum: ['active', 'suspended'] }).default('active').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// 2. Sites Table
export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  status: text('status', { enum: ['active', 'disabled', 'pending'] }).default('pending').notNull(),
  verificationStatus: text('verification_status', { enum: ['verified', 'unverified', 'failed'] }).default('unverified').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  lastCrawledAt: integer('last_crawled_at', { mode: 'timestamp' }),
});

// 3. Site Verification Table
export const siteVerifications = sqliteTable('site_verifications', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  method: text('method', { enum: ['html_file', 'meta_tag', 'dns_txt'] }).default('html_file').notNull(),
  token: text('token').notNull(),
  status: text('status', { enum: ['pending', 'verified', 'failed'] }).default('pending').notNull(),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});

// 4. Sitemaps Table
export const sitemaps = sqliteTable('sitemaps', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  url: text('url').notNull(),
  type: text('type', { enum: ['sitemap', 'sitemap_index', 'image_sitemap', 'video_sitemap', 'news_sitemap'] }).default('sitemap').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'error'] }).default('pending').notNull(),
  lastFetchedAt: integer('last_fetched_at', { mode: 'timestamp' }),
  lastSuccessAt: integer('last_success_at', { mode: 'timestamp' }),
  lastError: text('last_error'),
  urlCount: integer('url_count').default(0).notNull(),
});

// 5. Sitemap URLs Table
export const sitemapUrls = sqliteTable('sitemap_urls', {
  id: text('id').primaryKey(),
  sitemapId: text('sitemap_id').notNull().references(() => sitemaps.id),
  url: text('url').notNull(),
  lastmod: text('lastmod'),
  changefreq: text('changefreq'),
  priority: text('priority'),
  status: text('status', { enum: ['discovered', 'queued', 'crawled', 'indexed', 'failed', 'ignored'] }).default('discovered').notNull(),
}, (table) => ({
  sitemapIdx: index('idx_sitemap_urls_sitemap_id').on(table.sitemapId),
  urlIdx: index('idx_sitemap_urls_url').on(table.url),
}));

// 6. Pages Table
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  siteId: text('site_id').notNull().references(() => sites.id),
  url: text('url').notNull().unique(),
  canonicalUrl: text('canonical_url'),
  statusCode: integer('status_code'),
  contentType: text('content_type'),
  title: text('title'),
  description: text('description'),
  language: text('language').default('ar'),
  wordCount: integer('word_count').default(0),
  contentHash: text('content_hash'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  modifiedAt: integer('modified_at', { mode: 'timestamp' }),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).notNull(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).notNull(),
  lastCrawledAt: integer('last_crawled_at', { mode: 'timestamp' }),
}, (table) => ({
  urlIdx: index('idx_pages_url').on(table.url),
  siteIdx: index('idx_pages_site_id').on(table.siteId),
}));

// 7. Page Content (Fulltext & Indexed Data)
export const pageContents = sqliteTable('page_contents', {
  pageId: text('page_id').primaryKey().references(() => pages.id),
  text: text('text').notNull(),
  headings: text('headings'), // JSON stringified array of H1-H3
  structuredData: text('structured_data'), // JSON stringified
});

// 8. Media Table (Images/Videos)
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  pageId: text('page_id').notNull().references(() => pages.id),
  type: text('type', { enum: ['image', 'video'] }).notNull(),
  url: text('url').notNull(),
  title: text('title'),
  alt: text('alt'),
  width: integer('width'),
  height: integer('height'),
  thumbnailUrl: text('thumbnail_url'),
});

// 9. Search Analytics & Events Table (Phase 2 Addition)
export const searchEvents = sqliteTable('search_events', {
  id: text('id').primaryKey(),
  query: text('query').notNull(),
  resultsCount: integer('results_count').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  isZeroResult: integer('is_zero_result', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  queryIdx: index('idx_search_events_query').on(table.query),
  zeroIdx: index('idx_search_events_zero').on(table.isZeroResult),
}));
