import { describe, expect, it } from "vitest";
import { getAdminAgentPolicy } from "./adminAgentPolicy";

describe("owner/admin AI agent policy", () => {
  it("exposes only bounded read and review capabilities", () => {
    const policy = getAdminAgentPolicy();
    expect(policy.knowledgeSources).toEqual([
      "Published affidavit index",
      "Authorized evidence metadata",
      "Admin review history",
    ]);
    expect(policy.allowedTools).toEqual([
      "Search authorized evidence",
      "Summarize selected records",
      "Open secure preview",
      "Prepare review notes",
    ]);
    expect(policy.blockedActions).toContain("Delete or publish records without confirmation");
  });

  it("keeps memory scoped to the current admin workspace", () => {
    expect(getAdminAgentPolicy().memoryBoundary).toBe(
      "Current admin workspace only; no guest sessions, credentials, or raw secret values",
    );
  });
});
