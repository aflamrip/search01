const SYNONYM_MAP: Record<string, string[]> = {
  // Cross-Language & Transliteration Mappings
  astro: ['استرو', 'أسترو'],
  استرو: ['astro', 'أسترو'],
  أسترو: ['astro', 'استرو'],
  movie: ['فيلم', 'افلام', 'فلم', 'movies'],
  movies: ['افلام', 'أفلام', 'فيلم', 'فلم', 'movie'],
  فيلم: ['movie', 'movies', 'فلم', 'افلام'],
  افلام: ['movies', 'movie', 'أفلام', 'فيلم'],
  فلم: ['movie', 'movies', 'فيلم', 'افلام'],
  asad: ['اسد', 'أسد', 'lion'],
  اسد: ['asad', 'أسد', 'lion'],
  أسد: ['asad', 'اسد', 'lion'],
  saqr: ['صقر', 'falcon'],
  صقر: ['saqr', 'falcon'],
  kanarya: ['كناريا', 'كناري'],
  كناريا: ['kanarya', 'كناري'],

  // Technology & Search Mappings
  هاتف: ['جوال', 'موبايل', 'محمول', 'phone', 'mobile'],
  جوال: ['هاتف', 'موبايل', 'محمول', 'phone', 'mobile'],
  موبايل: ['هاتف', 'جوال', 'محمول', 'phone', 'mobile'],
  سيارة: ['مركبة', 'عربة', 'car', 'auto'],
  مركبة: ['سيارة', 'عربة', 'car'],
  ذكاء: ['الذكاء', 'ai', 'artificial intelligence'],
  حاسوب: ['كمبيوتر', 'حاسب', 'computer', 'laptop'],
  كمبيوتر: ['حاسوب', 'حاسب', 'computer', 'pc'],
  برمجة: ['تكويد', 'تطوير', 'programming', 'coding'],
};

export function expandQueryTerms(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expandedSet = new Set<string>(terms);

  for (const term of terms) {
    if (SYNONYM_MAP[term]) {
      SYNONYM_MAP[term].forEach((syn) => expandedSet.add(syn));
    }
  }

  // Also handle full multi-word phrase mappings like "saqr w kanarya" -> "صقر وكناريا"
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.includes('saqr w kanarya') || normalizedQuery.includes('saqr kanarya')) {
    expandedSet.add('صقر');
    expandedSet.add('وكناريا');
    expandedSet.add('صقر وكناريا');
  }
  if (normalizedQuery.includes('صقر وكناريا') || normalizedQuery.includes('صقر كناريا')) {
    expandedSet.add('saqr');
    expandedSet.add('kanarya');
    expandedSet.add('saqr w kanarya');
  }

  return Array.from(expandedSet);
}
