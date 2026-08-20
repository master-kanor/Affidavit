import { describe, expect, it } from "vitest";
import { buildEvidenceStorageKey, validateAdminUpload } from "./adminUpload";

describe("admin evidence upload helpers", () => {
  it("accepts supported evidence files and creates a sanitized storage key", () => {
    const file = new File(["case data"], "Case Notes 2026.pdf", { type: "application/pdf" });
    expect(validateAdminUpload(file)).toEqual({ valid: true });
    expect(buildEvidenceStorageKey("admin-123", file)).toMatch(/^admin-123\/[a-z0-9-]+\.pdf$/);
  });

  it("rejects unsupported executable files", () => {
    const file = new File(["binary"], "payload.exe", { type: "application/x-msdownload" });
    expect(validateAdminUpload(file)).toEqual({
      valid: false,
      error: "This file type is not allowed for evidence uploads.",
    });
  });

  it("rejects files larger than the configured limit", () => {
    const file = new File([new Uint8Array(26 * 1024 * 1024)], "large.mp4", { type: "video/mp4" });
    expect(validateAdminUpload(file)).toEqual({
      valid: false,
      error: "Evidence files must be 25 MB or smaller.",
    });
  });
});
