import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { sites, siteVerifications } from '@schema';
import { eq } from 'drizzle-orm';
import { verifyDomainHtmlFile } from '../../../lib/auth/verification';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { siteId } = await request.json();
    if (!siteId) {
      return new Response(JSON.stringify({ error: 'معرف الموقع مطلوب' }), { status: 400 });
    }

    const db = getDb(locals.runtime.env.DB);
    const siteRows = await db.select().from(sites).where(eq(sites.id, siteId));
    if (siteRows.length === 0) {
      return new Response(JSON.stringify({ error: 'الموقع غير موجود' }), { status: 404 });
    }
    const site = siteRows[0];

    const verificationRows = await db.select().from(siteVerifications).where(eq(siteVerifications.siteId, siteId));
    if (verificationRows.length === 0) {
      return new Response(JSON.stringify({ error: 'بيانات التحقق غير موجودة' }), { status: 404 });
    }
    const verification = verificationRows[0];

    const result = await verifyDomainHtmlFile(site.domain, verification.token);

    if (result.success) {
      await db.update(sites).set({ verificationStatus: 'verified', status: 'active', updatedAt: new Date() }).where(eq(sites.id, siteId));
      await db.update(siteVerifications).set({ status: 'verified', verifiedAt: new Date() }).where(eq(siteVerifications.id, verification.id));

      return new Response(JSON.stringify({ success: true, message: 'تم التحقق وتنشيط الموقع بنجاح' }));
    } else {
      await db.update(sites).set({ verificationStatus: 'failed', updatedAt: new Date() }).where(eq(sites.id, siteId));
      await db.update(siteVerifications).set({ status: 'failed' }).where(eq(siteVerifications.id, verification.id));

      return new Response(JSON.stringify({ success: false, error: result.message }), { status: 400 });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
