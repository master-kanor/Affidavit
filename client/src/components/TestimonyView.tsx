import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenceGallery, GalleryImage } from "./EvidenceGallery";
import { EmbeddedVideoPlayer, VideoSource } from "./EmbeddedVideoPlayer";

export interface TestimonySection {
  id: string;
  title: string;
  content: string;
  order: number;
  images?: GalleryImage[];
  videos?: VideoSource[];
  documents?: {
    id: string;
    title: string;
    url: string;
    type: string;
  }[];
  highlights?: {
    text: string;
    color: string;
    note?: string;
  }[];
}

export interface TestimonyViewProps {
  sections: TestimonySection[];
  title?: string;
  subtitle?: string;
  onSectionClick?: (section: TestimonySection) => void;
  loading?: boolean;
  error?: string;
}

export const TestimonyView: React.FC<TestimonyViewProps> = ({
  sections,
  title = "Official Testimony",
  subtitle,
  onSectionClick,
  loading = false,
  error,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.slice(0, 1).map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (sectionId: string) => expandedSections.has(sectionId);

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Error loading testimony</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-2 text-lg">{subtitle}</p>}
        <div className="mt-4 h-1 w-20 bg-blue-600 rounded" />
      </div>

      {/* Testimony sections */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-24 animate-pulse"
              />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No testimony sections available</p>
          </div>
        ) : (
          sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <TestimonySectionComponent
                key={section.id}
                section={section}
                isExpanded={isExpanded(section.id)}
                onToggle={() => toggleSection(section.id)}
                onClick={() => onSectionClick?.(section)}
              />
            ))
        )}
      </div>
    </div>
  );
};

interface TestimonySectionComponentProps {
  section: TestimonySection;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

const TestimonySectionComponent: React.FC<TestimonySectionComponentProps> = ({
  section,
  isExpanded,
  onToggle,
  onClick,
}) => {
  const hasMedia = (section.images?.length || 0) > 0 || (section.videos?.length || 0) > 0;
  const hasDocuments = (section.documents?.length || 0) > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      {/* Section header */}
      <button
        onClick={() => {
          onToggle();
          onClick?.();
        }}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 text-left flex-1">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {section.order}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h3>
            {hasMedia && (
              <div className="flex gap-3 mt-1">
                {(section.images?.length || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    <Image className="w-3 h-3" />
                    {section.images?.length} images
                  </span>
                )}
                {(section.videos?.length || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    <Video className="w-3 h-3" />
                    {section.videos?.length} videos
                  </span>
                )}
                {hasDocuments && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    <FileText className="w-3 h-3" />
                    {section.documents?.length} docs
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toggle icon */}
        <div className="flex-shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Section content */}
      {isExpanded && (
        <div className="px-6 py-6 bg-white border-t border-gray-200 space-y-6">
          {/* Text content */}
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          </div>

          {/* Highlights */}
          {section.highlights && section.highlights.length > 0 && (
            <div className="space-y-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-gray-900 text-sm">
                Key Highlights
              </h4>
              <div className="space-y-2">
                {section.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: highlight.color }}
                    />
                    <div>
                      <p className="text-sm text-gray-700 italic">
                        "{highlight.text}"
                      </p>
                      {highlight.note && (
                        <p className="text-xs text-gray-600 mt-1">
                          Note: {highlight.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image gallery */}
          {section.images && section.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Evidence Images ({section.images.length})
              </h4>
              <EvidenceGallery
                images={section.images}
                columns={3}
              />
            </div>
          )}

          {/* Video player */}
          {section.videos && section.videos.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Evidence Videos ({section.videos.length})
              </h4>
              <EmbeddedVideoPlayer
                videos={section.videos}
                columns={3}
              />
            </div>
          )}

          {/* Documents */}
          {section.documents && section.documents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Supporting Documents ({section.documents.length})
              </h4>
              <div className="grid gap-2">
                {section.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-600">{doc.type}</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium flex-shrink-0">
                      Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Combined view showing testimony with integrated evidence
 */
export interface AffidavitViewProps {
  title: string;
  subtitle?: string;
  affiant: string;
  sections: TestimonySection[];
  onExport?: () => void;
  loading?: boolean;
  error?: string;
}

export const AffidavitView: React.FC<AffidavitViewProps> = ({
  title,
  subtitle,
  affiant,
  sections,
  onExport,
  loading = false,
  error,
}) => {
  return (
    <div className="w-full bg-white">
      {/* Document header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold">{title}</h1>
          {subtitle && <p className="text-slate-300 mt-2 text-lg">{subtitle}</p>}
          <p className="text-slate-400 mt-4">Affiant: {affiant}</p>
          {onExport && (
            <button
              onClick={onExport}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Export Affidavit
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <TestimonyView
          sections={sections}
          title=""
          loading={loading}
          error={error}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-8">
        <div className="max-w-4xl mx-auto text-center text-gray-600 text-sm">
          <p>
            This affidavit contains {sections.length} testimony sections with{" "}
            {sections.reduce((sum, s) => sum + (s.images?.length || 0), 0)}{" "}
            images and{" "}
            {sections.reduce((sum, s) => sum + (s.videos?.length || 0), 0)}{" "}
            videos as supporting evidence.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};
