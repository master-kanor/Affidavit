import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import BatchDownloadProgress from "@/components/BatchDownloadProgress";

describe("BatchDownloadProgress", () => {
  it("renders no progress panel while a batch export is idle", () => {
    expect(renderToStaticMarkup(<BatchDownloadProgress active={false} percent={0} text="" />)).toBe("");
  });

  it("renders an accessible animated progress panel with clamped percentage and cancellation", () => {
    const html = renderToStaticMarkup(<BatchDownloadProgress active percent={106} text="Generating ZIP part 2 of 4" onCancel={vi.fn()} partNumber={2} totalParts={4} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain("Generating ZIP part 2 of 4");
    expect(html).toContain("animate-spin");
    expect(html).toContain("Cancel Download");
    expect(html).toContain('aria-label="Cancel download"');
    expect(html).toContain("ZIP part 2 of 4");
    expect(html).toContain('aria-label="ZIP part 2 of 4"');
  });

  it("renders pause and resume controls for the active ZIP part", () => {
    const pausedHtml = renderToStaticMarkup(<BatchDownloadProgress active percent={48} text="Generating ZIP part 1 of 3" onCancel={vi.fn()} onPause={vi.fn()} partNumber={1} totalParts={3} />);
    expect(pausedHtml).toContain("Pause Download");
    expect(pausedHtml).toContain('aria-label="Pause download"');
    expect(pausedHtml).toContain("focus-visible:ring-2");

    const resumedHtml = renderToStaticMarkup(<BatchDownloadProgress active paused percent={48} text="Paused ZIP part 1 of 3" onCancel={vi.fn()} onResume={vi.fn()} partNumber={1} totalParts={3} />);
    expect(resumedHtml).toContain("Resume Download");
    expect(resumedHtml).toContain('aria-label="Resume download"');
  });
});
