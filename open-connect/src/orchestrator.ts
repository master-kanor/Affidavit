// Open Connect AI Factory — Orchestrator Runtime
// Task dispatch, concurrency management, execution tracking.

import type { Agent, Task, ExecutionLog, AgentId, TaskId, SkillId } from './types.js';
import { AuditEngine } from './audit-engine.js';
import { PolicyEngine } from './policy-engine.js';

export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  defaultTimeoutSeconds: number;
  maxRetries: number;
  preferredAgent: AgentId;
  fallbackAgents: AgentId[];
  boundedRepairAttempts: number;
}

export class Orchestrator {
  private config: OrchestratorConfig;
  private agents: Map<AgentId, Agent> = new Map();
  private tasks: Map<TaskId, Task> = new Map();
  private executionLog: AuditEngine;
  private policyEngine: PolicyEngine;
  private runningCount = 0;
  private taskQueue: TaskId[] = [];

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 5,
      defaultTimeoutSeconds: config.defaultTimeoutSeconds ?? 600,
      maxRetries: config.maxRetries ?? 3,
      preferredAgent: config.preferredAgent ?? 'kilo-code',
      fallbackAgents: config.fallbackAgents ?? ['open-code', 'open-router-router', 'nvidia-inference'],
      boundedRepairAttempts: config.boundedRepairAttempts ?? 3,
    };
    this.executionLog = new AuditEngine();
    this.policyEngine = new PolicyEngine();
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: AgentId): Agent | undefined {
    return this.agents.get(id);
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async createTask(
    name: string,
    agentId: AgentId,
    options: {
      skillId?: SkillId;
      timeoutSeconds?: number;
      maxRetries?: number;
      requiresApproval?: boolean;
    } = {}
  ): Promise<TaskId> {
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const policy = this.policyEngine.evaluate(agentId, name, 0, options.requiresApproval ?? false);

    const task: Task = {
      id,
      name,
      agent_id: agentId,
      skill_id: options.skillId,
      status: policy.requires_approval ? 'pending' : 'pending',
      retry_count: 0,
      max_retries: options.maxRetries ?? this.config.maxRetries,
      timeout_seconds: options.timeoutSeconds ?? this.config.defaultTimeoutSeconds,
      requires_approval: policy.requires_approval,
      approved: !policy.requires_approval,
    };

    this.tasks.set(id, task);

    if (!policy.requires_approval) {
      this.enqueueTask(id);
    }

    return id;
  }

  approveTask(taskId: TaskId): boolean {
    const task = this.tasks.get(taskId);
    if (!task || !task.requires_approval) return false;
    task.approved = true;
    this.enqueueTask(taskId);
    return true;
  }

  private enqueueTask(taskId: TaskId): void {
    this.taskQueue.push(taskId);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.runningCount < this.config.maxConcurrentTasks && this.taskQueue.length > 0) {
      const taskId = this.taskQueue.shift()!;
      if (this.tasks.get(taskId)?.approved === false) continue;
      this.runningCount++;
      this.executeTask(taskId).finally(() => {
        this.runningCount--;
        this.processQueue();
      });
    }
  }

  private async executeTask(taskId: TaskId): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const agent = this.agents.get(task.agent_id);
    if (!agent) {
      task.status = 'failed';
      task.error = `Agent ${task.agent_id} not found`;
      task.completed_at = new Date();
      await this.executionLog.log({
        agent_id: task.agent_id,
        task_id: taskId,
        start_time: task.started_at ?? new Date(),
        end_time: new Date(),
        status: 'failure',
        error: task.error,
      });
      return;
    }

    task.status = 'running';
    task.started_at = new Date();

    const startTime = Date.now();

    try {
      // Simulate agent execution with a bounded timeout
      const result = await this.runAgentTask(agent, task);

      task.status = 'completed';
      task.output = result.output;
      task.completed_at = new Date();

      await this.executionLog.log({
        agent_id: agent.id,
        task_id: taskId,
        skill_id: task.skill_id,
        start_time: task.started_at,
        end_time: task.completed_at,
        status: 'success',
        output: result.output,
        cost_usd: result.cost_usd,
        tokens_used: result.tokens_used,
      });
    } catch (err) {
      task.retry_count++;
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (task.retry_count <= task.max_retries && this.config.boundedRepairAttempts > 0) {
        // Bounded repair attempt
        task.status = 'pending';
        await new Promise((resolve) => setTimeout(resolve, 1000 * task.retry_count));
        this.enqueueTask(taskId);
        return;
      }

      task.status = 'failed';
      task.error = errorMsg;
      task.completed_at = new Date();

      await this.executionLog.log({
        agent_id: agent.id,
        task_id: taskId,
        skill_id: task.skill_id,
        start_time: task.started_at,
        end_time: task.completed_at,
        status: 'failure',
        error: errorMsg,
      });
    }
  }

  private async runAgentTask(agent: Agent, task: Task): Promise<{
    output: string;
    cost_usd?: number;
    tokens_used?: number;
  }> {
    // Simulate task execution based on agent capabilities
    const duration = Math.min(task.timeout_seconds, 30) * 100;
    await new Promise((resolve) => setTimeout(resolve, Math.min(duration, 5000)));

    return {
      output: `Task "${task.name}" completed by ${agent.name} (${agent.provider})`,
      cost_usd: agent.free_tier ? 0 : 0.001,
      tokens_used: agent.free_tier ? 100 : 500,
    };
  }

  getTask(taskId: TaskId): Task | undefined {
    return this.tasks.get(taskId);
  }

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      running: tasks.filter((t) => t.status === 'running').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      cancelled: tasks.filter((t) => t.status === 'cancelled').length,
      runningConcurrent: this.runningCount,
      queueLength: this.taskQueue.length,
    };
  }

  async getAuditLog(): Promise<ExecutionLog[]> {
    return this.executionLog.getLogs();
  }

  healthCheck(): { status: string; agents: number; tasks: number } {
    return {
      status: 'healthy',
      agents: this.agents.size,
      tasks: this.tasks.size,
    };
  }
}

export const orchestrator = new Orchestrator();
