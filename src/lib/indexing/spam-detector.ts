export interface SpamAnalysisResult {
  spamScore: number; // 0 to 100
  isSpam: boolean;
  reasons: string[];
}

export function analyzePageSpam(html: string, bodyText: string): SpamAnalysisResult {
  let spamScore = 0;
  const reasons: string[] = [];

  // 1. Check for Hidden Text (display:none, visibility:hidden, opacity:0)
  const hiddenTextMatches = html.match(/style=["'][^"']*(display:\s*none|visibility:\s*hidden|opacity:\s*0)[^"']*["']/gi);
  if (hiddenTextMatches && hiddenTextMatches.length > 3) {
    spamScore += 30;
    reasons.push('كشف نصوص مخفية داخل كود الـ HTML');
  }

  // 2. Keyword Stuffing Detection
  const words = bodyText.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const totalWords = words.length;

  if (totalWords > 50) {
    const wordCounts: Record<string, number> = {};
    let maxFrequency = 0;

    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > maxFrequency) {
        maxFrequency = wordCounts[word];
      }
    }

    const keywordRatio = maxFrequency / totalWords;
    if (keywordRatio > 0.12) { // More than 12% repetition of a single word
      spamScore += 40;
      reasons.push('حشو مفرط للكلمات المفتاحية (Keyword Stuffing)');
    }
  }

  // 3. Excessive Ad Script Checks
  const adMatches = html.match(/(googlesyndication|doubleclick|popunder|adsterra)/gi);
  if (adMatches && adMatches.length > 8) {
    spamScore += 25;
    reasons.push('إعلانات ونوافذ منبثقة بكثافة عالية جداً');
  }

  return {
    spamScore: Math.min(spamScore, 100),
    isSpam: spamScore >= 50,
    reasons,
  };
}
