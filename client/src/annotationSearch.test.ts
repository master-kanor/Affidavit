import { describe, expect, it } from "vitest";
import { filterCatalogByAnnotationQuery, filterCatalogByAdvancedAnnotationFilters } from "@/utils/annotationSearch";
import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import type { AdminImageAnnotationMap } from "@/utils/adminAnnotations";

const items: AffidavitImageCatalogItem[] = [
  { id: "image-1", evidenceItem: 1, appendixPage: 13, slot: 1, filename: "lock.jpg", group: "source-images", width: 100, height: 100, mime: "image/jpeg" },
  { id: "image-2", evidenceItem: 2, appendixPage: 14, slot: 1, filename: "street.jpg", group: "source-images", width: 100, height: 100, mime: "image/jpeg" },
];

const annotations: AdminImageAnnotationMap = {
  "image-1": { tags: ["urgent", "review"], note: "Check chain of custody" , updatedAt: "2026-08-18T00:00:00.000Z" },
  "image-2": { tags: ["context"], note: "Street context", updatedAt: "2026-08-18T00:00:00.000Z" },
};

describe("annotation search", () => {
  it("matches annotation notes and tags case-insensitively", () => {
    expect(filterCatalogByAnnotationQuery(items, annotations, "CHAIN").map((item) => item.id)).toEqual(["image-1"]);
    expect(filterCatalogByAnnotationQuery(items, annotations, "context").map((item) => item.id)).toEqual(["image-2"]);
  });

  it("returns every item for an empty query and none for no match", () => {
    expect(filterCatalogByAnnotationQuery(items, annotations, "")).toHaveLength(2);
    expect(filterCatalogByAnnotationQuery(items, annotations, "missing")).toHaveLength(0);
  });

  it("filters by a selected tag and inclusive updated date range", () => {
    expect(filterCatalogByAdvancedAnnotationFilters(items, annotations, { tag: "urgent" }).map((item) => item.id)).toEqual(["image-1"]);
    expect(filterCatalogByAdvancedAnnotationFilters(items, annotations, { updatedFrom: "2026-08-18" }).map((item) => item.id)).toEqual(["image-1", "image-2"]);
    expect(filterCatalogByAdvancedAnnotationFilters(items, annotations, { updatedTo: "2026-08-17" })).toHaveLength(0);
  });
});
