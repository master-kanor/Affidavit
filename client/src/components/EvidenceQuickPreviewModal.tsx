import React, { useState, useEffect } from "react";
import { X, Eye, FileText, Download, Share2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { GalleryImage } from "./EvidenceGallery";

export type EvidenceNavigationDirection = "previous" | "next";

export const EVIDENCE_SWITCH_FADE_CLASS =
  "animate-in fade-in duration-200 motion-reduce:animate-none";

export const getEvidenceFullScreenLabel = (isFullScreen: boolean): string =>
  isFullScreen ? "Exit full screen" : "Enter full screen";

export const getAdjacentEvidenceIndex = (
  currentIndex: number,
  direction: EvidenceNavigationDirection,
  itemCount: number
): number => {
  if (itemCount <= 1) return currentIndex;
  return direction === "previous"
    ? (currentIndex - 1 + itemCount) % itemCount
    : (currentIndex + 1) % itemCount;
};

export const shouldIgnoreEvidenceNavigationTarget = (
  target: Pick<HTMLElement, "tagName" | "isContentEditable"> | null
): boolean => {
  if (!target) return false;
  const tagName = target.tagName.toUpperCase();
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
};

interface EvidenceQuickPreviewModalProps {
  image: GalleryImage | null;
  images?: GalleryImage[];
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  onDownload?: (image: GalleryImage) => void;
  onShare?: (image: GalleryImage) => void;
}

export const EvidenceQuickPreviewModal: React.FC<EvidenceQuickPreviewModalProps> = ({
  image,
  images = [],
  currentIndex = 0,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
  onShare,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const navigationImageIndex = image
    ? images.findIndex((img) => img.id === image.id)
    : -1;

  // Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(100);
  }, [image?.id]);

  useEffect(() => {
    if (!isOpen) {
      setIsFullScreen(false);
      return;
    }

    const handleFullScreenKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullScreen) {
        event.preventDefault();
        setIsFullScreen(false);
      }
    };

    window.addEventListener("keydown", handleFullScreenKeyDown);
    return () => window.removeEventListener("keydown", handleFullScreenKeyDown);
  }, [isFullScreen, isOpen]);

  useEffect(() => {
    if (!isOpen || !image || images.length <= 1 || !onNavigate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreEvidenceNavigationTarget(event.target as HTMLElement | null)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      event.preventDefault();
      const baseIndex = navigationImageIndex >= 0 ? navigationImageIndex : currentIndex;
      const direction: EvidenceNavigationDirection =
        event.key === "ArrowLeft" ? "previous" : "next";
      onNavigate(getAdjacentEvidenceIndex(baseIndex, direction, images.length));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, image, images.length, isOpen, navigationImageIndex, onNavigate]);

  if (!isOpen || !image) return null;

  const hasMultiple = images.length > 1;
  const activeIndex = images.findIndex((img) => img.id === image.id);
  const resolvedIndex = activeIndex !== -1 ? activeIndex : currentIndex;

  const handlePrevious = () => {
    if (!hasMultiple) return;
    const newIndex = (resolvedIndex - 1 + images.length) % images.length;
    onNavigate?.(newIndex);
  };

  const handleNext = () => {
    if (!hasMultiple) return;
    const newIndex = (resolvedIndex + 1) % images.length;
    onNavigate?.(newIndex);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 250));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${isFullScreen ? "p-0" : "p-4"} animate-in fade-in duration-200`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-preview-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col ${isFullScreen ? "h-full max-w-none max-h-none rounded-none border-0" : "max-w-3xl max-h-[90vh] rounded-xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 id="quick-preview-title" className="text-lg font-semibold text-gray-900 truncate max-w-[320px]">
                {image.title}
              </h3>
              <p className="text-xs text-gray-500">
                {image.category ? `Category: ${image.category}` : "Evidence Gallery Quick Preview"}
                {hasMultiple && ` • Item ${resolvedIndex + 1} of ${images.length}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom toolbar */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 transition-colors"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium text-gray-600 min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 250}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 transition-colors"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoomLevel === 100}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 transition-colors ml-1 border-l border-gray-200"
                aria-label="Reset zoom"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen((previous) => !previous)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={getEvidenceFullScreenLabel(isFullScreen)}
              aria-pressed={isFullScreen}
              title={getEvidenceFullScreenLabel(isFullScreen)}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-2"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview with Previous/Next Overlays */}
                  <div className={`relative p-6 overflow-auto flex-1 flex flex-col items-center justify-center bg-gray-900/5 ${isFullScreen ? "min-h-0" : "min-h-[300px]"}`}>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md border border-gray-200 transition-all hover:scale-105"
                aria-label="Previous evidence item"
                title="Previous item"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-md border border-gray-200 transition-all hover:scale-105"
                aria-label="Next evidence item"
                title="Next item"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div
            key={image.id}
            className={`w-full ${EVIDENCE_SWITCH_FADE_CLASS}`}
            data-evidence-transition="fade"
          >
            <div className="relative w-full flex items-center justify-center rounded-lg overflow-hidden bg-white shadow-inner border border-gray-200 p-4">
              <div className={`overflow-auto max-w-full flex items-center justify-center ${isFullScreen ? "max-h-full" : "max-h-[50vh]"}`}>
                <img
                  src={image.url}
                  alt={image.title}
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                  className="transition-transform duration-150 ease-out object-contain"
                />
              </div>
            </div>
            {image.description && (
              <div className="mt-4 w-full bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Description & Traceability
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{image.description}</p>
              </div>
            )}
            {image.uploadedAt && (
              <p className="mt-2 text-xs text-gray-400 self-start">
                Indexed: {image.uploadedAt} {image.uploadedBy ? `• By ${image.uploadedBy}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <FileText className="w-4 h-4" /> Quick view thumbnail mode (zoomable & navigable)
          </span>
          <div className="flex items-center gap-3">
            {onShare && (
              <button
                type="button"
                onClick={() => onShare(image)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share Link
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={() => onDownload(image)}
                aria-label="Download original evidence file"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Original
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
