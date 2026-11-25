import { describe, expect, it } from "vitest";
import { normalizeWorkspacePayload, type WorkspacePayload } from "@/lib/caseWorkspace";

describe("case workspace integration contract", () => {
  it("keeps source text separate while grouping permitted evidence by section and gallery", () => {
    const payload: WorkspacePayload = {
      case: { id: "case-1", title: "Authorized Case", description: "Review workspace" },
      sections: [
        { id: "section-1", section_number: "§ 1", title: "Identity", source_label: "Source affidavit", approval_status: "accepted" },
      ],
      textVersions: [
        { section_id: "section-1", text_content: "Original source paragraph.", created_at: "2026-01-01T00:00:00Z" },
      ],
      evidence: [
        {
          id: "evidence-1",
          title: "Approved exhibit",
          asset_type: "image",
          preview_url: null,
          source_url: "https://example.test/exhibit",
          verification_state: "approved",
          provenance_kind: "owner_content",
          metadata: { section_id: "section-1", gallery_id: "gallery-1", gallery_title: "Identity gallery" },
        },
      ],
      access: { role: "admin", canViewEvidence: true, canViewDossier: true, canExport: false },
    };

    const result = normalizeWorkspacePayload(payload);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].sourceText[0].text).toBe("Original source paragraph.");
    expect(result.sections[0].galleries[0].items[0].id).toBe("evidence-1");
    expect(result.sections[0].links[0].url).toBe("https://example.test/exhibit");
    expect(result.access.canExport).toBe(false);
  });
});
