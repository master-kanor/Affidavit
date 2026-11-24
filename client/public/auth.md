# auth.md

Agent authentication for the Master Kanor Case portal.

## Audience

AI agents acting on behalf of authorized users of the Master Kanor Case portal.

## Registration

Agents register via OAuth 2.0 authorization code flow with PKCE.

- Authorization server metadata: https://masterkanorcase.online/.well-known/oauth-authorization-server
- Protected resource metadata: https://masterkanorcase.online/.well-known/oauth-protected-resource
- Registration endpoint: https://masterkanorcase.online/.well-known/oauth-authorization-server

Supported methods:
- anonymous: agents may obtain bearer credentials for public discovery endpoints.
- oauth2: authorization code with PKCE for user-scoped access.

Registration request example:

POST https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "replace-with-strong-secret"
}

## Credential use

Use `Authorization: Bearer <token>` on protected API requests. Discovery endpoints are public.