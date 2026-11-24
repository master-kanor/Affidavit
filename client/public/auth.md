# auth.md

Agent authentication and agent registration for the Master Kanor Case portal.

## Agent Registration

This document describes agent registration for the Master Kanor Case portal.

Authorization server metadata: https://masterkanorcase.online/.well-known/oauth-authorization-server
Protected resource metadata: https://masterkanorcase.online/.well-known/oauth-protected-resource
Registration endpoint: https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup

### agent_auth

```json
{
  "skill": "https://masterkanorcase.online/auth.md",
  "register_uri": "https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup",
  "identity_types_supported": ["anonymous"],
  "anonymous": {
    "credential_types_supported": ["bearer"],
    "claim_uri": "https://masterkanorcase.online/auth.md"
  }
}
```

Supported methods:
- anonymous: agents may obtain bearer credentials for public discovery endpoints.
- oauth2: authorization code with PKCE for user-scoped access.

Registration request:
POST https://bftywnjdjyooyrbqahul.supabase.co/auth/v1/signup
Content-Type: application/json

{
  "email": "agent@example.com",
  "password": "replace-with-strong-secret"
}

## Credential use

Use `Authorization: Bearer <token>` on protected API requests. Discovery endpoints are public.