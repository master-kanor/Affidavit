import React, { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description?: string;
  category?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface EvidenceGalleryProps {
  images: GalleryImage[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
  onImageClick?: (image: GalleryImage) => void;
  onDownload?: (image: GalleryImage) => void;
  onShare?: (image: GalleryImage) => void;
  loading?: boolean;
  error?: string;
}

interface LightboxState {
  isOpen: boolean;
  currentIndex: number;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  images,
  title,
  description,
  columns = 3,
  onImageClick,
  onDownload,
  onShare,
  loading = false,
  error,
}) => {
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    currentIndex: 0,
  });

  const openLightbox = useCallback((index: number) => {
    setLightbox({ isOpen: true, currentIndex: index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox({ isOpen: false, currentIndex: 0 });
  }, []);

  const goToPrevious = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + images.length) % images.length,
    }));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % images.length,
    }));
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!lightbox.isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    },
    [lightbox.isOpen, closeLightbox, goToPrevious, goToNext]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentImage = images[lightbox.currentIndex];
  const gridColsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Error loading gallery</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No images to display</p>
          </div>
        ) : (
          <div className={cn("grid gap-4", gridColsClass)}>
            {images.map((image, index) => (
              <GalleryItem
                key={image.id}
                image={image}
                index={index}
                onImageClick={() => {
                  openLightbox(index);
                  onImageClick?.(image);
                }}
                onDownload={() => onDownload?.(image)}
                onShare={() => onShare?.(image)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightbox.isOpen && currentImage && (
        <Lightbox
          image={currentImage}
          currentIndex={lightbox.currentIndex}
          totalImages={images.length}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onDownload={() => onDownload?.(currentImage)}
          onShare={() => onShare?.(currentImage)}
        />
      )}
    </>
  );
};

interface GalleryItemProps {
  image: GalleryImage;
  index: number;
  onImageClick: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({
  image,
  onImageClick,
  onDownload,
  onShare,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onImageClick}
    >
      {/* Image */}
      <img
        src={image.url}
        alt={image.title}
        className={cn(
          "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
          !imageLoaded && "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
        loading="lazy"
      />

      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          isHovered ? "bg-opacity-40" : "bg-opacity-0"
        )}
      />

      {/* Hover actions */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.();
            }}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      )}

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <p className="text-white text-sm font-medium truncate">
          {image.title}
        </p>
        {image.category && (
          <p className="text-gray-300 text-xs">{image.category}</p>
        )}
      </div>
    </div>
  );
};

interface LightboxProps {
  image: GalleryImage;
  currentIndex: number;
  totalImages: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  image,
  currentIndex,
  totalImages,
  onClose,
  onPrevious,
  onNext,
  onDownload,
  onShare,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
        title="Close (Esc)"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main image container */}
      <div className="relative w-full h-full flex items-center justify-center px-4">
        {/* Image */}
        <div className="max-w-4xl max-h-[80vh] flex items-center justify-center">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>

        {/* Navigation buttons */}
        {totalImages > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-lg font-semibold">
                {image.title}
              </h3>
              {image.description && (
                <p className="text-gray-300 text-sm mt-1">
                  {image.description}
                </p>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                {image.category && <span>Category: {image.category}</span>}
                {image.uploadedAt && <span>Date: {image.uploadedAt}</span>}
                {image.uploadedBy && <span>By: {image.uploadedBy}</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Image counter */}
          {totalImages > 1 && (
            <div className="text-center text-gray-400 text-sm mt-4">
              {currentIndex + 1} / {totalImages}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
