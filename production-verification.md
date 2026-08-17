# Production verification — 2026-08-17

The canonical homepage `https://masterkanorcase.online/` was first tested before the Access change and redirected to a Cloudflare Access login page titled **Sign in to All Workers**. The account-wide Access application was then removed through the Cloudflare API.

The canonical homepage was tested again afterward and loaded the React application directly with title **Charles Tanauan Official Affidavit & Evidence**. The page rendered the public hero content, sign-in control, evidence dossier links, affidavit section summary, and evidence-file summary. No Cloudflare Access login wall was present in the second check.

The Cloudflare Pages project `affidavit` is Git-connected to `master-kanor/Affidavit` on `main`, has the canonical domains configured, and now uses `dist/public` as its build output directory. GitHub commit `2cc4f03fa8ad3da020d0b9fcf46a50879c66107e` produced a successful Cloudflare Pages production deployment.

The application-level admin guard remains in the source: `AdminDashboard.tsx` uses `useAdminCheck`, and the hook redirects unauthenticated or non-admin Supabase users to `/auth` while allowing users whose Supabase metadata role is `admin`.

No credentials, access URLs, cookies, or token values are stored in this verification note.
