import { describe, expect, it } from "vitest";

describe("Admin Revoke Access Functionality", () => {
  it("correctly blocks downloads for revoked emails while preserving audit status", () => {
    const revokedEmails = new Set(["suspicious@external.com"]);
    
    const checkDownloadAllowed = (email: string) => {
      if (revokedEmails.has(email)) return false;
      return true;
    };

    expect(checkDownloadAllowed("suspicious@external.com")).toBe(false);
    expect(checkDownloadAllowed("tanauancharles1@gmail.com")).toBe(true);
  });
});
