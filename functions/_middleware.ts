import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from './_shared/supabase';

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, '');
}

function htmlToMarkdown(html: string): string {
  let source = html;
  source = source.replace(/<script[\s\S]*?<\/script>/gi, '');
  source = source.replace(/<style[\s\S]*?<\/style>/gi, '');
  source = source.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  source = source.replace(/<footer[\s\S]*?<\/footer>/gi, '');

  for (let level = 1; level <= 6; level += 1) {
    const pattern = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'gi');
    source = source.replace(pattern, (_, text: string) => {
      return `\n${'#'.repeat(level)} ${stripTags(text).trim()}\n`;
    });
  }

  source = source.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, text: string) => {
    const label = stripTags(text).trim();
    return label ? `[${label}](${href})` : href;
  });

  source = source.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text: string) => {
    const value = stripTags(text).trim();
    return value ? `\n\n${value}\n\n` : '\n';
  });

  source = source.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text: string) => {
    const value = stripTags(text).trim();
    return value ? `\n- ${value}` : '';
  });

  source = source.replace(/<br\s*\/?>/gi, '\n');
  source = source.replace(/<hr\s*\/?>/gi, '\n---\n');

  source = stripTags(source);

  source = source
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  source = source.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return source;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const accept = context.request.headers.get('Accept') || '';
  const wantsMarkdown = accept.toLowerCase().includes('text/markdown');

  const response = await context.next();
  if (!wantsMarkdown) return response;

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('text/html')) return response;

  const html = await response.text();
  const markdown = htmlToMarkdown(html);
  const tokenCount = Math.max(1, Math.ceil(markdown.length / 4));

  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('x-markdown-tokens', String(tokenCount));
  headers.set('Vary', 'Accept');

  return new Response(markdown, {
    status: response.status,
    headers,
  });
};