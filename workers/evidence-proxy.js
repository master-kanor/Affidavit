// Evidence Proxy Worker
// Proxies evidence-related requests to Supabase with caching

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/evidence/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'evidence-proxy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Proxy evidence requests to Supabase
    if (url.pathname.startsWith('/evidence/')) {
      const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
      if (!supabaseUrl) {
        return new Response(JSON.stringify({ error: 'Supabase URL not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Forward request to Supabase
      const targetUrl = `${supabaseUrl}/rest/v1/${url.pathname.replace('/evidence/', '')}${url.search}`;
      const headers = new Headers(request.headers);
      headers.set('apikey', env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '');
      
      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.method !== 'GET' ? await request.text() : undefined
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: response.headers
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};