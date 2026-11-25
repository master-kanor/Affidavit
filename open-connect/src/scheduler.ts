// Open Connect AI Factory — Task Scheduler
// Scheduled triggers and event-driven workflow execution.

import type { TaskId } from './types.js';
import { orchestrator } from './orchestrator.js';
import { aiGateway } from './ai-gateway.js';

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  agentId: string;
  taskName: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  failureCount: number;
}

export interface EventSubscription {
  id: string;
  event: string;
  handler: string;
  agentId: string;
  enabled: boolean;
}

export class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private subscriptions: Map<string, EventSubscription> = new Map();
  private running = false;
  private intervalId: NodeJS.Timeout | null = null;
  private tickIntervalMs = 30000; // Check every 30 seconds

  constructor(tickIntervalMs: number = 30000) {
    this.tickIntervalMs = tickIntervalMs;
  }

  registerJob(job: Omit<ScheduledJob, 'lastRun' | 'nextRun' | 'runCount' | 'failureCount'>): void {
    const scheduledJob: ScheduledJob = {
      ...job,
      lastRun: undefined,
      nextRun: this.calculateNextRun(job.cronExpression),
      runCount: 0,
      failureCount: 0,
    };
    this.jobs.set(job.id, scheduledJob);
  }

  unregisterJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  listJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  enableJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.enabled = true;
    job.nextRun = this.calculateNextRun(job.cronExpression);
    return true;
  }

  disableJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    job.enabled = false;
    return true;
  }

  registerSubscription(sub: Omit<EventSubscription, 'id'>): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.subscriptions.set(id, { ...sub, id });
    return id;
  }

  unregisterSubscription(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  listSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  async triggerEvent(event: string, data: any): Promise<void> {
    const matching = Array.from(this.subscriptions.values()).filter(
      (s) => s.event === event && s.enabled
    );

    for (const sub of matching) {
      try {
        // Dispatch task to the subscribed agent
        await orchestrator.createTask(
          `Event: ${sub.event}`,
          sub.agentId,
          {
            timeoutSeconds: 300,
            maxRetries: 3,
            requiresApproval: false,
          }
        );
        console.log(`[Scheduler] Event ${event} dispatched to agent ${sub.agentId}`);
      } catch (err) {
        console.error(`[Scheduler] Failed to dispatch event ${event}:`, err);
      }
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[Scheduler] Starting scheduler (tick: ${this.tickIntervalMs}ms)`);
    this.tick();
    this.intervalId = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[Scheduler] Stopped');
  }

  private tick(): void {
    const now = new Date();

    for (const job of this.jobs.values()) {
      if (!job.enabled || !job.nextRun) continue;

      if (now >= job.nextRun) {
        this.executeJob(job);
      }
    }
  }

  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      console.log(`[Scheduler] Executing job: ${job.name}`);

      await orchestrator.createTask(job.taskName, job.agentId, {
        timeoutSeconds: 600,
        maxRetries: 3,
        requiresApproval: false,
      });

      job.lastRun = new Date();
      job.runCount++;
      job.nextRun = this.calculateNextRun(job.cronExpression);
    } catch (err) {
      job.failureCount++;
      console.error(`[Scheduler] Job ${job.name} failed:`, err);
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser: supports "*/N * * * *" (every N minutes) and "0 H * * *" (daily at H)
    const now = new Date();
    const parts = cronExpression.trim().split(/\s+/);

    if (parts.length < 5) {
      return new Date(now.getTime() + 60 * 60 * 1000); // Default: 1 hour
    }

    const [minPart] = parts;

    if (minPart.startsWith('*/')) {
      const interval = parseInt(minPart.slice(2), 10) || 60;
      return new Date(now.getTime() + interval * 60 * 1000);
    }

    if (minPart === '0') {
      const hourPart = parts[1];
      const hour = parseInt(hourPart, 10);
      const next = new Date(now);
      next.setHours(hour, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    // Default: 1 hour
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  getStatus() {
    const jobsArray = Array.from(this.jobs.values());
    return {
      running: this.running,
      tickIntervalMs: this.tickIntervalMs,
      totalJobs: jobsArray.length,
      enabledJobs: jobsArray.filter((j) => j.enabled).length,
      totalSubscriptions: this.subscriptions.size,
    };
  }
}

export const scheduler = new Scheduler();
