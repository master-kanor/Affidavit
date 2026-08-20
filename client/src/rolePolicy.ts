export type PortalRole = "owner" | "admin" | "user";

export type PortalPermission =
  | "viewPublishedDossier"
  | "exportPublishedDossier"
  | "useReadOnlyAssistant"
  | "manageEvidence"
  | "reviewEvidence"
  | "editWorkingDraft"
  | "restoreDraftHistory"
  | "manageIntegrations"
  | "manageAiProviderSettings"
  | "manageUsers"
  | "viewAuditLogs"
  | "publishEvidence";

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  user: "Guest / User",
};

export const PORTAL_ROLE_PERMISSIONS: Record<PortalRole, readonly PortalPermission[]> = {
  owner: [
    "viewPublishedDossier",
    "exportPublishedDossier",
    "useReadOnlyAssistant",
    "manageEvidence",
    "reviewEvidence",
    "editWorkingDraft",
    "restoreDraftHistory",
    "manageIntegrations",
    "manageAiProviderSettings",
    "manageUsers",
    "viewAuditLogs",
    "publishEvidence",
  ],
  admin: [
    "viewPublishedDossier",
    "exportPublishedDossier",
    "useReadOnlyAssistant",
    "manageEvidence",
    "reviewEvidence",
    "editWorkingDraft",
    "restoreDraftHistory",
    "viewAuditLogs",
    "publishEvidence",
  ],
  user: ["viewPublishedDossier", "exportPublishedDossier", "useReadOnlyAssistant"],
};

export const PORTAL_PERMISSION_LABELS: Record<PortalPermission, string> = {
  viewPublishedDossier: "View published dossier",
  exportPublishedDossier: "Export published dossier",
  useReadOnlyAssistant: "Ask the read-only assistant",
  manageEvidence: "Upload and organize evidence",
  reviewEvidence: "Review and verify evidence",
  editWorkingDraft: "Edit working affidavit draft",
  restoreDraftHistory: "Restore undone draft insights",
  manageIntegrations: "Manage storage and connector settings",
  manageAiProviderSettings: "Manage AI provider configuration",
  manageUsers: "Manage users and roles",
  viewAuditLogs: "View audit history",
  publishEvidence: "Publish evidence to user dashboard",
};

export function hasPortalPermission(role: PortalRole | null | undefined, permission: PortalPermission): boolean {
  return Boolean(role && PORTAL_ROLE_PERMISSIONS[role].includes(permission));
}

export function getDeniedPermissions(role: PortalRole): PortalPermission[] {
  return (Object.keys(PORTAL_PERMISSION_LABELS) as PortalPermission[]).filter((permission) => !hasPortalPermission(role, permission));
}
