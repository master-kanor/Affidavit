import type { PagesFunction } from '@cloudflare/workers-types';

const metadata = {
  issuer: 'https://masterkanorcase.online',
  authorization_endpoint: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/oauth/authorize',
  token_endpoint: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/oauth/token',
  jwks_uri: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/.well-known/jwks.json',
  userinfo_endpoint: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/oauth/userinfo',
  scopes_supported: ['openid', 'profile', 'email', 'phone', 'offline_access'],
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256', 'plain'],
  poppy_domains: ['masterkanorcase.online'],
  revocation_endpoint: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/logout',
  agent_auth: {
    skill: 'https://masterkanorcase.online/auth.md',
    register_uri: 'https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup',
    claim_uri: 'https://masterkanorcase.online/auth.md',
    identity_types_supported: ['anonymous'],
    anonymous: {
      credential_types_supported: ['bearer'],
      claim_uri: 'https://masterkanorcase.online/auth.md',
    },
  },
};

export const onRequest: PagesFunction = async () => {
  return new Response(JSON.stringify(metadata), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};