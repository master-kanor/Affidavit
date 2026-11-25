// Open Connect AI Factory — AI Gateway
// Model selection, fallback, quotas, and provider health.

import type { AIProvider } from './types.js';

export interface ProviderHealth {
  id: string;
  healthy: boolean;
  lastChecked: Date;
  responseTimeMs?: number;
  error?: string;
}

export interface QuotaStatus {
  providerId: string;
  tier: string;
  limit: string | number;
  currentUsage: number;
  resetPeriod: string | null;
  lastChecked: Date | null;
  exhausted: boolean;
}

export interface AIRequest {
  prompt: string;
  model?: string;
  providerId?: string;
  requireFree?: boolean;
  maxCostUsd?: number;
}

export interface AIResponse {
  text: string;
  providerId: string;
  modelId: string;
  costUsd: number;
  tokensUsed: number;
  fallbackUsed: boolean;
}

export class AIGateway {
  private providers: Map<string, AIProvider> = new Map();
  private health: Map<string, ProviderHealth> = new Map();
  private quotas: Map<string, QuotaStatus> = new Map();
  private fallbackChain: string[] = [];
  private maxFreeQuotaUsd: number;
  private requireApprovalForPaid: boolean;

  constructor(options: {
    providers?: AIProvider[];
    fallbackChain?: string[];
    maxFreeQuotaUsd?: number;
    requireApprovalForPaid?: boolean;
  } = {}) {
    this.maxFreeQuotaUsd = options.maxFreeQuotaUsd ?? 0;
    this.requireApprovalForPaid = options.requireApprovalForPaid ?? true;

    if (options.providers) {
      for (const p of options.providers) {
        this.registerProvider(p);
      }
    }

    this.fallbackChain = options.fallbackChain ?? [
      'kilo-code',
      'open-code',
      'openrouter',
      'nvidia',
    ];
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    this.health.set(provider.id, {
      id: provider.id,
      healthy: provider.status === 'active',
      lastChecked: new Date(),
    });
    this.quotas.set(provider.id, {
      providerId: provider.id,
      tier: provider.free_tier ? 'free' : 'paid',
      limit: provider.quota,
      currentUsage: 0,
      resetPeriod: null,
      lastChecked: null,
      exhausted: false,
    });
  }

  async checkHealth(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    const start = Date.now();
    let healthy = false;
    let error: string | undefined;

    try {
      // Simulate health check endpoint
      await new Promise((resolve) => setTimeout(resolve, 50));
      healthy = provider.status !== 'unhealthy';
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const responseTimeMs = Date.now() - start;

    this.health.set(providerId, {
      id: providerId,
      healthy,
      lastChecked: new Date(),
      responseTimeMs,
      error,
    });

    return healthy;
  }

  async checkAllHealth(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const id of this.providers.keys()) {
      results.set(id, await this.checkHealth(id));
    }
    return results;
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getHealth(): Map<string, ProviderHealth> {
    return new Map(this.health);
  }

  isHealthy(id: string): boolean {
    const h = this.health.get(id);
    // Providers that haven't been health-checked yet are assumed healthy
    if (!h) return true;
    return h.healthy;
  }

  selectProvider(options: {
    requireFree?: boolean;
    maxCostUsd?: number;
    excludeUnhealthy?: boolean;
  } = {}): AIProvider | null {
    const { requireFree = true, maxCostUsd, excludeUnhealthy = true } = options;

    // Try fallback chain in order
    for (const providerId of this.fallbackChain) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      // Skip if not healthy and we exclude unhealthy
      if (excludeUnhealthy && !this.isHealthy(providerId)) continue;

      // Skip paid providers if requireFree
      if (requireFree && !provider.free_tier) continue;

      // Skip if exceeds max cost
      if (maxCostUsd !== undefined) {
        const modelCost = provider.models[0]?.cost_per_1k_tokens ?? 0;
        if (modelCost > maxCostUsd) continue;
      }

      return provider;
    }

    return null;
  }

  async executeRequest(request: AIRequest): Promise<AIResponse> {
    const requireFree = request.requireFree ?? true;
    const maxCostUsd = request.maxCostUsd ?? this.maxFreeQuotaUsd;

    let fallbackUsed = false;
    let lastError: string | undefined;

    // Try primary provider first, then fallback chain
    const candidates: string[] = request.providerId
      ? [request.providerId, ...this.fallbackChain.filter((p) => p !== request.providerId)]
      : [...this.fallbackChain];

    // Filter to only registered providers
    const registeredCandidates = candidates.filter((pid) => this.providers.has(pid));

    if (registeredCandidates.length === 0) {
      throw new Error(
        'No AI providers registered. Register a provider via POST /api/ai/providers first.'
      );
    }

    let attemptedRegistered = false;

    for (const providerId of registeredCandidates) {
      const provider = this.providers.get(providerId)!;

      // Skip unhealthy providers
      if (!this.isHealthy(providerId)) {
        lastError = `Provider ${providerId} is unhealthy`;
        fallbackUsed = true;
        continue;
      }

      // Skip paid if requireFree
      if (requireFree && !provider.free_tier) {
        lastError = `Provider ${providerId} is paid and free-only mode is enabled`;
        fallbackUsed = true;
        continue;
      }

      // Check quota exhaustion
      const quota = this.quotas.get(providerId);
      if (quota?.exhausted) {
        lastError = `Provider ${providerId} quota exhausted`;
        fallbackUsed = true;
        continue;
      }

      attemptedRegistered = true;

      // Attempt execution
      try {
        const result = await this.callProvider(provider, request);

        // Update quota
        if (quota) {
          quota.currentUsage += result.tokensUsed;
          quota.lastChecked = new Date();
        }

        return {
          ...result,
          providerId,
          fallbackUsed,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        fallbackUsed = true;
        continue;
      }
    }

    if (!attemptedRegistered) {
      throw new Error(
        `No available AI provider matches criteria (requireFree=${requireFree}). ` +
          `Last skip reason: ${lastError ?? 'unknown'}`
      );
    }

    throw new Error(
      `All AI providers failed. Last error: ${lastError ?? 'unknown'}`
    );
  }

  private async callProvider(provider: AIProvider, request: AIRequest): Promise<{
    text: string;
    modelId: string;
    costUsd: number;
    tokensUsed: number;
  }> {
    // Simulate provider call
    await new Promise((resolve) => setTimeout(resolve, 100));

    const model = provider.models[0];
    const tokensUsed = Math.ceil(request.prompt.length / 4);
    const costUsd = (tokensUsed / 1000) * (model?.cost_per_1k_tokens ?? 0);

    return {
      text: `Response from ${provider.name} (${model?.name ?? 'default'}): ${request.prompt.slice(0, 50)}...`,
      modelId: model?.id ?? 'default',
      costUsd,
      tokensUsed,
    };
  }

  getQuotaStatus(providerId: string): QuotaStatus | undefined {
    return this.quotas.get(providerId);
  }

  listQuotas(): QuotaStatus[] {
    return Array.from(this.quotas.values());
  }

  updateQuota(providerId: string, currentUsage: number, exhausted: boolean): void {
    const quota = this.quotas.get(providerId);
    if (quota) {
      quota.currentUsage = currentUsage;
      quota.exhausted = exhausted;
      quota.lastChecked = new Date();
    }
  }

  getFallbackChain(): string[] {
    return [...this.fallbackChain];
  }
}

export const aiGateway = new AIGateway();
