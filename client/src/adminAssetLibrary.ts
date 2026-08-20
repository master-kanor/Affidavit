export type AdminAssetKind = "document" | "spreadsheet" | "image" | "video" | "text" | "audio" | "other";

export type AdminAssetRecord = {
  id: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  fileKey?: string | null;
  mimeType?: string | null;
  type?: string | null;
  status: "pending" | "verified" | "disputed" | "archived";
  category?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  fileSize?: number | null;
};

export type AdminAssetFilters = {
  kind?: AdminAssetKind | "all";
  status?: AdminAssetRecord["status"] | "all";
  search?: string;
};

const extensionKind = (url: string): AdminAssetKind | null => {
  const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (!extension) return null;
  if (["pdf", "doc", "docx", "odt", "rtf", "pages"].includes(extension)) return "document";
  if (["xls", "xlsx", "csv", "tsv", "ods"].includes(extension)) return "spreadsheet";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(extension)) return "image";
  if (["mp4", "webm", "mov", "m4v", "avi", "mkv"].includes(extension)) return "video";
  if (["txt", "md", "json", "xml", "html", "htm"].includes(extension)) return "text";
  if (["mp3", "wav", "m4a", "ogg", "flac"].includes(extension)) return "audio";
  return "other";
};

export function getAssetKind(asset: Pick<AdminAssetRecord, "mimeType" | "type" | "fileUrl">): AdminAssetKind {
  const mime = (asset.mimeType ?? "").toLowerCase();
  const type = (asset.type ?? "").toLowerCase();

  if (mime.startsWith("image/") || type.includes("image") || type.includes("photo")) return "image";
  if (mime.startsWith("video/") || type.includes("video") || type.includes("youtube") || type.includes("facebook")) return "video";
  if (mime.startsWith("audio/") || type.includes("audio")) return "audio";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv") || type.includes("sheet") || type.includes("spreadsheet")) return "spreadsheet";
  if (mime.startsWith("text/") || type.includes("text") || type.includes("markdown")) return "text";
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("document") || type.includes("pdf") || type.includes("document") || type.includes("affidavit")) return "document";

  return extensionKind(asset.fileUrl ?? "") ?? "other";
}

export function filterAdminAssets(assets: AdminAssetRecord[], filters: AdminAssetFilters = {}): AdminAssetRecord[] {
  const search = filters.search?.trim().toLowerCase();

  return assets.filter((asset) => {
    if (filters.kind && filters.kind !== "all" && getAssetKind(asset) !== filters.kind) return false;
    if (filters.status && filters.status !== "all" && asset.status !== filters.status) return false;
    if (search) {
      const haystack = [asset.title, asset.description, asset.category, asset.type, asset.mimeType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function formatAssetSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "Size unavailable";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
