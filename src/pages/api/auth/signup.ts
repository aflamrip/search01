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

    // Safe environment resolution for Astro 7 + Cloudflare adapter v14
    let envBindings: any = null;
    try {
      // @ts-ignore - cloudflare:workers module available in Cloudflare Workers environment
      const cfWorkers = await import('cloudflare:workers');
      envBindings = cfWorkers.env;
    } catch {
      envBindings = getCloudflareEnv(context);
    }

    if (!envBindings || !envBindings.DB) {
      envBindings = getCloudflareEnv(context);
    }

    const db = getDb(envBindings.DB);

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مسجل بالفعل' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // First user created is automatically assigned 'super_admin', subsequent users become 'webmaster'
    const allUsers = await db.select({ id: users.id }).from(users);
    const assignedRole = allUsers.length === 0 ? 'super_admin' : 'webmaster';

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name,
      passwordHash,
      role: assignedRole,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
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
