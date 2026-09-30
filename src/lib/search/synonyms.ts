const SYNONYM_MAP: Record<string, string[]> = {
  هاتف: ['جوال', 'موبايل', 'محمول', 'phone', 'mobile'],
  جوال: ['هاتف', 'موبايل', 'محمول'],
  موبايل: ['هاتف', 'جوال', 'محمول'],
  سيارة: ['مركبة', 'عربة', 'car', 'auto'],
  مركبة: ['سيارة', 'عربة'],
  ذكاء: ['الذكاء', 'ai', 'artificial intelligence'],
  حاسوب: ['كمبيوتر', 'حاسب', 'computer', 'laptop'],
  كمبيوتر: ['حاسوب', 'حاسب', 'pc'],
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

  return Array.from(expandedSet);
}
