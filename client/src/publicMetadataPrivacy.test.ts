import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");

describe("public metadata privacy", () => {
  it("does not expose the protected person's name in public title or metadata", () => {
    expect(publicHtml).not.toMatch(/Charles\s+Tanauan/i);
    expect(publicHtml).toContain("Master Kanor Case · Secure Review Portal");
    expect(publicHtml).toContain("noindex,nofollow,noarchive,nosnippet");
    expect(publicHtml).not.toContain("Official Affidavit of Evidence");
  });
});
