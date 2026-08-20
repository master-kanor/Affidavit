import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage, FileText, Download, ExternalLink, ShieldCheck, CheckCircle, Eye, Link2, Search, FileSpreadsheet, Tag, Trash2, RotateCcw, X, AlertTriangle, Loader2 } from "lucide-react";
import { sourceEvidenceManifest } from "@/data/affidavitManifest";
import { affidavitImageCatalog, type AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import AdminSourcePreviewModal, { type AdminSourcePreview } from "@/components/AdminSourcePreviewModal";
import BatchDownloadProgress from "@/components/BatchDownloadProgress";
import BatchDownloadSummary from "@/components/BatchDownloadSummary";
import BatchDownloadCompletionSummary from "@/components/BatchDownloadCompletionSummary";
import { exportCatalogToCsv, exportCatalogToReportJson } from "@/utils/exportCatalog";
import { exportCatalogToPdfReport } from "@/utils/exportCatalogPdf";
import { batchDownloadCatalogImages, createBatchDownloadPauseController, isBatchDownloadAbortError, mergeBatchDownloadSummaries, mergeRetriedBatchDownloadPart, retryBatchDownloadPart, type BatchDownloadPauseController, type BatchDownloadSummaryResult } from "@/utils/batchDownload";
import { filterCatalogByAdvancedAnnotationFilters } from "@/utils/annotationSearch";
import { applyAdminTagToAnnotations, deleteAdminAnnotations, loadAdminAnnotations } from "@/utils/adminAnnotations";
import { deleteAdminEvidenceItems, emptyDeletedEvidenceItems, loadDeletedEvidenceRecords, purgeDeletedEvidenceItems, restoreAdminEvidenceItems } from "@/utils/adminEvidenceWorkspace";
import { formatRestoreToastMessage } from "@/utils/restoreToast";
import { filterDeletedEvidenceItems } from "@/utils/deletedEvidenceSearch";

export default function AdminAffidavitExtractionWorkspace() {
  const [extractedStatus, setExtractedStatus] = useState<string>("Ready for extraction");
  const [isExporting, setIsExporting] = useState(false);
  const [annotationRefreshKey, setAnnotationRefreshKey] = useState(0);
  const [deletionRefreshKey, setDeletionRefreshKey] = useState(0);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [restoreToast, setRestoreToast] = useState<string | null>(null);
  const [permanentDeleteIds, setPermanentDeleteIds] = useState<string[]>([]);
  const [emptyTrashPending, setEmptyTrashPending] = useState(false);
  const [emptyTrashBusy, setEmptyTrashBusy] = useState(false);
  const restoreToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadAbortController = useRef<AbortController | null>(null);
  const downloadPauseController = useRef<BatchDownloadPauseController | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ active: boolean; percent: number; text: string; partNumber?: number; totalParts?: number; paused?: boolean }>({ active: false, percent: 0, text: "", paused: false });
  const [downloadSummary, setDownloadSummary] = useState<BatchDownloadSummaryResult | null>(null);
  const [retryingDownloads, setRetryingDownloads] = useState(false);
  const [retryingPartNumber, setRetryingPartNumber] = useState<number | null>(null);

  const handlePauseDownload = () => {
    const controller = downloadPauseController.current;
    if (!controller || controller.isPaused()) return;
    controller.pause();
    setDownloadProgress((current) => ({ ...current, paused: true, text: current.partNumber && current.totalParts ? `Paused ZIP part ${current.partNumber} of ${current.totalParts}.` : "Download paused." }));
    setExtractedStatus("Download paused. Resume to continue the active ZIP part.");
  };

  const handleResumeDownload = () => {
    const controller = downloadPauseController.current;
    if (!controller || !controller.isPaused()) return;
    controller.resume();
    setDownloadProgress((current) => ({ ...current, paused: false, text: current.partNumber && current.totalParts ? `Resuming ZIP part ${current.partNumber} of ${current.totalParts}...` : "Resuming download..." }));
    setExtractedStatus("Download resumed.");
  };

  const handleCancelDownload = () => {
    const controller = downloadAbortController.current;
    if (!controller || controller.signal.aborted) return;
    controller.abort();
    setExtractedStatus("Download cancelled. No ZIP archive was created.");
    setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
  };

  const handleBatchDownloadZip = async () => {
    if (filteredImages.length === 0) return;
    const controller = new AbortController();
    const pauseController = createBatchDownloadPauseController();
    downloadAbortController.current = controller;
    downloadPauseController.current = pauseController;
    try {
      setRetryingDownloads(false);
      setDownloadSummary(null);
      setDownloadProgress({ active: true, percent: 5, text: "Initializing ZIP package...", paused: false });
      const summary = await batchDownloadCatalogImages(filteredImages, (pct, statusText, metadata) => {
        setDownloadProgress((current) => ({ active: true, percent: pct, text: statusText, partNumber: metadata?.partNumber ?? current.partNumber, totalParts: metadata?.totalParts ?? current.totalParts, paused: current.paused }));
      }, controller.signal, pauseController);
      setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
      setDownloadSummary(summary);
    } catch (err: unknown) {
      if (isBatchDownloadAbortError(err)) {
        setExtractedStatus("Download cancelled. No ZIP archive was created.");
        setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
        setDownloadSummary(null);
        return;
      }
      const msg = err instanceof Error ? err.message : "Download failed";
      alert(`Batch download failed: ${msg}`);
      setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
      setDownloadSummary(null);
    } finally {
      if (downloadAbortController.current === controller) downloadAbortController.current = null;
      if (downloadPauseController.current === pauseController) downloadPauseController.current = null;
    }
  };

  const handleRetryFailedDownloads = async () => {
    const currentSummary = downloadSummary;
    if (!currentSummary || currentSummary.retryItemIds.length === 0 || retryingDownloads) return;
    const retryItems = affidavitImageCatalog.filter((item) => currentSummary.retryItemIds.includes(item.id));
    if (retryItems.length === 0) return;

    const controller = new AbortController();
    const pauseController = createBatchDownloadPauseController();
    downloadAbortController.current = controller;
    downloadPauseController.current = pauseController;
    try {
      setRetryingDownloads(true);
      setDownloadProgress({ active: true, percent: 5, text: `Retrying ${retryItems.length} failed gallery download${retryItems.length === 1 ? "" : "s"}...`, paused: false });
      const retrySummary = await batchDownloadCatalogImages(retryItems, (pct, statusText, metadata) => {
        setDownloadProgress((current) => ({ active: true, percent: pct, text: statusText, partNumber: metadata?.partNumber ?? current.partNumber, totalParts: metadata?.totalParts ?? current.totalParts, paused: current.paused }));
      }, controller.signal, pauseController);
      setDownloadSummary(mergeBatchDownloadSummaries(currentSummary, retrySummary));
    } catch (err: unknown) {
      if (isBatchDownloadAbortError(err)) {
        setExtractedStatus("Retry cancelled. The previous download summary is unchanged.");
        return;
      }
      const msg = err instanceof Error ? err.message : "Retry failed";
      alert(`Retry failed: ${msg}`);
    } finally {
      setRetryingDownloads(false);
      setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
      if (downloadAbortController.current === controller) downloadAbortController.current = null;
      if (downloadPauseController.current === pauseController) downloadPauseController.current = null;
    }
  };

  const handleRetryFailedPart = async (partNumber: number) => {
    const currentSummary = downloadSummary;
    const part = currentSummary?.archivePartResults?.find((candidate) => candidate.partNumber === partNumber);
    if (!currentSummary || !part || part.status !== "failed" || retryingDownloads || retryingPartNumber !== null) return;
    const retryItems = affidavitImageCatalog.filter((item) => part.entryIds.includes(item.id));
    if (retryItems.length === 0) {
      setExtractedStatus(`ZIP part ${partNumber} has no retryable gallery assets.`);
      return;
    }

    const controller = new AbortController();
    const pauseController = createBatchDownloadPauseController();
    downloadAbortController.current = controller;
    downloadPauseController.current = pauseController;
    try {
      setRetryingPartNumber(partNumber);
      setDownloadProgress({ active: true, percent: 5, text: `Retrying ZIP part ${partNumber} of ${currentSummary.archiveParts}...`, partNumber, totalParts: currentSummary.archiveParts, paused: false });
      const retrySummary = await retryBatchDownloadPart(retryItems, partNumber, currentSummary.archiveParts, (pct, statusText, metadata) => {
        setDownloadProgress((current) => ({ active: true, percent: pct, text: statusText, partNumber: metadata?.partNumber ?? partNumber, totalParts: metadata?.totalParts ?? currentSummary.archiveParts, paused: current.paused }));
      }, controller.signal, pauseController);
      setDownloadSummary(mergeRetriedBatchDownloadPart(currentSummary, retrySummary, partNumber));
    } catch (err: unknown) {
      if (isBatchDownloadAbortError(err)) {
        setExtractedStatus(`Retry for ZIP part ${partNumber} cancelled. Other parts remain available.`);
        return;
      }
      const msg = err instanceof Error ? err.message : "ZIP part retry failed";
      alert(`ZIP part ${partNumber} retry failed: ${msg}`);
    } finally {
      setRetryingPartNumber(null);
      setDownloadProgress({ active: false, percent: 0, text: "", paused: false });
      if (downloadAbortController.current === controller) downloadAbortController.current = null;
      if (downloadPauseController.current === pauseController) downloadPauseController.current = null;
    }
  };

  const [preview, setPreview] = useState<AdminSourcePreview | null>(null);
  const [imageSearch, setImageSearch] = useState("");
  const [annotationTag, setAnnotationTag] = useState("");
  const [annotationUpdatedFrom, setAnnotationUpdatedFrom] = useState("");
  const [annotationUpdatedTo, setAnnotationUpdatedTo] = useState("");
  const [deletedSearch, setDeletedSearch] = useState("");
  const [deletedTag, setDeletedTag] = useState("");
  const [deletedFrom, setDeletedFrom] = useState("");
  const [deletedTo, setDeletedTo] = useState("");
  const [imagePage, setImagePage] = useState(1);
  const imagePageSize = 24;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPermanentDeleteIds([]);
        setEmptyTrashPending(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (restoreToastTimer.current) clearTimeout(restoreToastTimer.current);
    };
  }, []);

  const deletedRecords = useMemo(() => loadDeletedEvidenceRecords(), [deletionRefreshKey]);
  const deletedImageIds = useMemo(() => new Set(deletedRecords.map((record) => record.id)), [deletedRecords]);
  const deletedCatalogItems = useMemo(() => deletedRecords.flatMap((record): Array<AffidavitImageCatalogItem & { deletedAt: string | null }> => {
    const item = affidavitImageCatalog.find((candidate) => candidate.id === record.id);
    return item ? [{ ...item, deletedAt: record.deletedAt }] : [];
  }), [deletedRecords]);
  const activeImageCatalog = useMemo(() => affidavitImageCatalog.filter((item) => !deletedImageIds.has(item.id)), [deletedImageIds]);
  const annotationMap = useMemo(() => loadAdminAnnotations(), [annotationRefreshKey]);
  const availableAnnotationTags = useMemo(() => Array.from(new Set(Object.values(annotationMap).flatMap((annotation) => annotation.tags))).sort((a, b) => a.localeCompare(b)), [annotationMap]);
  const filteredDeletedCatalogItems = useMemo(() => filterDeletedEvidenceItems(deletedCatalogItems, annotationMap, {
    query: deletedSearch,
    tag: deletedTag,
    deletedFrom: deletedFrom,
    deletedTo: deletedTo,
  }), [deletedCatalogItems, annotationMap, deletedSearch, deletedTag, deletedFrom, deletedTo]);
  const clearDeletedFilters = () => {
    setDeletedSearch("");
    setDeletedTag("");
    setDeletedFrom("");
    setDeletedTo("");
  };
  const filteredImages = useMemo(() => {
    const query = imageSearch.trim().toLowerCase();
    const metadataFiltered = !query ? activeImageCatalog : activeImageCatalog.filter((item) => {
      const sourceMetadata = `${item.evidenceItem} ${item.filename} ${item.group} ${item.appendixPage}`.toLowerCase();
      const annotation = annotationMap[item.id];
      const annotationText = [annotation?.note ?? "", ...(annotation?.tags ?? [])].join(" ").toLowerCase();
      return sourceMetadata.includes(query) || annotationText.includes(query);
    });
    return filterCatalogByAdvancedAnnotationFilters(metadataFiltered, annotationMap, {
      tag: annotationTag,
      updatedFrom: annotationUpdatedFrom,
      updatedTo: annotationUpdatedTo,
    });
  }, [activeImageCatalog, annotationMap, annotationTag, annotationUpdatedFrom, annotationUpdatedTo, imageSearch]);

  const totalImagePages = Math.max(1, Math.ceil(filteredImages.length / imagePageSize));
  const visibleImages = filteredImages.slice((imagePage - 1) * imagePageSize, imagePage * imagePageSize);

  const handleImageSearch = (value: string) => {
    setImageSearch(value);
    setImagePage(1);
  };

  const clearImageFilters = () => {
    setImageSearch("");
    setAnnotationTag("");
    setAnnotationUpdatedFrom("");
    setAnnotationUpdatedTo("");
    setSelectedImageIds(new Set());
    setImagePage(1);
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImageIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllFilteredImages = () => {
    setSelectedImageIds((current) => {
      const next = new Set(current);
      const allSelected = filteredImages.length > 0 && filteredImages.every((item) => next.has(item.id));
      filteredImages.forEach((item) => allSelected ? next.delete(item.id) : next.add(item.id));
      return next;
    });
  };

  const handleBulkTag = () => {
    const ids = Array.from(selectedImageIds);
    const tag = bulkTagInput.trim();
    if (!ids.length || !tag) return;
    applyAdminTagToAnnotations(ids, tag);
    setAnnotationRefreshKey((key) => key + 1);
    setBulkTagInput("");
    setExtractedStatus(`Applied tag to ${ids.length} selected image${ids.length === 1 ? "" : "s"}`);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedImageIds);
    if (!ids.length) return;
    const confirmed = typeof window === "undefined" || window.confirm(`Remove ${ids.length} selected evidence image${ids.length === 1 ? "" : "s"} from the admin workspace? The immutable source dossier will not be changed.`);
    if (!confirmed) return;
    deleteAdminEvidenceItems(ids);
    deleteAdminAnnotations(ids);
    setDeletionRefreshKey((key) => key + 1);
    setAnnotationRefreshKey((key) => key + 1);
    setSelectedImageIds(new Set());
    setExtractedStatus(`Removed ${ids.length} image${ids.length === 1 ? "" : "s"} from the admin workspace`);
  };

  const requestPermanentDelete = (ids: readonly string[]) => {
    if (ids.length) setPermanentDeleteIds(Array.from(ids));
  };

  const confirmPermanentDelete = () => {
    const ids = permanentDeleteIds;
    if (!ids.length) return;
    purgeDeletedEvidenceItems(ids);
    setPermanentDeleteIds([]);
    setDeletionRefreshKey((key) => key + 1);
    setExtractedStatus(`Permanently deleted ${ids.length} item${ids.length === 1 ? "" : "s"} from the admin trash`);
  };

  const requestEmptyTrash = () => {
    if (deletedCatalogItems.length) setEmptyTrashPending(true);
  };

  const confirmEmptyTrash = () => {
    const count = deletedCatalogItems.length;
    if (!count || emptyTrashBusy) return;
    setEmptyTrashBusy(true);
    window.setTimeout(() => {
      emptyDeletedEvidenceItems();
      setEmptyTrashBusy(false);
      setEmptyTrashPending(false);
      setDeletionRefreshKey((key) => key + 1);
      setExtractedStatus(`Emptied the admin trash: permanently deleted ${count} item${count === 1 ? "" : "s"}`);
    }, 250);
  };

  const handleRestore = (ids: readonly string[]) => {
    if (!ids.length) return;
    restoreAdminEvidenceItems(ids);
    setDeletionRefreshKey((key) => key + 1);
    setExtractedStatus(`Restored ${ids.length} image${ids.length === 1 ? "" : "s"} to the admin workspace`);
    setRestoreToast(formatRestoreToastMessage(ids.length));
    if (restoreToastTimer.current) clearTimeout(restoreToastTimer.current);
    restoreToastTimer.current = setTimeout(() => setRestoreToast(null), 4000);
  };

  const handleExportJson = () => {
    setIsExporting(true);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ sourceEvidenceManifest, affidavitImageCatalog }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "master-kanor-complete-alignment-manifest.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExporting(false);
    setExtractedStatus("Complete manifest exported as JSON successfully");
  };

  const openImagePreview = (item: AffidavitImageCatalogItem) => setPreview({ kind: "image", item });
  const openMediaPreview = (item: (typeof sourceEvidenceManifest.evidenceLinks)[number], index: number) => setPreview({ kind: "media", item: { ...item, id: `source-media-${index + 1}`, sourcePages: item.sourcePages } });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Official Affidavit & Evidence Alignment Workspace</CardTitle>
              <CardDescription>
                Admin control center for the 12 official affidavit sections, 87-page dossier, and 393 source evidence assets
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" /> Text Preserved (12 Pages + Appendix)
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Official Source Pages</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{sourceEvidenceManifest.officialSourcePageCount}</p>
              <p className="text-xs text-slate-600 mt-1">Exact text preserved</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Final Dossier Pages</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{sourceEvidenceManifest.finalDossierPageCount}</p>
              <p className="text-xs text-slate-600 mt-1">Includes 75-page gallery appendix</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">Unique Source Images</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{sourceEvidenceManifest.uniqueSourceImageCount}</p>
              <p className="text-xs text-slate-600 mt-1">Source-linked gallery assets</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-500 uppercase">External Media Links</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{sourceEvidenceManifest.evidenceLinks.length}</p>
              <p className="text-xs text-slate-600 mt-1">YouTube, Drive, & Facebook</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">Extracted Traceability & Alignment Controls</h3>
              <span className="text-xs text-slate-500">Status: {extractedStatus}</span>
            </div>
            <p className="text-sm text-slate-600">
              All extracted sections map unofficial evidence galleries directly into official affidavit headings. Preview source-image appendix pages and external media in the secure admin modal before publication.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleExportJson} disabled={isExporting} className="bg-slate-900 hover:bg-slate-800 text-white">
                <Download className="mr-2 h-4 w-4" /> Export Complete Manifest (JSON)
              </Button>
              <Button variant="outline" asChild>
                <a href="/manus-storage/official-affidavit-evidence-dossier-87-pages_3bf21f6a.pdf" target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" /> Open 87-Page PDF Dossier <ExternalLink className="ml-1.5 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Extracted Source Images</h3>
                <p className="text-xs text-slate-500">{filteredImages.length} image records ({activeImageCatalog.length} available) · select items for batch actions or click to preview</p>

              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <label htmlFor="admin-source-image-search" className="sr-only">Search extracted source images</label>
                  <input id="admin-source-image-search" type="search" value={imageSearch} onChange={(event) => handleImageSearch(event.target.value)} placeholder="Search filename, tags, annotations..." aria-describedby="admin-source-image-search-help" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm" />
                  <span id="admin-source-image-search-help" className="sr-only">Searches source metadata, custom tags, and private admin annotations.</span>
                </div>
                {(imageSearch || annotationTag || annotationUpdatedFrom || annotationUpdatedTo) && <Button size="sm" variant="ghost" onClick={clearImageFilters} aria-label="Clear all evidence image filters">Clear filters</Button>}
                <label htmlFor="admin-annotation-tag-filter" className="sr-only">Filter evidence images by custom tag</label>
                <select id="admin-annotation-tag-filter" value={annotationTag} onChange={(event) => { setAnnotationTag(event.target.value); setImagePage(1); }} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Filter by custom tag">
                  <option value="">All custom tags</option>
                  {availableAnnotationTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <label htmlFor="admin-annotation-updated-from" className="sr-only">Annotation updated from</label>
                <input id="admin-annotation-updated-from" type="date" value={annotationUpdatedFrom} onChange={(event) => { setAnnotationUpdatedFrom(event.target.value); setImagePage(1); }} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Annotation updated from" />
                <label htmlFor="admin-annotation-updated-to" className="sr-only">Annotation updated to</label>
                <input id="admin-annotation-updated-to" type="date" value={annotationUpdatedTo} onChange={(event) => { setAnnotationUpdatedTo(event.target.value); setImagePage(1); }} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700" aria-label="Annotation updated to" />
                <Button size="sm" variant="outline" onClick={() => exportCatalogToCsv(filteredImages, imageSearch)} className="gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportCatalogToReportJson(filteredImages, imageSearch)} className="gap-1.5">
                  <Download className="h-4 w-4 text-blue-600" /> Export JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportCatalogToPdfReport(filteredImages, imageSearch)} className="gap-1.5">
                  <FileText className="h-4 w-4 text-red-600" /> Export PDF Report
                </Button>
                <span className="text-xs text-slate-500" aria-live="polite">{filteredImages.length} match{filteredImages.length === 1 ? "" : "es"}</span>
                <Button size="sm" variant="default" onClick={handleBatchDownloadZip} disabled={downloadProgress.active || filteredImages.length === 0} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" title="Download managed gallery derivatives with a traceability manifest">
                  <Download className="h-4 w-4" /> {downloadProgress.active ? `${downloadProgress.percent}%` : "Download Gallery ZIP"}
                </Button>
              </div>
            </div>
            <BatchDownloadProgress active={downloadProgress.active} percent={downloadProgress.percent} text={downloadProgress.text} onCancel={handleCancelDownload} onPause={handlePauseDownload} onResume={handleResumeDownload} paused={downloadProgress.paused} partNumber={downloadProgress.partNumber} totalParts={downloadProgress.totalParts} />
            {downloadSummary && !downloadProgress.active && <BatchDownloadCompletionSummary summary={downloadSummary} />}
            {downloadSummary && <BatchDownloadSummary summary={downloadSummary} onDismiss={() => setDownloadSummary(null)} onRetry={handleRetryFailedDownloads} retrying={retryingDownloads} onRetryPart={handleRetryFailedPart} retryingPartNumber={retryingPartNumber} />}
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3" aria-label="Bulk evidence actions">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={filteredImages.length > 0 && filteredImages.every((item) => selectedImageIds.has(item.id))} onChange={toggleAllFilteredImages} aria-label="Select all filtered evidence images" className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                  Select all filtered ({filteredImages.length})
                </label>
                <span aria-live="polite">{selectedImageIds.size} selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="admin-bulk-tag-input" className="sr-only">Tag selected evidence images</label>
                <input id="admin-bulk-tag-input" value={bulkTagInput} onChange={(event) => setBulkTagInput(event.target.value)} placeholder="Tag selected items..." className="min-w-56 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
                <Button size="sm" variant="outline" onClick={handleBulkTag} disabled={selectedImageIds.size === 0 || !bulkTagInput.trim()} className="gap-1.5"><Tag className="h-4 w-4" /> Apply tag</Button>
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={selectedImageIds.size === 0} className="gap-1.5"><Trash2 className="h-4 w-4" /> Delete selected</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleImages.map((item) => (
                <div key={item.id} className="group rounded-lg border border-slate-200 bg-white p-3 transition hover:border-amber-400 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input type="checkbox" checked={selectedImageIds.has(item.id)} onChange={() => toggleImageSelection(item.id)} aria-label={`Select evidence image ${item.evidenceItem}`} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                      Select
                    </label>
                    <span className="text-[11px] text-slate-400">#{item.id}</span>
                  </div>
                  <button type="button" onClick={() => openImagePreview(item)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-amber-50 p-2 text-amber-700"><FileImage className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">Evidence image {item.evidenceItem}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{item.filename}</p>
                        <p className="mt-1 text-[11px] text-slate-400">Appendix page {item.appendixPage} · slot {item.slot}</p>
                      </div>
                      <Eye className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-amber-600" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>Page {imagePage} of {totalImagePages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setImagePage((page) => Math.max(1, page - 1))} disabled={imagePage === 1}>Previous</Button>
                <Button size="sm" variant="outline" onClick={() => setImagePage((page) => Math.min(totalImagePages, page + 1))} disabled={imagePage === totalImagePages}>Next</Button>
              </div>
            </div>
          </div>

          {deletedCatalogItems.length > 0 && (
            <div className="border border-rose-200 rounded-lg p-5 bg-rose-50 space-y-4" aria-labelledby="admin-recently-deleted-heading">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="admin-recently-deleted-heading" className="text-base font-semibold text-rose-950">Recently Deleted</h3>
                  <p className="text-xs text-rose-800">{deletedCatalogItems.length} item{deletedCatalogItems.length === 1 ? "" : "s"} removed from this admin workspace. Restoring does not change the immutable source dossier.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleRestore(deletedCatalogItems.map((item) => item.id))} className="gap-1.5 border-rose-300 bg-white"><RotateCcw className="h-4 w-4" /> Restore all</Button>
                  <Button size="sm" variant="outline" onClick={requestEmptyTrash} className="gap-1.5 border-rose-500 bg-white text-rose-900 hover:bg-rose-100"><Trash2 className="h-4 w-4" /> Empty Trash</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-rose-200 bg-white p-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-xs font-medium text-rose-950 xl:col-span-2">Search deleted items
                  <div className="relative mt-1.5">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <input value={deletedSearch} onChange={(event) => setDeletedSearch(event.target.value)} placeholder="Filename, evidence ID, tag, note…" aria-label="Search Recently Deleted" className="h-9 w-full rounded-md border border-rose-200 bg-white pl-8 pr-3 text-sm font-normal text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
                  </div>
                </label>
                <label className="text-xs font-medium text-rose-950">Custom tag
                  <select value={deletedTag} onChange={(event) => setDeletedTag(event.target.value)} aria-label="Filter Recently Deleted by custom tag" className="mt-1.5 h-9 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200">
                    <option value="">All tags</option>
                    {availableAnnotationTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </label>
                <label className="text-xs font-medium text-rose-950">Deleted from
                  <input type="date" value={deletedFrom} onChange={(event) => setDeletedFrom(event.target.value)} aria-label="Recently Deleted start date" className="mt-1.5 h-9 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
                </label>
                <label className="text-xs font-medium text-rose-950">Deleted to
                  <input type="date" value={deletedTo} onChange={(event) => setDeletedTo(event.target.value)} aria-label="Recently Deleted end date" className="mt-1.5 h-9 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200" />
                </label>
                <div className="flex items-end justify-between gap-2 md:col-span-2 xl:col-span-5">
                  <span className="text-xs text-rose-800">Showing {filteredDeletedCatalogItems.length} of {deletedCatalogItems.length} deleted item{deletedCatalogItems.length === 1 ? "" : "s"}</span>
                  <Button size="sm" variant="outline" onClick={clearDeletedFilters} disabled={!deletedSearch && !deletedTag && !deletedFrom && !deletedTo}>Clear filters</Button>
                </div>
              </div>
              <div className="space-y-2">
                {filteredDeletedCatalogItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-md bg-rose-100 p-2 text-rose-700"><Trash2 className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">Evidence image {item.evidenceItem} · {item.filename}</p>
                        <p className="truncate text-xs text-slate-500">Appendix page {item.appendixPage} · Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "date unavailable"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestore([item.id])} className="gap-1.5 border-rose-300 bg-white"><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
                      <Button size="sm" variant="outline" onClick={() => requestPermanentDelete([item.id])} className="gap-1.5 border-rose-400 bg-white text-rose-800 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5" /> Delete permanently</Button>
                    </div>
                  </div>
                ))}
                {filteredDeletedCatalogItems.length === 0 && <p className="rounded-lg border border-dashed border-rose-300 bg-white p-4 text-sm text-rose-900">No deleted evidence items match the current filters.</p>}
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Extracted Media Links</h3>
              <p className="text-xs text-slate-500">Provider-aware preview with original-source fallback and source-page traceability</p>
            </div>
            <div className="space-y-2">
              {sourceEvidenceManifest.evidenceLinks.map((item, index) => (
                <div key={`${item.provider}-${item.url}`} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-md bg-slate-100 p-2 text-slate-600"><Link2 className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.provider.toUpperCase()} · Source page {item.sourcePages.join(", ")}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openMediaPreview(item, index)} className="shrink-0"><Eye className="mr-1.5 h-3.5 w-3.5" /> Preview media</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Mapped Evidence Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                "Identity & Background (Tacloban City, Leyte, 6500)",
                "Gaming Career & Mobile Legends Evidence",
                "Computer Setup & Device Surveillance",
                "Casino Promotions & Vlogger Partnerships",
                "Fraud Discovery & Poisoning Attempt Logs",
                "IT Sabotage & Evidence Tampering Records",
              ].map((category) => (
                <div key={category} className="p-3 bg-white rounded border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{category}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {permanentDeleteIds.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPermanentDeleteIds([]); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="permanent-delete-title" aria-describedby="permanent-delete-description" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-700"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
              <div>
                <h2 id="permanent-delete-title" className="text-lg font-semibold text-slate-950">Permanently delete {permanentDeleteIds.length} item{permanentDeleteIds.length === 1 ? "" : "s"}?</h2>
                <p id="permanent-delete-description" className="mt-2 text-sm leading-6 text-slate-600">This removes the selected records from the admin Recently Deleted index and cannot be undone in this workspace. The immutable source dossier remains unchanged.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPermanentDeleteIds([])}>Cancel</Button>
              <Button variant="destructive" onClick={confirmPermanentDelete}><Trash2 className="mr-1.5 h-4 w-4" /> Permanently delete</Button>
            </div>
          </div>
        </div>
      )}
      {emptyTrashPending && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEmptyTrashPending(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="empty-trash-title" aria-describedby="empty-trash-description" className="w-full max-w-lg rounded-xl border-2 border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-700"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
              <div>
                <h2 id="empty-trash-title" className="text-lg font-semibold text-slate-950">Empty Recently Deleted?</h2>
                <p id="empty-trash-description" className="mt-2 text-sm leading-6 text-slate-600">This will permanently delete all {deletedCatalogItems.length} item{deletedCatalogItems.length === 1 ? "" : "s"} currently in the admin trash. This action cannot be undone in this workspace. The immutable source dossier remains unchanged.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmptyTrashPending(false)} disabled={emptyTrashBusy}>Cancel</Button>
              <Button variant="destructive" onClick={confirmEmptyTrash} disabled={emptyTrashBusy} aria-busy={emptyTrashBusy}>
                {emptyTrashBusy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />}
                {emptyTrashBusy ? "Emptying Trash…" : "Empty Trash"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {restoreToast && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-900 shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="flex-1">{restoreToast}</span>
          <button type="button" onClick={() => setRestoreToast(null)} aria-label="Dismiss restore confirmation" className="rounded p-1 text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}
      <AdminSourcePreviewModal preview={preview} onClose={() => setPreview(null)} onAnnotationSaved={() => setAnnotationRefreshKey((key) => key + 1)} />
    </div>
  );
}
