import type { APIRoute } from 'astro';
import { getDb, getCloudflareEnv } from '../../../lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '../../../lib/auth/session';
import { AuthLoginSchema } from '../../../lib/security/schemas';

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const validation = AuthLoginSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error.errors[0]?.message || 'البريد الإلكتروني وكلمة المرور مطلوبان' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { email, password } = validation.data;
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

    const userRows = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (userRows.length === 0) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userRows[0];
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    context.cookies.set('webmaster_session', user.id, {
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
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'حدث خطأ أثناء تسجيل الدخول' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
