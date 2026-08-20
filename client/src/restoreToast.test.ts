import { describe, expect, it } from "vitest";
import { formatRestoreToastMessage } from "@/utils/restoreToast";

describe("restore toast messages", () => {
  it("uses singular wording for one recovered item", () => {
    expect(formatRestoreToastMessage(1)).toBe("1 evidence item restored successfully");
  });

  it("uses plural wording for multiple recovered items", () => {
    expect(formatRestoreToastMessage(3)).toBe("3 evidence items restored successfully");
  });
});
