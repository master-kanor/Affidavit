import { describe, expect, it } from "vitest";
import { createBatchDownloadPauseController } from "@/utils/batchDownload";

describe("batch download pause controller", () => {
  it("waits while paused and resolves after resume", async () => {
    const controller = createBatchDownloadPauseController();
    controller.pause();
    let resumed = false;
    const wait = controller.waitForResume().then(() => {
      resumed = true;
    });

    await Promise.resolve();
    expect(controller.isPaused()).toBe(true);
    expect(resumed).toBe(false);

    controller.resume();
    await wait;
    expect(controller.isPaused()).toBe(false);
    expect(resumed).toBe(true);
  });

  it("reports pause/resume progress controls as independent from cancellation", () => {
    const controller = createBatchDownloadPauseController();
    expect(controller.isPaused()).toBe(false);
    controller.pause();
    expect(controller.isPaused()).toBe(true);
    controller.resume();
    expect(controller.isPaused()).toBe(false);
  });
});
