// Open Connect AI Factory — Credential Broker
// Scoped runtime access to credentials without exposing raw secrets.

import type { CredentialVault, CredentialScope, VaultId, ScopeId, AgentId } from './types.js';

export interface VaultEntry {
  id: VaultId;
  name: string;
  type: string;
  provider: string;
  role: string;
  status: 'active' | 'configured' | 'available' | 'pending_integration';
  secret_ref: string; // Reference, not the actual secret
}

export interface ScopeAssignment {
  scope_id: ScopeId;
  vault_id: VaultId;
  agent_ids: AgentId[];
  expiration_days: number;
  created_at: Date;
  last_accessed?: Date;
}

export interface CredentialRequest {
  agent_id: AgentId;
  vault_id: VaultId;
  scope_id: ScopeId;
}

export interface CredentialResponse {
  authorized: boolean;
  secret_ref?: string;
  scope?: ScopeId;
  expires_at?: Date;
  reason?: string;
}

export class CredentialBroker {
  private vaults: Map<VaultId, VaultEntry> = new Map();
  private scopes: Map<ScopeId, ScopeAssignment> = new Map();
  private accessLog: Array<{
    agent_id: AgentId;
    vault_id: VaultId;
    scope_id: ScopeId;
    timestamp: Date;
    authorized: boolean;
  }> = [];

  constructor() {
    this.initializeDefaultVaults();
    this.initializeDefaultScopes();
  }

  private initializeDefaultVaults(): void {
    const defaultVaults: VaultEntry[] = [
      {
        id: 'open-connect-credentials',
        name: 'Open Connect Credentials',
        type: 'central_integration_registry',
        provider: 'open_connect',
        role: 'integration_credential_registry_and_broker',
        status: 'active',
        secret_ref: 'ref://open-connect/credentials',
      },
      {
        id: 'composio',
        name: 'Composio',
        type: 'oauth_application_connections',
        provider: 'composio',
        role: 'managed_oauth_and_application_connections',
        status: 'available',
        secret_ref: 'ref://composio/credentials',
      },
      {
        id: 'onepassword',
        name: '1Password',
        type: 'password_vault',
        provider: 'agilebits',
        role: 'infrastructure_and_service_credentials',
        status: 'pending_integration',
        secret_ref: 'ref://1password/vault',
      },
      {
        id: 'proton-pass',
        name: 'Proton Pass',
        type: 'password_vault',
        provider: 'proton',
        role: 'personal_password_vault',
        status: 'pending_integration',
        secret_ref: 'ref://proton-pass/vault',
      },
      {
        id: 'github-secrets',
        name: 'GitHub Secrets',
        type: 'ci_cd_execution_credentials',
        provider: 'github',
        role: 'ci_cd_execution_credentials',
        status: 'configured',
        secret_ref: 'ref://github/secrets',
      },
      {
        id: 'railway-variables',
        name: 'Railway Variables',
        type: 'runtime_secrets',
        provider: 'railway',
        role: 'application_runtime_secrets',
        status: 'configured',
        secret_ref: 'ref://railway/variables',
      },
      {
        id: 'cloudflare-secrets',
        name: 'Cloudflare Secrets',
        type: 'cloudflare_runtime_credentials',
        provider: 'cloudflare',
        role: 'cloudflare_runtime_credentials',
        status: 'configured',
        secret_ref: 'ref://cloudflare/secrets',
      },
      {
        id: 'supabase-vault',
        name: 'Supabase Vault',
        type: 'database_related_secrets',
        provider: 'supabase',
        role: 'database_related_secrets',
        status: 'configured',
        secret_ref: 'ref://supabase/vault',
      },
      {
        id: 'databricks-secrets',
        name: 'Databricks Secrets',
        type: 'data_processing_credentials',
        provider: 'databricks',
        role: 'data_processing_credentials',
        status: 'pending_integration',
        secret_ref: 'ref://databricks/secrets',
      },
    ];

    for (const vault of defaultVaults) {
      this.vaults.set(vault.id, vault);
    }
  }

  private initializeDefaultScopes(): void {
    const defaultScopes: ScopeAssignment[] = [
      {
        scope_id: 'github-actions',
        vault_id: 'github-secrets',
        agent_ids: ['kilo-code', 'custom-agent-factory'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'railway-deploy',
        vault_id: 'railway-variables',
        agent_ids: ['custom-agent-factory'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'cloudflare-runtime',
        vault_id: 'cloudflare-secrets',
        agent_ids: ['custom-agent-factory'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'supabase-database',
        vault_id: 'supabase-vault',
        agent_ids: ['custom-agent-factory'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'sentry-monitoring',
        vault_id: 'open-connect-credentials',
        agent_ids: ['sentry-seer'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'linear-project',
        vault_id: 'open-connect-credentials',
        agent_ids: ['linear-ai'],
        expiration_days: 90,
        created_at: new Date(),
      },
      {
        scope_id: 'notion-documentation',
        vault_id: 'open-connect-credentials',
        agent_ids: ['notion-ai'],
        expiration_days: 90,
        created_at: new Date(),
      },
    ];

    for (const scope of defaultScopes) {
      this.scopes.set(scope.scope_id, scope);
    }
  }

  registerVault(vault: VaultEntry): void {
    this.vaults.set(vault.id, vault);
  }

  registerScope(scope: ScopeAssignment): void {
    this.scopes.set(scope.scope_id, { ...scope, created_at: new Date() });
  }

  requestCredential(request: CredentialRequest): CredentialResponse {
    const scope = this.scopes.get(request.scope_id);
    const vault = this.vaults.get(request.vault_id);

    if (!scope) {
      this.logAccess(request.agent_id, request.vault_id, request.scope_id, false);
      return { authorized: false, reason: `Scope ${request.scope_id} not found` };
    }

    if (!vault) {
      this.logAccess(request.agent_id, request.vault_id, request.scope_id, false);
      return { authorized: false, reason: `Vault ${request.vault_id} not found` };
    }

    if (!scope.agent_ids.includes(request.agent_id)) {
      this.logAccess(request.agent_id, request.vault_id, request.scope_id, false);
      return {
        authorized: false,
        reason: `Agent ${request.agent_id} not authorized for scope ${request.scope_id}`,
      };
    }

    // Check expiration
    const createdAt = scope.created_at.getTime();
    const expirationMs = scope.expiration_days * 24 * 60 * 60 * 1000;
    if (Date.now() - createdAt > expirationMs) {
      this.logAccess(request.agent_id, request.vault_id, request.scope_id, false);
      return { authorized: false, reason: `Scope ${request.scope_id} has expired` };
    }

    this.logAccess(request.agent_id, request.vault_id, request.scope_id, true);

    return {
      authorized: true,
      secret_ref: vault.secret_ref,
      scope: request.scope_id,
      expires_at: new Date(createdAt + expirationMs),
    };
  }

  private logAccess(
    agent_id: AgentId,
    vault_id: VaultId,
    scope_id: ScopeId,
    authorized: boolean
  ): void {
    this.accessLog.push({
      agent_id,
      vault_id,
      scope_id,
      timestamp: new Date(),
      authorized,
    });
  }

  getAccessLog() {
    return this.accessLog;
  }

  listVaults(): VaultEntry[] {
    return Array.from(this.vaults.values());
  }

  listScopes(): ScopeAssignment[] {
    return Array.from(this.scopes.values());
  }

  getVault(id: VaultId): VaultEntry | undefined {
    return this.vaults.get(id);
  }

  getScope(id: ScopeId): ScopeAssignment | undefined {
    return this.scopes.get(id);
  }
}

export const credentialBroker = new CredentialBroker();
