export const ADMIN_DELETED_EVIDENCE_STORAGE_KEY = "master-kanor-admin-deleted-evidence";

export interface AdminDeletedEvidenceRecord {
  id: string;
  deletedAt: string | null;
}

function getStorage(storage?: Storage): Storage | undefined {
  return storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
}

export function loadDeletedEvidenceRecords(storage?: Storage): AdminDeletedEvidenceRecord[] {
  const target = getStorage(storage);
  if (!target) return [];
  try {
    const raw = target.getItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): AdminDeletedEvidenceRecord[] => {
      if (typeof entry === "string") return [{ id: entry, deletedAt: null }];
      if (!entry || typeof entry !== "object") return [];
      const value = entry as { id?: unknown; deletedAt?: unknown };
      return typeof value.id === "string" ? [{ id: value.id, deletedAt: typeof value.deletedAt === "string" ? value.deletedAt : null }] : [];
    });
  } catch {
    return [];
  }
}

export function loadDeletedEvidenceIds(storage?: Storage): string[] {
  return loadDeletedEvidenceRecords(storage).map((record) => record.id);
}

export function deleteAdminEvidenceItems(ids: readonly string[], storage?: Storage): AdminDeletedEvidenceRecord[] {
  const current = new Map(loadDeletedEvidenceRecords(storage).map((record) => [record.id, record]));
  const now = new Date().toISOString();
  ids.forEach((id) => {
    if (!current.has(id)) current.set(id, { id, deletedAt: now });
  });
  const records = Array.from(current.values());
  getStorage(storage)?.setItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY, JSON.stringify(records));
  return records;
}

export function restoreAdminEvidenceItems(ids: readonly string[], storage?: Storage): AdminDeletedEvidenceRecord[] {
  const deletedIds = new Set(ids);
  const records = loadDeletedEvidenceRecords(storage).filter((record) => !deletedIds.has(record.id));
  getStorage(storage)?.setItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY, JSON.stringify(records));
  return records;
}

/** Permanently removes records from the local admin trash index only. The immutable source dossier is never changed. */
export function purgeDeletedEvidenceItems(ids: readonly string[], storage?: Storage): AdminDeletedEvidenceRecord[] {
  const purgedIds = new Set(ids);
  const records = loadDeletedEvidenceRecords(storage).filter((record) => !purgedIds.has(record.id));
  getStorage(storage)?.setItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY, JSON.stringify(records));
  return records;
}

/** Permanently clears the local admin trash index only. The immutable source dossier is never changed. */
export function emptyDeletedEvidenceItems(storage?: Storage): AdminDeletedEvidenceRecord[] {
  getStorage(storage)?.setItem(ADMIN_DELETED_EVIDENCE_STORAGE_KEY, JSON.stringify([]));
  return [];
}
