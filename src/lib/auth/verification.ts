export async function verifyDomainHtmlFile(domain: string, token: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUrl = `http://${domain}/${token}.html`;
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'SearchEngineBot-Verifier/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { success: false, message: `لم يتم العثور على الملف. كود الاستجابة: ${response.status}` };
    }

    const text = await response.text();
    if (text.trim().includes(token)) {
      return { success: true, message: 'تم التثبت من ملكية الموقع عبر ملف HTML بنجاح' };
    }

    return { success: false, message: 'ملف التثبت لا يحتوي على الرمز الصحيح' };
  } catch (error: any) {
    return { success: false, message: `تعذر الاتصال بالموقع: ${error.message || 'خطأ غير معروف'}` };
  }
}

export async function verifyDomainMetaTag(domain: string, token: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetUrl = `http://${domain}`;
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'SearchEngineBot-Verifier/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { success: false, message: `تعذر الوصول للصفحة الرئيسية. كود الاستجابة: ${response.status}` };
    }

    const html = await response.text();
    const metaRegex = new RegExp(`<meta[^>]*name=["']search-engine-verification["'][^>]*content=["']${token}["']`, 'i');

    if (metaRegex.test(html)) {
      return { success: true, message: 'تم التثبت من ملكية الموقع عبر Meta Tag بنجاح' };
    }

    return { success: false, message: 'لم يتم العثور على wوسم Meta Tag المطلوب في الصفحة الرئيسية' };
  } catch (error: any) {
    return { success: false, message: `تعذر الاتصال بالموقع: ${error.message || 'خطأ غير معروف'}` };
  }
}
