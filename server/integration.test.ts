import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "owner" | "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-openid-" + role,
    email: role === "owner" ? "tanauancharles1@gmail.com" : role === "admin" ? "admin@masterkanorcase.online" : "user@example.com",
    name: "Test " + role,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Master Kanor Portal Integration Tests", () => {
  it("allows authenticated user to list evidence", async () => {
    const ctx = createContext("user");
    const caller = appRouter.createCaller(ctx);
    const evidenceList = await caller.evidence.list();
    expect(Array.isArray(evidenceList)).toBe(true);
  });

  it("permits owner/admin to access audit logs", async () => {
    const ctx = createContext("owner");
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.audit.logs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("restricts audit logs for regular users", async () => {
    const ctx = createContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.audit.logs()).rejects.toThrow("Admin access required");
  });

  it("processes AI Q&A prompt successfully", async () => {
    const ctx = createContext("user");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.ai.ask({ prompt: "What is Testimony 1 about?" });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });
});
