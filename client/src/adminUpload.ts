const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "video/", "audio/", "text/"];
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "application/xml",
  "application/rtf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

const extensionFor = (file: File): string => {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || "bin";
};

export function validateAdminUpload(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: "Evidence files must be 25 MB or smaller." };
  }

  const mimeType = file.type.toLowerCase();
  const isAllowed = ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
  if (!isAllowed) {
    return { valid: false, error: "This file type is not allowed for evidence uploads." };
  }

  return { valid: true };
}

export function buildEvidenceStorageKey(ownerId: string, file: File): string {
  const safeOwner = ownerId.trim().replace(/[^a-zA-Z0-9_-]/g, "-") || "admin";
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "evidence";
  return `${safeOwner}/${safeBase}-${Date.now()}.${extensionFor(file)}`;
}

export { MAX_UPLOAD_BYTES };
