import { describe, expect, it, vi } from "vitest";
import { exportCatalogToCsv, exportCatalogToReportJson } from "@/utils/exportCatalog";
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
];

describe("catalog export helpers", () => {
  it("creates a downloadable CSV or JSON without throwing", () => {
    // Mock minimal DOM for Node test environment
    if (typeof document === "undefined") {
      (global as unknown as { document: unknown }).document = {
        createElement: () => ({ setAttribute: () => {}, click: () => {}, remove: () => {} }),
        body: { appendChild: () => {}, removeChild: () => {} },
      };
    }
    if (typeof URL.createObjectURL === "undefined") {
      URL.createObjectURL = () => "blob:mock";
      URL.revokeObjectURL = () => {};
    }

    expect(() => exportCatalogToCsv(sampleItems, "test")).not.toThrow();
    expect(() => exportCatalogToReportJson(sampleItems, "test")).not.toThrow();
  });
});
