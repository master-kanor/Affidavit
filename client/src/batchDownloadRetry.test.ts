import { describe, expect, it } from "vitest";
import { mergeBatchDownloadSummaries, mergeRetriedBatchDownloadPart, type BatchDownloadSummaryResult } from "@/utils/batchDownload";

const initialSummary: BatchDownloadSummaryResult = {
  totalSelected: 2,
  packagedFiles: 1,
  unavailableFiles: 0,
  failedFiles: 1,
  traceabilityRecords: 2,
  errors: ["failed.jpg: asset request returned 503"],
  retryItemIds: ["failed-id"],
  itemResults: [
    { id: "ok-id", filename: "ok.jpg", status: "packaged" },
    { id: "failed-id", filename: "failed.jpg", status: "failed", error: "asset request returned 503" },
  ],
  archiveParts: 1,
  estimatedBytes: 1024,
  partEstimatedBytes: [1024],
};

describe("batch download retry summaries", () => {
  it("replaces only the failed ZIP part while preserving completed part metadata", () => {
    const previous: BatchDownloadSummaryResult = {
      ...initialSummary,
      packagedFiles: 2,
      failedFiles: 0,
      errors: ["ZIP part 2: transient download failure"],
      archiveParts: 2,
      estimatedBytes: 3072,
      partEstimatedBytes: [1024, 2048],
      archivePartResults: [
        { partNumber: 1, totalParts: 2, entryIds: ["ok-id"], estimatedBytes: 1024, status: "downloaded", fileName: "part-1.zip" },
        { partNumber: 2, totalParts: 2, entryIds: ["failed-id"], estimatedBytes: 2048, status: "failed", error: "transient download failure" },
      ],
      retryPartNumbers: [2],
    };
    const retried: BatchDownloadSummaryResult = {
      ...previous,
      totalSelected: 1,
      packagedFiles: 1,
      failedFiles: 0,
      errors: [],
      retryItemIds: [],
      itemResults: [{ id: "failed-id", filename: "failed.jpg", status: "packaged" }],
      archiveParts: 1,
      estimatedBytes: 2048,
      partEstimatedBytes: [2048],
      archivePartResults: [{ partNumber: 2, totalParts: 2, entryIds: ["failed-id"], estimatedBytes: 2048, status: "downloaded", fileName: "part-2-retry.zip" }],
      retryPartNumbers: [],
    };

    const merged = mergeRetriedBatchDownloadPart(previous, retried, 2);
    expect(merged.archiveParts).toBe(2);
    expect(merged.archivePartResults).toEqual([
      previous.archivePartResults?.[0],
      { partNumber: 2, totalParts: 2, entryIds: ["failed-id"], estimatedBytes: 2048, status: "downloaded", fileName: "part-2-retry.zip" },
    ]);
    expect(merged.retryPartNumbers).toEqual([]);
    expect(merged.errors).toEqual([]);
  });
  it("replaces retryable outcomes with the latest result and clears resolved errors", () => {
    const retriedSummary: BatchDownloadSummaryResult = {
      totalSelected: 1,
      packagedFiles: 1,
      unavailableFiles: 0,
      failedFiles: 0,
      traceabilityRecords: 1,
      errors: [],
      retryItemIds: [],
      itemResults: [{ id: "failed-id", filename: "failed.jpg", status: "packaged" }],
      archiveParts: 1,
      estimatedBytes: 1024,
      partEstimatedBytes: [1024],
    };

    expect(mergeBatchDownloadSummaries(initialSummary, retriedSummary)).toEqual({
      totalSelected: 2,
      packagedFiles: 2,
      unavailableFiles: 0,
      failedFiles: 0,
      traceabilityRecords: 2,
      errors: [],
      retryItemIds: [],
      itemResults: [
        { id: "ok-id", filename: "ok.jpg", status: "packaged" },
        { id: "failed-id", filename: "failed.jpg", status: "packaged" },
      ],
      archiveParts: 2,
      estimatedBytes: 2048,
      partEstimatedBytes: [1024, 1024],
    });
  });
});
