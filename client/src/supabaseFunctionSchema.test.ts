import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Pages Function Supabase schema binding", () => {
  it("sets the public PostgREST profile for authorization queries", () => {
    const source = readFileSync(new URL("../../functions/_shared/supabase.ts", import.meta.url), "utf8");
    expect(source).toContain('"Accept-Profile": "public"');
  });
});
