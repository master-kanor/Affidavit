import { describe, expect, it } from "vitest";

describe.skipIf(process.env.SUPABASE_LIVE_TEST !== "1")("live Supabase credentials", () => {
  // Run explicitly with SUPABASE_LIVE_TEST=1 after the public key is corrected.
  it("can reach the configured REST schema endpoint with the public key", async () => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    expect(url, "SUPABASE_URL or VITE_SUPABASE_URL must be configured").toBeTruthy();
    expect(key, "VITE_SUPABASE_ANON_KEY or SUPABASE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/rest/v1/`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    expect(response.status, "Supabase REST schema endpoint must accept the configured key").toBe(200);
  }, 20_000);
});
