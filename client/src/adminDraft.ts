export type DraftRole = "owner" | "admin";

export interface DraftCitation {
  id: string;
  label: string;
  page: number;
  source: string;
  url?: string;
}

export interface DraftInsight {
  id: string;
  content: string;
  citations: DraftCitation[];
  authorEmail: string;
  createdAt: string;
  restoredAt?: string;
}

export interface UndoneInsight extends DraftInsight {
  undoneAt: string;
}

export const DRAFT_STORAGE_KEY = "master-kanor:affidavit-draft:v1";
export const HISTORY_STORAGE_KEY = "master-kanor:affidavit-draft-history:v1";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The workspace remains usable if browser storage is unavailable.
  }
}

export function loadDraftInsights(): DraftInsight[] {
  return readStored<DraftInsight[]>(DRAFT_STORAGE_KEY, []);
}

export function loadUndoneInsights(): UndoneInsight[] {
  return readStored<UndoneInsight[]>(HISTORY_STORAGE_KEY, []);
}

export function saveDraftInsights(items: DraftInsight[]): void {
  writeStored(DRAFT_STORAGE_KEY, items);
}

export function saveUndoneInsights(items: UndoneInsight[]): void {
  writeStored(HISTORY_STORAGE_KEY, items);
}

export function canManageDraft(role: DraftRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

function citationKey(citations: DraftCitation[]): string {
  return citations.map((citation) => citation.id).sort().join("|");
}

export function appendDraftInsight(input: Omit<DraftInsight, "id" | "createdAt"> & { id?: string; createdAt?: string }): { insight: DraftInsight; duplicate: boolean } {
  const current = loadDraftInsights();
  const normalizedContent = input.content.trim();
  const incomingCitationKey = citationKey(input.citations);
  const duplicate = current.find(
    (item) => item.content.trim() === normalizedContent && citationKey(item.citations) === incomingCitationKey,
  );
  if (duplicate) return { insight: duplicate, duplicate: true };

  const insight: DraftInsight = {
    id: input.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    content: normalizedContent,
    citations: input.citations,
    authorEmail: input.authorEmail,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  saveDraftInsights([insight, ...current]);
  return { insight, duplicate: false };
}

export function undoDraftInsight(id: string): { removed: DraftInsight | null; alreadyUndone: boolean } {
  const current = loadDraftInsights();
  const removed = current.find((item) => item.id === id) ?? null;
  if (!removed) {
    return { removed: null, alreadyUndone: loadUndoneInsights().some((item) => item.id === id) };
  }

  saveDraftInsights(current.filter((item) => item.id !== id));
  const history = loadUndoneInsights().filter((item) => item.id !== id);
  saveUndoneInsights([{ ...removed, undoneAt: new Date().toISOString() }, ...history]);
  return { removed, alreadyUndone: false };
}

export function restoreUndoneInsight(id: string): { restored: DraftInsight | null; duplicate: boolean } {
  const history = loadUndoneInsights();
  const item = history.find((entry) => entry.id === id);
  if (!item) return { restored: null, duplicate: false };

  const current = loadDraftInsights();
  const duplicate = current.some(
    (entry) => entry.content.trim() === item.content.trim() && citationKey(entry.citations) === citationKey(item.citations),
  );
  if (duplicate) {
    saveUndoneInsights(history.filter((entry) => entry.id !== id));
    return { restored: null, duplicate: true };
  }

  const restored: DraftInsight = {
    id: item.id,
    content: item.content,
    citations: item.citations,
    authorEmail: item.authorEmail,
    createdAt: item.createdAt,
    restoredAt: new Date().toISOString(),
  };
  saveDraftInsights([restored, ...current]);
  saveUndoneInsights(history.filter((entry) => entry.id !== id));
  return { restored, duplicate: false };
}

export function filterHistoryInsights(items: UndoneInsight[], query: string, fromDate = "", toDate = ""): UndoneInsight[] {
  const needle = query.trim().toLowerCase();
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

  return items.filter((item) => {
    const haystack = [
      item.content,
      item.authorEmail,
      ...item.citations.map((citation) => `${citation.label} ${citation.source} page ${citation.page}`),
    ].join(" ").toLowerCase();
    const timestamp = new Date(item.undoneAt).getTime();
    return (!needle || haystack.includes(needle)) && timestamp >= from && timestamp <= to;
  });
}
