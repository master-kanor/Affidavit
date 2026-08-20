import { Loader2, PackageCheck, Pause, Play, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type BatchDownloadProgressProps = {
  active: boolean;
  percent: number;
  text: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  paused?: boolean;
  partNumber?: number;
  totalParts?: number;
};

export default function BatchDownloadProgress({
  active,
  percent,
  text,
  onCancel,
  onPause,
  onResume,
  paused = false,
  partNumber,
  totalParts,
}: BatchDownloadProgressProps) {
  if (!active) return null;

  const clampedPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const canPause = Boolean(onPause && !paused);
  const canResume = Boolean(onResume && paused);

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="rounded-full bg-amber-100 p-2 text-amber-700" aria-hidden="true">
            {paused ? <Pause className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Preparing gallery ZIP download</p>
            <p className="truncate text-xs text-slate-600">{text || "Preparing source-linked gallery assets…"}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {partNumber && totalParts && <span className="rounded-md bg-orange-100 px-2 py-1 text-xs font-semibold tabular-nums text-orange-800" aria-label={`ZIP part ${partNumber} of ${totalParts}`}>ZIP part {partNumber} of {totalParts}</span>}
          <span className="text-sm font-bold tabular-nums text-amber-800">{clampedPercent}%</span>
          {canPause && <button type="button" onClick={onPause} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500" aria-label="Pause download">
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            Pause Download
          </button>}
          {canResume && <button type="button" onClick={onResume} className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Resume download">
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Resume Download
          </button>}
          {onCancel && <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" aria-label="Cancel download">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel Download
          </button>}
        </div>
      </div>
      <Progress
        value={clampedPercent}
        aria-label="Batch gallery ZIP download progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedPercent}
        className="mt-3 h-2.5 bg-amber-100 [&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-amber-500 [&_[data-slot=progress-indicator]]:to-orange-500"
      />
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        {clampedPercent >= 100 ? <PackageCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : paused ? <Pause className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /> : <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />}
        {clampedPercent >= 100 ? "ZIP package ready." : paused ? "Paused. Resume when you are ready to continue." : "Keep this workspace open while the archive is generated."}
      </p>
    </div>
  );
}
