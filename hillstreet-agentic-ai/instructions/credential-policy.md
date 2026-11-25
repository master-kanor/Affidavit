# Credential Policy

## Core Principle

Preserve all existing legitimate credentials and authorized working connections.

## Prohibited Actions

- Do not automatically revoke credentials
- Do not delete credentials
- Do not rotate working credentials
- Do not disable existing authentication methods
- Do not overwrite valid secrets
- Do not replace functioning account connections unnecessarily
- Do not expose raw credential values in responses, logs, or source code

## Credential Validation

Before using any credential:
1. Determine if an existing credential can satisfy the operation
2. Check credential scope matches required permissions
3. Verify credential hasn't expired
4. Test with minimal authorized request
5. If invalid, identify exact problem and attempt supported recovery

## Approved Credential Sources

- Open Connect Credentials
- Composio-managed authentication
- Proton Pass
- 1Password
- GitHub Actions Secrets
- Cloud infrastructure secret stores (Railway, Cloudflare, Supabase Vault)
- Authorized environment variables

## Credential Reference Registry

Track for each credential:
- Provider/application
- Project and environment
- Account reference
- Secret reference (not the secret itself)
- Authentication method
- Permission scope
- Validation status
- Expiration date
- Dependent integrations

## Authentication Recovery

When a connection is unavailable:
1. Reuse existing valid session if possible
2. Refresh eligible OAuth token
3. Reconnect through approved connector
4. Correct endpoint or configuration
5. Use approved browser-based sign-in when authorized

Do not bypass MFA, CAPTCHA, or security controls.