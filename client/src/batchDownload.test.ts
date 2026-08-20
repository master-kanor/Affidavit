import { describe, expect, it, vi } from "vitest";
import { batchDownloadCatalogImages, retryBatchDownloadPart } from "@/utils/batchDownload";
import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";

const sampleItems: AffidavitImageCatalogItem[] = [
  {
    id: "source-image-1",
    evidenceItem: 1,
    appendixPage: 13,
    slot: 1,
    filename: "evidence-photo-1.jpg",
    group: "source-images",
    width: 1200,
    height: 800,
    mime: "image/jpeg",
  },
  {
    id: "source-image-missing",
    evidenceItem: 2,
    appendixPage: 14,
    slot: 2,
    filename: "evidence-photo-missing.jpg",
    group: "source-images",
    width: 1200,
    height: 800,
    mime: "image/jpeg",
  },
];

describe("batch download ZIP helpers", () => {
  it("throws error when items list is empty", async () => {
    await expect(batchDownloadCatalogImages([])).rejects.toThrow("No image records match");
  });

  it("stops immediately with an AbortError when cancellation was requested before export", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(batchDownloadCatalogImages([sampleItems[0]], undefined, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });

  it("retries one managed ZIP part and returns part-specific completion metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
    vi.stubGlobal("document", {
      createElement: () => ({ setAttribute: () => {}, click: () => {}, remove: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
    });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:part-retry"), revokeObjectURL: vi.fn() });

    const result = await retryBatchDownloadPart([sampleItems[0]], 2, 3);
    expect(result.archiveParts).toBe(1);
    expect(result.archivePartResults).toEqual([
      expect.objectContaining({ partNumber: 2, totalParts: 3, status: "downloaded", entryIds: ["source-image-1"] }),
    ]);
    expect(result.retryPartNumbers).toEqual([]);

    vi.unstubAllGlobals();
  });

  it("returns a failed part result when the browser download action throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
    vi.stubGlobal("document", {
      createElement: () => ({ setAttribute: () => {}, click: () => { throw new Error("download blocked"); }, remove: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
    });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:part-failure"), revokeObjectURL: vi.fn() });

    const result = await retryBatchDownloadPart([sampleItems[0]], 2, 3);
    expect(result.archivePartResults?.[0]).toMatchObject({ partNumber: 2, status: "failed", error: "download blocked" });
    expect(result.retryPartNumbers).toEqual([2]);

    vi.unstubAllGlobals();
  });

  it("returns a detailed completion summary without fabricating failed image content", async () => {
    if (typeof document === "undefined") {
      (global as unknown as { document: unknown }).document = {
        createElement: () => ({ setAttribute: () => {}, click: () => {}, remove: () => {} }),
        body: { appendChild: () => {}, removeChild: () => {} },
      };
    }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer }));
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });

    const progressSpy = vi.fn();
    const result = await batchDownloadCatalogImages(sampleItems, progressSpy);
    expect(result).toMatchObject({
      totalSelected: 2,
      packagedFiles: 1,
      unavailableFiles: 1,
      failedFiles: 0,
      traceabilityRecords: 2,
    });
    expect(progressSpy).toHaveBeenCalledWith(50, expect.stringContaining("source asset"), { stage: "fetching", itemNumber: 1, totalItems: 2 });
    expect(progressSpy).toHaveBeenCalledWith(95, "Generating ZIP part 1 of 1...", { stage: "generating", partNumber: 1, totalParts: 1 });

    vi.unstubAllGlobals();
  });
});
