# auth.md

Agent authentication for the Master Kanor Case portal.

## Audience

AI agents acting on behalf of authorized users of the Master Kanor Case portal.

## Registration Flow

1. Discover authorization server metadata at https://masterkanorcase.online/.well-known/oauth-authorization-server
2. Register an agent using the registration endpoint.
3. Obtain bearer credentials via OAuth 2.0 authorization code with PKCE.
4. Use `Authorization: Bearer <token>` on protected API requests.

Registration endpoint:
POST https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup

Request body:
{
  "email": "agent@example.com",
  "password": "replace-with-strong-secret"
}

Supported methods:
- anonymous: agents may obtain bearer credentials for public discovery endpoints.
- oauth2: authorization code with PKCE for user-scoped access.

## Credential use

Use `Authorization: Bearer <token>` on protected API requests. Discovery endpoints are public.