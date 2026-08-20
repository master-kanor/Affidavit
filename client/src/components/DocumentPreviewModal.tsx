import React, { useState } from "react";
import { X, Download, Share2, Check, FileText, Image as ImageIcon, Video, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecureOriginalDownloadButton } from "./SecureOriginalDownloadButton";

export interface PreviewDocument {
  id: string;
  title: string;
  url: string;
  type: string;
  description?: string;
  category?: string;
  uploadedAt?: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PreviewDocument | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?doc=${document?.id || ""}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = window.document.createElement("textarea");
        textArea.value = shareUrl;
        window.document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        window.document.execCommand("copy");
        window.document.body.removeChild(textArea);
      }
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (!isOpen || !document) return null;

  const isPdf =
    document.type.toLowerCase().includes("pdf") ||
    document.url.toLowerCase().endsWith(".pdf");
  const isImage =
    document.type.toLowerCase().includes("image") ||
    /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(document.url);
  const isVideo =
    document.type.toLowerCase().includes("video") ||
    /\.(mp4|webm|mov|ogg)$/i.test(document.url) ||
    document.url.includes("youtube.com") ||
    document.url.includes("facebook.com");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg text-blue-600 dark:text-blue-400">
              {isPdf ? (
                <FileText className="w-5 h-5" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5" />
              ) : isVideo ? (
                <Video className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-lg">
                {document.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {document.category ? `Category: ${document.category} • ` : ""}
                Type: {document.type || "Document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer"
              title="Copy link to this document"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Share</span>
                </>
              )}
            </button>

            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Download original file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-lg h-9 w-9 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-950 relative overflow-auto flex items-center justify-center p-4 min-h-[500px]">
          {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Loading document viewer...
              </p>
            </div>
          )}

          {hasError ? (
            <div className="text-center p-8 max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <FileText className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                Embedded Preview Restricted
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This document cannot be displayed directly in the inline frame due to browser security policy or external hosting restrictions.
              </p>
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${document.url}#view=FitH`}
              className="w-full h-full min-h-[600px] border-0 rounded bg-white shadow-inner"
              title={document.title}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
            />
          ) : isImage ? (
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img
                src={document.url}
                alt={document.title}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : isVideo ? (
            <div className="w-full h-full min-h-[450px] flex items-center justify-center bg-black rounded-lg overflow-hidden">
              <iframe
                src={document.url.replace("watch?v=", "embed/")}
                className="w-full h-[500px] border-0"
                title={document.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                {document.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {document.description || "Official published affidavit document record ready for review."}
              </p>
              <a
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
              >
                <span>View Full Document</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer with Secure Original Download Option */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            {document.description && <span className="truncate">{document.description}</span>}
            <span className="flex-shrink-0 font-mono text-gray-400">ID: {document.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <SecureOriginalDownloadButton documentTitle={document.title} documentId={document.id} originalAssetPath={document.url} />
          </div>
        </div>
      </div>

      {/* Bottom Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div className="text-sm min-w-[200px]">
            <p className="font-medium">Link copied to clipboard</p>
            <p className="text-xs text-gray-400 truncate max-w-xs">{document.title}</p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer ml-1"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
