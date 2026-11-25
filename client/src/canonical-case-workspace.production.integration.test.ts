import { describe, expect, it } from "vitest";

const shouldRun = process.env.RUN_PRODUCTION_INTEGRATION === "true";
const describeProduction = shouldRun ? describe : describe.skip;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required production integration secret: ${name}`);
  return value;
}

describeProduction("canonical case production workspace", () => {
  it("returns the complete canonical affidavit and evidence payload for the owner", async () => {
    const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
    const anonKey = required("SUPABASE_ANON_KEY");
    const email = required("E2E_OWNER_EMAIL");
    const password = required("E2E_OWNER_PASSWORD");
    const workspaceUrl = required("WORKSPACE_URL").replace(/\/$/, "");

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const authBody = await authResponse.text();
    expect(authResponse.status, authBody).toBe(200);
    const auth = JSON.parse(authBody) as { access_token?: string };
    expect(auth.access_token).toBeTruthy();

    const workspaceResponse = await fetch(`${workspaceUrl}/api/cases/master-kanor-case/workspace`, {
      headers: { Authorization: `Bearer ${auth.access_token}` },
    });
    const body = (await workspaceResponse.json()) as {
      sections?: unknown[];
      textVersions?: unknown[];
      evidence?: unknown[];
    };

    expect(workspaceResponse.status, JSON.stringify(body)).toBe(200);
    expect(body.sections).toHaveLength(18);
    expect(body.textVersions).toHaveLength(98);
    expect(body.evidence).toHaveLength(66);
  }, 30_000);
});
