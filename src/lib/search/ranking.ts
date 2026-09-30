export interface SearchDocument {
  id: string;
  siteId: string;
  url: string;
  title: string | null;
  description: string | null;
  text: string;
  headings: string | null;
  publishedAt: Date | null;
  modifiedAt: Date | null;
}

export interface RankedResult {
  doc: SearchDocument;
  score: number;
  snippet: string;
}

export function rankDocuments(docs: SearchDocument[], query: string): RankedResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const results: RankedResult[] = [];

  for (const doc of docs) {
    let score = 0;
    const title = (doc.title || '').toLowerCase();
    const description = (doc.description || '').toLowerCase();
    const body = (doc.text || '').toLowerCase();
    const headings = (doc.headings || '').toLowerCase();

    for (const term of terms) {
      // 1. Title Exact & Partial Match (Highest Weight)
      if (title === query.toLowerCase()) score += 100;
      if (title.includes(term)) score += 35;

      // 2. Headings Match
      if (headings.includes(term)) score += 20;

      // 3. Description Match
      if (description.includes(term)) score += 15;

      // 4. Body Text Term Frequency
      const matches = (body.match(new RegExp(escapeRegexp(term), 'g')) || []).length;
      score += Math.min(matches * 2, 30);
    }

    // 5. Freshness boost
    if (doc.modifiedAt || doc.publishedAt) {
      const date = doc.modifiedAt || doc.publishedAt;
      if (date) {
        const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < 30) score += 10;
        else if (ageDays < 180) score += 5;
      }
    }

    if (score > 0) {
      results.push({
        doc,
        score,
        snippet: '',
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}

function escapeRegexp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
