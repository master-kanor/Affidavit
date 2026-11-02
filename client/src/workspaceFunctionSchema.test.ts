import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace Function Supabase schema binding", () => {
  it("sets the public PostgREST profile for case-data queries", () => {
    const source = readFileSync(new URL("../../functions/api/cases/[caseId]/workspace.ts", import.meta.url), "utf8");
    expect(source).toContain('"Accept-Profile": "public"');
  });
});
