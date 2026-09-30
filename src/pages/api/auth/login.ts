import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '../../../lib/auth/session';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }), { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb(locals.runtime.env.DB);

    const userRows = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (userRows.length === 0) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }), { status: 401 });
    }

    const user = userRows[0];
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }), { status: 401 });
    }

    // Set secure HTTP-only session cookie
    cookies.set('webmaster_session', user.id, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      }),
      { status: 200 }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'حدث خطأ أثناء تسجيل الدخول' }), { status: 500 });
  }
};
