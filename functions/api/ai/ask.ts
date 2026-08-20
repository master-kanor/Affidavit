import type { PagesFunction } from "@cloudflare/workers-types";
import { decryptCredential } from "../../_shared/credentials";
import type { Env } from "../../_shared/supabase";
import { json, requireAuth } from "../../_shared/supabase";

type AskBody = { question?: unknown; caseId?: unknown };
type KnowledgeRow = {
  id: string;
  resource_type: string;
  resource_id: string;
  content: string;
  source_label: string | null;
};
type RouteRow = {
  provider: "openrouter" | "nvidia" | "ollama" | "mistral" | "gemini";
  encrypted_api_key: string;
  base_url: string | null;
  paid_backup: boolean;
  priority: number;
  ai_provider_models: Array<{
    provider_model_id: string;
    is_free: boolean;
  }>;
};

function root(env: Env) {
  return env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function serviceHeaders(env: Env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function rows<T>(env: Env, path: string): Promise<T> {
  const response = await fetch(`${root(env)}/rest/v1/${path}`, {
    headers: serviceHeaders(env),
  });
  if (!response.ok)
    throw new Error(`Database query failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const onRequest: PagesFunction<Env> = async context => {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json(request, env, null, 204);
  if (request.method !== "POST")
    return json(
      request,
      env,
      { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." },
      405
    );

  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (auth.profile.role === "user" && auth.permissions.can_ask_ai !== true)
    return json(
      request,
      env,
      {
        code: "ACCESS_DENIED",
        message: "AI access is not enabled for this account.",
      },
      403
    );

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return json(
      request,
      env,
      { code: "INVALID_REQUEST", message: "A valid JSON request is required." },
      400
    );
  }
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const caseId = typeof body.caseId === "string" ? body.caseId.trim() : "";
  if (
    !question ||
    question.length > 2000 ||
    !/^[a-zA-Z0-9_-]{1,120}$/.test(caseId)
  )
    return json(
      request,
      env,
      {
        code: "INVALID_REQUEST",
        message:
          "Provide a valid case and a question of 2,000 characters or fewer.",
      },
      400
    );

  try {
    const memberships = await rows<Array<{ can_view: boolean }>>(
      env,
      `case_members?case_id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}&can_view=eq.true&select=can_view&limit=1`
    );
    if (auth.profile.role !== "owner" && memberships.length === 0)
      return json(
        request,
        env,
        {
          code: "ACCESS_DENIED",
          message: "The requested case is not available.",
        },
        403
      );

    const grants =
      auth.profile.role === "user"
        ? await rows<Array<{ resource_type: string; resource_id: string }>>(
            env,
            `resource_permissions?user_id=eq.${encodeURIComponent(auth.userId)}&can_view=eq.true&select=resource_type,resource_id`
          )
        : [];
    const authorized = (item: KnowledgeRow) =>
      auth.profile.role !== "user" ||
      grants.some(
        grant =>
          grant.resource_type === item.resource_type &&
          grant.resource_id === item.resource_id
      );
    const terms = question
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .slice(0, 8);
    const chunks = (
      await rows<KnowledgeRow[]>(
        env,
        `knowledge_chunks?case_id=eq.${encodeURIComponent(caseId)}&select=id,resource_type,resource_id,content,source_label&limit=100`
      )
    )
      .filter(authorized)
      .map(item => ({
        item,
        score: terms.reduce(
          (score, term) =>
            score + (item.content.toLowerCase().includes(term) ? 1 : 0),
          0
        ),
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(result => result.item);

    if (chunks.length === 0)
      return json(request, env, {
        answer:
          "The available authorized case materials do not provide enough information to answer that question.",
        citations: [],
      });

    if (env.AI_ENABLED !== "true")
      return json(
        request,
        env,
        {
          code: "AI_NOT_CONFIGURED",
          message:
            "The case assistant is not yet connected to an approved model provider.",
        },
        503
      );
    const contextText = chunks
      .map(
        (item, index) =>
          `[S${index + 1}] ${item.source_label ?? `${item.resource_type} ${item.resource_id}`}\n${item.content.slice(0, 6000)}`
      )
      .join("\n\n");
    const messages = [
      {
        role: "system",
        content:
          "You are the Master Kanor Case review assistant. Answer only from the authorized sources supplied below. Distinguish source facts from inference. Never invent evidence, dates, quotations, testimony, or legal conclusions. Cite sources using [S1], [S2]. If the sources are insufficient, say so clearly.",
      },
      {
        role: "user",
        content: `AUTHORIZED SOURCES:\n${contextText}\n\nQUESTION:\n${question}`,
      },
    ];
    const routes = await rows<RouteRow[]>(
      env,
      "ai_provider_connections?enabled=eq.true&status=eq.connected&select=provider,encrypted_api_key,base_url,paid_backup,priority,ai_provider_models!inner(provider_model_id,is_free)&ai_provider_models.enabled=eq.true&order=priority.asc"
    );
    const attempts = routes
      .flatMap(route =>
        route.ai_provider_models.map(model => ({
          ...route,
          model: model.provider_model_id,
          isFree: model.is_free,
        }))
      )
      .filter(route => route.isFree || route.paid_backup)
      .sort(
        (a, b) => Number(b.isFree) - Number(a.isFree) || a.priority - b.priority
      )
      .slice(0, 8);
    if (!attempts.length)
      return json(
        request,
        env,
        {
          code: "AI_NOT_CONFIGURED",
          message: "No approved provider models are enabled.",
        },
        503
      );
    let answer = "";
    for (const attempt of attempts) {
      const apiKey = await decryptCredential(env, attempt.encrypted_api_key);
      const baseUrl =
        attempt.provider === "gemini"
          ? "https://generativelanguage.googleapis.com/v1beta/openai"
          : attempt.provider === "ollama"
            ? "https://ollama.com/v1"
            : attempt.base_url;
      const modelResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: attempt.model,
          temperature: 0.1,
          max_tokens: 1200,
          messages,
        }),
      });
      if (modelResponse.ok) {
        const result = (await modelResponse.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        answer = result.choices?.[0]?.message?.content?.trim() ?? "";
        if (answer) break;
      }
      if (![402, 408, 429, 500, 502, 503, 504].includes(modelResponse.status))
        break;
    }
    if (!answer) throw new Error("Model provider returned an empty answer");
    return json(request, env, {
      answer,
      citations: chunks.map((item, index) => ({
        key: `S${index + 1}`,
        resourceType: item.resource_type,
        resourceId: item.resource_id,
        label: item.source_label ?? `${item.resource_type} ${item.resource_id}`,
      })),
    });
  } catch (cause) {
    console.error(
      "authorized AI request failed",
      cause instanceof Error ? cause.message : "unknown"
    );
    return json(
      request,
      env,
      {
        code: "AI_UNAVAILABLE",
        message: "The case assistant is temporarily unavailable.",
      },
      503
    );
  }
};
