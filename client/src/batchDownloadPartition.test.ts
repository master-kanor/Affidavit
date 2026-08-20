import { describe, expect, it } from "vitest";
import { partitionBatchDownloadEntries } from "@/utils/batchDownload";

describe("batch download multipart partitioning", () => {
  it("keeps estimated part payloads under the configured limit when possible", () => {
    const entries = ["a", "b", "c"].map((id) => ({
      id,
      fileName: `evidence-${id}.webp`,
      bytes: new Uint8Array(1000).buffer,
    }));

    const parts = partitionBatchDownloadEntries(entries, 2500);

    expect(parts).toHaveLength(3);
    expect(parts.map((part) => part.map((entry) => entry.id))).toEqual([["a"], ["b"], ["c"]]);
  });

  it("keeps the original order while packing small entries together", () => {
    const entries = ["a", "b", "c"].map((id) => ({
      id,
      fileName: `evidence-${id}.webp`,
      bytes: new Uint8Array(100).buffer,
    }));

    const parts = partitionBatchDownloadEntries(entries, 5000);

    expect(parts).toHaveLength(1);
    expect(parts[0].map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });
});
