import { describe, expect, it } from "vitest";

describe("Admin Audit Log Status Filter", () => {
  it("filters logs correctly by revoked vs authorized status", () => {
    const logs = [
      { id: "1", userEmail: "revoked@test.com", status: "revoked" },
      { id: "2", userEmail: "auth@test.com", status: "authorized" },
    ];
    const revokedSet = new Set(["revoked@test.com"]);

    const filterLogs = (status: "all" | "revoked" | "authorized") => {
      return logs.filter(log => {
        const isRevoked = revokedSet.has(log.userEmail) || log.status === "revoked";
        if (status === "revoked" && !isRevoked) return false;
        if (status === "authorized" && isRevoked) return false;
        return true;
      });
    };

    expect(filterLogs("revoked")).toHaveLength(1);
    expect(filterLogs("revoked")[0].userEmail).toBe("revoked@test.com");
    expect(filterLogs("authorized")).toHaveLength(1);
    expect(filterLogs("authorized")[0].userEmail).toBe("auth@test.com");
    expect(filterLogs("all")).toHaveLength(2);
  });
});
