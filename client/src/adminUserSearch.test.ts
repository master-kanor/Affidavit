import { describe, expect, it } from "vitest";

describe("Admin Audit Log User Search", () => {
  it("matches logs by user name or email case-insensitively", () => {
    const logs = [
      { id: "1", userName: "Charles Tanauan", userEmail: "tanauancharles1@gmail.com" },
      { id: "2", userName: "Legal Counsel", userEmail: "counsel@leyte.gov.ph" },
    ];

    const searchLogs = (query: string) => {
      const q = query.toLowerCase();
      return logs.filter(log =>
        log.userName.toLowerCase().includes(q) ||
        log.userEmail.toLowerCase().includes(q)
      );
    };

    expect(searchLogs("charles")).toHaveLength(1);
    expect(searchLogs("charles")[0].id).toBe("1");
    expect(searchLogs("COUNCIL")).toHaveLength(0);
    expect(searchLogs("counsel")).toHaveLength(1);
    expect(searchLogs("LEYTE")).toHaveLength(1);
  });
});
