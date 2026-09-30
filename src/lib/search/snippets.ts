export function generateSnippet(text: string, query: string, maxLength: number = 160): string {
  if (!text || !query) return text ? text.slice(0, maxLength) + '...' : '';

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lowerText = text.toLowerCase();

  let bestIndex = -1;
  for (const term of terms) {
    const idx = lowerText.indexOf(term);
    if (idx !== -1) {
      bestIndex = idx;
      break;
    }
  }

  if (bestIndex === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, bestIndex - Math.floor(maxLength / 3));
  const end = Math.min(text.length, start + maxLength);

  let snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

  // Highlight matched terms
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    snippet = snippet.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-slate-100 font-semibold px-0.5 rounded">$1</mark>');
  }

  return snippet;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
