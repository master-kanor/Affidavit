import { describe, expect, it } from "vitest";
import { ADMIN_ANNOTATIONS_STORAGE_KEY, applyAdminTagToAnnotations, deleteAdminAnnotations, type AdminImageAnnotationMap } from "@/utils/adminAnnotations";
import { ADMIN_DELETED_EVIDENCE_STORAGE_KEY, deleteAdminEvidenceItems, emptyDeletedEvidenceItems, loadDeletedEvidenceIds, loadDeletedEvidenceRecords, purgeDeletedEvidenceItems, restoreAdminEvidenceItems } from "@/utils/adminEvidenceWorkspace";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe("bulk admin annotations", () => {
  it("adds a normalized tag to selected records without removing existing tags", () => {
    const storage = createStorage();
    const initial: AdminImageAnnotationMap = {
      "image-1": { tags: ["review"], note: "First", updatedAt: "2026-08-18T00:00:00.000Z" },
      "image-2": { tags: [], note: "Second", updatedAt: "2026-08-18T00:00:00.000Z" },
    };
    storage.setItem(ADMIN_ANNOTATIONS_STORAGE_KEY, JSON.stringify(initial));

    const updated = applyAdminTagToAnnotations(["image-1", "image-2"], "  urgent  ", storage);
    expect(updated["image-1"].tags).toEqual(["review", "urgent"]);
    expect(updated["image-2"].tags).toEqual(["urgent"]);
  });

  it("deletes only selected annotation records and persists the remainder", () => {
    const storage = createStorage();
    storage.setItem(ADMIN_ANNOTATIONS_STORAGE_KEY, JSON.stringify({
      "image-1": { tags: ["review"], note: "First", updatedAt: "2026-08-18T00:00:00.000Z" },
      "image-2": { tags: ["context"], note: "Second", updatedAt: "2026-08-18T00:00:00.000Z" },
    }));

    const remaining = deleteAdminAnnotations(["image-1"], storage);
    expect(remaining["image-1"]).toBeUndefined();
    expect(remaining["image-2"].tags).toEqual(["context"]);
    expect(JSON.parse(storage.getItem(ADMIN_ANNOTATIONS_STORAGE_KEY) ?? "{}")["image-1"]).toBeUndefined();
  });

  it("persists deleted evidence IDs without changing the source catalog", () => {
    const storage = createStorage();
    const deleted = deleteAdminEvidenceItems(["image-1", "image-2"], storage);
    expect(deleted.map((record) => record.id)).toEqual(["image-1", "image-2"]);
    expect(deleted.every((record) => typeof record.deletedAt === "string")).toBe(true);
    expect(loadDeletedEvidenceIds(storage)).toEqual(["image-1", "image-2"]);
    expect(JSON.parse(storage.getItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY) ?? "[]")).toHaveLength(2);
  });

  it("restores selected deleted evidence records and persists the remaining trash", () => {
    const storage = createStorage();
    deleteAdminEvidenceItems(["image-1", "image-2"], storage);
    const remaining = restoreAdminEvidenceItems(["image-1"], storage);
    expect(remaining.map((record) => record.id)).toEqual(["image-2"]);
    expect(loadDeletedEvidenceRecords(storage)).toEqual(remaining);
  });

  it("purges only confirmed deleted records from the trash index", () => {
    const storage = createStorage();
    deleteAdminEvidenceItems(["image-1", "image-2"], storage);
    const remaining = purgeDeletedEvidenceItems(["image-2"], storage);
    expect(remaining.map((record) => record.id)).toEqual(["image-1"]);
    expect(loadDeletedEvidenceIds(storage)).toEqual(["image-1"]);
  });

  it("empties the entire trash index without mutating the source catalog", () => {
    const storage = createStorage();
    deleteAdminEvidenceItems(["image-1", "image-2"], storage);
    expect(emptyDeletedEvidenceItems(storage)).toEqual([]);
    expect(loadDeletedEvidenceIds(storage)).toEqual([]);
    expect(JSON.parse(storage.getItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY) ?? "null")).toEqual([]);
  });
});
