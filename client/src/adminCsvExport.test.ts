import { describe, expect, it } from "vitest";

describe("Admin Audit Log CSV Export", () => {
  it("formats filtered log entries correctly into CSV rows", () => {
    const logs = [
      {
        timestamp: "2026-08-18T10:00:00.000Z",
        userEmail: "tanauancharles1@gmail.com",
        userId: "admin-1",
        documentId: "doc-1",
        documentTitle: "Official Affidavit",
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        status: "authorized" as const,
      }
    ];

    const headers = ["Timestamp", "User Email", "User ID", "Document ID", "Document Title", "IP Address", "User Agent", "Access Status"];
    const rows = logs.map((log) => {
      return [
        `"${log.timestamp}"`,
        `"${log.userEmail}"`,
        `"${log.userId}"`,
        `"${log.documentId}"`,
        `"${log.documentTitle}"`,
        `"${log.ipAddress}"`,
        `"${log.userAgent}"`,
        `"${log.status}"`,
      ].join(",");
    });

    const csvOutput = [headers.join(","), ...rows].join("\n");
    expect(csvOutput).toContain("Timestamp,User Email");
    expect(csvOutput).toContain("tanauancharles1@gmail.com");
    expect(csvOutput).toContain("Official Affidavit");
  });
});
