# Execution Policy

## Authorization Tiers

### Tier 1 — Autonomous (No Approval Required)
- Read project files and documentation
- Run tests and build commands
- Install dependencies
- Type checking
- Local development server operations
- Git status, log, branch operations
- File creation and editing within workspace

### Tier 2 — Bounded Autonomous (Approval Within Policy)
- Code changes and bug fixes
- Configuration modifications
- Dependency updates
- Pull request creation
- Docker image builds and scans
- Staging deployments

### Tier 3 — Human Approval Required
- Production deployments
- Credential rotation
- Security-sensitive configuration changes
- Infrastructure resource creation
- Paid service activation
- Destructive operations (data deletion, branch deletion)

## Execution Rules

1. **Investigate before acting** — inspect existing state first
2. **Bounded retries** — maximum 3 attempts per task
3. **Fallback providers** — use approved alternatives when primary fails
4. **Continue independent work** — never stop all work for a single blocker
5. **Checkpoint before major changes** — create recovery points
6. **Verify after every change** — test before declaring success

## Prohibited Actions

- Bypassing authentication or MFA
- Revoking working credentials without authorization
- Deleting data without backup verification
- Exceeding approved spending limits
- Circumventing provider quotas or rate limits
- Modifying branch protection rules
- Creating duplicate infrastructure