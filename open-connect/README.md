# Open Connect AI Factory — HillStreet Autonomous AI Infrastructure

Centralized agent orchestration platform integrating development tools, AI resources,
cloud execution environments, credential managers, and project infrastructure.

## Architecture

```
open-connect/
├── factory/              # Core AI Factory configuration
│   ├── agent-registry.yaml       # Agent identities, capabilities, permissions
│   ├── tool-registry.yaml        # MCP servers, APIs, connectors
│   ├── skill-registry.yaml       # Reusable agent procedures
│   ├── policy-engine.yaml        # Permissions, spending limits, approvals
│   ├── credential-broker.yaml    # Scoped credential access
│   ├── audit-engine.yaml         # Execution evidence and history
│   ├── orchestrator-config.yaml  # Task dispatch, concurrency
│   └── workflow-definitions/     # Autonomous workflow definitions
├── ai-gateway/               # AI model routing and fallback
│   ├── providers.yaml          # AI provider configurations
│   ├── fallback-policy.yaml    # Free-tier execution policy
│   └── quotas.yaml             # Quota tracking and limits
├── integrations/             # External service integrations
│   ├── github/                 # GitHub automation
│   ├── docker/                 # Docker Hub registry
│   ├── cloudflare/             # DNS, CDN, R2, Pages
│   ├── supabase/               # Database, auth, backups
│   ├── sentry/                 # Error tracking, observability
│   ├── linear/                 # Project management
│   ├── notion/                 # Documentation, SOPs
│   ├── databricks/             # Data management
│   ├── railway/                # Current hosting
│   ├── tencent/                # Future migration target
│   └── vaults/                 # Credential vaults
└── execution/                # Cloud execution environments
    ├── sandbox/                # Isolated code execution
    └── cloud-browser/          # Browser-based operations
```

## Core Modules

### Agent Registry
Centralized agent identities including Kilo Code, Open Code, ChatGPT, Codex,
OpenRouter, NVIDIA, Linear AI, Sentry Seer, Notion AI, and Custom Agent Factory.

### Tool Registry
MCP servers and connectors for GitHub, Docker, Cloudflare, Supabase, Sentry,
Linear, Notion, Databricks, Railway, Tencent Cloud, and Composio.

### Skill Registry
Reusable version-controlled procedures for project setup, AI gateway configuration,
credential broker setup, CI/CD pipelines, observability, and sandbox execution.

### Policy Engine
Spending controls (free-tier only by default), permission scopes, validation rules,
and approval boundaries for destructive or cost-incurring actions.

### Credential Broker
Scoped runtime access to credentials via Open Connect Credentials, Composio,
1Password, Proton Pass, GitHub Secrets, Railway Variables, Cloudflare Secrets,
Supabase Vault, and Databricks Secrets.

### AI Gateway
Multi-model routing with free-tier-first fallback: Kilo Code → Open Code →
OpenRouter → NVIDIA → (paid) ChatGPT → (paid) Codex.

## Integrations

| Service | Role | Status |
|---------|------|--------|
| GitHub | Source of truth, CI/CD | Configured |
| Docker Hub | Container registry | Configured |
| Cloudflare | DNS, CDN, R2, Pages | Configured |
| Supabase | Database, auth, backups | Configured |
| Sentry | Error tracking | Configured |
| Linear | Project management | Configured |
| Notion | Knowledge base | Pending credentials |
| Databricks | Data management | Pending credentials |
| Railway | Current hosting | Discovered |
| Tencent Cloud | Future migration | Pending credentials |

## Credential Vaults

| Vault | Role | Status |
|-------|------|--------|
| Open Connect Credentials | Central integration broker | Active |
| Composio | Managed OAuth | Available |
| 1Password | Infrastructure credentials | Pending |
| Proton Pass | Personal vault | Pending |
| GitHub Secrets | CI/CD credentials | Configured |
| Railway Variables | Runtime secrets | Configured |
| Cloudflare Secrets | Runtime credentials | Configured |
| Supabase Vault | Database secrets | Configured |
| Databricks Secrets | Data credentials | Pending |

## Free-Tier Execution Policy

1. Check available authorized model quota
2. Select compatible free inference provider
3. Execute with designated coding agent
4. Fallback to another available free provider
5. Stop or defer when free quota is exhausted

Paid providers (ChatGPT, Codex) require explicit approval before use.

## Setup Instructions

1. Copy `open-connect/config/env.template` to `.env` and fill in credentials
2. Review `open-connect/factory/policy-engine.yaml` for spending controls
3. Configure each integration in `open-connect/integrations/` with actual API keys
4. Deploy workflows via GitHub Actions (`.github/workflows/`)
5. Run `pnpm install` and `pnpm check` to verify the base project
6. Deploy to Railway or Cloudflare Pages

## Requirements

- Node.js v24+
- pnpm v10+
- Docker (for containerized execution)
- Credentials for each external service (see env.template)

## Files Not to Commit

- `.env` — contains real secrets
- `open-connect/config/.env` — contains real secrets
- Any file containing raw API keys or tokens
