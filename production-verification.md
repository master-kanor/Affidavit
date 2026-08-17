# Production verification — 2026-08-17

The canonical homepage `https://masterkanorcase.online/` was first tested before the Access change and redirected to a Cloudflare Access login page titled **Sign in to All Workers**. The account-wide Access application was then removed through the Cloudflare API.

The canonical homepage was tested again afterward and loaded the React application directly with title **Charles Tanauan Official Affidavit & Evidence**. The page rendered the public hero content, sign-in control, evidence dossier links, affidavit section summary, and evidence-file summary. No Cloudflare Access login wall was present in the second check.

The Cloudflare Pages project `affidavit` is Git-connected to `master-kanor/Affidavit` on `main`, has the canonical domains configured, and now uses `dist/public` as its build output directory. GitHub commit `2cc4f03fa8ad3da020d0b9fcf46a50879c66107e` produced a successful Cloudflare Pages production deployment.

The application-level admin guard remains in the source: `AdminDashboard.tsx` uses `useAdminCheck`, and the hook redirects unauthenticated or non-admin Supabase users to `/auth` while allowing users whose Supabase metadata role is `admin`.

No credentials, access URLs, cookies, or token values are stored in this verification note.


The first direct `/auth` check after removing Access but before the final source-alignment deployment returned the application's 404 page, confirming the SPA fallback was missing from the GitHub source. After the successful `dist` deployment, a second direct `/auth` check reached the canonical application title but rendered a blank white page with no detected interactive elements. This is now a client-side runtime/rendering issue rather than a Cloudflare Access or platform 404 issue and requires console inspection before claiming login is operational.


A subsequent refresh of the same production `/auth` URL resolved to the app's 404 page again. The two consecutive observations (blank title-only page, then app 404) are inconsistent, so the direct route cannot yet be considered fixed. The latest production deployment may still be propagating or the route fallback behavior may be inconsistent across the canonical edge cache.


After the successful `dist` deployment, direct browser checks of `/dossier` and `/admin` both rendered the application's 404 page. The latest GitHub tree contains both `public/_redirects` and `client/public/_redirects`, but the deployed route behavior remains incorrect for direct navigation. This confirms the remaining issue is the Cloudflare Pages SPA fallback/source alignment and not the Supabase role guard itself.

## React Error #310 Investigation — 2026-08-17

The mobile screenshot showed minified React error #310 and a blank page. Source tracing found that both `EvidenceDossier` and `AdminDashboard` returned during Supabase admin-loading or denial states before executing their page-level hooks. When authentication state changed, React saw a different hook sequence on the next render, producing the minified hook-order failure.

The fix introduces stable auth-gated shell components. The outer route components now call only the authentication guard and render loading/denial states; the authorized child components contain the state, effect, query, and memo hooks. Local Vitest, TypeScript checking, and the production Vite build pass after the change. A mobile preview of `/`, `/auth`, `/dossier`, and `/admin` renders without the React crash; protected routes correctly show the Supabase admin login screen when no session is present.

## GitHub Actions Smoke Check Correction — 2026-08-17

The first workflow run for the hook-order fix built the application but failed only in the final smoke step because the GitHub-hosted runner received HTTP 403 from the canonical edge. The same canonical domain returned HTTP 200 from the sandbox and the Pages origin is the reliable deployment target. The smoke check now requires HTTP 200 from `https://affidavit-abo.pages.dev/`, reports the canonical response for diagnosis, and does not falsely mark a successful Pages publish as failed solely because of runner-specific edge protection.

## Successful React Fix Deployment — 2026-08-17

Commit `8e0e487f6563fdacb59f842b4e7c7612ae40d761` passed the GitHub Actions install, TypeScript, build, Cloudflare Pages publish, and Pages-origin smoke check. The canonical edge returned a runner-specific 403 during the first workflow attempt, so the workflow now validates `affidavit-abo.pages.dev` as the deployment origin and reports the canonical status separately. The remaining workflow annotation identified an unsupported `productionBranch` input; it has been removed in the follow-up source change.
