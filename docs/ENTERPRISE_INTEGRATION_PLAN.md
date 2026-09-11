# Affidavit Enterprise Integration Plan

## Purpose

This document defines the canonical operating model for the Master Kanor Affidavit platform at `https://masterkanorcase.online`. GitHub repository `master-kanor/Affidavit`, branch `main`, is the source of truth. Cloudflare Pages and Pages Functions provide the public application and server-side API edge, while Supabase provides authentication, PostgreSQL persistence, row-level security, and controlled storage metadata. The existing database is preserved by default; schema changes are additive, migration-ordered, and reversible where practical.

## Canonical Service Boundaries

| Concern | Canonical service | Policy |
| --- | --- | --- |
| Source control and review | GitHub, `master-kanor/Affidavit:main` | All production changes arrive through reviewed commits or pull requests. |
| Public web application | Cloudflare Pages project `affidavit` | `masterkanorcase.online` remains the canonical public domain. |
| Server-side APIs | Cloudflare Pages Functions under `functions/api` | Provider keys and service-role credentials remain server-side only. |
| Authentication and database | Supabase Auth and PostgreSQL | Existing data is never dropped or reset by deployment automation. |
| Private evidence objects | R2 or Supabase Storage with server-issued signed URLs | No public evidence bucket or open file-serving route. |
| Optional container workflow | DockerHub | Not on the critical Pages path; use only for reproducible auxiliary jobs or a separately approved container runtime. |

DockerHub is therefore treated as an optional artifact registry rather than a second production runtime. Introducing a container deployment in parallel with Cloudflare Pages would create two sources of truth and is not safe until a separate runtime contract, health checks, secrets policy, and cutover plan are approved.

## Role Model

The application uses least-privilege roles with server-side enforcement. The **Owner** has full case and platform administration rights, including user management, provider configuration, audit review, and controlled publication. **Admins** can manage evidence, case operations, notifications, and operational review but cannot change owner-level identity or platform ownership. **Clients** can access only the cases and evidence explicitly granted to them and cannot administer users, providers, or migrations. **Guest Reviewers** receive narrowly scoped, time-bounded read access through the published permission RPCs and cannot enumerate unrelated cases or raw storage objects. Every sensitive action is recorded in audit history.

## Merge Strategy

The latest `main` branch already contains the production-hardening series and the Cloudflare deployment fixes. The branch `production/masterkanorcase-hardening-20260820` is divergent and contains an older version of many of the same files, so merging it wholesale would risk regressing later fixes. It should remain archived as historical reference rather than be merged on top of `main`. The Cloudflare fix branches are also represented by later commits on `main`; only a branch with a genuinely unique, reviewed change should be cherry-picked after a file-level comparison and passing CI.

The open Dependabot pull request is independent of the platform hardening work. It should be merged only after its dependency lockfile diff passes the current typecheck, unit/integration tests, browser E2E suite, secret scan, and production build. No direct force-push, reset, or destructive merge is permitted.

## Database Preservation Contract

Deployment workflows must never run `db push`, reset a database, drop production tables, or apply unreviewed SQL automatically. Supabase migrations must be idempotent, additive, and applied in timestamp order through the approved migration path. Before any migration is applied, the target project reference, current migration history, table schemas, RLS policies, and storage configuration must be confirmed. The current integration session could not resolve a Supabase project through the configured read-only connector, so live schema parity remains a deployment blocker rather than an assumption.

## CI/CD Contract

Every pull request runs source secret scanning, TypeScript validation, Vitest, and browser E2E checks. A push to `main` runs the same checks and a production build before the Cloudflare Pages deployment job. Production deployment uses the `production` environment and requires only public build variables in the browser bundle. The smoke check verifies the Pages origin, canonical domain, authentication route, and health route. A managed Cloudflare challenge is treated as an observability limitation, not as proof of application failure.

The production domain currently returns HTTP 200 for the public shell, `/auth`, `/api/health`, and `admin.masterkanorcase.online`. The admin hostname is reachable, but the repository configuration does not yet declare a dedicated admin Pages domain binding; this must be confirmed in the Cloudflare account before treating it as an isolated administrative surface.

## Security Remediation Required Before Further Deployment

The public repository previously tracked `.project-config.json` containing runtime database credentials, artifact Git credentials, and platform secrets. The file has been removed from the canonical working tree and added to `.gitignore`. The affected credentials must be rotated in their originating systems because removal from the current tree does not erase historical exposure. Production deployment must remain paused until the owner confirms rotation of the database credential, artifact credential, and any platform keys that were present in that file.

The repository also tracked generated `node_modules`. They have been removed from Git tracking while remaining available locally for validation; dependencies are reproducible from `package.json` and `pnpm-lock.yaml`. This reduces repository size and prevents generated files from obscuring application diffs.

## Current Validation Evidence

The canonical GitHub `main` branch was cloned into an isolated audit workspace. After sanitizing the managed-environment false positives in the credential-hygiene tests, the source scanner, TypeScript check, Vitest suite, and production build completed successfully: 9 test files passed, 23 tests passed, 1 test was skipped, and the build completed with a chunk-size warning only. The canonical domain and admin hostname both returned HTTP 200 during the audit.

## Remaining Actions

The next safe actions are to rotate exposed credentials, confirm the Supabase project and migration history through an authorized connector, verify the Cloudflare Pages custom-domain bindings, and commit the security remediation as a reviewed pull request. Only after those checks pass should branch protection, environment approvals, and any optional DockerHub artifact workflow be enabled.
