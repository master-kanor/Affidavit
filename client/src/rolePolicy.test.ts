import { describe, expect, it } from "vitest";
import { getDeniedPermissions, hasPortalPermission } from "./rolePolicy";

describe("portal role policy", () => {
  it("gives owners the complete management surface", () => {
    expect(hasPortalPermission("owner", "manageUsers")).toBe(true);
    expect(hasPortalPermission("owner", "manageAiProviderSettings")).toBe(true);
    expect(hasPortalPermission("owner", "publishEvidence")).toBe(true);
    expect(getDeniedPermissions("owner")).toHaveLength(0);
  });

  it("keeps administrators operational but prevents global settings and user administration", () => {
    expect(hasPortalPermission("admin", "manageEvidence")).toBe(true);
    expect(hasPortalPermission("admin", "editWorkingDraft")).toBe(true);
    expect(hasPortalPermission("admin", "manageUsers")).toBe(false);
    expect(hasPortalPermission("admin", "manageIntegrations")).toBe(false);
    expect(hasPortalPermission("admin", "publishEvidence")).toBe(true);
  });

  it("keeps guest/user access read-only", () => {
    expect(hasPortalPermission("user", "viewPublishedDossier")).toBe(true);
    expect(hasPortalPermission("user", "exportPublishedDossier")).toBe(true);
    expect(hasPortalPermission("user", "useReadOnlyAssistant")).toBe(true);
    expect(hasPortalPermission("user", "editWorkingDraft")).toBe(false);
    expect(hasPortalPermission("user", "manageEvidence")).toBe(false);
    expect(hasPortalPermission("user", "manageUsers")).toBe(false);
  });
});
