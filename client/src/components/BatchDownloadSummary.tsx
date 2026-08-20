import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Clipboard, FileArchive, Loader2, RotateCcw, X } from "lucide-react";
import { copyErrorBreakdown } from "@/utils/copyErrorBreakdown";
import type { BatchDownloadSummaryResult } from "@/utils/batchDownload";

type BatchDownloadSummaryProps = {
  summary: BatchDownloadSummaryResult;
  onDismiss: () => void;
  onRetry: () => void;
  retrying?: boolean;
  onRetryPart?: (partNumber: number) => void;
  retryingPartNumber?: number | null;
};

export default function BatchDownloadSummary({ summary, onDismiss, onRetry, retrying = false, onRetryPart, retryingPartNumber = null }: BatchDownloadSummaryProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copySucceeded, setCopySucceeded] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const handleCopyErrors = async () => {
    const result = await copyErrorBreakdown(summary.errors);
    setCopySucceeded(result.ok);
    setCopyMessage(result.message);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      setCopyMessage(null);
      setCopySucceeded(false);
    }, 3500);
  };

  return (
    <section role="region" aria-labelledby="batch-download-summary-title" className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="rounded-full bg-white p-2 text-emerald-700 shadow-sm" aria-hidden="true">
            <FileArchive className="h-4 w-4" />
          </span>
          <div>
            <h4 id="batch-download-summary-title" className="text-sm font-semibold text-slate-900">Batch ZIP download summary</h4>
            <p className="text-xs text-slate-600">The archive and TRACEABILITY.json manifest are ready.</p>
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Dismiss summary" title="Dismiss summary">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Download totals">
        <div aria-label={`${summary.totalSelected} selected`} className="rounded-lg border border-white/80 bg-white/80 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Selected</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{summary.totalSelected}</p>
        </div>
        <div aria-label={`${summary.packagedFiles} packaged`} className="rounded-lg border border-white/80 bg-white/80 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Packaged</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{summary.packagedFiles}</p>
        </div>
        <div aria-label={`${summary.unavailableFiles} unavailable`} className="rounded-lg border border-white/80 bg-white/80 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Unavailable</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-amber-700">{summary.unavailableFiles}</p>
        </div>
        <div aria-label={`${summary.failedFiles} failed`} className="rounded-lg border border-white/80 bg-white/80 p-2.5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Failed</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-red-700">{summary.failedFiles}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">{summary.traceabilityRecords} traceability record{summary.traceabilityRecords === 1 ? "" : "s"} written to TRACEABILITY.json. {summary.archiveParts} ZIP part{summary.archiveParts === 1 ? "" : "s"} generated; estimated payload {Math.round(summary.estimatedBytes / (1024 * 1024))} MB.</p>
      {(summary.archivePartResults ?? []).some((part) => part.status === "failed") && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50/80 p-3" aria-label="ZIP part retry status">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
            ZIP part download failures
          </div>
          <ul className="mt-2 space-y-2 text-xs text-red-900">
            {(summary.archivePartResults ?? []).filter((part) => part.status === "failed").map((part) => (
              <li key={`${part.partNumber}-${part.totalParts}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-red-200 bg-white/70 p-2">
                <span>ZIP part {part.partNumber} of {part.totalParts}: {part.error ?? "download failed"}</span>
                {onRetryPart && <button type="button" onClick={() => onRetryPart(part.partNumber)} disabled={retrying || retryingPartNumber !== null} className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-2.5 py-1.5 font-semibold text-red-900 transition hover:border-red-500 hover:bg-red-100 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label={`Retry ZIP part ${part.partNumber}`} aria-busy={retryingPartNumber === part.partNumber}>
                  {retryingPartNumber === part.partNumber ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                  {retryingPartNumber === part.partNumber ? "Retrying part..." : `Retry ZIP part ${part.partNumber}`}
                </button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-white/80 bg-white/70 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          {summary.errors.length > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
          {summary.errors.length > 0 ? `${summary.errors.length} file issue${summary.errors.length === 1 ? "" : "s"} recorded` : "No export errors were reported"}
        </div>
        {summary.errors.length > 0 ? (
          <>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto pl-5 text-xs text-slate-600">
            {summary.errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {summary.retryItemIds.length > 0 && <button type="button" onClick={onRetry} disabled={retrying || retryingPartNumber !== null} className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition hover:border-amber-500 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label="Retry failed downloads" aria-busy={retrying}>
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              {retrying ? "Retrying failed downloads..." : `Retry Failed Downloads (${summary.retryItemIds.length})`}
            </button>}
            <button type="button" onClick={handleCopyErrors} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label="Copy error breakdown to clipboard">
              {copySucceeded ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
              {copySucceeded ? "Copied" : "Copy error breakdown"}
            </button>
            {copyMessage && <p role="status" aria-live="polite" className={copySucceeded ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>{copyMessage}</p>}
          </div>
          </>
        ) : (
          <p className="mt-1 text-xs text-slate-600">All selected gallery assets were packaged successfully.</p>
        )}
      </div>
    </section>
  );
}
