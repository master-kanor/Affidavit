import { describe, it, expect } from "vitest";
import React from "react";
import {
  EvidenceQuickPreviewModal,
  EVIDENCE_SWITCH_FADE_CLASS,
  getEvidenceFullScreenLabel,
  getAdjacentEvidenceIndex,
  shouldIgnoreEvidenceNavigationTarget,
} from "./components/EvidenceQuickPreviewModal";

describe("EvidenceQuickPreviewModal Component", () => {
  const mockImages = [
    {
      id: "img-1",
      url: "https://example.com/evidence1.jpg",
      title: "Evidence Record 1",
      description: "First observation.",
    },
    {
      id: "img-2",
      url: "https://example.com/evidence2.jpg",
      title: "Evidence Record 2",
      description: "Second observation.",
    },
  ];

  it("is defined and can be instantiated as a React element", () => {
    const element = React.createElement(EvidenceQuickPreviewModal, {
      image: mockImages[0],
      images: mockImages,
      currentIndex: 0,
      isOpen: true,
      onClose: () => {},
    });
    expect(element).toBeDefined();
    expect(element.props.isOpen).toBe(true);
    expect(element.props.image.title).toBe("Evidence Record 1");
    expect(element.props.images.length).toBe(2);
  });

  it("wraps left and right navigation at the collection boundaries", () => {
    expect(getAdjacentEvidenceIndex(0, "previous", 3)).toBe(2);
    expect(getAdjacentEvidenceIndex(2, "next", 3)).toBe(0);
    expect(getAdjacentEvidenceIndex(1, "previous", 3)).toBe(0);
    expect(getAdjacentEvidenceIndex(1, "next", 3)).toBe(2);
  });

  it("ignores arrow navigation while editing text controls", () => {
    expect(shouldIgnoreEvidenceNavigationTarget({ tagName: "INPUT", isContentEditable: false })).toBe(true);
    expect(shouldIgnoreEvidenceNavigationTarget({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
    expect(shouldIgnoreEvidenceNavigationTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
    expect(shouldIgnoreEvidenceNavigationTarget({ tagName: "BUTTON", isContentEditable: false })).toBe(false);
  });

  it("uses a short fade transition with reduced-motion fallback for document switches", () => {
    expect(EVIDENCE_SWITCH_FADE_CLASS).toContain("animate-in");
    expect(EVIDENCE_SWITCH_FADE_CLASS).toContain("fade-in");
    expect(EVIDENCE_SWITCH_FADE_CLASS).toContain("duration-200");
    expect(EVIDENCE_SWITCH_FADE_CLASS).toContain("motion-reduce:animate-none");
  });

  it("provides explicit accessible labels for entering and exiting full screen", () => {
    expect(getEvidenceFullScreenLabel(false)).toBe("Enter full screen");
    expect(getEvidenceFullScreenLabel(true)).toBe("Exit full screen");
  });
});
