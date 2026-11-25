# Canonical Seed and Workspace Verification Implementation Plan

**Goal:** Populate the canonical case idempotently during GitHub Actions deployments and verify the production workspace API returns the expected affidavit and evidence counts.

**Architecture:** Keep the canonical source in `supabase/seed/canonical-case.json`. Add a dependency-free Python REST seed runner that uses only the server-side Supabase service-role secret and deterministic IDs/upserts. Add a Vitest integration suite that signs the owner in through Supabase Auth, calls the Pages workspace API, and asserts 18 sections, 98 source-original text versions, and 66 evidence assets. Run the seed before Pages deployment and the integration test after deployment using GitHub environment secrets.

**Tech Stack:** GitHub Actions, Python 3 standard library, Supabase Auth/PostgREST, Cloudflare Pages Functions, Vitest.

---

### Task 1: Add the production workspace integration test

**Files:**
- Create: `client/src/canonical-case-workspace.production.integration.test.ts`

**Step 1:** Define the test contract and required environment variables without embedding credentials.

**Step 2:** Authenticate the owner using Supabase Auth password grant, call the configured workspace URL, and assert HTTP 200 plus the exact counts.

**Step 3:** Run the test with a deliberately unavailable URL to verify the failure is meaningful.

### Task 2: Add the idempotent canonical seed runner

**Files:**
- Create: `scripts/seed-canonical-case.py`

**Step 1:** Load `supabase/seed/canonical-case.json` relative to the repository root.

**Step 2:** Validate the expected case, section, text, and evidence counts before writing.

**Step 3:** Upsert case, sections, source-original text, evidence, memberships, and user grants using the public schema and service-role key.

**Step 4:** Run the seed twice against the configured database and verify counts remain stable.

### Task 3: Wire GitHub Actions

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1:** Add a pre-deployment canonical seed step using production Supabase secrets.

**Step 2:** Add a post-deployment workspace integration step using the Pages origin and owner/Auth secrets.

**Step 3:** Keep public build variables and server-only seed variables separate.

### Task 4: Verify and commit

**Step 1:** Run typecheck and the full unit suite.

**Step 2:** Run the seed against the configured Supabase project and the production integration test against the Pages origin.

**Step 3:** Build the application and inspect the diff to ensure no secrets or unrelated files are included.

**Step 4:** Commit and push to `main`, then report the workflow and verification results.
