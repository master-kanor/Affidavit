import { describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

/**
 * These tests intentionally do not require private credentials in the test runner.
 * Public Supabase configuration is injected only in the production build job;
 * server-only secrets must never be imported into browser tests or bundles.
 */
describe("Production configuration hygiene", () => {
  it("does not require Supabase configuration for a safe local preview", () => {
    expect(typeof isSupabaseConfigured).toBe("boolean");
  });

  it("does not expose server-only credential names through Vite public variables", () => {
    const publicKeys = Object.keys(import.meta.env).filter((key) => key.startsWith("VITE_"));
    expect(publicKeys.some((key) => /SERVICE_ROLE|SECRET|PRIVATE|TOKEN|PASSWORD|API_KEY/i.test(key))).toBe(false);
  });

  it("keeps the configured app URL in an explicit public variable when supplied", () => {
    const appUrl = import.meta.env.VITE_APP_URL;
    if (appUrl) expect(appUrl).toMatch(/^https:\/\//);
  });
});
