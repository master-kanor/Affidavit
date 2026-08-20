import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const catalogText = fs.readFileSync("client/src/data/affidavitImageCatalog.ts", "utf8");
const filenames = [...catalogText.matchAll(/"filename":\s*"([^"]+)"/g)].map((match) => match[1]);
const uniqueFilenames = [...new Set(filenames)];
const zipPath = "/tmp/evidence-export-part-1.zip";
const archiveList = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" }).split("\n").filter(Boolean);
const matches = uniqueFilenames.map((filename) => ({
  filename,
  members: archiveList.filter((member) => path.posix.basename(member) === filename),
}));
const output = {
  catalogCount: filenames.length,
  uniqueCatalogCount: uniqueFilenames.length,
  matchedUniqueCount: matches.filter((entry) => entry.members.length > 0).length,
  missing: matches.filter((entry) => entry.members.length === 0),
  duplicateMemberMatches: matches.filter((entry) => entry.members.length > 1),
  matches,
};
fs.writeFileSync("/tmp/gallery-asset-inventory.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify({
  catalogCount: output.catalogCount,
  uniqueCatalogCount: output.uniqueCatalogCount,
  matchedUniqueCount: output.matchedUniqueCount,
  missingCount: output.missing.length,
  duplicateMemberMatchCount: output.duplicateMemberMatches.length,
}, null, 2));
