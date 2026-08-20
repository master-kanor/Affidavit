import type { TestimonySection } from "@/components/TestimonyView";

/**
 * Read-only references extracted from the supplied unofficial evidence affidavit.
 * These are source links, not fabricated or generated evidence records.
 */
export const sourceEvidenceManifest = {
  sourceLabel: "Provided evidence affidavit export",
  officialSourcePageCount: 12,
  unofficialSourcePageCount: 26,
  finalDossierPageCount: 87,
  uniqueSourceImageCount: 393,
  evidenceLinks: [
    {
      provider: "google-drive" as const,
      url: "https://drive.google.com/drive/folders/1Fi5y-6nKKhnwGDVbtQ0aKbM3F4QzNCoJ",
      sourcePages: [21],
      title: "Source evidence folder",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/L0q0je4gJHM?feature=shared",
      sourcePages: [24],
      title: "YouTube evidence reference 1",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/p42RaLTwRDs?feature=shared",
      sourcePages: [24],
      title: "YouTube evidence reference 2",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/Ya2hhWPtlr4?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 3",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/jeQij7T9Xo8?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 4",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/rAu7u4u9eXs?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 5",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/jWjuNViS93o?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 6",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/oD2uuXxt9DQ?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 7",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/1aQsyIbvawA?feature=shared",
      sourcePages: [25],
      title: "YouTube evidence reference 8",
    },
    {
      provider: "youtube" as const,
      url: "https://youtu.be/7pLaNUJD0Tk?feature=shared",
      sourcePages: [26],
      title: "YouTube evidence reference 9",
    },
  ],
} as const;

export const sourceLinkedTestimonySections: TestimonySection[] = [
  {
    id: "source-testimony-1",
    title: "Testimony 1 — Source-linked evidence",
    content:
      "Source-linked media references extracted from the provided evidence affidavit export. The official affidavit text is not rewritten here; each item remains traceable to its source page and opens in a read-only media preview or external source.",
    order: 1,
    images: [],
    videos: sourceEvidenceManifest.evidenceLinks
      .filter((item) => item.provider === "youtube")
      .map((item, index) => ({
        id: `source-youtube-${index + 1}`,
        url: item.url,
        title: item.title,
        description: `Source page ${item.sourcePages.join(", ")} of the provided evidence affidavit export.`,
        provider: "youtube" as const,
      })),
    documents: [
      {
        id: "source-drive-folder",
        title: "Source evidence folder",
        url: sourceEvidenceManifest.evidenceLinks[0].url,
        type: "Google Drive folder",
      },
    ],
    highlights: [],
  },
];
