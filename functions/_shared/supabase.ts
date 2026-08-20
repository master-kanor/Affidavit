export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CORS_ALLOWED_ORIGIN?: string;
  AI_ENABLED?: string;
  AI_PROVIDER?: "nvidia" | "openrouter";
  AI_MODEL?: string;
  NVIDIA_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  CONNECTION_ENCRYPTION_KEY?: string;
}

export interface AuthContext {
  userId: string;
  email: string | null;
  profile: {
    id: string;
    user_id: string;
    display_name: string | null;
    role: "owner" | "admin" | "user";
    status: "active" | "disabled" | "pending";
  };
  permissions: Record<string, boolean>;
}

function baseUrl(env: Env) {
  return env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function headers(env: Env, accessToken?: string) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${accessToken ?? env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

export function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = (
    env.CORS_ALLOWED_ORIGIN ??
    "https://masterkanorcase.online,https://admin.masterkanorcase.online"
  )
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin":
      origin === allowedOrigin ? allowedOrigin : allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    Vary: "Origin",
  };
}

export function json(request: Request, env: Env, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function requireAuth(
  request: Request,
  env: Env
): Promise<AuthContext | Response> {
  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken)
    return json(
      request,
      env,
      { code: "AUTH_REQUIRED", message: "Authentication is required." },
      401
    );
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    return json(
      request,
      env,
      {
        code: "SERVER_NOT_CONFIGURED",
        message: "The authorization service is not configured.",
      },
      503
    );

  const userResponse = await fetch(`${baseUrl(env)}/auth/v1/user`, {
    headers: headers(env, accessToken),
  });
  if (!userResponse.ok)
    return json(
      request,
      env,
      { code: "AUTH_INVALID", message: "The session could not be verified." },
      401
    );
  const user = (await userResponse.json()) as {
    id?: string;
    email?: string | null;
  };
  if (!user.id)
    return json(
      request,
      env,
      {
        code: "AUTH_INVALID",
        message: "The session did not include a valid user.",
      },
      401
    );

  const profileResponse = await fetch(
    `${baseUrl(env)}/rest/v1/profiles?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,display_name,role,status&limit=1`,
    { headers: headers(env) }
  );
  const profiles = (await profileResponse.json()) as AuthContext["profile"][];
  const profile = profiles[0];
  if (
    !profile ||
    profile.status !== "active" ||
    !["owner", "admin", "user"].includes(profile.role)
  )
    return json(
      request,
      env,
      {
        code: "ACCESS_DENIED",
        message: "The account is not active or provisioned.",
      },
      403
    );

  const permissionResponse = await fetch(
    `${baseUrl(env)}/rest/v1/user_permissions?user_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`,
    { headers: headers(env) }
  );
  const permissionRows = (await permissionResponse.json()) as Record<
    string,
    boolean
  >[];
  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    permissions: permissionRows[0] ?? {},
  };
}
