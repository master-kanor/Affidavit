// Open Connect AI Factory — Shared Types

export type AgentId = string;
export type ToolId = string;
export type SkillId = string;
export type TaskId = string;
export type VaultId = string;
export type ScopeId = string;

export interface Agent {
  id: AgentId;
  name: string;
  type: string;
  role: string;
  provider: string;
  capabilities: string[];
  permissions: string[];
  status: 'active' | 'available' | 'inactive';
  free_tier: boolean;
  default_model?: string;
  quota_tracking?: boolean;
}

export interface Tool {
  id: ToolId;
  name: string;
  type: string;
  category: string;
  endpoint?: string;
  auth_method: string;
  capabilities: string[];
  status: 'configured' | 'available' | 'pending_credentials' | 'active';
  free_tier: boolean;
}

export interface Skill {
  id: SkillId;
  name: string;
  category: string;
  version: string;
  agent: AgentId;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    action: string;
    timeout: number;
    required: boolean;
    depends_on?: string[];
    outputs: string[];
  }>;
  prerequisites: string[];
  outputs: string[];
}

export interface Task {
  id: TaskId;
  name: string;
  agent_id: AgentId;
  skill_id?: SkillId;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timed_out';
  started_at?: Date;
  completed_at?: Date;
  output?: string;
  error?: string;
  cost_usd?: number;
  tokens_used?: number;
  retry_count: number;
  max_retries: number;
  timeout_seconds: number;
  requires_approval: boolean;
  approved: boolean;
}

export interface CredentialVault {
  id: VaultId;
  name: string;
  type: string;
  provider: string;
  role: string;
  status: 'active' | 'configured' | 'available' | 'pending_integration';
}

export interface CredentialScope {
  scope_id: ScopeId;
  vault_id: VaultId;
  agent_ids: AgentId[];
  expiration_days: number;
}

export interface ExecutionLog {
  id: string;
  agent_id: AgentId;
  task_id: TaskId;
  skill_id?: SkillId;
  tool_id?: ToolId;
  start_time: Date;
  end_time?: Date;
  status: 'success' | 'failure' | 'partial' | 'timed_out' | 'cancelled';
  output?: string;
  error?: string;
  cost_usd?: number;
  tokens_used?: number;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  requires_approval: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  auth_method: string;
  free_tier: boolean;
  quota: string;
  models: Array<{
    id: string;
    name: string;
    type: string;
    context_length: number;
    cost_per_1k_tokens: number;
  }>;
  capabilities: string[];
  status: 'active' | 'available' | 'unhealthy';
  priority: number;
  health_check?: string;
}
