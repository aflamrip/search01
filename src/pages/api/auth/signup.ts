import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'جميع الحقول مطلوبة' }), { status: 400 });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }), { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb(locals.runtime.env.DB);

    const existingUser = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مسجل بالفعل' }), { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name,
      passwordHash,
      role: 'webmaster',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إنشاء حساب مشرف الموقع بنجاح. يمكنك الآن تسجيل الدخول.',
        userId,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'حدث خطأ في التسجيل' }), { status: 500 });
  }
};
