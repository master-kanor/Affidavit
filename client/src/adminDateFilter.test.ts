import { describe, expect, it } from "vitest";

describe("Admin Audit Log Date Range Filter", () => {
  it("filters log entries correctly by start and end date boundaries", () => {
    const logs = [
      { id: "1", timestamp: "2026-08-10T12:00:00.000Z" },
      { id: "2", timestamp: "2026-08-15T12:00:00.000Z" },
      { id: "3", timestamp: "2026-08-20T12:00:00.000Z" },
    ];

    const filterByDate = (start: string, end: string) => {
      return logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        if (start) {
          const startMs = new Date(start).getTime();
          if (logTime < startMs) return false;
        }
        if (end) {
          const endMs = new Date(end).getTime() + (24 * 60 * 60 * 1000 - 1);
          if (logTime > endMs) return false;
        }
        return true;
      });
    };

    expect(filterByDate("2026-08-12", "2026-08-18")).toHaveLength(1);
    expect(filterByDate("2026-08-12", "2026-08-18")[0].id).toBe("2");
    expect(filterByDate("", "")).toHaveLength(3);
  });
});
