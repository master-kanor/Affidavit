import { describe, expect, it } from "vitest";
import fs from "node:fs";

const api = fs.readFileSync("functions/api/ai/providers.ts", "utf8");
const ask = fs.readFileSync("functions/api/ai/ask.ts", "utf8");
const vault = fs.readFileSync("functions/_shared/credentials.ts", "utf8");
const migration = fs.readFileSync(
  "supabase/migrations/20260820000008_ai_provider_registry.sql",
  "utf8"
);
const correction = fs.readFileSync(
  "supabase/migrations/20260820000009_provider_registry_api_only.sql",
  "utf8"
);

describe("AI provider registry security", () => {
  it("encrypts credentials and never selects ciphertext in management responses", () => {
    expect(vault).toContain('"AES-GCM"');
    expect(api).toContain("encryptCredential");
    expect(api).toContain("key_fingerprint");
    expect(api).not.toContain("select=*,encrypted_api_key");
    expect(api).toContain('"x-goog-api-key": apiKey');
    expect(api).not.toContain("?key=");
  });

  it("limits management to Owner and Admin and removes browser writes", () => {
    expect(api).toContain('["owner", "admin"]');
    expect(migration).toContain("revoke all on public.ai_provider_connections");
    expect(migration).toContain("current_app_role() in ('owner','admin')");
    expect(correction).toContain(
      "revoke select on public.ai_provider_connections"
    );
    expect(api).toContain("JSON.stringify({ enabled: false }))");
  });

  it("routes free models first and retries bounded transient failures", () => {
    expect(ask).toContain("Number(b.isFree) - Number(a.isFree)");
    expect(ask).toContain(".slice(0, 8)");
    expect(ask).toContain("402, 408, 429, 500, 502, 503, 504");
  });
});