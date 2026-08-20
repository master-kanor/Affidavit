import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workspaceApi = readFileSync(new URL("../../functions/api/cases/[caseId]/workspace.ts", import.meta.url), "utf8");
const correction = readFileSync(new URL("../../supabase/migrations/20260820000005_guest_reviewer_security_correction.sql", import.meta.url), "utf8");
const aiFoundation = readFileSync(new URL("../../supabase/migrations/20260820000006_ai_knowledge_foundation.sql", import.meta.url), "utf8");
const caseReview = readFileSync(new URL("./pages/CaseReview.tsx", import.meta.url), "utf8");

describe("Guest Reviewer security boundaries", () => {
  it("filters workspace resources before returning model context", () => {
    expect(workspaceApi).toContain("resource_permissions?");
    expect(workspaceApi).toMatch(/allowed\(["']affidavit_section["']/);
    expect(workspaceApi).toMatch(/allowed\(["']evidence["']/);
    expect(workspaceApi).toMatch(/allowed\(["']testimony["']/);
    expect(workspaceApi).toMatch(/allowed\(["']timeline["']/);
  });

  it("removes direct authenticated writes and prevents self grants", () => {
    expect(correction).toContain("Self-access changes are not allowed");
    expect(correction).toContain("Resource access may only be assigned to Guest Reviewers");
    expect(correction).toContain("revoke insert, update, delete on table public.evidence_assets from authenticated");
  });

  it("keeps Guest AI read-only and resource authorized", () => {
    expect(aiFoundation).toContain("'Affidavit Ask AI'");
    expect(aiFoundation).toContain("'read'");
    expect(aiFoundation).toContain("public.can_view_resource(resource_type, resource_id)");
  });

  it("does not render exports unless server authorization allows them", () => {
    expect(caseReview).toContain("if (!canonicalCase.access.canExport) return null");
  });
});