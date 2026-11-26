# Guarded GitHub pipeline

Scope: master-kanor/Affidavit. No live account, credentials, branch protections, production or repository variables are changed by this proposal.

## Enabled by code after review and merge

- Issues receive one idempotent intake comment.
- Maintainer comments accept exact /agent status, /agent review, /agent fix and /agent merge commands. Arbitrary comment text is never executed.
- Hosted pull-request validation results are reported on the matching current head, explicitly separate from code review or approval.
- Ready-for-review runs existing tests. Main push validation adds Chromium before deployment eligibility.
- Structured task comments contain a stable event ID. Optional TRUSTED_AGENT_BOT_IDS is a comma-separated list of explicitly approved immutable GitHub Bot user IDs; allowed bots may request status/fix/review, never merge. Empty means no bot handoffs. This is a GitHub comment transport, not an implementation of the A2A protocol.

## Disabled until separately configured

- AI fix/review: no verified executor is connected; these commands report BLOCKED. No paid provider calls or fake approvals.
- Merge: AGENT_AUTO_MERGE_ENABLED must equal true and the PR must carry agent:auto-merge. It additionally needs an existing authorized GitHub App token in AGENT_AUTOMATION_TOKEN with repository Administration read, Contents write, and Pull requests write. Do not use a default GITHUB_TOKEN or a personal token for this slot: the implementation needs protection inspection and normal post-merge push events. Installing an App or expanding permissions is NOT authorized by this proposal. Missing access fails closed.
- Merge requires enforced strict main protection, stale-review dismissal, current-head independent nonbot approvals, successful named checks and no pending/failing checks. Scripts, workflows, auth, credentials, Functions and migration changes require manual merge. GitHub's protections remain final authority. No protections are changed or bypassed.
- Production: AGENT_PRODUCTION_DEPLOY_ENABLED must equal true. Cloudflare remains the existing target. The production environment's existing approval policies still apply. Exact current main commit must have a successful same-repository CI push run with both test and Main Chromium validation jobs completed successfully. No PR artifacts are promoted. Production seeding is off unless explicitly selected during manual dispatch after validation/build.

## Limits and recovery

No new accounts, permissions, paid APIs, infrastructure, hosted workers, schedules, rollbacks or secret changes are activated here. Production rollback remains manual using existing hosting controls; it is not claimed automated. Deployment serializes uploads and rechecks main before side effects; main can still advance during upload, so the guarantee is validated exact-commit deployment, not instantaneous latest-main-at-upload. Missing optional production integration credentials remains an explicit skipped integration test, not production coverage.

Validate locally: node --test scripts/automation/*.test.cjs; pnpm check; pnpm test; pnpm build; pnpm test:e2e. New default-branch event handlers cannot be operationally verified until reviewed and merged. Do not activate merge or production variables without validating identity, protection and included quota availability.
