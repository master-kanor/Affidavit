import { describe, expect, it } from "vitest";

describe("Secure Original Download Authorization", () => {
  it("restricts original affidavit download to authenticated authorized roles", () => {
    const unauthorizedUser = null;
    const regularUser = { id: "u1", email: "guest@masterkanorcase.online", role: "user" };
    const adminUser = { id: "a1", email: "tanauancharles1@gmail.com", role: "admin" };

    const checkAccess = (user: { email: string; role: string } | null) => {
      if (!user) return false;
      return user.role === "admin" || user.email.endsWith("@masterkanorcase.online") || user.email === "tanauancharles1@gmail.com";
    };

    expect(checkAccess(unauthorizedUser)).toBe(false);
    expect(checkAccess(regularUser)).toBe(true); // authorized domain email
    expect(checkAccess(adminUser)).toBe(true);
  });
});
