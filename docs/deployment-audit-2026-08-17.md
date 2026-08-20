# Deployment Audit — 2026-08-17

## Verified through authenticated Cloudflare API

The Cloudflare Pages project is `affidavit`. Its Pages subdomain is `affidavit-abo.pages.dev`. The project has the following custom domains attached: `masterkanorcase.online`, `www.masterkanorcase.online`, and `admin.masterkanorcase.online`.

The Pages project source is GitHub owner `master-kanor`, repository `Affidavit`, production branch `main`, with production deployments enabled. The configured build command is `pnpm build`, the project root is the repository root, and the configured destination directory is `dist`.

## Live HTTP checks

On 2026-08-17, the following endpoints returned HTTP 200 over HTTPS: `https://affidavit-abo.pages.dev/`, `https://masterkanorcase.online/`, and `https://admin.masterkanorcase.online/`. Response headers identified Cloudflare as the edge server and returned HTML content.

## Deployment status

The latest listed GitHub Actions `Deploy to Production` run completed successfully. The Cloudflare Pages deployment list contains successful production deployments triggered by GitHub pushes to `main`.

## Runtime mismatch finding

A separate deployment system continues to report `Cannot find module /usr/src/app/dist/index.js` and a failed TCP probe on port 3000. This is inconsistent with the active Cloudflare Pages project, which serves the static Vite artifact successfully and expects the copied `dist/index.html` output rather than a Node entrypoint. The repository has been aligned to the static SPA contract, and the GitHub workflow now explicitly copies `dist/public/.` into `dist/` and asserts that `dist/index.html` exists while `dist/index.js` does not. The remaining container error must be removed or reconfigured in the external service that is still launching the stale Node runtime; it is not evidence that the active Cloudflare Pages domain is down.

## Still unverified

These checks require direct external verification beyond HTTP 200: Supabase OAuth behavior on the canonical origins, protected admin authorization, Storage bucket/RLS configuration, API or edge-function availability, and the deployment system that owns the stale Node container.
