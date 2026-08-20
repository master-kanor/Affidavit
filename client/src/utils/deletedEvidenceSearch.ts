export type DeletedEvidenceSearchItem = {
  id: string;
  evidenceItem: string | number;
  filename: string;
  group: string;
  appendixPage: number;
  deletedAt: string | null;
};

export type DeletedEvidenceAnnotation = {
  tags: string[];
  note: string;
  updatedAt: string;
};

export type DeletedEvidenceFilters = {
  query?: string;
  tag?: string;
  deletedFrom?: string;
  deletedTo?: string;
};

const endOfLocalDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const startOfLocalDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

export function filterDeletedEvidenceItems<T extends DeletedEvidenceSearchItem>(
  items: readonly T[],
  annotations: Record<string, DeletedEvidenceAnnotation | undefined>,
  filters: DeletedEvidenceFilters,
): T[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const tag = (filters.tag ?? "").trim().toLowerCase();
  const from = filters.deletedFrom ? startOfLocalDay(filters.deletedFrom) : null;
  const to = filters.deletedTo ? endOfLocalDay(filters.deletedTo) : null;

  return items.filter((item) => {
    const annotation = annotations[item.id];
    const searchable = [
      item.evidenceItem,
      item.filename,
      item.group,
      String(item.appendixPage),
      annotation?.note ?? "",
      ...(annotation?.tags ?? []),
    ].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return false;
    if (tag && !(annotation?.tags ?? []).some((value) => value.trim().toLowerCase() === tag)) return false;

    if (from !== null || to !== null) {
      if (!item.deletedAt) return false;
      const deletedAt = new Date(item.deletedAt).getTime();
      if (Number.isNaN(deletedAt)) return false;
      if (from !== null && deletedAt < from) return false;
      if (to !== null && deletedAt > to) return false;
    }
    return true;
  });
}
