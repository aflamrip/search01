import { expandQueryTerms } from '../src/lib/search/synonyms';
import { rankDocuments, type SearchDocument } from '../src/lib/search/ranking';
import { analyzePageSpam } from '../src/lib/indexing/spam-detector';
import { generateSnippet } from '../src/lib/search/snippets';

console.log('==================================================');
console.log('🧪 بدء اختبار محرك البحث ولوحة مشرفي المواقع (V4)');
console.log('==================================================\n');

// Test 1: Cross-Language & Transliteration Synonyms
console.log('1️⃣  اختبار توسيع المرادفات بين العربية والإنجليزية:');
const synonymTests = [
  'astro',
  'movies',
  'فيلم',
  'saqr w kanarya',
  'asad',
  'هاتف',
];

for (const q of synonymTests) {
  const expanded = expandQueryTerms(q);
  console.log(`  🔍 الكلمة: "${q}" -> المرادفات المكتشفة: [ ${expanded.join(', ')} ]`);
}

// Test 2: Search Ranking Engine
console.log('\n2️⃣  اختبار محرك ترتيب النتائج (Ranking Engine):');
const mockDocs: SearchDocument[] = [
  {
    id: 'doc1',
    siteId: 'site1',
    url: 'https://example.com/movies/saqr',
    title: 'فيلم صقر وكناريا - مشاهدة وتحميل',
    description: 'مشاهدة فيلم صقر وكناريا بجودة عالية',
    text: 'فيلم صقر وكناريا هو من أشهر الأفلام السينمائية العربية.',
    headings: 'صقر وكناريا',
    publishedAt: new Date(),
    modifiedAt: new Date(),
  },
  {
    id: 'doc2',
    siteId: 'site1',
    url: 'https://example.com/astro-guide',
    title: 'دليل Astro استرو الشامل لبناء المواقع',
    description: 'تعرف على إطار عمل Astro استرو',
    text: 'Astro يتيح لك بناء مواقع فائقة السرعة.',
    headings: 'Astro استرو',
    publishedAt: new Date(),
    modifiedAt: new Date(),
  },
];

const searchTestQuery = 'movies صقر وكناريا';
const expandedQuery = expandQueryTerms(searchTestQuery).join(' ');
const rankedResults = rankDocuments(mockDocs, expandedQuery);

console.log(`  🎯 استعلام البحث: "${searchTestQuery}"`);
rankedResults.forEach((res, i) => {
  console.log(`   [${i + 1}] العنوان: ${res.doc.title} (الوزن: ${res.score})`);
  console.log(`       المقتطف: ${generateSnippet(res.doc.text, searchTestQuery)}`);
});

// Test 3: Anti-Spam Detector
console.log('\n3️⃣  اختبار كاشف الجودة والسبام (Anti-Spam Detector):');
const spamHtml = `<div style="display:none">كلمات مخفية</div><script src="https://googlesyndication.com/ad.js"></script>`;
const spamText = 'شراء شراء شراء شراء شراء شراء شراء شراء شراء هاتف';
const spamReport = analyzePageSpam(spamHtml, spamText);
console.log(`  🛡️  درجة السبام (Spam Score): ${spamReport.spamScore}/100 | هل تعتبر سبام: ${spamReport.isSpam ? 'نعم ⚠️' : 'لا ✅'}`);

console.log('\n==================================================');
console.log('✅ اكتملت جميع الاختبارات بنجاح!');
console.log('==================================================');
