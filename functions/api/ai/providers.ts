import type { PagesFunction } from "@cloudflare/workers-types";
import {
  decryptCredential,
  encryptCredential,
  fingerprintCredential,
} from "../../_shared/credentials";
import type { Env } from "../../_shared/supabase";
import { json, requireAuth } from "../../_shared/supabase";

type Provider = "openrouter" | "nvidia" | "ollama" | "mistral" | "gemini";
type Body = {
  action?: string;
  id?: string;
  provider?: Provider;
  displayName?: string;
  apiKey?: string;
  enabled?: boolean;
  priority?: number;
  freeOnly?: boolean;
  paidBackup?: boolean;
};
type Connection = {
  id: string;
  provider: Provider;
  display_name: string;
  encrypted_api_key: string;
  key_fingerprint: string;
  base_url: string | null;
  enabled: boolean;
  priority: number;
  free_only: boolean;
  paid_backup: boolean;
  status: string;
  last_tested_at: string | null;
  last_error: string | null;
};
type Model = {
  id: string;
  name: string;
  pricing?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  free: boolean;
};

const providers: Record<Provider, { base: string; models: string }> = {
  openrouter: { base: "https://openrouter.ai/api/v1", models: "/models" },
  nvidia: { base: "https://integrate.api.nvidia.com/v1", models: "/models" },
  ollama: { base: "https://ollama.com", models: "/api/tags" },
  mistral: { base: "https://api.mistral.ai/v1", models: "/models" },
  gemini: {
    base: "https://generativelanguage.googleapis.com/v1beta",
    models: "/models",
  },
};

function root(env: Env) {
  return env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}
function dbHeaders(env: Env, prefer?: string) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}
async function db<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${root(env)}/rest/v1/${path}`, {
    ...init,
    headers: { ...dbHeaders(env), ...(init?.headers ?? {}) },
  });
  if (!response.ok)
    throw new Error(`Provider registry query failed (${response.status})`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function discover(
  connection: Connection,
  apiKey: string
): Promise<Model[]> {
  const config = providers[connection.provider];
  const url =
    connection.provider === "gemini"
      ? `${config.base}${config.models}?pageSize=1000`
      : `${connection.base_url ?? config.base}${config.models}`;
  const response = await fetch(url, {
    headers:
      connection.provider === "gemini"
        ? { "x-goog-api-key": apiKey }
        : { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok)
    throw new Error(`Provider model discovery failed (${response.status})`);
  const payload = (await response.json()) as Record<string, unknown>;
  const raw = (payload.data ?? payload.models ?? []) as Array<
    Record<string, unknown>
  >;
  return raw
    .map(item => {
      const id = String(item.id ?? item.name ?? item.model ?? "").replace(
        /^models\//,
        ""
      );
      const pricing = (item.pricing ?? {}) as Record<string, unknown>;
      const openRouterFree =
        connection.provider === "openrouter" &&
        [pricing.prompt, pricing.completion, pricing.request].every(
          value => value === undefined || Number(value) === 0
        );
      const free =
        openRouterFree ||
        connection.provider === "nvidia" ||
        connection.provider === "ollama";
      return {
        id,
        name: String(item.name ?? item.display_name ?? id),
        pricing,
        capabilities: {
          architecture: item.architecture,
          supportedActions: item.supportedGenerationMethods,
        },
        free,
      };
    })
    .filter(item => item.id);
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json(request, env, null, 204);
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!["owner", "admin"].includes(auth.profile.role))
    return json(
      request,
      env,
      {
        code: "ACCESS_DENIED",
        message: "Provider management requires Owner or Admin authority.",
      },
      403
    );

  try {
    if (request.method === "GET") {
      const connections = await db<Connection[]>(
        env,
        "ai_provider_connections?select=id,provider,display_name,key_fingerprint,base_url,enabled,priority,free_only,paid_backup,status,last_tested_at,last_error&order=priority.asc"
      );
      return json(request, env, { connections });
    }
    if (request.method !== "POST")
      return json(
        request,
        env,
        { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." },
        405
      );
    const body = (await request.json()) as Body;
    if (body.action === "save") {
      if (
        !body.provider ||
        !providers[body.provider] ||
        !body.apiKey?.trim() ||
        !body.displayName?.trim()
      )
        return json(
          request,
          env,
          {
            code: "INVALID_REQUEST",
            message: "Provider, display name, and API key are required.",
          },
          400
        );
      const encrypted = await encryptCredential(env, body.apiKey.trim());
      const fingerprint = await fingerprintCredential(body.apiKey.trim());
      const saved = await db<Connection[]>(
        env,
        "ai_provider_connections?on_conflict=provider,display_name",
        {
          method: "POST",
          headers: dbHeaders(
            env,
            "resolution=merge-duplicates,return=representation"
          ),
          body: JSON.stringify({
            provider: body.provider,
            display_name: body.displayName.trim(),
            encrypted_api_key: encrypted,
            key_fingerprint: fingerprint,
            base_url: providers[body.provider].base,
            enabled: body.enabled ?? true,
            priority: Math.max(1, Math.min(999, body.priority ?? 100)),
            free_only: body.freeOnly ?? true,
            paid_backup: body.paidBackup ?? false,
            status: "authorization_required",
            created_by: auth.userId,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      return json(
        request,
        env,
        { connection: { ...saved[0], encrypted_api_key: undefined } },
        201
      );
    }
    if (body.action === "sync" && body.id) {
      const connections = await db<Connection[]>(
        env,
        `ai_provider_connections?id=eq.${encodeURIComponent(body.id)}&select=*&limit=1`
      );
      const connection = connections[0];
      if (!connection)
        return json(
          request,
          env,
          { code: "NOT_FOUND", message: "Provider connection not found." },
          404
        );
      try {
        const models = await discover(
          connection,
          await decryptCredential(env, connection.encrypted_api_key)
        );
        if (!models.length)
          throw new Error("Provider returned no usable models");
        await db(
          env,
          `ai_provider_models?connection_id=eq.${encodeURIComponent(connection.id)}`,
          {
            method: "PATCH",
            headers: dbHeaders(env, "return=minimal"),
            body: JSON.stringify({ enabled: false }),
          }
        );
        await db(
          env,
          "ai_provider_models?on_conflict=connection_id,provider_model_id",
          {
            method: "POST",
            headers: dbHeaders(
              env,
              "resolution=merge-duplicates,return=minimal"
            ),
            body: JSON.stringify(
              models.map(model => ({
                connection_id: connection.id,
                provider_model_id: model.id,
                display_name: model.name,
                pricing: model.pricing,
                capabilities: model.capabilities,
                is_free: model.free,
                enabled: connection.free_only ? model.free : true,
                last_seen_at: new Date().toISOString(),
              }))
            ),
          }
        );
        await db(
          env,
          `ai_provider_connections?id=eq.${encodeURIComponent(connection.id)}`,
          {
            method: "PATCH",
            headers: dbHeaders(env, "return=minimal"),
            body: JSON.stringify({
              status: "connected",
              last_tested_at: new Date().toISOString(),
              last_error: null,
              updated_at: new Date().toISOString(),
            }),
          }
        );
        return json(request, env, {
          count: models.length,
          freeCount: models.filter(model => model.free).length,
        });
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Connection failed";
        await db(
          env,
          `ai_provider_connections?id=eq.${encodeURIComponent(connection.id)}`,
          {
            method: "PATCH",
            headers: dbHeaders(env, "return=minimal"),
            body: JSON.stringify({
              status: "error",
              last_tested_at: new Date().toISOString(),
              last_error: message.slice(0, 300),
              updated_at: new Date().toISOString(),
            }),
          }
        );
        return json(request, env, { code: "PROVIDER_ERROR", message }, 502);
      }
    }
    if (body.action === "models" && body.id) {
      const models = await db(
        env,
        `ai_provider_models?connection_id=eq.${encodeURIComponent(body.id)}&select=id,provider_model_id,display_name,capabilities,pricing,is_free,enabled,last_seen_at&order=is_free.desc,display_name.asc`
      );
      return json(request, env, { models });
    }
    return json(
      request,
      env,
      { code: "INVALID_REQUEST", message: "Unsupported provider action." },
      400
    );
  } catch (cause) {
    console.error(
      "provider registry failed",
      cause instanceof Error ? cause.message : "unknown"
    );
    return json(
      request,
      env,
      {
        code: "PROVIDER_REGISTRY_UNAVAILABLE",
        message: "Provider management is temporarily unavailable.",
      },
      503
    );
  }
};
