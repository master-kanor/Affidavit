import { describe, expect, it, vi } from "vitest";
import { copyErrorBreakdown } from "@/utils/copyErrorBreakdown";

describe("copyErrorBreakdown", () => {
  it("copies a numbered error breakdown to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyErrorBreakdown(["missing.jpg: no managed asset URL", "failed.jpg: asset request returned 503"])).resolves.toEqual({
      ok: true,
      message: "Error breakdown copied to clipboard.",
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("1. missing.jpg: no managed asset URL"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("2. failed.jpg: asset request returned 503"));

    vi.unstubAllGlobals();
  });

  it("returns a clear failure result when clipboard access is unavailable or rejected", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    await expect(copyErrorBreakdown(["failed.jpg: denied"])).resolves.toEqual({
      ok: false,
      message: "Clipboard access was unavailable. Select and copy the error list manually.",
    });
    vi.unstubAllGlobals();
  });
});
