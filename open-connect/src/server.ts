// Open Connect AI Factory — HTTP Server
// Express server with REST API for orchestrator, credential broker, AI gateway, audit.

import express from 'express';
import cors from 'cors';
import { orchestrator } from './orchestrator.js';
import { credentialBroker } from './credential-broker.js';
import { aiGateway } from './ai-gateway.js';
import { auditEngine } from './audit-engine.js';
import { policyEngine } from './policy-engine.js';
import type { Agent, AIProvider } from './types.js';

// Default AI providers pre-registered on startup (free-tier first)
const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'kilo-code',
    name: 'Kilo Code',
    type: 'ide_agent',
    endpoint: 'local://kilo',
    auth_method: 'session_token',
    free_tier: true,
    quota: 'unlimited',
    models: [
      {
        id: 'kilo-auto/free',
        name: 'Kilo Auto Free',
        type: 'chat',
        context_length: 128000,
        cost_per_1k_tokens: 0,
      },
    ],
    capabilities: ['code_generation', 'debugging', 'testing', 'file_editing'],
    status: 'active',
    priority: 1,
  },
  {
    id: 'open-code',
    name: 'Open Code',
    type: 'cli_agent',
    endpoint: 'local://open-code',
    auth_method: 'session_token',
    free_tier: true,
    quota: 'unlimited',
    models: [
      {
        id: 'open-code/default',
        name: 'Open Code Default',
        type: 'chat',
        context_length: 128000,
        cost_per_1k_tokens: 0,
      },
    ],
    capabilities: ['code_generation', 'shell_execution', 'git_operations'],
    status: 'available',
    priority: 2,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'gateway',
    endpoint: 'https://openrouter.ai/api/v1',
    auth_method: 'bearer_token',
    free_tier: true,
    quota: 'check_required',
    models: [
      {
        id: 'openrouter/auto',
        name: 'OpenRouter Auto',
        type: 'chat',
        context_length: 128000,
        cost_per_1k_tokens: 0,
      },
    ],
    capabilities: ['multi_model_routing', 'fallback_routing'],
    status: 'available',
    priority: 3,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    type: 'inference',
    endpoint: 'https://integrate.api.nvidia.com/v1',
    auth_method: 'bearer_token',
    free_tier: true,
    quota: 'check_required',
    models: [
      {
        id: 'nvidia/nemotron',
        name: 'NVIDIA Nemotron',
        type: 'chat',
        context_length: 128000,
        cost_per_1k_tokens: 0,
      },
    ],
    capabilities: ['llm_inference', 'code_generation'],
    status: 'available',
    priority: 4,
  },
];

for (const p of DEFAULT_PROVIDERS) {
  aiGateway.registerProvider(p);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const allowedOrigins = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/.*\.manus\.computer$/,
  /^https?:\/\/.*\.manus\.space$/,
  /^https?:\/\/masterkanorcase\.online$/,
  /^https?:\/\/admin\.masterkanorcase\.online$/,
];

app.use(
  cors({
    origin: (_origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);

// ============ Health ============
app.get('/health', (_req, res) => {
  const health = orchestrator.healthCheck();
  res.json({
    ...health,
    timestamp: new Date().toISOString(),
    service: 'open-connect-ai-factory',
    version: '1.0.0',
    status: 'healthy',
  });
});

// ============ Orchestrator ============
app.get('/api/orchestrator/stats', (_req, res) => {
  res.json(orchestrator.getStats());
});

app.get('/api/orchestrator/agents', (_req, res) => {
  res.json(orchestrator.listAgents());
});

app.post('/api/orchestrator/agents', (req, res) => {
  const agent = req.body as Agent;
  orchestrator.registerAgent(agent);
  res.json({ success: true, agent_id: agent.id });
});

app.get('/api/orchestrator/tasks', (_req, res) => {
  res.json(orchestrator.listTasks());
});

app.post('/api/orchestrator/tasks', (req, res) => {
  const { name, agent_id, skill_id, timeout_seconds, max_retries, requires_approval } = req.body;

  if (!name || !agent_id) {
    return res.status(400).json({ error: 'name and agent_id are required' });
  }

  const taskId = orchestrator.createTask(name, agent_id, {
    skillId: skill_id,
    timeoutSeconds: timeout_seconds,
    maxRetries: max_retries,
    requiresApproval: requires_approval ?? false,
  });

  res.json({ task_id: taskId, status: 'pending' });
});

app.get('/api/orchestrator/tasks/:id', (req, res) => {
  const task = orchestrator.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

app.post('/api/orchestrator/tasks/:id/approve', (req, res) => {
  const approved = orchestrator.approveTask(req.params.id);
  if (!approved) {
    return res.status(400).json({ error: 'Task not found or does not require approval' });
  }
  res.json({ success: true, task_id: req.params.id });
});

app.get('/api/orchestrator/audit', async (_req, res) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : undefined;
  const logs = await orchestrator.getAuditLog();
  res.json(limit ? logs.slice(0, limit) : logs);
});

// ============ Credential Broker ============
app.get('/api/credentials/vaults', (_req, res) => {
  res.json(credentialBroker.listVaults());
});

app.get('/api/credentials/scopes', (_req, res) => {
  res.json(credentialBroker.listScopes());
});

app.post('/api/credentials/request', (req, res) => {
  const { agent_id, vault_id, scope_id } = req.body;

  if (!agent_id || !vault_id || !scope_id) {
    return res.status(400).json({ error: 'agent_id, vault_id, and scope_id are required' });
  }

  const response = credentialBroker.requestCredential({ agent_id, vault_id, scope_id });
  res.json({ credential_request_id: `cred_${Date.now()}`, ...response });
});

app.get('/api/credentials/access-log', (_req, res) => {
  res.json(credentialBroker.getAccessLog());
});

// ============ AI Gateway ============
app.get('/api/ai/providers', (_req, res) => {
  res.json(aiGateway.listProviders());
});

app.post('/api/ai/providers', (req, res) => {
  const provider = req.body as AIProvider;
  aiGateway.registerProvider(provider);
  res.json({ success: true, provider_id: provider.id });
});

app.get('/api/ai/health', async (_req, res) => {
  const results = await aiGateway.checkAllHealth();
  const healthMap = aiGateway.getHealth();
  const health = Array.from(healthMap.entries()).map(([id, h]) => ({
    ...h,
    id,
  }));
  res.json({ providers: health, all_healthy: Array.from(results.values()).every((h) => h) });
});

app.get('/api/ai/health/:providerId', async (req, res) => {
  const healthy = await aiGateway.checkHealth(req.params.providerId);
  res.json({ provider_id: req.params.providerId, healthy });
});

app.get('/api/ai/select', (req, res) => {
  const requireFree = req.query.require_free !== 'false';
  const maxCostUsd = req.query.max_cost_usd ? parseFloat(req.query.max_cost_usd as string) : undefined;
  const provider = aiGateway.selectProvider({ requireFree, maxCostUsd });
  if (!provider) {
    return res.status(404).json({ error: 'No available provider matches criteria' });
  }
  res.json(provider);
});

app.post('/api/ai/execute', async (req, res) => {
  const { prompt, model, provider_id, require_free, max_cost_usd } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await aiGateway.executeRequest({
      prompt,
      model,
      providerId: provider_id,
      requireFree: require_free ?? true,
      maxCostUsd: max_cost_usd,
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get('/api/ai/quotas', (_req, res) => {
  res.json(aiGateway.listQuotas());
});

// ============ Policy Engine ============
app.get('/api/policy/config', (_req, res) => {
  res.json(policyEngine.getConfig());
});

app.get('/api/policy/spending', (_req, res) => {
  res.json(policyEngine.getSpending());
});

app.post('/api/policy/evaluate', (req, res) => {
  const { agent_id, action, estimated_cost_usd, requires_approval } = req.body;
  if (!agent_id || !action) {
    return res.status(400).json({ error: 'agent_id and action are required' });
  }
  const result = policyEngine.evaluate(agent_id, action, estimated_cost_usd ?? 0, requires_approval ?? false);
  res.json(result);
});

app.get('/api/policy/permissions/:agentId', (req, res) => {
  const permissions = policyEngine.getAgentPermissions(req.params.agentId);
  res.json({ agent_id: req.params.agentId, permissions: permissions ?? [] });
});

// ============ Audit Engine ============
app.get('/api/audit/stats', (_req, res) => {
  res.json(auditEngine.getStats());
});

app.get('/api/audit/logs', (_req, res) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : undefined;
  const agentId = _req.query.agent_id as string | undefined;
  res.json(auditEngine.getLogs(limit, agentId));
});

// ============ Start Server ============
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Open Connect AI Factory running on http://0.0.0.0:${PORT}/`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
  console.log(`API: http://0.0.0.0:${PORT}/api/`);
});

export { app };
