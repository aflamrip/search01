import { defineMiddleware } from 'astro:middleware';
import { getDb } from './lib/db/client';
import { users } from '@schema';
import { eq } from 'drizzle-orm';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard'];

// Routes only for guests (redirect logged-in users away)
const GUEST_ONLY_ROUTES = ['/login', '/signup'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const sessionUserId = context.cookies.get('webmaster_session')?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

  // Verify session exists in DB
  let isAuthenticated = false;
  if (sessionUserId) {
    try {
      const db = getDb(context.locals.runtime.env.DB);
      const userRows = await db.select({ id: users.id }).from(users).where(eq(users.id, sessionUserId));
      isAuthenticated = userRows.length > 0;
    } catch {
      // DB error — treat as unauthenticated
      isAuthenticated = false;
    }
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !isAuthenticated) {
    return context.redirect('/login?redirect=' + encodeURIComponent(pathname));
  }

  // Redirect already-logged-in users away from login/signup
  if (isGuestOnly && isAuthenticated) {
    return context.redirect('/dashboard');
  }

  return next();
});
