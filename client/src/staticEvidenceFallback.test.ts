import { describe, expect, it } from "vitest";
import { buildStaticEvidenceRecords } from "@/utils/staticEvidenceFallback";

describe("buildStaticEvidenceRecords", () => {
  it("creates one verified public gallery record per catalog entry", () => {
    const records = buildStaticEvidenceRecords();
    expect(records).toHaveLength(393);
    expect(records.every((record) => record.status === "verified" && record.fileUrl.startsWith("/manus-storage/"))).toBe(true);
  });

  it("keeps public metadata anonymized while retaining appendix traceability", () => {
    const [record] = buildStaticEvidenceRecords();
    const publicText = `${record.title} ${record.description} ${record.category}`.toLowerCase();
    expect(publicText).not.toContain("charles");
    expect(publicText).not.toContain("tanauan");
    expect(publicText).not.toContain("suspect");
    expect(record.description).toContain("Appendix page");
    expect(record.description).toContain("slot");
  });
});
