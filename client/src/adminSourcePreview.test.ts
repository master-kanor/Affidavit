import { describe, expect, it } from "vitest";
import { getAdminImagePageUrl, getAdminMediaEmbedUrl } from "@/components/AdminSourcePreviewModal";

const image = {
  id: "source-image-7",
  evidenceItem: 7,
  appendixPage: 18,
  slot: 3,
  filename: "evidence-photo-7.jpg",
  group: "source-images",
  width: 1600,
  height: 900,
  mime: "image/jpeg",
} as const;

describe("admin source preview helpers", () => {
  it("targets the exact appendix page for an extracted source image", () => {
    expect(getAdminImagePageUrl(image)).toContain("#page=18&view=FitH");
  });

  it("builds a YouTube embed URL for a short link", () => {
    const result = getAdminMediaEmbedUrl({
      id: "youtube-1",
      title: "YouTube evidence",
      url: "https://youtu.be/L0q0je4gJHM?feature=shared",
      provider: "youtube",
      sourcePages: [24],
    });
    expect(result).toBe("https://www.youtube.com/embed/L0q0je4gJHM");
  });

  it("builds a Facebook plugin URL for a watch link", () => {
    const result = getAdminMediaEmbedUrl({
      id: "facebook-1",
      title: "Facebook evidence",
      url: "https://www.facebook.com/watch/?v=123456789",
      provider: "facebook",
      sourcePages: [26],
    });
    expect(result).toContain("https://www.facebook.com/plugins/video.php");
  });

  it("uses the original URL as the only path for Google Drive", () => {
    expect(getAdminMediaEmbedUrl({
      id: "drive-1",
      title: "Drive evidence folder",
      url: "https://drive.google.com/drive/folders/example",
      provider: "google-drive",
      sourcePages: [21],
    })).toBeNull();
  });
});
