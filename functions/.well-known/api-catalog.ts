import type { PagesFunction } from '@cloudflare/workers-types';

const catalog = {
  linkset: [
    {
      anchor: 'https://masterkanorcase.online/api',
      'service-desc': [
        {
          href: 'https://masterkanorcase.online/openapi.json',
          type: 'application/vnd.oai.openapi+json;version=3.1',
        },
      ],
      'service-doc': [
        {
          href: 'https://masterkanorcase.online/api-docs.html',
        },
      ],
      status: [
        {
          href: 'https://masterkanorcase.online/api/health',
        },
      ],
    },
  ],
};

export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify(catalog), {
    status: 200,
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};