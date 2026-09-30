import { describe, it, expect } from 'vitest';
import { rankDocuments, type SearchDocument } from '../src/lib/search/ranking';

describe('BM25 Lexical Ranking Engine Tests', () => {
  const mockDocs: SearchDocument[] = [
    {
      id: '1',
      siteId: 's1',
      url: 'https://astro.build',
      title: 'Astro 7 Framework',
      description: 'Astro web framework',
      text: 'Astro is a modern web framework for content driven websites.',
      headings: 'Astro Framework',
      publishedAt: new Date(),
      modifiedAt: new Date(),
    },
    {
      id: '2',
      siteId: 's1',
      url: 'https://svelte.dev',
      title: 'Svelte 5 Runes',
      description: 'Svelte web framework',
      text: 'Svelte 5 introduces runes for reactivity.',
      headings: 'Svelte Runes',
      publishedAt: new Date(),
      modifiedAt: new Date(),
    },
  ];

  it('should rank exact title matches higher using BM25 field boosting', () => {
    const results = rankDocuments(mockDocs, 'Astro');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].doc.id).toBe('1');
    expect(results[0].bm25Score).toBeGreaterThan(0);
  });
});
