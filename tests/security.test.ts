import { describe, it, expect } from 'vitest';
import { SearchQuerySchema, SiteAddSchema } from '../src/lib/security/schemas';
import { generateSnippet } from '../src/lib/search/snippets';

describe('V4 Blueprint Enhancements Test Suite', () => {
  it('should validate search params using Zod schema', () => {
    const valid = SearchQuerySchema.safeParse({ q: 'astro', page: '2', limit: '20' });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.page).toBe(2);
      expect(valid.data.limit).toBe(20);
    }

    const invalid = SearchQuerySchema.safeParse({ q: '' });
    expect(invalid.success).toBe(false);
  });

  it('should validate domain formatting using SiteAddSchema', () => {
    expect(SiteAddSchema.safeParse({ domain: 'astro.build', ownerId: '123' }).success).toBe(true);
    expect(SiteAddSchema.safeParse({ domain: 'not-a-domain', ownerId: '123' }).success).toBe(false);
  });

  it('should sanitize snippet HTML to prevent XSS while preserving <mark> highlighting', () => {
    const snippet = generateSnippet('Astro framework <script>alert(1)</script>', 'astro');
    expect(snippet).toContain('<mark');
    expect(snippet).not.toContain('<script>');
  });
});
