# Master Kanor Case Portal
## End-to-End Setup, Security, and Deployment Runbook

**Project:** `master-kanor/Affidavit`  
**Canonical domain:** `https://masterkanorcase.online`  
**Admin domain target:** `https://admin.masterkanorcase.online`  
**Hosting target:** Cloudflare Pages  
**Authentication and database target:** Supabase  
**Document status:** Implementation and deployment runbook, 20 August 2026

> This runbook is written for a source-preserving case system. The official affidavit text is an immutable source record. Evidence galleries, documentary chapters, relationship mappings, AI suggestions, and editorial captions remain separate records and must never be silently merged into the official text.

## 1. What is implemented in the repository

The current working tree now contains the secure application foundation and the deployment contract. The public landing page is a neutral authentication gateway and no longer advertises or embeds case content before authorization. Case routes are guarded by authentication and trusted authorization state. Owner and Admin controls are determined by database-backed profiles and permissions rather than user metadata, hardcoded email addresses, or hidden browser controls.

The authentication UI now uses manually provisioned email/password accounts and a controlled password-reset path. Public registration, magic-link entry, and social-provider buttons were removed from the presented login surface. The browser identity hook contains identity only; role decisions are delegated to the authorization service.

The new `client/src/lib/authorization.ts` and `client/src/hooks/useAuthorization.ts` modules resolve `profiles`, `user_permissions`, and `resource_permissions` from Supabase. They fail closed when the schema is missing, the profile is not active, or the permission query fails. The administrative dashboard no longer reports fabricated evidence counts, uptime, AI spend, cache hit rate, or simulated system health.

A reproducible Supabase migration is available at `supabase/migrations/20260820000000_case_portal_security.sql`. It defines profiles, roles, permissions, resource permissions, case membership, affidavit sections, immutable text versions, evidence assets, testimonies, timeline events, documentary records, documentary chapters/items, relationships, audit history, database functions, row-level security policies, and a private `case-evidence` storage bucket policy set.

The Pages workflow in `.github/workflows/deploy.yml` now performs frozen dependency installation, token-pattern scanning, build-time public Supabase configuration, TypeScript validation, tests, Vite build validation, Pages artifact checks, Cloudflare Pages deployment, and read-only smoke checks for the Pages origin, canonical domain, and authentication route. The verified Vite output is `dist/public`, so the workflow deploys that directory.

## 2. Authority model

| Role | Authentication | Read access | Write access | AI capability |
|---|---|---|---|---|
| Owner | Manually provisioned Supabase account | All authorized case resources | Full case, evidence, relationship, documentary, and permission control | Owner Agent, subject to audit and explicit policy |
| Admin | Manually provisioned Supabase account | Assigned cases and approved resources | Delegated case and documentary management according to membership | Admin Agent, subject to delegation and audit |
| User / Guest Reviewer | Manually provisioned Supabase account | Only explicitly granted resources | None in the current production foundation | Read-only Ask AI only when `can_ask_ai` is granted |

The application uses the browser only as a presentation and request layer. Supabase RLS and, when Pages Functions are enabled, a server-side API boundary are the enforcement layers. A hidden button, route, or client-side role field is not considered authorization.

## 3. Supabase setup

### 3.1 Rotate supplied credentials first

The supplied credential workbook contains long-lived service credentials for multiple providers. Those values must be rotated before production deployment. Do not copy any workbook value into source code, Markdown, GitHub issues, browser JavaScript, or a committed environment file. Rotate at least the Supabase service-role credential, Cloudflare API token, GitHub token, R2 keys, AI keys, messaging tokens, Notion token, and Hugging Face token.

After rotation, store each secret in the smallest required scope. Public Supabase URL and publishable/anon key may be used as browser build variables. Service-role keys, database passwords, R2 secret keys, AI keys, and administrative API tokens must remain server-side or in CI secret stores.

### 3.2 Apply the migration

The migration is designed for Supabase Postgres. Apply it through the authorized Supabase migration channel after reviewing existing production tables. Do not apply it to an unknown project. The target project must match the Supabase URL configured for the Pages build.

The migration creates the following core structures:

| Group | Tables or functions |
|---|---|
| Identity | `profiles`, `user_permissions`, `resource_permissions` |
| Case | `case_records`, `case_members` |
| Source record | `affidavit_sections`, `affidavit_text_versions` |
| Evidence | `evidence_assets`, `testimonies`, `timeline_events` |
| Documentary | `documentaries`, `documentary_chapters`, `documentary_items` |
| Traceability | `case_relationships`, `case_audit_log` |
| Authorization functions | `current_app_role`, `is_owner`, `is_admin_or_owner`, `has_permission`, `can_view_case`, `can_edit_case`, `can_view_resource` |
| Storage | Private bucket `case-evidence` and object policies |

The migration intentionally gives new accounts `pending` status and a `user` role. A new account cannot view case data until an Owner/Admin explicitly activates it, grants permissions, and assigns case membership.

### 3.3 Provision the first Owner

Create the first account directly in Supabase Auth. Then update its `profiles` row to `role = 'owner'` and `status = 'active'`. Create or update the corresponding `user_permissions` row with the required permissions. Record the change in `case_audit_log` through the approved administrative path.

Do not use user metadata or an email address as the authority source. The email is an identity attribute, not a role grant.

### 3.4 Configure authentication

Set the Supabase Site URL to `https://masterkanorcase.online`. Add the exact callback URL `https://masterkanorcase.online/auth/callback`. If the separate admin hostname is used for role routing, add its callback URL only after the admin hostname is active and its redirect behavior is verified.

Disable public sign-up in the Supabase Auth settings. Keep email/password enabled for manually provisioned accounts. Configure password-reset email delivery and rate limits in the Supabase dashboard. Enable multi-factor authentication for Owner/Admin accounts where the project plan and provider configuration support it. Verify that no client form or OAuth provider creates an account without explicit provisioning.

### 3.5 Seed the canonical source correctly

The canonical affidavit source must be imported into `case_records`, `affidavit_sections`, and `affidavit_text_versions` as `version_kind = 'source_original'`. Evidence gallery labels and documentary suggestions must be inserted into their own tables. Do not insert gallery labels into `text_content`.

The generated canonical case data has been moved from `client/src/data` into `supabase/seed`. The CaseReview client now retrieves workspace data from the authenticated case API boundary, and the current production bundle check confirms that a known canonical paragraph is absent from `dist/public/assets`. Before a production case route is enabled, apply the private database seed and configure the Pages Function secrets so the authorized boundary has real data to return.

## 4. Private evidence storage

Use the private Supabase Storage bucket `case-evidence` created by the migration. Use object paths in the form:

```text
case/{case_id}/evidence/{evidence_id}/{safe_filename}
```

The storage policies derive the case ID from the path and check `can_view_case` or `can_edit_case`. The browser should receive short-lived signed URLs or stream responses generated after authorization. Do not make the bucket public and do not store permanent public object URLs in evidence metadata.

For external YouTube/Facebook references, store the external URL and provider metadata separately from uploaded evidence. Thumbnail previews may be displayed only when the user has permission to view the related evidence record. Do not treat an external thumbnail as proof of the underlying video content.

## 5. Cloudflare Pages setup

The verified application build produces the static site in `dist/public`. The Pages project must use:

| Setting | Value |
|---|---|
| Project | `affidavit` |
| Build command | `pnpm build` |
| Output directory | `dist/public` |
| Production branch | `main` |
| Canonical domain | `masterkanorcase.online` |
| Optional alias | `www.masterkanorcase.online` |
| SSL | Full (Strict) |

Cloudflare’s Pages documentation states that the build directory is the directory generated by the build command, and its direct-upload workflow uses Wrangler with an account ID and Pages API token.[1] The repository workflow uses the Pages action currently present in the repository; if the project is moved to Wrangler direct upload or Pages Functions, update the workflow and Pages project configuration together rather than mixing deployment models.

### 5.1 GitHub Actions secrets

Create these GitHub Actions secrets in the `production` environment:

| Secret | Purpose | Exposure |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Pages deployment target | CI only |
| `CLOUDFLARE_API_TOKEN` | Pages deployment permission | CI only |
| `VITE_SUPABASE_URL` | Browser Supabase project URL | Build-time public |
| `VITE_SUPABASE_ANON_KEY` | Browser publishable/anon key | Build-time public |

Do not add `SUPABASE_SERVICE_ROLE_KEY`, `R2_SECRET_ACCESS_KEY`, AI keys, or database passwords as `VITE_` variables. Those values must never enter the browser bundle.

### 5.2 Pages environment variables

If the project remains static-only, only the two public `VITE_SUPABASE_*` variables are needed at build time. If Pages Functions are enabled, configure server-only secrets through the Pages/Workers secret store or Wrangler secret commands. A Wrangler configuration file becomes the Pages configuration source of truth once it is used for production Functions deployment, so it must be downloaded or reviewed against the existing dashboard settings first.[2]

## 6. Pages Functions and API boundary

The secure foundation currently relies on Supabase Auth plus RLS. The next production step is a Pages Functions API boundary for operations requiring service-role access, signed URLs, audit writes, or AI provider calls. The API should validate the Supabase access token, resolve the user ID through Supabase Auth, load the trusted profile, check case/resource permissions, and only then call privileged services.

Recommended endpoints are:

| Endpoint | Method | Authorization | Purpose |
|---|---|---|---|
| `/api/health` | GET | Public, non-sensitive | Return service availability only |
| `/api/me` | GET | Authenticated | Return profile and effective permissions |
| `/api/cases/:caseId/workspace` | GET | Case view permission | Return approved source sections, allowed evidence metadata, timeline, and documentary projection |
| `/api/evidence/:evidenceId/signed-url` | POST | Evidence view + download permission | Return a short-lived private object URL |
| `/api/documentaries/:id` | GET | Dossier/documentary view permission | Return chapter structure and approved items |
| `/api/documentaries/:id/review` | POST | Owner/Admin | Accept, modify, or reject a chapter/item recommendation and write an audit record |
| `/api/documentaries/:id/items/reorder` | POST | Owner/Admin | Persist order with optimistic version checking |
| `/api/audit` | GET | Owner/Admin | Read filtered audit history |
| `/api/ai/ask` | POST | `can_ask_ai` | Query only permission-scoped records and label responses as source fact, inference, suggestion, or unverified |

The API must return a consistent error envelope with `code`, `message`, `requestId`, and optional field errors. A failed authorization check should not reveal whether a hidden case, evidence asset, or user record exists.

## 7. Documentary workspace deployment state

The documentary workspace is a reviewable editorial projection. Chapter grouping, narration, captions, item ordering, and AI recommendations must remain separate from the official affidavit source. The `documentaries.status` and `documentary_chapters.status` values provide the review state:

```text
draft → review → approved → archived
```

A chapter marked `suggested`, `modified`, or `rejected` must not be presented as an approved documentary export. Approval actions must record the reviewer, timestamp, previous value, new value, and supporting relationship or recommendation ID in `case_audit_log`.

## 8. Verification checklist

Run the following checks before merging or deploying:

```bash
pnpm install --frozen-lockfile
python3 scripts/scan-secrets.py
pnpm check
pnpm test
pnpm build
```

The current local validation completed with TypeScript checks passing, the full Vitest suite passing with one intentionally skipped external credential check, the token-pattern scan reporting no tracked credential patterns, and the Vite build producing `dist/public/index.html` and `dist/public/_redirects`.

Read-only live checks currently return HTTP 200 for the Pages origin, canonical home page, `/auth`, and `/admin`. These statuses only establish that the SPA is served. They do **not** prove that a user is authorized; authorization must be tested with real Owner, Admin, and User accounts after the Supabase migration is applied.

The following authenticated verification matrix is still required:

| Scenario | Expected result |
|---|---|
| Anonymous `/` | Neutral gateway; no case title, affidavit text, evidence labels, or case counts |
| Anonymous `/dossier` | Login or denied response; no case data |
| Active User with assigned resource | Read-only authorized material only |
| Active User without assigned resource | Denied with no resource existence disclosure |
| Active Admin | Assigned case management and review controls only |
| Owner | Full authorized control and audit visibility |
| Disabled account | Denied even with a valid Supabase session |
| Expired signed URL | Object unavailable |
| Rejected documentary chapter | Excluded from approved export |
| AI query without `can_ask_ai` | Denied |

## 9. Current blockers and required manual actions

The implementation is not yet a completed production launch. The following blockers are explicit:

| Blocker | Why it matters | Action |
|---|---|---|
| Supabase migration not applied | The target audit did not expose the new canonical tables | Apply and verify the migration on the confirmed project |
| Public build variables are not present in the sandbox | Local build safely renders a no-Supabase preview, but production auth requires build-time variables | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the GitHub production environment |
| Private database seed/API not yet activated in production | The browser no longer bundles the canonical source, but the Pages Function cannot return real case data until the migration/seed and server secrets are provisioned | Apply the Supabase migration and source seed, configure Pages Function secrets, then run authenticated role-matrix checks |
| Credential workbook contains long-lived secrets | The values should be considered compromised | Rotate all provider credentials before deployment |
| `/admin` returns SPA HTTP 200 anonymously | Static SPA routing returns the application shell; authorization is a client/database decision | Verify denied UI and RLS with real sessions; do not use HTTP 200 alone as an authorization signal |
| Pages rollback is not automated in the current workflow | Cloudflare’s official Pages rollback documentation describes selecting a prior production deployment in the dashboard | Keep the previous successful deployment identified and execute the documented rollback if smoke checks fail; add API automation only after the exact supported endpoint is verified |
| AI chat is not production-connected | The current chat path contains demo/simulated behavior | Keep AI disabled until the authorized API boundary, retrieval scoping, audit logging, and cost controls are implemented |

## 10. Safe release sequence

First rotate credentials and confirm the target Supabase project. Next apply the migration, provision the Owner account, create the case record, seed the immutable source version, and verify RLS with a matrix of authenticated accounts. Then configure the GitHub production environment and Cloudflare Pages public variables. After that, confirm the source-clean browser bundle, configure Pages Function secrets, and connect the case API to the seeded private workspace. Run the full validation commands, deploy to Pages, perform origin and canonical smoke checks, and manually validate the authenticated role matrix. Only after those checks pass should the canonical domain be treated as a production case portal.

If the smoke checks fail or the canonical domain serves a 5xx response, preserve the previous successful deployment and follow Cloudflare’s production rollback procedure. Cloudflare documents that any successfully built production deployment is a valid rollback target, while preview deployments are not valid rollback targets.[3]

## References

[1]: https://developers.cloudflare.com/pages/configuration/api/ "Cloudflare Pages REST API"
[2]: https://developers.cloudflare.com/pages/functions/wrangler-configuration/ "Cloudflare Pages Functions Wrangler configuration"
[3]: https://developers.cloudflare.com/pages/configuration/rollbacks/ "Cloudflare Pages rollbacks"
