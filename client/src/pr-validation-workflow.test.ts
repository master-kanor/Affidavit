import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../.github/workflows/pr-validation.yml", import.meta.url),
  "utf8"
);
const browserJob = workflow.split("\n  browser-e2e:")[1] ?? "";

describe("Chromium PR validation", () => {
  it("pins the browser runner instead of following an incompatible latest image", () => {
    expect(browserJob).toContain("runs-on: ubuntu-24.04");
    expect(browserJob).not.toContain("runs-on: ubuntu-latest");
  });

  it("keeps browser installation and actual end-to-end execution enabled", () => {
    expect(browserJob).toContain(
      "pnpm exec playwright install --with-deps chromium"
    );
    expect(browserJob).toContain("run: pnpm test:e2e");
    expect(browserJob).not.toMatch(/continue-on-error:\s*true/);
    expect(browserJob).not.toMatch(/if:\s*(?:false|\$\{\{\s*false\s*\}\})/);
  });

  it("retains bounded execution and diagnostic artifacts", () => {
    expect(browserJob).toContain("timeout-minutes: 20");
    expect(browserJob).toContain("uses: actions/upload-artifact@v4");
    expect(browserJob).toContain("if: always()");
  });
});
