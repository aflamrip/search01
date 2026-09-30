import type { APIRoute } from 'astro';
import { getDb, getCloudflareEnv } from '../../../lib/db/client';
import { sites, users } from '@schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  const currentUser = (context.locals as any).user;
  if (!currentUser || currentUser.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'صلاحية المدير المطلوب غير متوفرة' }), { status: 403 });
  }

  const cfEnv = getCloudflareEnv(context);
  const db = getDb(cfEnv.DB);

  try {
    const allSites = await db
      .select({
        id: sites.id,
        name: sites.name,
        domain: sites.domain,
        status: sites.status,
        verificationStatus: sites.verificationStatus,
        ownerName: users.name,
        ownerEmail: users.email,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .innerJoin(users, eq(sites.ownerId, users.id));

    return new Response(JSON.stringify({ sites: allSites }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async (context) => {
  const currentUser = (context.locals as any).user;
  if (!currentUser || currentUser.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'صلاحية المدير المطلوب غير متوفرة' }), { status: 403 });
  }

  const cfEnv = getCloudflareEnv(context);
  const db = getDb(cfEnv.DB);

  try {
    const { siteId, status } = await context.request.json();
    if (!siteId || !status) {
      return new Response(JSON.stringify({ error: 'معرف الموقع والحالة مطلوبان' }), { status: 400 });
    }

    await db.update(sites).set({ status, updatedAt: new Date() }).where(eq(sites.id, siteId));

    return new Response(JSON.stringify({ success: true, message: 'تم تحديث حالة الموقع بنجاح' }));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
