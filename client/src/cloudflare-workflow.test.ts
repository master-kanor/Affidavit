import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workflowPath = fileURLToPath(
  new URL("../../.github/workflows/deploy.yml", import.meta.url),
);
const workflow = readFileSync(workflowPath, "utf8");

describe("Cloudflare Pages deployment workflow", () => {
  it("deploys the intended Pages project and Vite static output", () => {
    expect(workflow).toContain("projectName: affidavit");
    expect(workflow).toContain("directory: dist/public");
    expect(workflow).not.toContain("projectName: masterkanor-affidavit");
    expect(workflow).not.toContain("directory: dist\n");
  });

  it("does not ignore the TypeScript check", () => {
    expect(workflow).toContain("run: pnpm run check\n");
    expect(workflow).not.toContain("pnpm run check || true");
  });

  it("smoke-checks the canonical homepage instead of an unavailable Express health route", () => {
    expect(workflow).toContain("curl -f -sS https://masterkanorcase.online/");
    expect(workflow).not.toContain("/api/health");
  });

  it("keeps the SPA fallback in the Vite public directory", () => {
    const redirectsPath = fileURLToPath(
      new URL("../public/_redirects", import.meta.url),
    );
    const redirects = readFileSync(redirectsPath, "utf8");
    expect(redirects).toContain("/*    /index.html   200");
  });
});
