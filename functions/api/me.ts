import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_shared/supabase';
import { json, requireAuth } from '../_shared/supabase';

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return json(request, env, null, 204);
  if (request.method !== 'GET') return json(request, env, { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }, 405);
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  return json(request, env, { userId: auth.userId, email: auth.email, profile: auth.profile, permissions: auth.permissions });
};
