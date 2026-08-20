export type AdminAgentPolicy = {
  knowledgeSources: string[];
  allowedTools: string[];
  blockedActions: string[];
  memoryBoundary: string;
};

export function getAdminAgentPolicy(): AdminAgentPolicy {
  return {
    knowledgeSources: [
      "Published affidavit index",
      "Authorized evidence metadata",
      "Admin review history",
    ],
    allowedTools: [
      "Search authorized evidence",
      "Summarize selected records",
      "Open secure preview",
      "Prepare review notes",
    ],
    blockedActions: [
      "Delete or publish records without confirmation",
      "Read credentials, tokens, or service-role secrets",
      "Expose unpublished records to guests",
    ],
    memoryBoundary: "Current admin workspace only; no guest sessions, credentials, or raw secret values",
  };
}
