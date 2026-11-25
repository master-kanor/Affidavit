# Production Readiness Audit — 2026-08-20

## Verified baseline

The selected repository is `master-kanor/Affidavit` on branch `main`, with GitHub CLI authentication available for the `master-kanor` account and a Cloudflare Account API Token available to Wrangler. The Cloudflare Pages project and custom domains are documented in the repository’s prior deployment audit notes, but the current working tree contains uncommitted application and documentation changes that must be validated before any push or deployment.

The configured Supabase project is reachable through the environment-backed REST host. Supabase Auth settings responded successfully and currently report email authentication enabled. The supplied database audit found the new canonical Postgres tables absent or unexposed through the current REST key, so the canonical migration has not been applied to the target project. The browser build currently has no `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` values in the sandbox environment, although server-side audit variables exist; Cloudflare Pages environment variables must therefore be configured before a real authenticated browser build can operate.

## Critical application gaps

| Area | Verified state | Required correction |
|---|---|---|
| Public landing | Current page exposes affidavit/evidence/documentary descriptions and links before authentication | Replace with neutral authentication gateway; protect all case routes |
| Auth UI | Email/password plus magic link and Google/GitHub OAuth are exposed | Lock to approved email/password flow unless providers are explicitly enabled |
| Role resolution | `useAuth` maps roles from user metadata; `useAdminCheck` trusts metadata, hardcoded email, and domain checks | Resolve role from trusted `profiles`/permissions data; enforce server-side and RLS |
| Evidence access | Existing hooks query and mutate the `evidence` table directly from the browser | Add permission-aware API/RLS boundaries; no client-only mutations for production |
| Admin dashboard | Contains hardcoded metrics, fake operational states, and `Math.random()` updates | Replace with real data or mark unavailable; remove simulated production truth |
| Backend/API | No active `server/` directory or API entrypoint exists | Add a production-safe Cloudflare Pages Function/Worker façade or Supabase Edge Function boundary |
| Database | Drizzle schema includes MySQL-style table definitions while target is Supabase Postgres; canonical tables are not present in the target audit | Normalize the Postgres migration and apply only after schema review |
| Storage | Private evidence storage policies and signed URL flow are not yet verified | Create private bucket policies and server-mediated/signed access |
| Deployment | Existing workflow deploys Pages and runs a smoke check, but current code/config is not yet aligned with secure role routing | Update workflow, environment variables, build output, custom-domain verification, and rollback checks |
| AI | Chat widget uses simulated responses and hardcoded model/cost/cache displays | Replace or quarantine until retrieval, authorization, and server-side provider routing exist |

## Security handling

Credential material supplied in the shared workbook was treated as sensitive. Secret values were not written to this report or source files. Because the workbook contains long-lived credential material and the audit command necessarily handled it in memory, the owner should rotate the Supabase, Cloudflare, GitHub, R2, AI, Notion, Hugging Face, and messaging credentials after the production path is secured. No plaintext password from the supplied files was inserted into application code.

## Safe deployment blocker

A production deployment must not be claimed complete until: the target Supabase schema and RLS are applied; Cloudflare Pages receives the public Supabase URL/anon key and any server-only secrets through protected settings; the public root exposes no case data; role routing is verified with Owner/Admin/User accounts; denied resource access returns no data; private storage URLs are protected; and the canonical domain is independently tested. If a required Cloudflare Access policy or Supabase privileged operation requires interactive provider confirmation, that operation remains an explicit blocker rather than being bypassed.
