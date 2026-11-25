import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const readProjectFile = (name: string) => readFileSync(`${projectRoot}${name}`, "utf8");

describe("Cloudflare Pages build configuration", () => {
  it("keeps the workspace and lockfile compatible with frozen pnpm installs", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as { scripts?: { build?: string }; pnpm?: unknown };
    const workspace = readProjectFile("pnpm-workspace.yaml");
    const lockfile = readProjectFile("pnpm-lock.yaml");
    expect(packageJson.scripts?.build).toBe("vite build");
    expect(packageJson.pnpm).toBeUndefined();
    expect(workspace).toContain("packages:");
    expect(workspace).toContain("- .");
    expect(workspace).not.toContain("patchedDependencies:");
    expect(lockfile).not.toContain("patchedDependencies:");
  });

  it("declares the dependencies required by validation", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect(packageJson.dependencies?.express).toBeDefined();
    expect(packageJson.devDependencies?.["@types/express"]).toBeDefined();
    expect(packageJson.devDependencies?.vitest).toBeDefined();
  });
});
