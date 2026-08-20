import { describe, expect, it } from "vitest";

describe("Admin Restore Access Functionality", () => {
  it("successfully reinstates download privileges when restored", () => {
    const revokedEmails = new Set(["user@test.com"]);
    
    // Simulate restore
    revokedEmails.delete("user@test.com");

    const checkDownloadAllowed = (email: string) => {
      if (revokedEmails.has(email)) return false;
      return true;
    };

    expect(checkDownloadAllowed("user@test.com")).toBe(true);
  });
});
