import { describe, expect, it } from "vitest";
import { getEmbedUrl, getVideoThumbnail, formatDuration } from "./components/EmbeddedVideoPlayer";
import { sourceEvidenceManifest, sourceLinkedTestimonySections } from "./data/affidavitManifest";

describe("evidence media mapping", () => {
  it("builds a YouTube embed URL from a short link", () => {
    expect(
      getEmbedUrl({
        id: "yt-1",
        url: "https://youtu.be/L0q0je4gJHM?feature=shared",
        title: "YouTube source",
        provider: "youtube",
      }),
    ).toBe("https://www.youtube.com/embed/L0q0je4gJHM");
  });

  it("builds a Facebook plugin URL when a Facebook video URL is supported", () => {
    const url = "https://www.facebook.com/example/videos/123456789/";
    expect(
      getEmbedUrl({ id: "fb-1", url, title: "Facebook source", provider: "facebook" }),
    ).toContain("https://www.facebook.com/plugins/video.php?href=");
  });

  it("provides a stable thumbnail fallback and duration formatting", () => {
    expect(
      getVideoThumbnail({
        id: "yt-1",
        url: "https://youtu.be/L0q0je4gJHM",
        title: "YouTube source",
        provider: "youtube",
      }),
    ).toContain("img.youtube.com/vi/L0q0je4gJHM");
    expect(formatDuration(125)).toBe("2:05");
  });

  it("keeps the provided evidence links traceable to source pages", () => {
    expect(sourceEvidenceManifest.officialSourcePageCount).toBe(12);
    expect(sourceEvidenceManifest.unofficialSourcePageCount).toBe(26);
    expect(sourceEvidenceManifest.evidenceLinks).toHaveLength(10);
    expect(sourceLinkedTestimonySections[0].videos).toHaveLength(9);
    expect(sourceLinkedTestimonySections[0].documents?.[0].url).toContain("drive.google.com");
  });
});
