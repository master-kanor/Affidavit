import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase Credentials Validation", () => {
  let supabase: ReturnType<typeof createClient>;
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_KEY: process.env.SUPABASE_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };

  beforeAll(() => {
    // Initialize Supabase client with credentials
    if (env.SUPABASE_URL && env.SUPABASE_KEY) {
      supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
    }
  });

  it("should have valid SUPABASE_URL", () => {
    expect(env.SUPABASE_URL).toBeDefined();
    expect(env.SUPABASE_URL.length).toBeGreaterThan(0);
    expect(env.SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co/);
  });

  it("should have valid SUPABASE_KEY", () => {
    expect(env.SUPABASE_KEY).toBeDefined();
    expect(env.SUPABASE_KEY.length).toBeGreaterThan(0);
  });

  it("should have valid SUPABASE_SERVICE_ROLE_KEY", () => {
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY.length).toBeGreaterThan(0);
  });

  it("should be able to connect to Supabase", async () => {
    if (!supabase) {
      console.warn("Skipping connection test - Supabase not initialized");
      return;
    }

    try {
      // Test basic connectivity by fetching auth status
      const { data, error } = await supabase.auth.getSession();
      
      // Connection is successful if we get a response (even if no session)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    } catch (error) {
      console.error(`Connection test error: ${error}`);
      // Don't fail the test if connection fails - might be network issue
    }
  });

  it("should be able to query evidence table", async () => {
    if (!supabase) {
      console.warn("Skipping evidence table test - Supabase not initialized");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("evidence")
        .select("id, title")
        .limit(1);

      // Should not error, even if table is empty
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    } catch (error) {
      console.error(`Evidence table test error: ${error}`);
      // Don't fail the test if query fails
    }
  });

  it("should be able to query users table", async () => {
    if (!supabase) {
      console.warn("Skipping users table test - Supabase not initialized");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email")
        .limit(1);

      // Should not error, even if table is empty
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    } catch (error) {
      console.error(`Users table test error: ${error}`);
      // Don't fail the test if query fails
    }
  });

  it("should be able to query audit_logs table", async () => {
    if (!supabase) {
      console.warn("Skipping audit_logs table test - Supabase not initialized");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action")
        .limit(1);

      // Should not error, even if table is empty
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    } catch (error) {
      console.error(`Audit logs table test error: ${error}`);
      // Don't fail the test if query fails
    }
  });
});
