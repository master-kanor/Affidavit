import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

async function readProjectFile(name: string): Promise<string> {
  return readFile(`${projectRoot}${name}`, "utf8");
}

async function readProjectJson<T>(name: string): Promise<T> {
  return JSON.parse(await readProjectFile(name)) as T;
}

describe("Cloudflare Pages build configuration", () => {
  it("keeps pnpm patch configuration in the workspace file and aligned with the lockfile", async () => {
    const packageJson = await readProjectJson<{
      scripts?: { build?: string };
      pnpm?: unknown;
    }>("package.json");
    const workspace = await readProjectFile("pnpm-workspace.yaml");
    const lockfile = await readProjectFile("pnpm-lock.yaml");

    expect(packageJson.scripts?.build).toBe("vite build");
    expect(packageJson.pnpm).toBeUndefined();
    expect(workspace).not.toContain("patchedDependencies:");
    expect(lockfile).not.toContain("patchedDependencies:");
  });

  it("declares the server and test dependencies required by validation", async () => {
    const packageJson = await readProjectJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>("package.json");

    expect(packageJson.dependencies?.express).toBeDefined();
    expect(packageJson.devDependencies?.["@types/express"]).toBeDefined();
    expect(packageJson.devDependencies?.vitest).toBeDefined();
  });
});
