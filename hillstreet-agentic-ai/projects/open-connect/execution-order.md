# Open Connect Project Execution Profile

## Primary Objective
Maintain and operate the Open Connect AI Factory as the centralized agent orchestration platform.

## Architecture
- Project: Open Connect AI Factory
- Runtime: Node.js + Express + TypeScript
- Location: /workspace/app/open-connect/
- AI Gateway: Multi-provider with free-tier-first fallback
- Credential Broker: Scoped access to 9 vaults

## Components
- Orchestrator: Task dispatch, concurrency, bounded repair
- Credential Broker: Scoped credential access
- AI Gateway: Provider selection, fallback, quota tracking
- Audit Engine: Execution evidence, outcome tracking
- Policy Engine: Spending controls, permissions, approvals
- Health Monitor: Persistent health checks, automated recovery
- Scheduler: Scheduled triggers, event-driven workflows
- REST API: 18 endpoints for all components

## Execution Requirements
1. Maintain TypeScript compilation (exit code 0)
2. Keep all 25/25 endpoint tests passing
3. Preserve free-tier-only policy
4. Maintain bounded repair attempts (max 3)
5. Keep credential broker scoped access enforced