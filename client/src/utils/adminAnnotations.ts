export interface AdminImageAnnotation {
  tags: string[];
  note: string;
  updatedAt: string;
}

export type AdminImageAnnotationMap = Record<string, AdminImageAnnotation>;

export const ADMIN_ANNOTATIONS_STORAGE_KEY = "master-kanor-admin-evidence-annotations";

export function normalizeAnnotation(input: Pick<AdminImageAnnotation, "tags" | "note"> & Partial<Pick<AdminImageAnnotation, "updatedAt">>): AdminImageAnnotation {
  const tags = Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)));
  return {
    tags,
    note: input.note.trim(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function loadAdminAnnotations(storage?: Storage): AdminImageAnnotationMap {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  if (!target) return {};
  try {
    const raw = target.getItem(ADMIN_ANNOTATIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<AdminImageAnnotation>>;
    return Object.fromEntries(
      Object.entries(parsed).map(([id, value]) => [id, normalizeAnnotation({
        tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string") : [],
        note: typeof value.note === "string" ? value.note : "",
        updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
      })]),
    );
  } catch {
    return {};
  }
}

export function saveAdminAnnotation(id: string, annotation: AdminImageAnnotation, storage?: Storage): AdminImageAnnotationMap {
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  const current = loadAdminAnnotations(target);
  current[id] = normalizeAnnotation(annotation);
  if (target) {
    target.setItem(ADMIN_ANNOTATIONS_STORAGE_KEY, JSON.stringify(current));
  }
  return current;
}

export function applyAdminTagToAnnotations(ids: readonly string[], tag: string, storage?: Storage): AdminImageAnnotationMap {
  const normalizedTag = tag.trim();
  const current = loadAdminAnnotations(storage);
  if (!normalizedTag) return current;
  const now = new Date().toISOString();
  for (const id of ids) {
    const existing = current[id] ?? normalizeAnnotation({ tags: [], note: "" });
    current[id] = normalizeAnnotation({
      tags: [...existing.tags, normalizedTag],
      note: existing.note,
      updatedAt: now,
    });
  }
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  target?.setItem(ADMIN_ANNOTATIONS_STORAGE_KEY, JSON.stringify(current));
  return current;
}

export function deleteAdminAnnotations(ids: readonly string[], storage?: Storage): AdminImageAnnotationMap {
  const current = loadAdminAnnotations(storage);
  for (const id of ids) delete current[id];
  const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
  target?.setItem(ADMIN_ANNOTATIONS_STORAGE_KEY, JSON.stringify(current));
  return current;
}
