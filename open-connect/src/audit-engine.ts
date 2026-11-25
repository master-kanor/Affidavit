// Open Connect AI Factory — Audit Engine
// Execution evidence, logs, outcomes, and operational history.

import type { ExecutionLog, AgentId, TaskId, SkillId, ToolId } from './types.js';

export interface AuditEntry extends ExecutionLog {
  id: string;
}

export interface AuditStats {
  totalExecutions: number;
  successes: number;
  failures: number;
  partial: number;
  timedOut: number;
  cancelled: number;
  totalCostUsd: number;
  totalTokens: number;
  successRate: number;
}

export class AuditEngine {
  private logs: ExecutionLog[] = [];
  private maxRetentionDays = 90;

  log(entry: Omit<ExecutionLog, 'id'>): string {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const logEntry: ExecutionLog = {
      id,
      ...entry,
    };
    this.logs.push(logEntry);
    this.enforceRetention();
    return id;
  }

  getLogs(limit?: number, agentId?: AgentId): ExecutionLog[] {
    let filtered = this.logs;
    if (agentId) {
      filtered = filtered.filter((l) => l.agent_id === agentId);
    }
    filtered = filtered.sort((a, b) => b.start_time.getTime() - a.start_time.getTime());
    if (limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }

  getLog(id: string): ExecutionLog | undefined {
    return this.logs.find((l) => l.id === id);
  }

  getStats(): AuditStats {
    const total = this.logs.length;
    const successes = this.logs.filter((l) => l.status === 'success').length;
    const failures = this.logs.filter((l) => l.status === 'failure').length;
    const partial = this.logs.filter((l) => l.status === 'partial').length;
    const timedOut = this.logs.filter((l) => l.status === 'timed_out').length;
    const cancelled = this.logs.filter((l) => l.status === 'cancelled').length;
    const totalCost = this.logs.reduce((sum, l) => sum + (l.cost_usd ?? 0), 0);
    const totalTokens = this.logs.reduce((sum, l) => sum + (l.tokens_used ?? 0), 0);

    return {
      totalExecutions: total,
      successes,
      failures,
      partial,
      timedOut,
      cancelled,
      totalCostUsd: totalCost,
      totalTokens,
      successRate: total > 0 ? successes / total : 0,
    };
  }

  getLogsByStatus(status: ExecutionLog['status']): ExecutionLog[] {
    return this.logs.filter((l) => l.status === status);
  }

  getLogsByAgent(agentId: AgentId): ExecutionLog[] {
    return this.logs.filter((l) => l.agent_id === agentId);
  }

  private enforceRetention(): void {
    const cutoff = Date.now() - this.maxRetentionDays * 24 * 60 * 60 * 1000;
    this.logs = this.logs.filter((l) => l.start_time.getTime() > cutoff);
  }

  setRetentionDays(days: number): void {
    this.maxRetentionDays = days;
    this.enforceRetention();
  }
}

export const auditEngine = new AuditEngine();
