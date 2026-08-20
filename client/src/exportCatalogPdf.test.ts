import { describe, expect, it, vi } from "vitest";
import { exportCatalogToPdfReport } from "@/utils/exportCatalogPdf";
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

describe("catalog PDF export helpers", () => {
  it("opens a print window for the PDF report without throwing", () => {
    if (typeof window === "undefined") {
      (global as unknown as { window: unknown }).window = {
        open: () => ({
          document: { write: () => {}, close: () => {} },
        }),
        alert: () => {},
      };
    }

    const openSpy = vi.spyOn(window, "open").mockReturnValue({
      document: {
        write: () => {},
        close: () => {},
      },
    } as unknown as Window);

    expect(() => exportCatalogToPdfReport(sampleItems, "test")).not.toThrow();
    expect(openSpy).toHaveBeenCalled();
  });
});
