# auth.md

Agent authentication for the Master Kanor Case portal.

## Audience

AI agents acting on behalf of authorized users of the Master Kanor Case portal.

## Registration

Agents register via OAuth 2.0 authorization code flow with PKCE.

- Authorization server metadata: https://masterkanorcase.online/.well-known/oauth-authorization-server
- Protected resource metadata: https://masterkanorcase.online/.well-known/oauth-protected-resource
- Registration endpoint: https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup

Supported methods:
- anonymous: agents may obtain bearer credentials for public discovery endpoints.
- oauth2: authorization code with PKCE for user-scoped access.

## Credential use

Use `Authorization: Bearer <token>` on protected API requests. Discovery endpoints are public.