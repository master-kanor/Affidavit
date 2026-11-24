import type { PagesFunction } from '@cloudflare/workers-types';

const metadata = {
  resource: 'https://masterkanorcase.online',
  authorization_servers: ['https://masterkanorcase.online'],
  scopes_supported: ['openid', 'profile', 'email'],
  bearer_methods_supported: ['header'],
};

export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};