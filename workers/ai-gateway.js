// AI Gateway Worker
// Proxies AI requests to configured providers with caching and cost tracking

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/ai/health' || url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'ai-gateway' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // AI chat endpoint
    if (url.pathname === '/ai/ask' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { question, caseId } = body;
        
        if (!question || !caseId) {
          return new Response(JSON.stringify({ error: 'Missing question or caseId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check cache
        const cacheKey = `ai:${caseId}:${question.slice(0, 100)}`;
        const cached = await env.KV?.get(cacheKey);
        if (cached) {
          return new Response(cached, {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
          });
        }

        // Forward to Supabase Edge Function or handle here
        // For now, return a placeholder
        const response = JSON.stringify({
          answer: "AI gateway is operational. Connect to Supabase for full AI capabilities.",
          citations: []
        });

        // Cache the response
        if (env.KV) {
          ctx.waitUntil(env.KV.put(cacheKey, response, { expirationTtl: 3600 }));
        }

        return new Response(response, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};