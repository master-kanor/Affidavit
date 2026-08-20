import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import { affidavitGalleryAssetUrls } from "@/data/affidavitGalleryAssets";

const SOURCE_DOSSIER_PDF_URL = "/manus-storage/official-affidavit-evidence-dossier-87-pages_3bf21f6a.pdf";
export const MAX_BATCH_ZIP_BYTES = 500 * 1024 * 1024;
const ZIP_ENTRY_OVERHEAD_BYTES = 1024;

export type BatchDownloadItemStatus = "packaged" | "unavailable" | "failed";

export type BatchDownloadItemResult = {
  id: string;
  filename: string;
  status: BatchDownloadItemStatus;
  error?: string;
};

export type BatchDownloadEntry = {
  id: string;
  fileName: string;
  bytes: ArrayBuffer;
};

export type BatchDownloadPartResult = {
  partNumber: number;
  totalParts: number;
  entryIds: string[];
  estimatedBytes: number;
  status: "downloaded" | "failed";
  fileName?: string;
  error?: string;
};

export type BatchDownloadProgressMetadata = {
  stage: "preparing" | "fetching" | "generating" | "complete";
  partNumber?: number;
  totalParts?: number;
  itemNumber?: number;
  totalItems?: number;
};

export type BatchDownloadProgressCallback = (percent: number, status: string, metadata?: BatchDownloadProgressMetadata) => void;

export type BatchDownloadPauseController = {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  waitForResume: (signal?: AbortSignal) => Promise<void>;
};

export function createBatchDownloadPauseController(): BatchDownloadPauseController {
  let paused = false;
  const waiters = new Set<() => void>();

  const resume = () => {
    paused = false;
    const pending = Array.from(waiters);
    waiters.clear();
    pending.forEach((resolve) => resolve());
  };

  return {
    pause: () => {
      paused = true;
    },
    resume,
    isPaused: () => paused,
    waitForResume: async (signal?: AbortSignal) => {
      throwIfAborted(signal);
      if (!paused) return;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (callback: () => void) => {
          if (settled) return;
          settled = true;
          signal?.removeEventListener("abort", onAbort);
          waiters.delete(resolveWaiter);
          callback();
        };
        const resolveWaiter = () => finish(resolve);
        const onAbort = () => finish(() => reject(createBatchDownloadAbortError()));
        waiters.add(resolveWaiter);
        signal?.addEventListener("abort", onAbort, { once: true });
        if (signal?.aborted) onAbort();
        else if (!paused) resolveWaiter();
      });
    },
  };
}

export type BatchDownloadSummaryResult = {
  totalSelected: number;
  packagedFiles: number;
  unavailableFiles: number;
  failedFiles: number;
  traceabilityRecords: number;
  errors: string[];
  retryItemIds: string[];
  itemResults: BatchDownloadItemResult[];
  archiveParts: number;
  estimatedBytes: number;
  partEstimatedBytes: number[];
  archivePartResults?: BatchDownloadPartResult[];
  retryPartNumbers?: number[];
};

export function estimateBatchDownloadEntryBytes(entry: Pick<BatchDownloadEntry, "fileName" | "bytes">): number {
  return entry.bytes.byteLength + entry.fileName.length * 2 + ZIP_ENTRY_OVERHEAD_BYTES;
}

export function partitionBatchDownloadEntries(
  entries: readonly BatchDownloadEntry[],
  maxBytes = MAX_BATCH_ZIP_BYTES,
): BatchDownloadEntry[][] {
  if (entries.length === 0) return [[]];
  const parts: BatchDownloadEntry[][] = [];
  let currentPart: BatchDownloadEntry[] = [];
  let currentBytes = 0;

  for (const entry of entries) {
    const entryBytes = estimateBatchDownloadEntryBytes(entry);
    if (currentPart.length > 0 && currentBytes + entryBytes > maxBytes) {
      parts.push(currentPart);
      currentPart = [];
      currentBytes = 0;
    }
    currentPart.push(entry);
    currentBytes += entryBytes;
  }

  if (currentPart.length > 0) parts.push(currentPart);
  return parts;
}

export function createBatchDownloadAbortError(): Error {
  const error = new Error("Batch gallery ZIP download cancelled.");
  error.name = "AbortError";
  return error;
}

export function isBatchDownloadAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw createBatchDownloadAbortError();
}

function createSummary(
  totalSelected: number,
  itemResults: BatchDownloadItemResult[],
  archiveParts: number,
  estimatedBytes: number,
  partEstimatedBytes: number[],
  archivePartResults?: BatchDownloadPartResult[],
): BatchDownloadSummaryResult {
  const errors = itemResults
    .filter((item) => item.status !== "packaged")
    .map((item) => `${item.filename}: ${item.error ?? "unknown export error"}`);
  const partErrors = (archivePartResults ?? [])
    .filter((part) => part.status === "failed")
    .map((part) => `ZIP part ${part.partNumber}: ${part.error ?? "unknown archive error"}`);
  const retryPartNumbers = (archivePartResults ?? [])
    .filter((part) => part.status === "failed")
    .map((part) => part.partNumber);
  const summary: BatchDownloadSummaryResult = {
    totalSelected,
    packagedFiles: itemResults.filter((item) => item.status === "packaged").length,
    unavailableFiles: itemResults.filter((item) => item.status === "unavailable").length,
    failedFiles: itemResults.filter((item) => item.status === "failed").length,
    traceabilityRecords: itemResults.length,
    errors: [...errors, ...partErrors],
    retryItemIds: itemResults.filter((item) => item.status !== "packaged").map((item) => item.id),
    itemResults,
    archiveParts,
    estimatedBytes,
    partEstimatedBytes,
  };
  if (archivePartResults) {
    summary.archivePartResults = archivePartResults;
    summary.retryPartNumbers = retryPartNumbers;
  }
  return summary;
}

export function mergeBatchDownloadSummaries(
  previous: BatchDownloadSummaryResult,
  retry: BatchDownloadSummaryResult,
): BatchDownloadSummaryResult {
  const merged = new Map(previous.itemResults.map((item) => [item.id, item]));
  retry.itemResults.forEach((item) => merged.set(item.id, item));
  const previousParts = previous.archivePartResults ?? [];
  const retryParts = retry.archivePartResults ?? [];
  const mergedParts = previousParts.length || retryParts.length
    ? [...previousParts, ...retryParts.map((part, index) => ({ ...part, partNumber: previousParts.length + index + 1, totalParts: previousParts.length + retryParts.length }))]
    : undefined;
  return createSummary(
    previous.totalSelected,
    Array.from(merged.values()),
    previousParts.length || retryParts.length ? mergedParts?.length ?? previous.archiveParts : previous.archiveParts + retry.archiveParts,
    previous.estimatedBytes + retry.estimatedBytes,
    [...previous.partEstimatedBytes, ...retry.partEstimatedBytes],
    mergedParts,
  );
}

export function mergeRetriedBatchDownloadPart(
  previous: BatchDownloadSummaryResult,
  retry: BatchDownloadSummaryResult,
  partNumber: number,
): BatchDownloadSummaryResult {
  const previousParts = previous.archivePartResults ?? [];
  const replacement = retry.archivePartResults?.[0];
  if (!replacement) return previous;
  const mergedItems = new Map(previous.itemResults.map((item) => [item.id, item]));
  retry.itemResults.forEach((item) => mergedItems.set(item.id, item));
  const nextParts = previousParts.map((part) => part.partNumber === partNumber ? { ...replacement, partNumber, totalParts: previous.archiveParts } : part);
  const nextEstimatedBytes = previous.estimatedBytes - (previous.partEstimatedBytes[partNumber - 1] ?? 0) + replacement.estimatedBytes;
  const nextPartEstimatedBytes = [...previous.partEstimatedBytes];
  nextPartEstimatedBytes[partNumber - 1] = replacement.estimatedBytes;
  return createSummary(previous.totalSelected, Array.from(mergedItems.values()), previous.archiveParts, nextEstimatedBytes, nextPartEstimatedBytes, nextParts);
}

async function generateZipBlob(zip: { generateAsync: (options: { type: "blob" }) => Promise<Blob> }, signal?: AbortSignal): Promise<Blob> {
  throwIfAborted(signal);
  if (!signal) return zip.generateAsync({ type: "blob" });

  return new Promise<Blob>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createBatchDownloadAbortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
    zip.generateAsync({ type: "blob" }).then((blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    }).catch((error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    });
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function fetchBatchDownloadItems(
  items: readonly AffidavitImageCatalogItem[],
  onProgress: BatchDownloadProgressCallback | undefined,
  signal: AbortSignal | undefined,
  pauseController: BatchDownloadPauseController | undefined,
): Promise<{ itemResults: BatchDownloadItemResult[]; traceability: Array<Record<string, string | number>>; downloadedEntries: BatchDownloadEntry[] }> {
  const itemResults: BatchDownloadItemResult[] = [];
  const traceability: Array<Record<string, string | number>> = [];
  const downloadedEntries: BatchDownloadEntry[] = [];

  for (let i = 0; i < items.length; i++) {
    throwIfAborted(signal);
    await pauseController?.waitForResume(signal);
    const item = items[i];
    const pct = Math.round(20 + ((i + 1) / items.length) * 60);
    const assetUrl = affidavitGalleryAssetUrls[item.id];
    onProgress?.(pct, `Fetching source asset ${i + 1} of ${items.length}: ${item.filename}`, { stage: "fetching", itemNumber: i + 1, totalItems: items.length });

    if (!assetUrl) {
      const error = "no managed asset URL";
      itemResults.push({ id: item.id, filename: item.filename, status: "unavailable", error });
      traceability.push({
        id: item.id,
        evidenceItem: item.evidenceItem,
        filename: item.filename,
        appendixPage: item.appendixPage,
        slot: item.slot,
        status: "asset URL unavailable",
        sourceDossierPage: `${SOURCE_DOSSIER_PDF_URL}#page=${item.appendixPage}&view=FitH`,
      });
      continue;
    }

    try {
      const response = await fetch(assetUrl, { signal });
      if (!response.ok) throw new Error(`asset request returned ${response.status}`);
      const bytes = await response.arrayBuffer();
      throwIfAborted(signal);
      downloadedEntries.push({ id: item.id, fileName: `evidence-${item.evidenceItem}-${item.id}.webp`, bytes });
      itemResults.push({ id: item.id, filename: item.filename, status: "packaged" });
      traceability.push({
        id: item.id,
        evidenceItem: item.evidenceItem,
        filename: item.filename,
        appendixPage: item.appendixPage,
        slot: item.slot,
        status: "downloaded managed gallery derivative",
        assetUrl,
        sourceDossierPage: `${SOURCE_DOSSIER_PDF_URL}#page=${item.appendixPage}&view=FitH`,
      });
    } catch (error) {
      if (isBatchDownloadAbortError(error) || (error instanceof Error && error.name === "AbortError")) throw createBatchDownloadAbortError();
      const reason = error instanceof Error ? error.message : "unknown asset request error";
      itemResults.push({ id: item.id, filename: item.filename, status: "failed", error: reason });
      traceability.push({
        id: item.id,
        evidenceItem: item.evidenceItem,
        filename: item.filename,
        appendixPage: item.appendixPage,
        slot: item.slot,
        status: "asset request failed",
        assetUrl,
        error: reason,
        sourceDossierPage: `${SOURCE_DOSSIER_PDF_URL}#page=${item.appendixPage}&view=FitH`,
      });
    }
  }

  return { itemResults, traceability, downloadedEntries };
}

type BatchZipConstructor = new () => {
  folder: (name: string) => { file: (name: string, data: ArrayBuffer | string) => void } | null;
  generateAsync: (options: { type: "blob" }) => Promise<Blob>;
};

async function createAndDownloadPart(
  JSZip: BatchZipConstructor,
  part: readonly BatchDownloadEntry[],
  partNumber: number,
  totalParts: number,
  traceability: Array<Record<string, string | number>>,
  onProgress: BatchDownloadProgressCallback | undefined,
  signal: AbortSignal | undefined,
  pauseController: BatchDownloadPauseController | undefined,
): Promise<BatchDownloadPartResult> {
  throwIfAborted(signal);
  const partIds = new Set(part.map((entry) => entry.id));
  const partTraceability = traceability.filter((record) => partIds.has(String(record.id)));
  const zip = new JSZip();
  const folder = zip.folder("master-kanor-evidence-gallery-assets");
  if (!folder) throw new Error("Failed to create ZIP archive folder.");
  for (const entry of part) folder.file(entry.fileName, entry.bytes);

  await pauseController?.waitForResume(signal);
  const estimatedPartBytes = part.reduce((sum, entry) => sum + estimateBatchDownloadEntryBytes(entry), 0);
  folder.file("TRACEABILITY.json", JSON.stringify({
    title: "Master Kanor evidence gallery asset export",
    note: "The downloaded image files are managed gallery derivatives generated from the supplied archive. The immutable 87-page dossier remains the authoritative document source.",
    partNumber,
    partCount: totalParts,
    estimatedUncompressedBytes: estimatedPartBytes,
    errors: traceability.filter((record) => record.status !== "downloaded managed gallery derivative"),
    items: partTraceability,
  }, null, 2));

  const progress = 80 + Math.round((partNumber / totalParts) * 15);
  onProgress?.(progress, `Generating ZIP part ${partNumber} of ${totalParts}...`, { stage: "generating", partNumber, totalParts });
  const content = await generateZipBlob(zip, signal);
  throwIfAborted(signal);
  const fileName = `master-kanor-evidence-gallery-assets-part-${partNumber}-of-${totalParts}-${Date.now()}.zip`;
  downloadBlob(content, fileName);
  return { partNumber, totalParts, entryIds: part.map((entry) => entry.id), estimatedBytes: estimatedPartBytes, status: "downloaded", fileName };
}

export async function retryBatchDownloadPart(
  items: readonly AffidavitImageCatalogItem[],
  partNumber: number,
  totalParts: number,
  onProgress?: BatchDownloadProgressCallback,
  signal?: AbortSignal,
  pauseController?: BatchDownloadPauseController,
): Promise<BatchDownloadSummaryResult> {
  if (items.length === 0) throw new Error("No gallery items are available for this ZIP part.");
  throwIfAborted(signal);
  onProgress?.(10, `Preparing retry for ZIP part ${partNumber} of ${totalParts}...`, { stage: "preparing", partNumber, totalParts });
  const JSZip = (await import("jszip")).default;
  await pauseController?.waitForResume(signal);
  const fetched = await fetchBatchDownloadItems(items, onProgress, signal, pauseController);
  const estimatedBytes = fetched.downloadedEntries.reduce((sum, entry) => sum + estimateBatchDownloadEntryBytes(entry), 0);
  const part: BatchDownloadPartResult = {
    partNumber,
    totalParts,
    entryIds: fetched.downloadedEntries.map((entry) => entry.id),
    estimatedBytes,
    status: "failed",
  };
  try {
    const downloadedPart = await createAndDownloadPart(JSZip, fetched.downloadedEntries, partNumber, totalParts, fetched.traceability, onProgress, signal, pauseController);
    part.status = downloadedPart.status;
    part.fileName = downloadedPart.fileName;
  } catch (error) {
    if (isBatchDownloadAbortError(error)) throw error;
    part.error = error instanceof Error ? error.message : "unknown ZIP part error";
  }
  const archivePartResults = [part];
  return createSummary(items.length, fetched.itemResults, 1, estimatedBytes, [estimatedBytes], archivePartResults);
}

export async function batchDownloadCatalogImages(
  items: readonly AffidavitImageCatalogItem[],
  onProgress?: BatchDownloadProgressCallback,
  signal?: AbortSignal,
  pauseController?: BatchDownloadPauseController,
): Promise<BatchDownloadSummaryResult> {
  if (items.length === 0) throw new Error("No image records match the current filter.");

  throwIfAborted(signal);
  onProgress?.(10, `Preparing ${items.length} source asset records for batch download...`, { stage: "preparing" });
  const JSZip = (await import("jszip")).default;
  throwIfAborted(signal);
  await pauseController?.waitForResume(signal);
  const fetched = await fetchBatchDownloadItems(items, onProgress, signal, pauseController);
  throwIfAborted(signal);

  const parts = partitionBatchDownloadEntries(fetched.downloadedEntries);
  const partEstimatedBytes: number[] = [];
  const archivePartResults: BatchDownloadPartResult[] = [];
  for (let index = 0; index < parts.length; index++) {
    throwIfAborted(signal);
    const part = parts[index];
    const partNumber = index + 1;
    const estimatedPartBytes = part.reduce((sum, entry) => sum + estimateBatchDownloadEntryBytes(entry), 0);
    partEstimatedBytes.push(estimatedPartBytes);
    try {
      await pauseController?.waitForResume(signal);
    archivePartResults.push(await createAndDownloadPart(JSZip, part, partNumber, parts.length, fetched.traceability, onProgress, signal, pauseController));
    } catch (error) {
      if (isBatchDownloadAbortError(error)) throw error;
      archivePartResults.push({ partNumber, totalParts: parts.length, entryIds: part.map((entry) => entry.id), estimatedBytes: estimatedPartBytes, status: "failed", error: error instanceof Error ? error.message : "unknown ZIP part error" });
    }
  }

  const estimatedBytes = fetched.downloadedEntries.reduce((sum, entry) => sum + estimateBatchDownloadEntryBytes(entry), 0);
  const summary = createSummary(items.length, fetched.itemResults, parts.length, estimatedBytes, partEstimatedBytes, archivePartResults);
  onProgress?.(100, `Downloaded ${summary.packagedFiles} source assets in ${summary.archiveParts} ZIP part${summary.archiveParts === 1 ? "" : "s"}.`, { stage: "complete", partNumber: summary.archiveParts, totalParts: summary.archiveParts });
  return summary;
}
