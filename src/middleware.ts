import { defineMiddleware } from 'astro:middleware';
import { getDb, getCloudflareEnv } from './lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';

const PROTECTED_ROUTES = ['/dashboard'];
const GUEST_ONLY_ROUTES = ['/login', '/signup'];
const SUPER_ADMIN_ROUTES = ['/dashboard/admin'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const sessionUserId = context.cookies.get('webmaster_session')?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
  const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  let isAuthenticated = false;
  let currentUser: any = null;

  if (sessionUserId) {
    try {
      const cfEnv = getCloudflareEnv(context);
      const db = getDb(cfEnv.DB);
      const userRows = await db.select().from(users).where(eq(users.id, sessionUserId));
      if (userRows.length > 0) {
        isAuthenticated = true;
        currentUser = userRows[0];
        context.locals.user = currentUser;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect unauthenticated users from protected routes
  if (isProtected && !isAuthenticated) {
    return context.redirect('/login?redirect=' + encodeURIComponent(pathname));
  }

  // Super Admin Role Check for /dashboard/admin
  if (isSuperAdminRoute && currentUser?.role !== 'super_admin') {
    return context.redirect('/dashboard');
  }

  // Redirect logged-in users away from guest routes
  if (isGuestOnly && isAuthenticated) {
    return context.redirect('/dashboard');
  }

  return next();
});
