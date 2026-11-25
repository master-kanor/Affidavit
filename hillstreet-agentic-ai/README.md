# HillStreet Agentic AI — Centralized Instruction Repository

Version-controlled instructions for all AI agent platforms.

## Structure

```
hillstreet-agentic-ai/
├── AGENTS.md                              # Master entry point
├── README.md                              # This file
├── instructions/                          # Universal operating instructions
│   ├── universal-master.md
│   ├── execution-policy.md
│   ├── memory-policy.md
│   ├── credential-policy.md
│   ├── provider-routing.md
│   ├── security-policy.md
│   └── completion-policy.md
├── agents/                                # Specialist agent definitions
│   ├── orchestrator.md
│   ├── architect.md
│   ├── research.md
│   ├── engineering.md
│   ├── integration.md
│   ├── authentication.md
│   ├── devops.md
│   ├── testing.md
│   ├── monitoring.md
│   ├── recovery.md
│   └── verification.md
├── platforms/                             # Platform-specific adapters
│   ├── chatgpt/
│   ├── codex/
│   ├── hermes/
│   ├── openclaw/
│   ├── opencode/
│   ├── kilo-code/
│   └── custom-agents/
├── config/                                # Reusable YAML configuration
│   ├── agentic-ai.yaml
│   ├── provider-registry.yaml
│   ├── connector-registry.yaml
│   ├── model-routing.yaml
│   └── secret-references.yaml
├── projects/                              # Project execution profiles
│   ├── open-system/
│   ├── open-connect/
│   ├── open-box/
│   ├── open-claw/
│   └── project-template/
├── memory/                                # Persistent memory structure
│   ├── organization/
│   ├── architecture/
│   ├── decisions/
│   ├── checkpoints/
│   └── knowledge/
├── workflows/                             # Reusable workflow definitions
│   ├── discovery/
│   ├── development/
│   ├── integration/
│   ├── deployment/
│   ├── monitoring/
│   └── recovery/
└── .github/workflows/                     # CI/CD for this repo
    ├── validate-config.yml
    ├── validate-skills.yml
    ├── test-integrations.yml
    ├── sync-instructions.yml
    ├── release.yml
    └── verify-backups.yml
```

## Usage

1. Copy the appropriate platform adapter from `platforms/` to your AI agent's configuration
2. Customize `projects/` with project-specific execution profiles
3. Reference shared credentials via `config/secret-references.yaml` (never store raw secrets)
4. Maintain persistent memory in `memory/` following the checkpoint format

## Key Principles

- **One master policy, many platform adapters** — not separate instructions per agent
- **Credential references, not raw secrets** — always use secret managers
- **Free-tier first** — prioritize free and included usage
- **Evidence-based completion** — verify, don't assume
- **Cloud-first continuity** — persistent state, checkpoint recovery