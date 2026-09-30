import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('webmaster_session', { path: '/' });
  return redirect('/login');
};
