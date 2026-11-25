# Memory Policy

## Memory Tiers

### Organization Memory
- Organization-wide architecture decisions
- Shared infrastructure configurations
- Cross-project patterns and standards
- Global credential references (not secrets)

### Project Memory
- Project architecture and design decisions
- Current implementation status
- Known issues and workarounds
- Deployment history and configurations
- Integration references

### Agent Memory
- Agent role and responsibilities
- Agent-specific configuration
- Agent execution history
- Agent-specific learned patterns

### Task Memory
- Current task objectives
- Task execution state
- Task results and outputs
- Task dependencies

## Memory Structure

Each memory entry contains:
- **ID**: Unique identifier
- **Type**: organization/project/agent/task
- **Timestamp**: When recorded
- **Source**: Where the information came from
- **Status**: active/archived/deprecated
- **Content**: The actual information
- **References**: Links to related entries

## Checkpoint Format

```yaml
checkpoint:
  id: cp_YYYYMMDD_HHMMSS
  project: project-name
  status: in_progress|completed|blocked
  completed_tasks:
    - task_id: task-001
      result: verified
      evidence: test_output_123
  pending_tasks:
    - task_id: task-002
      blocker: credential_expired
  next_actions:
    - resume task-002 after credential renewal
```

## Memory Rules

1. **Never store raw secrets** — only credential references
2. **Timestamp everything** — enables recovery and audit
3. **Version important changes** — maintain history
4. **Compact regularly** — prevent memory bloat
5. **Resume from checkpoints** — don't restart completed work
6. **Separate verified from assumed** — evidence-based memory