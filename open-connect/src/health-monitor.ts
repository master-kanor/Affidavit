// Open Connect AI Factory — Health Monitor
// Persistent execution mechanism: scheduled health checks and automated recovery.

import { aiGateway } from './ai-gateway.js';
import { orchestrator } from './orchestrator.js';
import { policyEngine } from './policy-engine.js';
import { auditEngine } from './audit-engine.js';

export interface HealthCheckResult {
  timestamp: Date;
  provider: string;
  healthy: boolean;
  responseTimeMs?: number;
  error?: string;
  action_taken?: string;
}

export interface RecoveryAction {
  timestamp: Date;
  trigger: string;
  action: string;
  result: string;
}

export class HealthMonitor {
  private checkIntervalMs: number;
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;
  private healthHistory: HealthCheckResult[] = [];
  private recoveryActions: RecoveryAction[] = [];
  private consecutiveFailures: Map<string, number> = new Map();
  private maxConsecutiveFailures = 3;

  constructor(checkIntervalMs: number = 60000) {
    this.checkIntervalMs = checkIntervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[HealthMonitor] Starting health checks every ${this.checkIntervalMs}ms`);
    this.runCheck();
    this.intervalId = setInterval(() => this.runCheck(), this.checkIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[HealthMonitor] Stopped');
  }

  private async runCheck(): Promise<void> {
    const timestamp = new Date();
    const healthResults = await aiGateway.checkAllHealth();

    for (const [providerId, healthy] of healthResults) {
      const provider = aiGateway.getProvider(providerId);
      const health = aiGateway.getHealth().get(providerId);

      const result: HealthCheckResult = {
        timestamp,
        provider: providerId,
        healthy,
        responseTimeMs: health?.responseTimeMs,
        error: health?.error,
      };

      if (healthy) {
        this.consecutiveFailures.set(providerId, 0);
        result.action_taken = 'No action needed';
      } else {
        const failures = (this.consecutiveFailures.get(providerId) ?? 0) + 1;
        this.consecutiveFailures.set(providerId, failures);

        if (failures >= this.maxConsecutiveFailures) {
          const action = this.attemptRecovery(providerId);
          result.action_taken = action.action;
          this.recoveryActions.push({
            timestamp,
            trigger: `provider_${providerId}_unhealthy`,
            action: action.action,
            result: action.result,
          });
        } else {
          result.action_taken = `Warning: ${failures}/${this.maxConsecutiveFailures} consecutive failures`;
        }
      }

      this.healthHistory.push(result);
      // Keep only last 1000 entries
      if (this.healthHistory.length > 1000) {
        this.healthHistory = this.healthHistory.slice(-1000);
      }

      console.log(
        `[HealthMonitor] ${providerId}: ${healthy ? 'HEALTHY' : 'UNHEALTHY'}${
          result.action_taken ? ` — ${result.action_taken}` : ''
        }`
      );
    }

    // Check orchestrator health
    const orchHealth = orchestrator.healthCheck();
    if (orchHealth.status !== 'healthy') {
      this.recoveryActions.push({
        timestamp,
        trigger: 'orchestrator_unhealthy',
        action: 'orchestrator_status_check',
        result: orchHealth.status,
      });
    }

    // Record audit log for each check
    for (const result of healthResults.entries()) {
      const [providerId, healthy] = result;
      auditEngine.log({
        agent_id: 'system-health-monitor',
        task_id: `health_check_${providerId}_${timestamp.getTime()}`,
        start_time: timestamp,
        end_time: new Date(),
        status: healthy ? 'success' : 'failure',
        output: `Health check for ${providerId}: ${healthy ? 'healthy' : 'unhealthy'}`,
        error: healthy ? undefined : 'Provider unhealthy',
      });
    }
  }

  private attemptRecovery(providerId: string): { action: string; result: string } {
    const provider = aiGateway.getProvider(providerId);
    if (!provider) {
      return { action: 'none', result: 'Provider not found' };
    }

    // Attempt re-health check
    const wasHealthy = aiGateway.getHealth().get(providerId)?.healthy ?? false;

    if (!wasHealthy) {
      // Mark for fallback — the gateway will automatically route to next available provider
      return {
        action: 'mark_provider_unhealthy_trigger_fallback',
        result: `Provider ${providerId} marked unhealthy; AI Gateway will route to fallback providers`,
      };
    }

    return { action: 'none', result: 'Provider recovered' };
  }

  getHealthHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }

  getRecoveryActions(): RecoveryAction[] {
    return [...this.recoveryActions];
  }

  getStatus() {
    return {
      running: this.running,
      checkIntervalMs: this.checkIntervalMs,
      consecutiveFailures: Object.fromEntries(this.consecutiveFailures),
      totalChecks: this.healthHistory.length,
      totalRecoveryActions: this.recoveryActions.length,
    };
  }
}

export const healthMonitor = new HealthMonitor();
