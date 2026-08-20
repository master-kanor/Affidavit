import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import BatchDownloadCompletionSummary from "@/components/BatchDownloadCompletionSummary";
import BatchDownloadProgress from "@/components/BatchDownloadProgress";
import BatchDownloadSummary from "@/components/BatchDownloadSummary";
import type { BatchDownloadSummaryResult } from "@/utils/batchDownload";

const failedPartSummary: BatchDownloadSummaryResult = {
  totalSelected: 2,
  packagedFiles: 2,
  unavailableFiles: 0,
  failedFiles: 0,
  traceabilityRecords: 2,
  errors: ["ZIP part 2: network interrupted"],
  retryItemIds: [],
  itemResults: [
    { id: "one", filename: "one.jpg", status: "packaged" },
    { id: "two", filename: "two.jpg", status: "packaged" },
  ],
  archiveParts: 2,
  estimatedBytes: 2048,
  partEstimatedBytes: [1024, 1024],
  archivePartResults: [
    { partNumber: 1, totalParts: 2, entryIds: ["one"], estimatedBytes: 1024, status: "downloaded" },
    { partNumber: 2, totalParts: 2, entryIds: ["two"], estimatedBytes: 1024, status: "failed", error: "network interrupted" },
  ],
  retryPartNumbers: [2],
};

describe("batch export accessibility", () => {
  it("exposes a keyboard-reachable cancel button with visible focus styling", () => {
    const html = renderToStaticMarkup(<BatchDownloadProgress active percent={42} text="Generating" onCancel={vi.fn()} partNumber={1} totalParts={2} />);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Cancel download"');
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain('aria-label="ZIP part 1 of 2"');
  });

  it("exposes keyboard-reachable part retry, copy, and dismiss controls", () => {
    const html = renderToStaticMarkup(<BatchDownloadSummary summary={failedPartSummary} onDismiss={vi.fn()} onRetry={vi.fn()} onRetryPart={vi.fn()} />);
    expect(html).toContain('aria-label="Retry ZIP part 2"');
    expect(html).toContain('aria-label="Copy error breakdown to clipboard"');
    expect(html).toContain('aria-label="Dismiss summary"');
    expect((html.match(/focus-visible:ring-2/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("exposes the completion summary as a live status with labeled totals", () => {
    const html = renderToStaticMarkup(<BatchDownloadCompletionSummary summary={{ ...failedPartSummary, archivePartResults: failedPartSummary.archivePartResults?.map((part) => ({ ...part, status: "downloaded" as const })), retryPartNumbers: [] }} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="2 files exported"');
    expect(html).toContain('aria-label="2 ZIP parts downloaded"');
  });
});
