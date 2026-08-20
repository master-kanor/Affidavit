import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../_shared/supabase';

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  return new Response(JSON.stringify({ ok: true, service: 'master-kanor-case-portal' }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
};
