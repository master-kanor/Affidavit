import { afterEach, describe, expect, it } from "vitest";
import {
  appendDraftInsight,
  filterHistoryInsights,
  loadDraftInsights,
  loadUndoneInsights,
  restoreUndoneInsight,
  saveDraftInsights,
  saveUndoneInsights,
  undoDraftInsight,
  type DraftCitation,
} from "./adminDraft";

const citation: DraftCitation = {
  id: "source-page-24",
  label: "Source evidence affidavit, page 24",
  page: 24,
  source: "Provided evidence affidavit export",
};

function installStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("admin draft history", () => {
  it("appends an insight once and rejects the same content/citations as a duplicate", () => {
    installStorage();
    const input = { content: "The source evidence links are mapped to page 24.", citations: [citation], authorEmail: "admin@masterkanorcase.online" };
    const first = appendDraftInsight(input);
    const second = appendDraftInsight(input);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(loadDraftInsights()).toHaveLength(1);
  });

  it("moves an appended insight into undo history and restores it", () => {
    installStorage();
    const { insight } = appendDraftInsight({ content: "A traceable source reference.", citations: [citation], authorEmail: "owner@example.com" });

    expect(undoDraftInsight(insight.id).removed?.id).toBe(insight.id);
    expect(loadDraftInsights()).toHaveLength(0);
    expect(loadUndoneInsights()).toHaveLength(1);

    expect(restoreUndoneInsight(insight.id).restored?.id).toBe(insight.id);
    expect(loadDraftInsights()).toHaveLength(1);
    expect(loadUndoneInsights()).toHaveLength(0);
  });

  it("filters undone insights by keyword and inclusive date range", () => {
    installStorage();
    saveUndoneInsights([
      { id: "one", content: "YouTube source reference", citations: [citation], authorEmail: "admin@example.com", createdAt: "2026-08-10T09:00:00.000Z", undoneAt: "2026-08-12T10:00:00.000Z" },
      { id: "two", content: "Google Drive document", citations: [{ ...citation, id: "source-page-21", label: "Source evidence folder, page 21", page: 21 }], authorEmail: "owner@example.com", createdAt: "2026-08-11T09:00:00.000Z", undoneAt: "2026-08-14T10:00:00.000Z" },
    ]);

    expect(filterHistoryInsights(loadUndoneInsights(), "youtube", "2026-08-12", "2026-08-12").map((item) => item.id)).toEqual(["one"]);
    expect(filterHistoryInsights(loadUndoneInsights(), "", "2026-08-13", "2026-08-15").map((item) => item.id)).toEqual(["two"]);
  });

  it("reports already undone actions without deleting unrelated history", () => {
    installStorage();
    saveDraftInsights([]);
    saveUndoneInsights([{ id: "gone", content: "Already removed", citations: [citation], authorEmail: "admin@example.com", createdAt: "2026-08-10T09:00:00.000Z", undoneAt: "2026-08-12T10:00:00.000Z" }]);

    expect(undoDraftInsight("gone")).toEqual({ removed: null, alreadyUndone: true });
    expect(loadUndoneInsights()).toHaveLength(1);
  });
});
