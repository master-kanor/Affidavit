import { describe, expect, it } from "vitest";
import {
  filterAdminAssets,
  getAssetKind,
  type AdminAssetRecord,
} from "./adminAssetLibrary";

const assets: AdminAssetRecord[] = [
  {
    id: "pdf-1",
    title: "Signed affidavit",
    description: "Official document",
    fileUrl: "https://cdn.example.test/affidavit.pdf",
    mimeType: "application/pdf",
    type: "document",
    status: "pending",
    category: "Affidavit",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "image-1",
    title: "Scene photograph",
    description: "Evidence photo",
    fileUrl: "https://cdn.example.test/scene.jpg",
    mimeType: "image/jpeg",
    type: "image",
    status: "verified",
    category: "Photos",
    createdAt: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "sheet-1",
    title: "Case index",
    description: "Spreadsheet index",
    fileUrl: "https://cdn.example.test/index.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    type: "sheet",
    status: "archived",
    category: "Index",
    createdAt: "2026-08-03T00:00:00.000Z",
  },
];

describe("admin asset library helpers", () => {
  it("normalizes common evidence records into stable asset kinds", () => {
    expect(getAssetKind(assets[0])).toBe("document");
    expect(getAssetKind(assets[1])).toBe("image");
    expect(getAssetKind(assets[2])).toBe("spreadsheet");
  });

  it("filters by kind and includes unpublished records for admins", () => {
    const result = filterAdminAssets(assets, { kind: "document" });
    expect(result.map((asset) => asset.id)).toEqual(["pdf-1"]);
  });

  it("filters by status and search text without exposing guest-only defaults", () => {
    const result = filterAdminAssets(assets, {
      status: "pending",
      search: "signed",
    });
    expect(result.map((asset) => asset.id)).toEqual(["pdf-1"]);
  });
});
