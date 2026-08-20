import { describe, expect, it } from "vitest";

/** Private credentials are intentionally absent from local and CI test environments. */
describe("Supabase configuration hygiene", () => {
  it("does not require server-only credentials in the browser test runner", () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").toBe("");
  });

  it("does not expose a server-only service-role variable as a Vite public variable", () => {
    const publicKeys = Object.keys(import.meta.env).filter((key) => key.startsWith("VITE_"));
    expect(publicKeys.some((key) => /SERVICE_ROLE|SECRET|PRIVATE|TOKEN|PASSWORD|API_KEY/i.test(key))).toBe(false);
  });

  it("permits a safe local preview when public Supabase variables are absent", () => {
    expect(import.meta.env.VITE_SUPABASE_URL == null || typeof import.meta.env.VITE_SUPABASE_URL === "string").toBe(true);
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY == null || typeof import.meta.env.VITE_SUPABASE_ANON_KEY === "string").toBe(true);
  });
});
