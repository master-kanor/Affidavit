// Open Connect AI Factory — Policy Engine
// Permissions, spending limits, validation, and approval boundaries.

import type { AgentId } from './types.js';

export interface PolicyConfig {
  freeTierOnly: boolean;
  maxDailySpendUsd: number;
  maxMonthlySpendUsd: number;
  requireApprovalAboveUsd: number;
  blockedProviders: string[];
  allowedFreeProviders: string[];
  maxTaskDurationSeconds: number;
  maxConcurrentExecutions: number;
  maxRepairAttempts: number;
  sandboxTimeoutSeconds: number;
}

export interface AgentPermissions {
  agentId: AgentId;
  scopes: string[];
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requires_approval: boolean;
}

export class PolicyEngine {
  private config: PolicyConfig;
  private agentPermissions: Map<AgentId, string[]> = new Map();
  private dailySpendUsd = 0;
  private monthlySpendUsd = 0;

  constructor(config: Partial<PolicyConfig> = {}) {
    this.config = {
      freeTierOnly: config.freeTierOnly ?? true,
      maxDailySpendUsd: config.maxDailySpendUsd ?? 0,
      maxMonthlySpendUsd: config.maxMonthlySpendUsd ?? 0,
      requireApprovalAboveUsd: config.requireApprovalAboveUsd ?? 0,
      blockedProviders: config.blockedProviders ?? [
        'paid_models_without_explicit_approval',
      ],
      allowedFreeProviders: config.allowedFreeProviders ?? [
        'kilo-code',
        'open-code',
        'open-router-router',
        'nvidia-inference',
        'linear-ai',
        'sentry-seer',
        'notion-ai',
      ],
      maxTaskDurationSeconds: config.maxTaskDurationSeconds ?? 600,
      maxConcurrentExecutions: config.maxConcurrentExecutions ?? 5,
      maxRepairAttempts: config.maxRepairAttempts ?? 3,
      sandboxTimeoutSeconds: config.sandboxTimeoutSeconds ?? 300,
    };

    this.initializeDefaultPermissions();
  }

  private initializeDefaultPermissions(): void {
    const defaults: Array<[AgentId, string[]]> = [
      ['kilo-code', ['read:workspace', 'write:workspace', 'execute:local_commands', 'read:github_secrets']],
      ['open-code', ['read:workspace', 'write:workspace', 'execute:local_commands']],
      ['open-router-router', ['read:external_apis', 'read:quotas']],
      ['custom-agent-factory', ['read:factory', 'write:factory', 'execute:isolated_tasks']],
      ['sentry-seer', ['read:sentry']],
      ['linear-ai', ['read:linear', 'write:linear']],
      ['notion-ai', ['read:notion', 'write:notion']],
    ];

    for (const [agentId, scopes] of defaults) {
      this.agentPermissions.set(agentId, scopes);
    }
  }

  evaluate(
    agentId: AgentId,
    action: string,
    estimatedCostUsd: number = 0,
    requiresHumanApproval: boolean = false
  ): PolicyResult {
    // Check free-tier-only policy
    if (this.config.freeTierOnly && estimatedCostUsd > 0) {
      return {
        allowed: false,
        reason: 'Free-tier-only policy: paid action not allowed',
        requires_approval: true,
      };
    }

    // Check spending limits
    if (this.config.maxDailySpendUsd > 0 && this.dailySpendUsd + estimatedCostUsd > this.config.maxDailySpendUsd) {
      return {
        allowed: false,
        reason: 'Daily spend limit would be exceeded',
        requires_approval: true,
      };
    }

    if (this.config.maxMonthlySpendUsd > 0 && this.monthlySpendUsd + estimatedCostUsd > this.config.maxMonthlySpendUsd) {
      return {
        allowed: false,
        reason: 'Monthly spend limit would be exceeded',
        requires_approval: true,
      };
    }

    // Check approval threshold
    if (estimatedCostUsd > this.config.requireApprovalAboveUsd) {
      return {
        allowed: true,
        reason: `Action requires approval: cost ${estimatedCostUsd} USD exceeds threshold`,
        requires_approval: true,
      };
    }

    // Check if human approval explicitly required
    if (requiresHumanApproval) {
      return {
        allowed: true,
        reason: 'Human approval required for this action',
        requires_approval: true,
      };
    }

    // Check blocked providers
    if (this.config.blockedProviders.some((p) => action.toLowerCase().includes(p.toLowerCase()))) {
      return {
        allowed: false,
        reason: 'Action involves a blocked provider',
        requires_approval: true,
      };
    }

    return {
      allowed: true,
      reason: 'Action permitted by policy',
      requires_approval: false,
    };
  }

  checkAgentPermission(agentId: AgentId, scope: string): boolean {
    const permissions = this.agentPermissions.get(agentId);
    if (!permissions) return false;
    return permissions.includes(scope) || permissions.includes('*');
  }

  grantPermission(agentId: AgentId, scope: string): void {
    const current = this.agentPermissions.get(agentId) ?? [];
    if (!current.includes(scope)) {
      current.push(scope);
      this.agentPermissions.set(agentId, current);
    }
  }

  revokePermission(agentId: AgentId, scope: string): void {
    const current = this.agentPermissions.get(agentId);
    if (!current) return;
    this.agentPermissions.set(agentId, current.filter((s) => s !== scope));
  }

  getAgentPermissions(agentId: AgentId): string[] | undefined {
    return this.agentPermissions.get(agentId);
  }

  recordSpend(usd: number): void {
    this.dailySpendUsd += usd;
    this.monthlySpendUsd += usd;
  }

  resetDailySpend(): void {
    this.dailySpendUsd = 0;
  }

  resetMonthlySpend(): void {
    this.monthlySpendUsd = 0;
  }

  getSpending() {
    return {
      dailyUsd: this.dailySpendUsd,
      monthlyUsd: this.monthlySpendUsd,
      dailyLimitUsd: this.config.maxDailySpendUsd,
      monthlyLimitUsd: this.config.maxMonthlySpendUsd,
    };
  }

  getConfig(): PolicyConfig {
    return { ...this.config };
  }
}

export const policyEngine = new PolicyEngine();
