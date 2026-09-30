CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`page_id` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`alt` text,
	`width` integer,
	`height` integer,
	`thumbnail_url` text,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `page_contents` (
	`page_id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`headings` text,
	`structured_data` text,
	FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`url` text NOT NULL,
	`canonical_url` text,
	`status_code` integer,
	`content_type` text,
	`title` text,
	`description` text,
	`language` text DEFAULT 'ar',
	`word_count` integer DEFAULT 0,
	`content_hash` text,
	`published_at` integer,
	`modified_at` integer,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_crawled_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_url_unique` ON `pages` (`url`);--> statement-breakpoint
CREATE INDEX `idx_pages_url` ON `pages` (`url`);--> statement-breakpoint
CREATE INDEX `idx_pages_site_id` ON `pages` (`site_id`);--> statement-breakpoint
CREATE TABLE `search_events` (
	`id` text PRIMARY KEY NOT NULL,
	`query` text NOT NULL,
	`results_count` integer NOT NULL,
	`latency_ms` integer NOT NULL,
	`is_zero_result` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_search_events_query` ON `search_events` (`query`);--> statement-breakpoint
CREATE INDEX `idx_search_events_zero` ON `search_events` (`is_zero_result`);--> statement-breakpoint
CREATE TABLE `site_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`method` text DEFAULT 'html_file' NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_at` integer,
	`expires_at` integer,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sitemap_urls` (
	`id` text PRIMARY KEY NOT NULL,
	`sitemap_id` text NOT NULL,
	`url` text NOT NULL,
	`lastmod` text,
	`changefreq` text,
	`priority` text,
	`status` text DEFAULT 'discovered' NOT NULL,
	FOREIGN KEY (`sitemap_id`) REFERENCES `sitemaps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sitemap_urls_sitemap_id` ON `sitemap_urls` (`sitemap_id`);--> statement-breakpoint
CREATE INDEX `idx_sitemap_urls_url` ON `sitemap_urls` (`url`);--> statement-breakpoint
CREATE TABLE `sitemaps` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`url` text NOT NULL,
	`type` text DEFAULT 'sitemap' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`last_fetched_at` integer,
	`last_success_at` integer,
	`last_error` text,
	`url_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`verification_status` text DEFAULT 'unverified' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_crawled_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sites_domain_unique` ON `sites` (`domain`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'webmaster' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);