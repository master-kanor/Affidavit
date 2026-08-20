import { describe, expect, it } from "vitest";
import { loadAdminAnnotations, normalizeAnnotation, saveAdminAnnotation, type AdminImageAnnotation } from "@/utils/adminAnnotations";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  };
}

describe("admin image annotations", () => {
  it("normalizes, trims, and deduplicates tags", () => {
    expect(normalizeAnnotation({ tags: ["  urgent ", "urgent", "Evidence"], note: "  Review source  " })).toMatchObject({
      tags: ["urgent", "Evidence"],
      note: "Review source",
    });
  });

  it("persists and reloads an annotation by image id", () => {
    const storage = createMemoryStorage();
    const annotation: AdminImageAnnotation = { tags: ["verified"], note: "Cross-check appendix", updatedAt: "2026-08-18T00:00:00.000Z" };
    saveAdminAnnotation("source-image-1", annotation, storage);
    expect(loadAdminAnnotations(storage)["source-image-1"]).toEqual(annotation);
  });
});
