import { describe, expect, it } from "vitest";
import { filterDeletedEvidenceItems } from "@/utils/deletedEvidenceSearch";

const items = [
  { id: "one", evidenceItem: "Evidence 1", filename: "lock.jpg", group: "Testimony 1", appendixPage: 18, deletedAt: "2026-08-17T09:00:00.000Z" },
  { id: "two", evidenceItem: "Evidence 2", filename: "screen.png", group: "Testimony 2", appendixPage: 42, deletedAt: "2026-08-18T12:00:00.000Z" },
  { id: "three", evidenceItem: "Evidence 3", filename: "note.jpg", group: "Testimony 2", appendixPage: 51, deletedAt: null },
];

const annotations = {
  one: { tags: ["physical", "priority"], note: "Padlock detail", updatedAt: "2026-08-10T00:00:00.000Z" },
  two: { tags: ["digital"], note: "Monitor capture", updatedAt: "2026-08-11T00:00:00.000Z" },
  three: { tags: ["physical"], note: "Handwritten note", updatedAt: "2026-08-12T00:00:00.000Z" },
};

describe("filterDeletedEvidenceItems", () => {
  it("searches deleted metadata and annotation text", () => {
    expect(filterDeletedEvidenceItems(items, annotations, { query: "padlock" }).map((item) => item.id)).toEqual(["one"]);
    expect(filterDeletedEvidenceItems(items, annotations, { query: "testimony 2" }).map((item) => item.id)).toEqual(["two", "three"]);
  });

  it("matches a specific custom tag", () => {
    expect(filterDeletedEvidenceItems(items, annotations, { tag: "digital" }).map((item) => item.id)).toEqual(["two"]);
  });

  it("applies inclusive deletion date ranges and excludes unavailable dates", () => {
    expect(filterDeletedEvidenceItems(items, annotations, { deletedFrom: "2026-08-17", deletedTo: "2026-08-18" }).map((item) => item.id)).toEqual(["one", "two"]);
  });
});
