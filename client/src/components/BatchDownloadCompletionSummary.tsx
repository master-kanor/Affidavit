import { CheckCircle2, Download, FileArchive } from "lucide-react";
import type { BatchDownloadSummaryResult } from "@/utils/batchDownload";

type BatchDownloadCompletionSummaryProps = {
  summary: BatchDownloadSummaryResult;
};

export function formatBatchDownloadBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export default function BatchDownloadCompletionSummary({ summary }: BatchDownloadCompletionSummaryProps) {
  const parts = summary.archiveParts;
  const partResults = summary.archivePartResults ?? [];
  const failedParts = partResults.filter((part) => part.status === "failed");
  const completedParts = partResults.length > 0 ? partResults.filter((part) => part.status === "downloaded").length : parts;
  const hasFailedParts = failedParts.length > 0;
  const exportedFiles = summary.packagedFiles;
  const combinedSize = formatBatchDownloadBytes(summary.estimatedBytes);

  return (
    <section role="status" aria-live="polite" aria-labelledby="batch-download-completion-title" className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-emerald-100 p-2 text-emerald-700" aria-hidden="true">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h4 id="batch-download-completion-title" className="text-sm font-semibold text-slate-900">{hasFailedParts ? "Export partially complete" : "Export complete"}</h4>
          <p className="mt-0.5 text-xs text-slate-600">{hasFailedParts ? `${completedParts} of ${parts} ZIP part${parts === 1 ? "" : "s"} finished; ${failedParts.length} require${failedParts.length === 1 ? "s" : ""} retry.` : `All ${parts} ZIP part${parts === 1 ? "" : "s"} finished downloading.`}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Completed export totals">
        <div aria-label={`${exportedFiles} files exported`} className="rounded-lg border border-white/80 bg-white/80 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Download className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Files exported</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{exportedFiles}</p>
        </div>
        <div aria-label={`${combinedSize} total size`} className="rounded-lg border border-white/80 bg-white/80 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileArchive className="h-4 w-4 text-emerald-700" aria-hidden="true" /> Total size</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{combinedSize}</p>
        </div>
        <div aria-label={`${parts} ZIP parts downloaded`} className="rounded-lg border border-white/80 bg-white/80 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileArchive className="h-4 w-4 text-emerald-700" aria-hidden="true" /> ZIP parts</div>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{parts}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">{hasFailedParts ? "Completed parts remain available. Use the individual part retry controls below to re-attempt only the failed archives." : "The exported files remain managed gallery derivatives, and each ZIP part includes its own TRACEABILITY.json manifest."}</p>
    </section>
  );
}
