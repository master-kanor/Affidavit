import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import { loadAdminAnnotations } from "@/utils/adminAnnotations";

export function exportCatalogToCsv(items: readonly AffidavitImageCatalogItem[], searchFilter?: string) {
  const headers = ["ID", "Evidence Item", "Appendix Page", "Slot", "Filename", "Group", "Width", "Height", "MIME Type", "Tags", "Annotation"];
  const annotations = loadAdminAnnotations();
  const rows = items.map((item) => [
    item.id,
    item.evidenceItem,
    item.appendixPage,
    item.slot,
    `"${item.filename.replace(/"/g, '""')}"`,
    `"${item.group.replace(/"/g, '""')}"`,
    item.width,
    item.height,
    item.mime,
    `"${(annotations[item.id]?.tags ?? []).join("; ").replace(/"/g, '""')}"`,
    `"${(annotations[item.id]?.note ?? "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filterSuffix = searchFilter ? `-${searchFilter.replace(/[^a-z0-9]/gi, "_").toLowerCase()}` : "";
  link.setAttribute("href", url);
  link.setAttribute("download", `master-kanor-evidence-catalog${filterSuffix}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportCatalogToReportJson(items: readonly AffidavitImageCatalogItem[], searchFilter?: string) {
  const annotations = loadAdminAnnotations();
  const report = {
    title: "Master Kanor Affidavit - Filtered Evidence Image Catalog Report",
    generatedAt: new Date().toISOString(),
    filterQuery: searchFilter || "None",
    totalMatchedRecords: items.length,
    records: items.map((item) => ({
      ...item,
      adminTags: annotations[item.id]?.tags ?? [],
      adminAnnotation: annotations[item.id]?.note ?? "",
      annotationUpdatedAt: annotations[item.id]?.updatedAt ?? null,
    })),
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const link = document.createElement("a");
  const filterSuffix = searchFilter ? `-${searchFilter.replace(/[^a-z0-9]/gi, "_").toLowerCase()}` : "";
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `master-kanor-evidence-report${filterSuffix}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
