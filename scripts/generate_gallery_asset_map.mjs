import fs from "node:fs";

const catalogText = fs.readFileSync("client/src/data/affidavitImageCatalog.ts", "utf8");
const catalogItems = [...catalogText.matchAll(/"id":\s*"([^"]+)"[\s\S]*?"filename":\s*"([^"]+)"/g)].map((match) => ({ id: match[1], filename: match[2] }));
const localManifest = JSON.parse(fs.readFileSync("source-extract/gallery-asset-manifest.json", "utf8"));
const uploadOutput = fs.readFileSync("/tmp/gallery-upload-output.txt", "utf8");
const uploaded = new Map();
for (const match of uploadOutput.matchAll(/Uploading file \(webdev private\): .*?\/([^/]+\.webp) \(size:.*?\n(?:File uploaded successfully!\n)?Storage Path: (\/manus-storage\/[^\s]+)|\[SUCCESS\] .*?\/([^/]+\.webp) -> (\/manus-storage\/[^\s]+)/gs)) {
  const filename = match[1] || match[3];
  const url = match[2] || match[4];
  if (filename && url) uploaded.set(filename, url);
}
const byCatalogFilename = new Map();
for (const entry of localManifest.assets) {
  const localFilename = entry.assetPath.split("/").pop();
  const url = uploaded.get(localFilename);
  if (url) byCatalogFilename.set(entry.filename, url);
}
const missing = catalogItems.filter((item) => !byCatalogFilename.has(item.filename));
if (missing.length) throw new Error(`Missing uploaded URLs for ${missing.length} catalog items: ${missing.slice(0, 5).map((item) => item.filename).join(", ")}`);
const lines = [
  "// Generated from the supplied evidence archive and managed webdev asset uploads.",
  "// This file contains only read-only asset URLs; affidavit text remains in its original source files.",
  "export const affidavitGalleryAssetUrls: Record<string, string> = {",
  ...catalogItems.map((item) => `  ${JSON.stringify(item.id)}: ${JSON.stringify(byCatalogFilename.get(item.filename))},`),
  "};",
  "",
];
fs.writeFileSync("client/src/data/affidavitGalleryAssets.ts", lines.join("\n"));
fs.writeFileSync("source-extract/gallery-upload-summary.json", JSON.stringify({
  catalogRecordCount: catalogItems.length,
  uniqueFilenameCount: byCatalogFilename.size,
  missingCount: missing.length,
  uploadOutput: "/tmp/gallery-upload-output.txt",
}, null, 2) + "\n");
console.log(JSON.stringify({ catalogRecordCount: catalogItems.length, uniqueFilenameCount: byCatalogFilename.size, missingCount: missing.length }, null, 2));
