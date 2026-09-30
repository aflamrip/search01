import type { APIRoute } from 'astro';
import { getDb, getCloudflareEnv } from '../../../lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  const currentUser = (context.locals as any).user;
  if (!currentUser || currentUser.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'صلاحية المدير المطلوب غير متوفرة' }), { status: 403 });
  }

  const cfEnv = getCloudflareEnv(context);
  const db = getDb(cfEnv.DB);

  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    }).from(users);

    return new Response(JSON.stringify({ users: allUsers }), { status: 200 });
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
    const { userId, role, status } = await context.request.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'معرف المستخدم مطلوب' }), { status: 400 });
    }

    await db.update(users).set({
      ...(role && { role }),
      ...(status && { status }),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    return new Response(JSON.stringify({ success: true, message: 'تم تحديث بيانات المستخدم بنجاح' }));
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
