# Affidavit Evidence Presentation Implementation Notes

## Source preservation findings

The shared project directory contains the supplied official and unofficial source materials. The available PDF files are 12 pages, 30 pages, and 26 pages; none of the supplied PDFs is an 87-page PDF. The unofficial HTML source contains section labels such as `Official Affidavit · Paragraphs 82–87 (Final)` and uses paragraph ranges rather than an 87-page layout. The implementation must therefore preserve the supplied official text exactly and must not claim that a non-existent 87-page PDF was created. The requested `87` is treated as a source paragraph/range requirement unless the user supplies an actual 87-page official source.

## Existing repository findings

The repository is `master-kanor/Affidavit`, currently on `main` at commit `fe75e2cd`. The application already includes routes for `/`, `/auth`, `/auth/callback`, `/dossier`, and `/admin`. It has a flat `evidence` table and several legacy evidence, annotation, collection, report, export, and audit tables. The current browser data layer uses direct Supabase access and the current admin gate is client-side, so the new presentation must keep Guest access read-only and must not rely on browser-only authorization for critical mutations.

The current `EvidenceDossier` page groups verified evidence by category and presents it as pseudo-testimony. That is not a canonical affidavit relationship. The existing `TestimonyView` component already supports the desired section pattern of affidavit text followed by images, videos, documents, highlights, and related content, so it is the primary UI foundation to reuse or extend.

## Required implementation constraints

1. Preserve source/original affidavit text as immutable content. Store current approved text and proposed revisions separately.
2. Maintain three distinct views from one canonical case model: text-only official affidavit, affidavit with evidence, and documentary workspace/plan.
3. Make evidence mappings explicit, approval-gated, auditable, and distinguish source fact, owner/admin content, AI inference, AI suggestion, and unverified information.
4. Support image galleries and safe video/link previews. Do not fabricate media, evidence, dates, quotations, or legal conclusions.
5. Keep Owner/Admin editing separate from Guest Reviewer read-only access.
6. Do not silently rewrite the supplied affidavit text or merge evidence into the text-only output.
7. Use the supplied unofficial source as a mapping reference, not as authority to replace the official source.

## Browser validation findings

The local Vite server now responds with HTTP 200 for `/`, `/case-review`, `/official`, and `/documentary`. The landing page renders the three controlled outputs and the Owner/Admin/Guest authority model. The case-review page renders 18 canonical source blocks, section-aligned evidence galleries, 9 YouTube thumbnail cards using the exact video IDs found in the supplied HTML, and inline iframe playback/direct YouTube links. The browser initially exposed a pre-existing blank-page failure because the app attempted to initialize Supabase with missing local environment variables and the client bootstrap mounted a failing React Query provider. The app now falls back to read-only preview mode when Supabase is not configured and the unused provider was removed from the bootstrap; the landing and case-review pages render successfully.

## Additional browser validation

The `/official` route renders a long source-preserving text-only document and explicitly excludes evidence cards, inferred relationships, and AI suggestions. The `/documentary` route renders three review-gated chapter groupings, source-derived section counts, and clear labels that the editorial structure is a suggestion requiring Owner/Admin approval and is not a legal finding.

## Database synchronization result

The configured Supabase connector was available, but its project discovery returned an empty project list. No external database migration was applied. A reviewable Postgres/Supabase migration artifact was added at `drizzle/migrations/0001_canonical_case_knowledge.sql`; it includes case membership, immutable affidavit text versions, evidence assets, testimonies, timeline events, explicit approval-gated relationships, recommendations, documentary chapters/items, audit logging, and RLS helper policies. Applying it requires a discoverable target Supabase project and a schema review against the production database.

## Final validation

`pnpm check` and `pnpm build` both passed. Build output contains only non-blocking existing warnings for unset analytics placeholders and bundle size. The final repository status was cleaned so generated Vite/cache artifacts are not part of the intentional diff.
