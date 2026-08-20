import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, ExternalLink, FileImage, Link2, Plus, Save, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmbedUrl, getVideoThumbnail, type VideoProvider, type VideoSource } from "@/components/EmbeddedVideoPlayer";
import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import { loadAdminAnnotations, normalizeAnnotation, saveAdminAnnotation } from "@/utils/adminAnnotations";

export const AFFIDAVIT_DOSSIER_PDF_URL = "/manus-storage/official-affidavit-evidence-dossier-87-pages_3bf21f6a.pdf";

export type AdminMediaProvider = VideoProvider | "google-drive";

export type AdminSourcePreview =
  | { kind: "image"; item: AffidavitImageCatalogItem }
  | { kind: "media"; item: { id: string; title: string; url: string; provider: AdminMediaProvider; sourcePages: readonly number[] } };

interface AdminSourcePreviewModalProps {
  preview: AdminSourcePreview | null;
  onClose: () => void;
  onAnnotationSaved?: () => void;
}

export function getAdminMediaEmbedUrl(item: Extract<AdminSourcePreview, { kind: "media" }>["item"]): string | null {
  if (item.provider === "google-drive") return null;
  if (item.provider === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(item.url)}&show_text=false`;
  }
  return getEmbedUrl({ id: item.id, title: item.title, url: item.url, provider: item.provider } satisfies VideoSource);
}

export function getAdminImagePageUrl(item: AffidavitImageCatalogItem): string {
  return `${AFFIDAVIT_DOSSIER_PDF_URL}#page=${item.appendixPage}&view=FitH`;
}

export default function AdminSourcePreviewModal({ preview, onClose, onAnnotationSaved }: AdminSourcePreviewModalProps) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [draftNote, setDraftNote] = useState("");
  const [annotationSaved, setAnnotationSaved] = useState(false);

  useEffect(() => {
    if (!preview) return;
    setEmbedFailed(false);
    setAnnotationSaved(false);
    setTagInput("");
    if (preview.kind === "image") {
      const annotation = loadAdminAnnotations()[preview.item.id];
      setDraftTags(annotation?.tags ?? []);
      setDraftNote(annotation?.note ?? "");
    } else {
      setDraftTags([]);
      setDraftNote("");
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [preview, onClose]);

  const mediaEmbedUrl = useMemo(() => {
    if (!preview || preview.kind !== "media") return null;
    return getAdminMediaEmbedUrl(preview.item);
  }, [preview]);

  if (!preview) return null;

  const title = preview.kind === "image" ? `Evidence image ${preview.item.evidenceItem}` : preview.item.title;
  const sourcePages = preview.kind === "image" ? [`Appendix page ${preview.item.appendixPage}`, `Slot ${preview.item.slot}`] : preview.item.sourcePages.map((page) => `Source page ${page}`);
  const fallbackUrl = preview.kind === "image" ? getAdminImagePageUrl(preview.item) : preview.item.url;

  const addTag = () => {
    const normalized = normalizeAnnotation({ tags: [...draftTags, tagInput], note: draftNote });
    setDraftTags(normalized.tags);
    setTagInput("");
  };

  const removeTag = (tag: string) => setDraftTags((current) => current.filter((item) => item !== tag));

  const saveAnnotation = () => {
    if (preview.kind !== "image") return;
    const annotation = normalizeAnnotation({ tags: draftTags, note: draftNote });
    saveAdminAnnotation(preview.item.id, annotation);
    onAnnotationSaved?.();
    setDraftTags(annotation.tags);
    setDraftNote(annotation.note);
    setAnnotationSaved(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="admin-source-preview-title">
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              {preview.kind === "image" ? <FileImage className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              Admin source preview
            </div>
            <h2 id="admin-source-preview-title" className="truncate text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-slate-400">{sourcePages.join(" · ")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close source preview" className="shrink-0 text-slate-300 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-900 p-4">
          {preview.kind === "image" ? (
            <div className="space-y-4">
              <iframe src={getAdminImagePageUrl(preview.item)} title={`${title} appendix page preview`} className="h-[55vh] min-h-[360px] w-full rounded-xl border border-slate-700 bg-white" />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{preview.item.filename}</span><span aria-hidden="true">·</span><span>{preview.item.width} × {preview.item.height}</span><span aria-hidden="true">·</span><span>{preview.item.group}</span></div>
              <section className="rounded-xl border border-slate-700 bg-slate-950/70 p-4" aria-labelledby="admin-image-annotation-title">
                <div className="mb-3 flex items-center gap-2"><Tag className="h-4 w-4 text-amber-300" /><h3 id="admin-image-annotation-title" className="text-sm font-semibold">Admin tags and annotation</h3></div>
                <div className="mb-3 flex flex-wrap gap-2" aria-label="Current image tags">
                  {draftTags.map((tag) => <button key={tag} type="button" onClick={() => removeTag(tag)} className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200 hover:bg-amber-500/20" aria-label={`Remove tag ${tag}`}>{tag}<X className="h-3 w-3" /></button>)}
                  {draftTags.length === 0 && <span className="text-xs text-slate-500">No custom tags yet.</span>}
                </div>
                <div className="flex gap-2">
                  <label htmlFor="admin-image-tag-input" className="sr-only">Add image tag</label>
                  <input id="admin-image-tag-input" value={tagInput} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addTag(); } }} placeholder="Add tag and press Enter" className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                  <Button type="button" variant="outline" onClick={addTag} className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"><Plus className="mr-1 h-4 w-4" />Add</Button>
                </div>
                <label htmlFor="admin-image-note" className="mt-3 block text-xs font-medium text-slate-300">Text annotation</label>
                <textarea id="admin-image-note" value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="Add a private review note for this evidence image..." rows={3} className="mt-1 w-full resize-y rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Saved only in this admin workspace.</span><Button type="button" onClick={saveAnnotation} className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"><Save className="h-4 w-4" />Save annotation</Button></div>
                {annotationSaved && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300" role="status"><CheckCircle className="h-3.5 w-3.5" />Annotation saved.</p>}
              </section>
            </div>
          ) : mediaEmbedUrl && !embedFailed ? (
            <div className="space-y-3"><div className="aspect-video overflow-hidden rounded-xl border border-slate-700 bg-black"><iframe src={`${mediaEmbedUrl}${mediaEmbedUrl.includes("?") ? "&" : "?"}autoplay=1`} title={title} className="h-full w-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen onError={() => setEmbedFailed(true)} /></div><div className="flex flex-wrap items-center gap-2">{preview.item.provider !== "google-drive" && <img src={getVideoThumbnail({ id: preview.item.id, title, url: preview.item.url, provider: preview.item.provider })} alt="" className="h-12 w-20 rounded object-cover opacity-80" />}<span className="text-xs text-slate-400">Embedded preview. If the provider blocks framing, use the original-source link below.</span></div></div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-amber-700/50 bg-amber-950/30 p-8 text-center"><AlertCircle className="mb-3 h-10 w-10 text-amber-300" /><h3 className="text-lg font-semibold">Embedded preview unavailable</h3><p className="mt-2 max-w-lg text-sm text-slate-300">The external provider may restrict iframe playback. The original source remains available and unchanged.</p></div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-4"><div className="max-w-2xl truncate text-xs text-slate-500" title={fallbackUrl}>{fallbackUrl}</div><div className="flex items-center gap-2"><a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"><ExternalLink className="h-3.5 w-3.5" /> Open original source</a><Button variant="outline" onClick={onClose} className="border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white">Close</Button></div></footer>
      </section>
    </div>
  );
}
