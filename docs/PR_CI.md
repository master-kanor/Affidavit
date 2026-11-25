# Pull-Request CI

The repository now runs automated pull-request validation through `.github/workflows/pr-validation.yml`. The workflow is intentionally separate from the production deployment workflow so a pull request never receives Cloudflare production credentials or deploy permissions.

## Jobs

| Job | Command | Purpose |
|---|---|---|
| `static-checks` | `python3 scripts/scan-secrets.py`, `pnpm check` | Detect credential patterns and validate TypeScript |
| `integration-tests` | `pnpm test -- --run` | Run Vitest unit, authorization, deployment-contract, privacy, and case-workspace integration tests |
| `browser-e2e` | `pnpm exec playwright install --with-deps chromium`, `pnpm test:e2e` | Build the static site, start the Vite preview server, and run Chromium browser smoke tests |

The workflow triggers on pull requests when they are opened, synchronized, or reopened. It uses a concurrency group per pull request and cancels outdated runs when a newer commit arrives. All jobs use Node.js 22 and pnpm 10.4.1 with a frozen lockfile.

## Browser coverage

The current browser suite is intentionally small and deterministic. It verifies that the public gateway displays restricted-access language without affidavit disclosure, that the authentication page exposes manually provisioned email/password sign-in without public registration, and that opening a protected route without a session does not reveal canonical source text.

The Playwright configuration uses Chromium in CI, one worker in CI, retries on failure, traces on the first retry, screenshots only on failure, and videos retained on failure. Reports are written to `playwright-report/` and `test-results/`.

## Local commands

Run the fast checks locally with:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test -- --run
```

Run the browser suite locally with:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

For headed browser debugging:

```bash
pnpm test:e2e:headed
```

The Playwright web server command builds the app and starts `vite preview` at `http://127.0.0.1:4173`. The local preview intentionally does not require Supabase credentials; it must render the neutral gateway and fail closed for protected case routes.

## Artifacts and failure handling

The integration job uploads any available Vitest result or coverage directories for seven days. The browser job uploads the Playwright HTML report, traces, screenshots, videos, and result files for fourteen days. Artifact upload uses `if: always()` so diagnostics remain available after a test failure.

The workflow does not upload environment files, credentials, Supabase service-role keys, Cloudflare tokens, or case secrets. No production secrets are required for the current public-gateway browser tests.

## Required repository settings

For merge protection, configure the default branch to require the following status checks:

| Required check | Reason |
|---|---|
| `TypeScript and source checks` | Blocks type errors and tracked credential patterns |
| `Integration tests` | Blocks contract and authorization regressions |
| `Chromium end-to-end tests` | Blocks public-gateway and protected-route disclosure regressions |

Require branches to be up to date before merging if the repository uses frequent changes to the authentication or route-guard code. Do not grant the pull-request workflow `deployments: write`, Cloudflare token access, Supabase service-role access, or case-storage access.

## Test expansion policy

Keep browser tests focused on user-visible critical paths. Add database-backed Owner/Admin/User tests only after a dedicated disposable test project or isolated test schema exists. Do not point pull-request tests at production case data. Use mocked `/api` responses or a disposable Supabase project for authenticated workspace tests, and clean all test users and evidence objects after the run.
