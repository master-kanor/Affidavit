# Current Evidence Audit — 2026-08-18

## Verified facts

- The supplied official dossier artifact is `artifacts/official-affidavit-evidence-dossier-87-pages.pdf`.
- The static affidavit image catalog contains 393 catalog records and 379 unique filenames.
- The supplied nested archive contains a matching member for all 379 unique catalog filenames; 55 filenames occur in more than one archive path and require deterministic first-match selection.
- The current guest `/dossier` route renders the 10 source-linked video thumbnails, but the evidence count is `0` when the Supabase evidence query has no records. This is a user-visible gallery fallback defect because the static catalog already contains the mapped source-image records.
- The current admin batch-download helper generates placeholder cards containing metadata rather than downloading original evidence assets. That behavior is not acceptable for an evidence-preserving workflow and must be replaced with source-asset or immutable-dossier references.
- The current managed deployment error is `MODULE_NOT_FOUND` for `/usr/src/app/dist/index.js`; the repository currently builds a static Vite output under `dist/public` and defines `start` as `npx serve dist -p 3000`. This is a runtime configuration mismatch and is separate from the local gallery behavior.

## Safe implementation boundary

The official affidavit text and source PDF are immutable. Planned changes will add read-only gallery asset references and traceability metadata without rewriting affidavit text, fabricating evidence, changing evidence meaning, or exposing protected identities.

## Production read-only check

A read-only request to `https://masterkanorcase.online` returned an older public build. Its visible content still exposes the affiant name, respondent names, and the location `Imus, Cavite`, and reports `331+ evidence files`. This does not match the requested anonymized public view, `Tacloban City, Leyte, 6500`, or the verified 393-record local gallery. No production or credential changes were made under the confirmed safe scope.
