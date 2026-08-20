import { affidavitGalleryAssetUrls } from "@/data/affidavitGalleryAssets";
import { affidavitImageCatalog, type AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";

export type PublicEvidenceRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  status: "verified";
  createdAt: string;
  uploadedBy: string;
  sourceFilename: string;
  appendixPage: number;
  slot: number;
};

const publicCategory = (item: AffidavitImageCatalogItem) => {
  if (item.appendixPage <= 24) return "Mapped source evidence — Testimony 1";
  if (item.appendixPage <= 52) return "Mapped source evidence — Testimony 2";
  return "Mapped source evidence — Testimony 3";
};

export function buildStaticEvidenceRecords(): PublicEvidenceRecord[] {
  return affidavitImageCatalog.flatMap((item) => {
    const fileUrl = affidavitGalleryAssetUrls[item.id];
    if (!fileUrl) return [];
    return [{
      id: item.id,
      title: `Evidence image ${item.evidenceItem}`,
      description: `Read-only source image from the supplied evidence archive. Appendix page ${item.appendixPage}, slot ${item.slot}.`,
      category: publicCategory(item),
      fileUrl,
      status: "verified" as const,
      createdAt: `2026-01-${String(Math.min(item.appendixPage, 28)).padStart(2, "0")}T00:00:00.000Z`,
      uploadedBy: "Verified source archive",
      sourceFilename: item.filename,
      appendixPage: item.appendixPage,
      slot: item.slot,
    }];
  });
}
