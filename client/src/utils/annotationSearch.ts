import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import type { AdminImageAnnotationMap } from "@/utils/adminAnnotations";

export function filterCatalogByAnnotationQuery(
  items: readonly AffidavitImageCatalogItem[],
  annotations: AdminImageAnnotationMap,
  query: string,
): AffidavitImageCatalogItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...items];

  return items.filter((item) => {
    const annotation = annotations[item.id];
    const searchableAnnotation = [annotation?.note ?? "", ...(annotation?.tags ?? [])].join(" ").toLowerCase();
    return searchableAnnotation.includes(normalizedQuery);
  });
}

export interface AnnotationFilterOptions {
  tag?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

export function filterCatalogByAdvancedAnnotationFilters(
  items: readonly AffidavitImageCatalogItem[],
  annotations: AdminImageAnnotationMap,
  options: AnnotationFilterOptions,
): AffidavitImageCatalogItem[] {
  const selectedTag = options.tag?.trim().toLowerCase();
  const from = options.updatedFrom ? new Date(`${options.updatedFrom}T00:00:00.000Z`).getTime() : undefined;
  const to = options.updatedTo ? new Date(`${options.updatedTo}T23:59:59.999Z`).getTime() : undefined;

  return items.filter((item) => {
    const annotation = annotations[item.id];
    if (!annotation) return !selectedTag && from === undefined && to === undefined;
    if (selectedTag && !annotation.tags.some((tag) => tag.toLowerCase() === selectedTag)) return false;
    const updatedAt = new Date(annotation.updatedAt).getTime();
    if (from !== undefined && (!Number.isFinite(updatedAt) || updatedAt < from)) return false;
    if (to !== undefined && (!Number.isFinite(updatedAt) || updatedAt > to)) return false;
    return true;
  });
}
