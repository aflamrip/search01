import type { APIRoute } from 'astro';
import { getDb, getCloudflareEnv } from '../../../lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../lib/auth/session';
import { AuthSignupSchema } from '../../../lib/security/schemas';

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validation = AuthSignupSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0]?.message || 'بيانات إنشاء الحساب غير صالحة' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, password } = validation.data;
    const cleanEmail = email.toLowerCase().trim();

    let envBindings: any = null;
    try {
      // @ts-ignore - cloudflare:workers module in Cloudflare Workers
      const cfWorkers = await import('cloudflare:workers');
      envBindings = cfWorkers.env;
    } catch {
      envBindings = getCloudflareEnv(context);
    }

    if (!envBindings || !envBindings.DB) {
      envBindings = getCloudflareEnv(context);
    }

    const db = getDb(envBindings.DB);

    // Try executing users query with friendly fallback for unmigrated D1 database
    let existingUser: any[] = [];
    let allUsers: any[] = [];

    try {
      existingUser = await db.select().from(users).where(eq(users.email, cleanEmail));
      allUsers = await db.select({ id: users.id }).from(users);
    } catch (dbError: any) {
      if (dbError.message?.includes('no such table') || dbError.message?.includes('users')) {
        return new Response(
          JSON.stringify({
            error: 'جدول المستخدمين غير موجود في D1 بعد. يرجى تطبيق أمر D1 Migrations: npx wrangler d1 execute my-app --remote --file=./drizzle/migrations/0000_swift_sersi.sql',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw dbError;
    }

    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مسجل بالفعل' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First user created is automatically assigned 'super_admin', subsequent users become 'webmaster'
    const assignedRole = allUsers.length === 0 ? 'super_admin' : 'webmaster';

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name,
      passwordHash,
      role: assignedRole,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    const roleMessage = assignedRole === 'super_admin'
      ? 'تم إنشاء الحساب الأول بنجاح ورتبتك هي (مدير النظام الرئيسي — Super Admin).'
      : 'تم إنشاء حساب مشرف الموقع بنجاح. يمكنك الآن تسجيل الدخول.';

    return new Response(
      JSON.stringify({
        success: true,
        message: roleMessage,
        userId,
        role: assignedRole,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'حدث خطأ أثناء إنشاء الحساب' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
