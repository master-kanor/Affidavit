import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Archive,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Film,
  FolderOpen,
  ImagePlus,
  Info,
  LayoutGrid,
  Link2,
  LockKeyhole,
  Play,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  CaseWorkspaceProvider,
  useCaseWorkspace,
  useCaseWorkspaceQuery,
  type CaseSection,
} from "@/lib/caseWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const videoEvidence = [
  {
    id: "L0q0je4gJHM",
    title: "Evidence Video 1 — Case Documentation",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "p42RaLTwRDs",
    title: "Evidence Video 2 — Victim Testimony",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "Ya2hhWPtlr4",
    title: "Evidence Video 3 — IT Shadow Exposure",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "jeQij7T9Xo8",
    title: "Evidence Video 4 — Device Surveillance",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "rAu7u4u9eXs",
    title: "Evidence Video 5 — Identity Theft",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "jWjuNViS93o",
    title: "Evidence Video 6 — Psychological Torture",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "oD2uuXxt9DQ",
    title: "Evidence Video 7 — Call for Justice",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "1aQsyIbvawA",
    title: "Evidence Video 8 — Legal Filings",
    sub: "Charles Tanauan · Cybercrime Case",
  },
  {
    id: "7pLaNUJD0Tk",
    title: "Evidence Video 9 — Case Continuation",
    sub: "Charles Tanauan · Cybercrime Case",
  },
] as const;

type Mode = "text" | "evidence" | "documentary";
type Section = CaseSection;
type LocalUpload = { url: string; name: string };
type MappingStatus = "suggested" | "accepted" | "rejected";

function pluralSuffix(count: number) {
  return count === 1 ? "" : "s";
}

function ProvenanceBadge({ children = "SOURCE TEXT" }: { children?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d2d9] bg-[#f6f7f8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#48545d]">
      <ShieldCheck className="h-3 w-3" />
      {children}
    </span>
  );
}

function Header({
  mode,
  setMode,
  manager,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  manager: boolean;
}) {
  const [, setLocation] = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-[#d6dde2] bg-[#f3f5f6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <button
          className="flex items-center gap-3 text-left"
          onClick={() => setLocation("/")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#21313a] text-[#f4efe7] shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.2em] text-[#21313a]">
              MASTER KANOR
            </div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#64717a]">
              Case knowledge system
            </div>
          </div>
        </button>
        <nav className="hidden items-center gap-1 rounded-xl border border-[#d6dde2] bg-white p-1 md:flex">
          {(["text", "evidence", "documentary"] as Mode[]).map(item => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${mode === item ? "bg-[#21313a] text-white" : "text-[#61707a] hover:bg-[#edf0f2]"}`}
            >
              {item === "text"
                ? "Official text"
                : item === "evidence"
                  ? "With evidence"
                  : "Documentary"}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs text-[#5d6b74]">
          {manager ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#e6efe8] px-3 py-1.5 font-semibold text-[#356044] sm:flex">
              <LockKeyhole className="h-3.5 w-3.5" /> Owner/Admin edit mode
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full bg-[#edf0f2] px-3 py-1.5 font-semibold sm:flex">
              <UserRound className="h-3.5 w-3.5" /> Guest review
            </span>
          )}
          <span className="rounded-full bg-[#e6efe8] px-2.5 py-1.5 font-semibold text-[#356044] md:hidden">
            Private
          </span>
        </div>
      </div>
      <nav
        className="mx-5 mb-4 grid grid-cols-3 gap-1 rounded-xl border border-[#d6dde2] bg-white p-1 md:hidden"
        aria-label="Case views"
      >
        {(["text", "evidence", "documentary"] as Mode[]).map(item => (
          <button
            key={item}
            onClick={() => setMode(item)}
            className={`min-h-11 rounded-lg px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${mode === item ? "bg-[#21313a] text-white" : "text-[#61707a]"}`}
          >
            {item === "text"
              ? "Official"
              : item === "evidence"
                ? "Evidence"
                : "Documentary"}
          </button>
        ))}
      </nav>
    </header>
  );
}

function SourceText({
  section,
  compact = false,
}: {
  section: Section;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap items-center gap-2">
        <ProvenanceBadge>{section.badge || "SOURCE TEXT"}</ProvenanceBadge>
        {section.sourceLabel && (
          <span className="text-xs text-[#78848b]">{section.sourceLabel}</span>
        )}
      </div>
      <div className="space-y-3 text-[15px] leading-8 text-[#26343d]">
        {section.sourceText.map((paragraph, index) => (
          <p key={`${section.id}-paragraph-${index}`}>
            <span className="mr-2 text-xs font-bold tracking-[0.16em] text-[#9a6b32]">
              {paragraph.number || ""}
            </span>
            {paragraph.text}
          </p>
        ))}
        {section.sourceText.length === 0 && (
          <p className="italic text-[#7a858c]">
            No affidavit paragraphs are present in this source block; the block
            is retained as a reference or signature/media section.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeading({
  section,
  expanded,
  onToggle,
}: {
  section: Section;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 border-b border-[#dfe4e7] px-5 py-5 text-left lg:px-8"
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="mt-0.5 flex h-9 min-w-9 items-center justify-center rounded-full bg-[#21313a] px-2 text-xs font-bold text-white">
          {section.number.replace("§ ", "") || "—"}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a6b32]">
            {section.sourceLabel || "Case resource"}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-[#21313a]">
            {section.title}
          </h2>
        </div>
      </div>
      {expanded ? (
        <ChevronUp className="h-5 w-5 flex-none text-[#74818a]" />
      ) : (
        <ChevronDown className="h-5 w-5 flex-none text-[#74818a]" />
      )}
    </button>
  );
}

function EvidenceCard({
  item,
  upload,
  manager,
  mappingStatus,
  onAcceptMapping,
  onUpload,
}: {
  item: {
    id: string;
    title: string;
    icon: string;
    type: string;
    verificationState: string;
    source: string;
  };
  upload?: LocalUpload;
  manager: boolean;
  mappingStatus: MappingStatus;
  onAcceptMapping: () => void;
  onUpload: (id: string, file: File) => void;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-[#d7dfe3] bg-[#fafbfb] shadow-[0_8px_24px_rgba(30,44,52,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,44,52,0.1)]">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e9edef]">
        {upload ? (
          <img
            src={upload.url}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center text-[#6d7a82]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {item.icon}
            </div>
            <span className="px-4 text-xs font-semibold uppercase tracking-[0.12em]">
              Preview pending upload
            </span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5b6971]">
            {item.verificationState.replaceAll("_", " ")}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold text-[#26343d]">{item.title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#78848b]">
            Evidence ID: {item.id}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b6952]">
            <Link2 className="h-3.5 w-3.5" />{" "}
            {mappingStatus === "accepted"
              ? "Approved mapping"
              : mappingStatus === "rejected"
                ? "Rejected mapping"
                : "Suggested mapping"}
          </span>
          {manager && mappingStatus === "suggested" && (
            <button
              type="button"
              onClick={onAcceptMapping}
              className="rounded-lg bg-[#e6efe8] px-2.5 py-1.5 text-xs font-semibold text-[#356044] hover:bg-[#d8e8dc]"
            >
              Accept
            </button>
          )}
          {manager && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#cfd8dd] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#41515a] hover:bg-[#f1f3f4]">
              <Upload className="h-3.5 w-3.5" /> Upload
              <input
                type="file"
                accept="image/*,.pdf,.mp4,.mov"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(item.id, file);
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceGalleryBlock({
  section,
  uploads,
  manager,
  mappingStatus,
  onAcceptMapping,
  onUpload,
}: {
  section: Section;
  uploads: Record<string, LocalUpload>;
  manager: boolean;
  mappingStatus: Record<string, MappingStatus>;
  onAcceptMapping: (id: string) => void;
  onUpload: (id: string, file: File) => void;
}) {
  return (
    <div className="space-y-5">
      {section.galleries.map(gallery => (
        <div
          key={gallery.id}
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (file) onUpload(`${gallery.id}-${Date.now()}`, file);
          }}
          className="rounded-2xl border border-[#d9e0e4] bg-[#f7f8f8] p-4 lg:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#9a6b32]">
                <LayoutGrid className="h-4 w-4" /> Related evidence gallery
              </div>
              <h3 className="mt-1 text-base font-semibold text-[#2b3a43]">
                {gallery.title}
              </h3>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#67757d]">
              {gallery.items.length} mapped item
              {pluralSuffix(gallery.items.length)}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gallery.items.map(item => (
              <EvidenceCard
                key={item.id}
                item={item}
                upload={uploads[item.id]}
                manager={manager}
                mappingStatus={mappingStatus[item.id] ?? "suggested"}
                onAcceptMapping={() => onAcceptMapping(item.id)}
                onUpload={onUpload}
              />
            ))}
          </div>
          {manager && (
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c7d1d6] bg-white px-4 py-4 text-sm font-semibold text-[#56656e] hover:bg-[#f1f3f4]">
              <ImagePlus className="h-4 w-4" /> Add evidence image or document
              <input
                type="file"
                accept="image/*,.pdf,.mp4,.mov"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(`${gallery.id}-${Date.now()}`, file);
                }}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

function VideoGallery() {
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {videoEvidence.map(video => (
        <article
          key={video.id}
          className="overflow-hidden rounded-2xl border border-[#d7dfe3] bg-[#fafbfb]"
        >
          <button
            className="relative block aspect-video w-full overflow-hidden bg-[#17252d]"
            onClick={() => setPlaying(playing === video.id ? null : video.id)}
            aria-label={`Play ${video.title}`}
          >
            {playing === video.id ? (
              <iframe
                title={video.title}
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <>
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                  loading="lazy"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#21313a] shadow-lg">
                    <Play className="ml-1 h-6 w-6 fill-current" />
                  </span>
                </span>
              </>
            )}
          </button>
          <div className="space-y-2 p-4">
            <h3 className="font-semibold text-[#26343d]">{video.title}</h3>
            <p className="text-xs text-[#78848b]">{video.sub}</p>
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9a6b32] hover:underline"
            >
              Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

function TextOnlyView() {
  const canonicalCase = useCaseWorkspace();
  return (
    <div className="mx-auto max-w-[980px] space-y-5">
      <div className="rounded-2xl border border-[#d4dde1] bg-[#fffdfa] p-6 shadow-[0_12px_40px_rgba(30,44,52,0.07)] lg:p-10">
        <div className="mb-8 border-b border-[#dfe4e7] pb-8">
          <ProvenanceBadge>OFFICIAL TEXT ONLY</ProvenanceBadge>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-[#21313a]">
            AFFIDAVIT OF EVIDENCE
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.14em] text-[#78848b]">
            {canonicalCase.case.affiant} · Source-preserving view
          </p>
          <div className="mt-5 flex gap-3 rounded-xl border border-[#eadfce] bg-[#fbf6ee] p-4 text-sm leading-6 text-[#66553f]">
            <Info className="mt-0.5 h-4 w-4 flex-none" />
            <p>
              Only approved/source affidavit text appears here. Evidence
              galleries, inferred relationships, and AI suggestions are
              intentionally excluded from this canonical text-only view.
            </p>
          </div>
        </div>
        {canonicalCase.sections.map(section => (
          <section
            key={section.id}
            className="border-b border-[#e5e9eb] py-8 last:border-b-0"
          >
            <div className="mb-5 flex items-start gap-4">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#9a6b32]">
                {section.number || "REFERENCE"}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#21313a]">
                  {section.title}
                </h2>
                <p className="mt-1 text-xs text-[#7b878e]">
                  {section.sourceLabel}
                </p>
              </div>
            </div>
            <SourceText section={section} compact />
          </section>
        ))}
      </div>
    </div>
  );
}

function EvidenceView({
  uploads,
  manager,
  mappingStatus,
  onAcceptMapping,
  onUpload,
}: {
  uploads: Record<string, LocalUpload>;
  manager: boolean;
  mappingStatus: Record<string, MappingStatus>;
  onAcceptMapping: (id: string) => void;
  onUpload: (id: string, file: File) => void;
}) {
  const canonicalCase = useCaseWorkspace();
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([canonicalCase.sections[0]?.id ?? ""])
  );
  const [query, setQuery] = useState("");
  const visibleSections = useMemo(
    () =>
      canonicalCase.sections.filter(section =>
        `${section.title} ${section.sourceLabel}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query]
  );
  const toggle = (id: string) =>
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d4dde1] bg-[#fffdfa] p-6 shadow-[0_12px_40px_rgba(30,44,52,0.07)] lg:flex-row lg:items-end lg:p-8">
        <div>
          <ProvenanceBadge>WITH EVIDENCE</ProvenanceBadge>
          <h1 className="mt-4 font-serif text-4xl font-semibold text-[#21313a]">
            Affidavit with Evidence
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66747c]">
            Each approved/source text block is immediately followed by its
            mapped gallery, supporting links, and review metadata. No
            relationship is treated as verified automatically.
          </p>
        </div>
        <label className="flex min-w-[240px] items-center gap-2 rounded-xl border border-[#cfd8dd] bg-white px-3 py-2.5 text-sm text-[#63717a]">
          <Search className="h-4 w-4" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Filter sections"
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>
      {visibleSections.map(section => (
        <article
          key={section.id}
          className="overflow-hidden rounded-2xl border border-[#d4dde1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(30,44,52,0.05)]"
        >
          <SectionHeading
            section={section}
            expanded={expanded.has(section.id)}
            onToggle={() => toggle(section.id)}
          />
          {expanded.has(section.id) && (
            <div className="space-y-8 p-5 lg:p-8">
              <SourceText section={section} />
              <EvidenceGalleryBlock
                section={section}
                uploads={uploads}
                manager={manager}
                mappingStatus={mappingStatus}
                onAcceptMapping={onAcceptMapping}
                onUpload={onUpload}
              />
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-[#e1e6e8] bg-[#f7f8f8] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b6952]">
                    Related testimony
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#4c5a62]">
                    The source testimony above is the authoritative text for
                    this section. Separate testimony records remain available
                    for approved mapping.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6e8] bg-[#f7f8f8] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b6952]">
                    Timeline
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#4c5a62]">
                    Timeline relationship: needs review unless an approved event
                    is linked in the case database.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e1e6e8] bg-[#f7f8f8] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7b6952]">
                    Source references
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#4c5a62]">
                    {section.sourceLabel || "Supplied case source"}
                  </p>
                  {section.links.map(link => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block truncate text-xs font-semibold text-[#9a6b32] hover:underline"
                    >
                      {link.url}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>
      ))}
      {visibleSections.some(section => section.id === "s-video") && (
        <section className="rounded-2xl border border-[#d4dde1] bg-[#fffdfa] p-5 shadow-[0_10px_32px_rgba(30,44,52,0.05)] lg:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <ProvenanceBadge>EXTERNAL VIDEO REFERENCES</ProvenanceBadge>
              <h2 className="mt-3 text-2xl font-semibold text-[#21313a]">
                Video Evidence Gallery — YouTube Call for Justice
              </h2>
            </div>
            <span className="rounded-full bg-[#edf0f2] px-3 py-1 text-xs font-semibold text-[#65737b]">
              {videoEvidence.length} videos
            </span>
          </div>
          <VideoGallery />
        </section>
      )}
    </div>
  );
}

function DocumentaryView() {
  const canonicalCase = useCaseWorkspace();
  const chapters = [
    {
      title: "Chapter 1 — Background and identity",
      sections: canonicalCase.sections.slice(0, 3),
      note: "Suggested editorial grouping from the supplied section sequence.",
    },
    {
      title: "Chapter 2 — Technology, events, and alleged harm",
      sections: canonicalCase.sections.slice(3, 12),
      note: "Suggested grouping; Owner/Admin approval is required before use in a documentary.",
    },
    {
      title: "Chapter 3 — Complaints, case status, and public awareness",
      sections: canonicalCase.sections.slice(12),
      note: "Includes the supplied complaint, video, storage, and signature reference blocks.",
    },
  ];
  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="rounded-2xl border border-[#d4dde1] bg-[#fffdfa] p-6 shadow-[0_12px_40px_rgba(30,44,52,0.07)] lg:p-8">
        <ProvenanceBadge>DOCUMENTARY WORKSPACE</ProvenanceBadge>
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl font-semibold text-[#21313a]">
              Video Documentation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#66747c]">
              A traceable editorial workspace driven by canonical sections and
              approved evidence references. Narration and ordering below are
              proposals, not legal findings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Open workspace
            </Button>
            <Button className="gap-2 bg-[#21313a] hover:bg-[#344a56]">
              <Film className="h-4 w-4" /> Review export
            </Button>
          </div>
        </div>
      </div>
      {chapters.map((chapter, index) => (
        <Card
          key={chapter.title}
          className="overflow-hidden border-[#d4dde1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(30,44,52,0.05)]"
        >
          <div className="flex items-start gap-4 border-b border-[#e2e7e9] p-5 lg:p-7">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#eadcc8] text-sm font-bold text-[#76552e]">
              0{index + 1}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#21313a]">
                {chapter.title}
              </h2>
              <p className="mt-1 text-sm text-[#78848b]">{chapter.note}</p>
            </div>
            <span className="ml-auto hidden rounded-full bg-[#fbf3e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6537] sm:block">
              AI suggestion · needs approval
            </span>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3 lg:p-7">
            {chapter.sections.map(section => (
              <div
                key={section.id}
                className="rounded-xl border border-[#dfe5e7] bg-[#f7f8f8] p-4"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a6b32]">
                  {section.number || "Reference"}
                </div>
                <h3 className="mt-1 font-semibold text-[#2d3d46]">
                  {section.title}
                </h3>
                <div className="mt-3 flex items-center gap-3 text-xs text-[#6f7d84]">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />{" "}
                    {section.sourceText.length} text blocks
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileImage className="h-3.5 w-3.5" />{" "}
                    {section.galleries.reduce(
                      (sum, gallery) => sum + gallery.items.length,
                      0
                    )}{" "}
                    evidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ExportTools({
  manager,
  uploads,
}: {
  manager: boolean;
  uploads: Record<string, LocalUpload>;
}) {
  const canonicalCase = useCaseWorkspace();
  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  if (!canonicalCase.access.canExport) return null;
  return (
    <div className="rounded-2xl border border-[#d4dde1] bg-[#eef2f3] p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#21313a]">
            <Archive className="h-4 w-4" /> Controlled exports
          </div>
          <p className="mt-1 text-xs leading-5 text-[#6b7880]">
            Exports are generated from the canonical source snapshot. Evidence
            uploads remain local to this review session until persisted through
            an approved storage workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!manager}
            className="gap-2 bg-white"
            onClick={() =>
              download(
                "master-kanor-canonical-case.json",
                JSON.stringify(
                  { ...canonicalCase, localUploads: Object.keys(uploads) },
                  null,
                  2
                ),
                "application/json"
              )
            }
          >
            <Download className="h-4 w-4" /> JSON index
          </Button>
          <Button
            variant="outline"
            className="gap-2 bg-white"
            onClick={() => {
              const text = canonicalCase.sections
                .map(
                  section =>
                    `${section.number} ${section.title}

${section.sourceText.map(p => p.text).join("

")}`
                )
                .join("

---

");
              download("official-affidavit-text-only.txt", text, "text/plain");
            }}
          >
            <FileText className="h-4 w-4" /> Text-only
          </Button>
        </div>
      </div>
    </div>
  );
}

function CaseReviewContent() {
  const canonicalCase = useCaseWorkspace();
  useAuth();
  const { isOwner, isAdmin } = useAuthorization();
  const manager = isOwner || isAdmin;
  const [location] = useLocation();
  const initialMode: Mode =
    location === "/official"
      ? "text"
      : location === "/documentary"
        ? "documentary"
        : "evidence";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [uploads, setUploads] = useState<Record<string, LocalUpload>>({});
  const [mappingStatus, setMappingStatus] = useState<
    Record<string, MappingStatus>
  >({});
  const handleUpload = (id: string, file: File) =>
    setUploads(current => ({
      ...current,
      [id]: { url: URL.createObjectURL(file), name: file.name },
    }));
  const handleAcceptMapping = (id: string) =>
    setMappingStatus(current => ({ ...current, [id]: "accepted" }));
  return (
    <div className="min-h-screen bg-[#f3f5f6] text-[#21313a]">
      <Header mode={mode} setMode={setMode} manager={manager} />
      <main>
        <section className="relative overflow-hidden border-b border-[#d6dde2] bg-[#21313a] text-white">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 0%, rgba(255,255,255,.14) 45%, transparent 46%), linear-gradient(180deg, rgba(255,255,255,.12) 1px, transparent 1px)",
              backgroundSize: "100% 100%, 100% 18px",
            }}
          />
          <div className="relative mx-auto max-w-[1480px] px-5 py-16 lg:px-8 lg:py-20">
            <div className="max-w-4xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e8cfa9]">
                  Official case presentation
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#c3ced2]">
                  <CheckCircle2 className="h-4 w-4" /> Source text preserved
                </span>
              </div>
              <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
                {canonicalCase.case.title}
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-[#c8d1d5] md:text-base">
                {canonicalCase.case.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setMode("evidence")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e5c18f] px-5 py-3 text-sm font-bold text-[#21313a] transition hover:bg-[#efd2aa]"
                >
                  Review affidavit with evidence{" "}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMode("text")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <FileText className="h-4 w-4" /> Open official text only
                </button>
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-[1480px] px-5 py-8 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6b32]">
                {mode === "text"
                  ? "Canonical text"
                  : mode === "evidence"
                    ? "Section-aligned review"
                    : "Editorial planning"}
              </div>
              <p className="mt-1 text-sm text-[#74818a]">
                {manager
                  ? "Owner/Admin controls are available for local mapping and upload review."
                  : "Read-only guest review. Only authorized material should be exposed in production."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMode("text")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "text" ? "bg-[#21313a] text-white" : "bg-white text-[#586872]"}`}
              >
                Text only
              </button>
              <button
                onClick={() => setMode("evidence")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "evidence" ? "bg-[#21313a] text-white" : "bg-white text-[#586872]"}`}
              >
                With evidence
              </button>
              <button
                onClick={() => setMode("documentary")}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${mode === "documentary" ? "bg-[#21313a] text-white" : "bg-white text-[#586872]"}`}
              >
                Documentary
              </button>
            </div>
          </div>
          {mode === "text" ? (
            <TextOnlyView />
          ) : mode === "evidence" ? (
            <EvidenceView
              uploads={uploads}
              manager={manager}
              mappingStatus={mappingStatus}
              onAcceptMapping={handleAcceptMapping}
              onUpload={handleUpload}
            />
          ) : (
            <DocumentaryView />
          )}
          <div className="mx-auto mt-8 max-w-[1180px]">
            <ExportTools manager={manager} uploads={uploads} />
          </div>
        </div>
      </main>
      <footer className="border-t border-[#d6dde2] bg-[#e9edef] px-5 py-8 text-center text-xs leading-6 text-[#6f7d84]">
        <p>{canonicalCase.case.sourceIntegrityNote}</p>
        <p className="mt-2">
          AI suggestions and relationship mappings require Owner/Admin review;
          they are not legal conclusions.
        </p>
      </footer>
    </div>
  );
}

export default function CaseReview() {
  const { data, isLoading, error } = useCaseWorkspaceQuery("master-kanor-case");
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] text-sm text-[#66747c]">
        Loading authorized case workspace…
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5f6] px-6">
        <div className="max-w-md border border-[#d4dde1] bg-[#fffdfa] p-8 text-center">
          <h1 className="font-serif text-3xl font-semibold text-[#21313a]">
            Workspace unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#66747c]">
            {error ?? "The authorized case workspace could not be loaded."}
          </p>
        </div>
      </div>
    );
  return (
    <CaseWorkspaceProvider value={data}>
      <CaseReviewContent />
    </CaseWorkspaceProvider>
  );
}
