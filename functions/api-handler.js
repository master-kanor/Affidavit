// API Handler Worker
// Handles general API requests for the Affidavit portal

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'api-handler' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route to appropriate handler
    if (url.pathname.startsWith('/ai/')) {
      // Delegate to AI gateway logic
      return new Response(JSON.stringify({ 
        message: 'AI endpoints available at /ai/ask',
        status: 'ok'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname.startsWith('/evidence/')) {
      // Delegate to evidence proxy logic
      return new Response(JSON.stringify({ 
        message: 'Evidence endpoints available at /evidence/*',
        status: 'ok'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default response
    return new Response(JSON.stringify({ 
      service: 'master-kanor-case-api',
      version: '1.0.0',
      endpoints: ['/health', '/ai/*', '/evidence/*']
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};