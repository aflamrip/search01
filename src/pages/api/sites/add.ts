import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { sites, siteVerifications } from '@schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { domain, name, ownerId } = body;

    if (!domain || !ownerId) {
      return new Response(JSON.stringify({ error: 'الرجاء إدخال النطاق ومعرف المستخدم' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const db = getDb(locals.runtime.env.DB);

    // Check if domain exists
    const existing = await db.select().from(sites).where(eq(sites.domain, cleanDomain));
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'الموقع مسجل بالفعل في المحرك' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteId = crypto.randomUUID();
    const token = `verify_${crypto.randomUUID().replace(/-/g, '')}`;

    await db.insert(sites).values({
      id: siteId,
      ownerId,
      name: name || cleanDomain,
      domain: cleanDomain,
      status: 'pending',
      verificationStatus: 'unverified',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(siteVerifications).values({
      id: crypto.randomUUID(),
      siteId,
      method: 'html_file',
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return new Response(
      JSON.stringify({
        success: true,
        siteId,
        token,
        filename: `${token}.html`,
        instruction: `يرجى رفع ملف باسم ${token}.html محتواه ${token} إلى المجلد الرئيسي لموقعك ثم اضغط على زر التحقق.`,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'حدث خطأ في السيرفر' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
