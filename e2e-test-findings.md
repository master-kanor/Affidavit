# Production E2E Test Findings

## Run
- Target: https://masterkanorcase.online
- Scope: Public landing page and initial dossier navigation
- Date: 2026-08-20

## Findings
- Public homepage loaded directly with title `Charles Tanauan Official Affidavit & Evidence` and no Cloudflare Access wall.
- Homepage exposed Sign In and View Evidence Dossier actions, plus 12 affidavit sections and 331+ evidence files messaging.
- Clicking the public `View Evidence Dossier` action navigated to `/auth`.
- `/auth` rendered an `Admin Authentication` screen that states admin access only and says user accounts are created by administrators in Supabase.
- This indicates a possible public Guest Reviewer flow regression or an intentional auth gate that must be verified against the stated requirement that guests can view the dossier read-only.
- No data was modified.

## Additional Findings
- Direct navigation to `https://masterkanorcase.online/dossier` redirected to `/auth` and rendered the same admin-only authentication screen.
- Direct navigation to `https://admin.masterkanorcase.online/` returned a blank white page with no detected interactive elements or visible portal content. This is a production blocker for admin-host usability and requires investigation before authenticated flows can be verified.
- No login credentials were entered and no state-changing operation was performed.

## Authentication Findings
The production `/auth` form rendered correctly and accepted the entered administrator credentials, but Supabase returned `Invalid login credentials`. The test did not retry the same credentials. This prevents verification of authenticated AI, draft, toast Undo, history search, and restore flows using that account. No account or source data was changed.

## Authenticated Dossier Findings
The owner test account authenticated successfully and redirected to `/dossier`, confirming the Supabase email-login path works for that account. The dossier page rendered its Gallery View, Testimony, Timeline, Export Dossier, Share, and Show Filters controls. After loading completed, it displayed `No verified evidence found` with zero matching items, zero verified items, zero categories, and zero testimony sections, despite the public landing page advertising 331+ evidence files and 12 affidavit sections. This is a high-severity data-availability mismatch that blocks gallery, testimony, timeline, and evidence-preview verification. No data was modified.

## Admin AI Findings
The authenticated owner could open `/admin` and the AI Assistant tab rendered with expected dashboard cards and a prompt input. Submitting a read-only evidence question completed, but the response explicitly stated that it was a simulated response and that production would connect to Gemini with OpenRouter fallback. The response contained no evidence-grounded citations, no clickable source references, and no visible Save to Draft action. Therefore the advertised AI citation and draft workflow could not be verified in production and appears not to be wired to the live backend/API.

## Admin Workspace Findings
The authenticated `/admin` workspace rendered its Overview, Evidence, AI Assistant, and Settings tabs. The Evidence tab showed only summary text (`Total Files: 331`, `Organized in 26 folders`, `Evidence Types: 12+`) and no evidence list, preview, upload, categorization, annotation, or gallery controls. The production UI therefore exposes high-level counts but not the detailed evidence-management workflow described by the requested feature set.

Browser console inspection produced no new production console errors during the authenticated AI flow. The local development log still contains an older `vite.config.ts` syntax-error entry, which is not evidence of a current production failure because the production domain served the application.

## Settings and Admin-Host Findings
The Settings tab rendered only read-only summary values for AI cost threshold, cache TTL, and database maintenance; it did not expose connector configuration, knowledge-base controls, draft history, or model/API-key management. A recheck of `https://admin.masterkanorcase.online/` while authenticated rendered the public landing page rather than the administrator portal. The required admin subdomain is therefore not routing to the admin workspace.

## Role-Separation Findings
The public-host route `https://masterkanorcase.online/admin` rendered the full admin dashboard instead of redirecting or denying access. A browser storage inspection showed no localStorage session keys, so the route behavior cannot be attributed to a client-side storage flag alone. This is a critical authorization and domain-separation finding: the public host exposes the admin workspace route, and the required `admin.masterkanorcase.online` host does not route to that workspace.

## Final E2E Evidence
A direct production DOM inspection of the admin Overview and AI Assistant tabs returned `false` for the presence of `Save to Draft`, `Undo`, `history`, `history search`, and `citation` controls. The live AI Assistant page remained keyboard-addressable at the tab level, but there were no draft/history controls available to exercise. Console inspection produced no new browser-console errors during the tested flow. The requested toast Undo and history-search flows are consequently blocked by missing live UI/backend wiring, not by an interaction failure in the test.

## Consolidated preview verification — 2026-08-20

- Managed preview now loads normally after adding the `.manus.computer` and `.manus.space` host suffixes to Vite `allowedHosts`.
- Public landing page renders the official affidavit title, source-preservation messaging, source-page/image counts, and dossier entry points.
- Public `/dossier` loads without an admin session and exposes 393 evidence items, the 87-page dossier framing, source-linked YouTube thumbnails, the Google Drive source folder link, Gallery/Testimony/Timeline tabs, and read-only evidence cards.
- Visual verification showed the public gallery in a responsive three-column card layout with readable controls and media thumbnails.

## Cloudflare production verification — 2026-08-20

- Cloudflare Pages project `affidavit` is configured with `masterkanorcase.online`, `www.masterkanorcase.online`, and `admin.masterkanorcase.online` domains.
- Direct deployment of the verified build completed at `https://c4d8b928.affidavit-abo.pages.dev`.
- HTTP HEAD checks returned 200 from the canonical domain, admin hostname, and deployment preview.
- The canonical homepage served the expected Official Affidavit of Evidence page with 12 official source pages, 393 source images, and 87-page source-preservation messaging.
- The admin hostname returned HTTP 200 but rendered a blank page in the browser, so host-level admin routing remains a production blocker even though DNS/TLS and the Pages response are active.
- The existing GitHub `main` branch has unrelated history and oversized historical/generated artifacts. A clean production snapshot was pushed successfully to branch `manus-production-f7c7c362`; a pull request could not be created because GitHub reported no common history with `main`. The existing `main` branch was not overwritten.

## Live dossier re-verification — 2026-08-20

The canonical production route `https://masterkanorcase.online/dossier` initially showed a blank screenshot while loading, but the subsequent browser view completed successfully. The live page exposes the Evidence Dossier with Gallery View, Testimony, Timeline, Export Dossier, Share, filtering, 393 evidence items, 10 source-linked YouTube thumbnails, the source evidence folder link, and read-only source-image cards. This confirms direct production navigation and live gallery/media fallback rendering after the latest Cloudflare deployment.
