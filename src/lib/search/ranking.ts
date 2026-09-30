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
  bm25Score: number;
  freshnessBoost: number;
  snippet: string;
}

// BM25 Hyperparameters
const K1 = 1.2;
const B = 0.75;

export function rankDocuments(docs: SearchDocument[], query: string): RankedResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0 || docs.length === 0) return [];

  // Calculate average document length
  const totalDocLength = docs.reduce((acc, d) => acc + (d.text || '').length, 0);
  const avgdl = totalDocLength / docs.length || 1;

  const results: RankedResult[] = [];

  for (const doc of docs) {
    const title = (doc.title || '').toLowerCase();
    const description = (doc.description || '').toLowerCase();
    const body = (doc.text || '').toLowerCase();
    const headings = (doc.headings || '').toLowerCase();
    const docLength = body.length || 1;

    let bm25Score = 0;

    for (const term of terms) {
      // 1. Term frequency in fields
      const tfTitle = countOccurrences(title, term);
      const tfHeadings = countOccurrences(headings, term);
      const tfDesc = countOccurrences(description, term);
      const tfBody = countOccurrences(body, term);

      // Field Boosting Weights (Title x5, Headings x3, Description x2, Body x1)
      const weightedTf = tfTitle * 5.0 + tfHeadings * 3.0 + tfDesc * 2.0 + tfBody * 1.0;

      if (weightedTf > 0) {
        // Inverse Document Frequency (IDF) estimation
        const docCountWithTerm = docs.filter(
          (d) =>
            (d.title || '').toLowerCase().includes(term) ||
            (d.text || '').toLowerCase().includes(term)
        ).length;

        const idf = Math.log((docs.length - docCountWithTerm + 0.5) / (docCountWithTerm + 0.5) + 1);

        // BM25 Formula
        const termBm25 = idf * ((weightedTf * (K1 + 1)) / (weightedTf + K1 * (1 - B + B * (docLength / avgdl))));
        bm25Score += termBm25;
      }
    }

    // 2. Freshness Boost
    let freshnessBoost = 0;
    const date = doc.modifiedAt || doc.publishedAt;
    if (date) {
      const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 7) freshnessBoost = 15;
      else if (ageDays < 30) freshnessBoost = 10;
      else if (ageDays < 180) freshnessBoost = 5;
    }

    const totalScore = parseFloat((bm25Score + freshnessBoost).toFixed(2));

    if (totalScore > 0) {
      results.push({
        doc,
        score: totalScore,
        bm25Score: parseFloat(bm25Score.toFixed(2)),
        freshnessBoost,
        snippet: '',
      });
    }
  }

  // Sort descending by total score
  return results.sort((a, b) => b.score - a.score);
}

function countOccurrences(text: string, term: string): number {
  if (!text || !term) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(term, pos)) !== -1) {
    count++;
    pos += term.length;
  }
  return count;
}
