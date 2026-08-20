# Affidavit Evidence Platform

This repository contains the React/Vite evidence dossier and owner/admin workspace for the Affidavit project. The public client is intended for `masterkanorcase.online`; the owner/admin route is protected in the application and is intended for `admin.masterkanorcase.online`.

## Verified application behavior

The guest dossier supports published affidavit/evidence browsing, in-page previews, sharing, filtering, sorting, evidence-specific AI prompts, and attachment extraction feedback. The admin dashboard now includes a database-backed evidence asset workspace with search, file-type and review-status filters, loading/error/empty states, secure preview actions, verification/archive actions, and an upload flow that validates files before sending them to the Supabase `evidence` Storage bucket and `evidence` metadata table.

Supported asset families include PDF and office documents, spreadsheets/CSV, text/data files, images, audio, video, and external video-link records. Uploaded records are created with `pending` status and require admin review before publication. The upload helper rejects executable/unsupported MIME types and files larger than 25 MB. Storage keys are generated from the authenticated user ID and a sanitized file name; raw file bytes are not stored in database columns.

The admin AI workspace exposes a bounded policy for the assistant: its declared knowledge sources are the published affidavit index, authorized evidence metadata, and admin review history. Its allowed tools are authorized evidence search, selected-record summarization, secure preview opening, and review-note preparation. Its memory boundary is the current admin workspace only. It must not read credentials, expose service-role keys, publish or delete records without confirmation, or expose unpublished records to guests. The UI does not render gateway/API secrets.

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
pnpm start
```

The project is a static Vite SPA. `pnpm build` produces the Cloudflare Pages artifact under `dist/public`. The default development command runs only Vite; it does not reference a missing Express entrypoint. The current repository does not contain `server/index.ts`, so do not configure a Node server start command that expects `dist/index.js`.

## Required deployment contract

For Cloudflare Pages, use the Git-connected repository and the Vite build command. The build output directory must match the generated artifact (`dist/public` in the current project configuration). The deployment must not use `node /usr/src/app/dist/index.js` for this static SPA. If the Cloudflare project still has a Node/Cloud Run-style start command, remove or override it in the external dashboard; a repository checkpoint alone cannot change an external service's stale runtime setting.

The browser bundle may contain only public Supabase URL/anon-key configuration. Supabase service-role keys, storage secrets, Cloudflare tokens, R2 credentials, AI provider keys, GitHub tokens, and MCP credentials must remain in protected server/edge-function or deployment-secret configuration. Never commit `.env` files or paste secret values into source, tests, documentation, or chat.

## External setup still requiring independent verification

The following items cannot be claimed from local build success alone: live custom-domain DNS/TLS, Cloudflare Pages project settings, Cloudflare Worker/KV/R2 bindings, Supabase Storage bucket existence and RLS policies, OAuth redirect/provider configuration on the production origins, deployed AI/MCP functions, and live GitHub-to-Cloudflare deployment status. Verify each in its corresponding external dashboard or authenticated API, and record the result before marking it complete in `todo.md`.

## Verification status

The current local verification includes the Vitest suite, TypeScript checking, and the Vite production build. The repository has regression tests for admin asset normalization/filtering, secure secret presentation, upload validation/storage-key generation, owner/admin AI policy boundaries, and existing Cloudflare/Supabase configuration checks. The build currently emits a static `index.html` artifact and does not emit `dist/index.js`.

## Release v1.0.1 - 2026-06-27

- Added robust, sortable, date-filtered, and searchable Admin Audit Logs for original affidavit downloads.
- Implemented secure Revoke and Restore access controls with explicit confirmation dialogs and top-right success toast notifications.
- Added filtered CSV export for audit logs.
- Enforced strict public anonymization in page metadata while preserving official affidavit text and secure authenticated original downloads.
- Verified 95 comprehensive unit tests, TypeScript type checking, and successful Vite production builds.
