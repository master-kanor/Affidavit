import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/deploy.yml", import.meta.url),
);
const workflow = readFileSync(workflowPath, "utf8");
const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("./main.tsx", import.meta.url), "utf8");
const authHookSource = readFileSync(new URL("./hooks/useAuth.ts", import.meta.url), "utf8");
const evidenceSource = readFileSync(new URL("./pages/EvidenceDossier.tsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("./pages/AdminDashboard.tsx", import.meta.url), "utf8");

describe("Cloudflare Pages deployment workflow", () => {
  it("deploys the intended Pages project and GitHub artifact output", () => {
    expect(workflow).toContain("projectName: affidavit");
    expect(workflow).toContain("directory: dist\n");
    expect(workflow).not.toContain("projectName: masterkanor-affidavit");
    expect(workflow).not.toContain("directory: dist/public");
    expect(workflow).not.toContain("productionBranch:");
  });

  it("does not ignore the TypeScript check", () => {
    expect(workflow).toContain("run: pnpm run check\n");
    expect(workflow).not.toContain("pnpm run check || true");
  });

  it("smoke-checks the Pages origin and diagnoses canonical edge responses", () => {
    expect(workflow).toContain("https://affidavit-abo.pages.dev/");
    expect(workflow).toContain("canonical_status");
    expect(workflow).not.toContain("curl -f -sS https://masterkanorcase.online/");
    expect(workflow).not.toContain("/api/health");
  });

  it("keeps the local SPA fallback in the Vite public directory", () => {
    const redirectsPath = fileURLToPath(
      new URL("../public/_redirects", import.meta.url),
    );
    const redirects = readFileSync(redirectsPath, "utf8");
    expect(redirects).toContain("/*    /index.html   200");
  });

  it("keeps protected routes and authentication in Supabase client code", () => {
    expect(appSource).toContain('path={"/auth"}');
    expect(appSource).toContain('path={"/dossier"}');
    expect(appSource).toContain('path={"/admin"}');
    expect(mainSource).toContain("QueryClientProvider");
    expect(mainSource).not.toContain("getLoginUrl");
    expect(authHookSource).toContain("@/lib/supabaseClient");
    expect(authHookSource).not.toContain("/api/auth/");
  });

  it("keeps protected-page hooks stable across auth loading transitions", () => {
    expect(evidenceSource).toContain("AuthorizedEvidenceDossier");
    expect(evidenceSource).toContain("return <AuthorizedEvidenceDossier user={user} />;");
    expect(adminSource).toContain("AuthorizedAdminDashboard");
    expect(adminSource).toContain("return <AuthorizedAdminDashboard />;");
  });
});
