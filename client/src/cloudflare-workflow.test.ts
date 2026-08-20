import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workflowPath = fileURLToPath(new URL("../../.github/workflows/deploy.yml", import.meta.url));
const workflow = readFileSync(workflowPath, "utf8");
const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const authHookSource = readFileSync(new URL("./hooks/useAuth.ts", import.meta.url), "utf8");
const authorizationSource = readFileSync(new URL("./lib/authorization.ts", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("./pages/AdminDashboard.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");

 describe("Cloudflare Pages deployment workflow", () => {
  it("deploys the intended Pages project and output directory", () => {
    expect(workflow).toContain("pages deploy dist/public --project-name=affidavit --branch=main");
    expect(workflow).toContain("test -f dist/public/index.html");
    expect(workflow).toContain("test -f dist/public/_redirects");
  });

  it("requires validation and public build configuration before deployment", () => {
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("pnpm run check");
    expect(workflow).toContain("pnpm test");
    expect(workflow).toContain("wrangler-action@v3");
    expect(workflow).toContain("/api/health");
    expect(workflow).toContain("VITE_SUPABASE_URL");
    expect(workflow).toContain("VITE_SUPABASE_ANON_KEY");
    expect(workflow).toContain("python3 scripts/scan-secrets.py");
  });

  it("smoke-checks the Pages origin, canonical domain, and auth route", () => {
    expect(workflow).toContain("https://affidavit-abo.pages.dev");
    expect(workflow).toContain("https://masterkanorcase.online");
    expect(workflow).toContain("auth_status");
    expect(workflow).not.toContain("curl -f -sS https://masterkanorcase.online/");
  });

  it("keeps protected routes and trusted authorization in the application", () => {
    expect(appSource).toContain('path="/auth"');
    expect(appSource).toContain('path="/auth/callback"');
    expect(appSource).toContain('path="/dashboard"');
    expect(appSource).toContain('path="/dossier"');
    expect(appSource).toContain('path="/admin"');
    expect(appSource).toContain("ProtectedCaseRoute");
    expect(appSource).toContain("ProtectedAdminRoute");
    expect(authHookSource).toContain("@/lib/supabaseClient");
    expect(authHookSource).not.toContain("user_metadata?.role");
    expect(authorizationSource).toContain("from(\"profiles\")");
    expect(authorizationSource).toContain("from(\"user_permissions\")");
  });

  it("does not present simulated production truth on the public or admin surfaces", () => {
    expect(homeSource).not.toContain("canonicalCase");
    expect(adminSource).toContain("Trusted authorization is active");
    expect(adminSource).not.toContain("Math.random");
    expect(adminSource).not.toContain("totalEvidence: 331");
  });
});
