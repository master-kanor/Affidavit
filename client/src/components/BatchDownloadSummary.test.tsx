import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import BatchDownloadSummary from "@/components/BatchDownloadSummary";
import type { BatchDownloadSummaryResult } from "@/utils/batchDownload";

const summary: BatchDownloadSummaryResult = {
  totalSelected: 4,
  packagedFiles: 2,
  unavailableFiles: 1,
  failedFiles: 1,
  traceabilityRecords: 4,
  errors: ["missing-file.jpg: no managed asset URL", "failed-file.jpg: asset request returned 503"],
  retryItemIds: ["missing-id", "failed-id"],
  itemResults: [
    { id: "packaged-id", filename: "packaged-file.jpg", status: "packaged" },
    { id: "packaged-id-2", filename: "packaged-file-2.jpg", status: "packaged" },
    { id: "missing-id", filename: "missing-file.jpg", status: "unavailable", error: "no managed asset URL" },
    { id: "failed-id", filename: "failed-file.jpg", status: "failed", error: "asset request returned 503" },
  ],
  archiveParts: 1,
  estimatedBytes: 2048,
  partEstimatedBytes: [2048],
};

describe("BatchDownloadSummary", () => {
  it("shows an individual retry action for a failed ZIP part", () => {
    const failedPartSummary: BatchDownloadSummaryResult = {
      ...summary,
      archiveParts: 3,
      archivePartResults: [
        { partNumber: 1, totalParts: 3, entryIds: ["packaged-id"], estimatedBytes: 1024, status: "downloaded", fileName: "part-1.zip" },
        { partNumber: 2, totalParts: 3, entryIds: ["failed-id"], estimatedBytes: 1024, status: "failed", error: "download stream interrupted" },
        { partNumber: 3, totalParts: 3, entryIds: ["packaged-id-2"], estimatedBytes: 1024, status: "downloaded", fileName: "part-3.zip" },
      ],
      retryPartNumbers: [2],
    };
    const html = renderToStaticMarkup(<BatchDownloadSummary summary={failedPartSummary} onDismiss={vi.fn()} onRetry={vi.fn()} onRetryPart={vi.fn()} />);
    expect(html).toContain("ZIP part download failures");
    expect(html).toContain("ZIP part 2 of 3: download stream interrupted");
    expect(html).toContain('aria-label="Retry ZIP part 2"');
  });
  it("shows file totals, errors, and a dismiss control", () => {
    const html = renderToStaticMarkup(<BatchDownloadSummary summary={summary} onDismiss={vi.fn()} onRetry={vi.fn()} />);
    expect(html).toContain('role="region"');
    expect(html).toContain("Batch ZIP download summary");
    expect(html).toContain("4");
    expect(html).toContain('aria-label="2 packaged"');
    expect(html).toContain("1 ZIP part generated");
    expect(html).toContain("estimated payload 0 MB");
    expect(html).toContain('aria-label="1 unavailable"');
    expect(html).toContain('aria-label="1 failed"');
    expect(html).toContain("missing-file.jpg: no managed asset URL");
    expect(html).toContain("failed-file.jpg: asset request returned 503");
    expect(html).toContain("Copy error breakdown");
    expect(html).toContain('aria-label="Copy error breakdown to clipboard"');
    expect(html).toContain("Retry Failed Downloads");
    expect(html).toContain('aria-label="Retry failed downloads"');
    expect(html).toContain("Dismiss summary");
  });
});
