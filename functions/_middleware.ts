import type { PagesFunction } from '@cloudflare/workers-types';

const origin = 'https://masterkanorcase.online';

// Register public, canonical pages here when publishing or removing them.
const publicPages = new Map([
  ['/', [
    '# Master Kanor Case',
    '',
    'A private portal for controlled case review.',
    '',
    'The public gateway provides secure sign-in for authorized reviewers. Reviewers can access the cases, documents, and actions assigned to their accounts.',
    '',
    '[Authorized sign in](https://masterkanorcase.online/auth)',
  ].join('\n') + '\n'],
]);

function acceptsMarkdown(accept: string): boolean {
  return accept.split(',').some((entry) => {
    const [type, ...params] = entry.trim().toLowerCase().split(';');
    const quality = params.find((param) => param.trim().startsWith('q='));
    const weight = quality === undefined ? 1 : Number(quality.trim().slice(2));
    return type.trim() === 'text/markdown' && weight > 0 && weight <= 1;
  });
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const { pathname } = new URL(request.url);
  const readable = request.method === 'GET' || request.method === 'HEAD';
  if (readable && pathname === '/sitemap.xml') {
    const entries = [...publicPages.keys()].map((path) =>
      `  <url><loc>${escapeXml(new URL(path, origin).href)}</loc></url>`
    );
    const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries, '</urlset>', ''].join('\n');
    return new Response(request.method === 'HEAD' ? null : xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.append('Link', '</.well-known/api-catalog>; rel="api-catalog", </.well-known/openid-configuration>; rel="service-desc"');
  const markdown = readable ? publicPages.get(pathname) : undefined;
  if (markdown && response.status === 200 && headers.get('Content-Type')?.startsWith('text/html')) {
    headers.append('Vary', 'Accept');
    if (acceptsMarkdown(request.headers.get('Accept') ?? '')) {
      for (const name of ['Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified', 'Accept-Ranges']) {
        headers.delete(name);
      }
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      return new Response(request.method === 'HEAD' ? null : markdown, { headers });
    }
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
