import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BatchDownloadCompletionSummary from "@/components/BatchDownloadCompletionSummary";
import type { BatchDownloadSummaryResult } from "@/utils/batchDownload";

const summary: BatchDownloadSummaryResult = {
  totalSelected: 12,
  packagedFiles: 10,
  unavailableFiles: 1,
  failedFiles: 1,
  traceabilityRecords: 12,
  errors: ["missing.jpg: no managed asset URL", "failed.jpg: request failed"],
  retryItemIds: ["missing-id", "failed-id"],
  itemResults: [],
  archiveParts: 3,
  estimatedBytes: 5242880,
  partEstimatedBytes: [2097152, 2097152, 1048576],
};

describe("BatchDownloadCompletionSummary", () => {
  it("shows the finished state, total exported files, total size, and ZIP parts", () => {
    const html = renderToStaticMarkup(<BatchDownloadCompletionSummary summary={summary} />);

    expect(html).toContain("Export complete");
    expect(html).toContain("All 3 ZIP parts finished downloading");
    expect(html).toContain('aria-label="10 files exported"');
    expect(html).toContain("5.0 MB");
    expect(html).toContain('aria-label="3 ZIP parts downloaded"');
  });

  it("reports partial completion when one ZIP part needs retry", () => {
    const html = renderToStaticMarkup(<BatchDownloadCompletionSummary summary={{ ...summary, archivePartResults: [
      { partNumber: 1, totalParts: 3, entryIds: ["a"], estimatedBytes: 1024, status: "downloaded" },
      { partNumber: 2, totalParts: 3, entryIds: ["b"], estimatedBytes: 1024, status: "failed", error: "network interrupted" },
      { partNumber: 3, totalParts: 3, entryIds: ["c"], estimatedBytes: 1024, status: "downloaded" },
    ], retryPartNumbers: [2] }} />);

    expect(html).toContain("Export partially complete");
    expect(html).toContain("2 of 3 ZIP parts finished; 1 requires retry.");
    expect(html).toContain("Completed parts remain available");
  });
});
