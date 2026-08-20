import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock3, ExternalLink, History, RotateCcw, Search, ShieldCheck, Sparkles, Undo2, X } from "lucide-react";
import { sourceEvidenceManifest } from "@/data/affidavitManifest";
import { checkIsAdmin, checkIsOwner } from "@/lib/authConfig";
import { supabase } from "@/lib/supabaseClient";
import {
  appendDraftInsight,
  canManageDraft,
  filterHistoryInsights,
  loadDraftInsights,
  loadUndoneInsights,
  restoreUndoneInsight,
  saveDraftInsights,
  saveUndoneInsights,
  undoDraftInsight,
  type DraftCitation,
  type DraftInsight,
  type DraftRole,
  type UndoneInsight,
} from "@/adminDraft";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: DraftCitation[];
  timestamp: Date;
  savedInsightId?: string;
}

type ToastState =
  | { tone: "success" | "info" | "error"; message: string; insightId?: string }
  | null;

const citationForDrive: DraftCitation = {
  id: "source-page-21",
  label: "Source evidence folder, page 21",
  page: 21,
  source: sourceEvidenceManifest.sourceLabel,
  url: sourceEvidenceManifest.evidenceLinks[0]?.url,
};

const citationForVideo: DraftCitation = {
  id: "source-page-24",
  label: "YouTube evidence reference, page 24",
  page: 24,
  source: sourceEvidenceManifest.sourceLabel,
  url: sourceEvidenceManifest.evidenceLinks.find((item) => item.provider === "youtube")?.url,
};

const citationForDossier: DraftCitation = {
  id: "final-dossier-87-pages",
  label: "Final 87-page dossier, source-linked appendix",
  page: 87,
  source: "Official affidavit evidence dossier",
  url: "/dossier",
};

function getGroundedResponse(query: string): { content: string; citations: DraftCitation[] } {
  const normalized = query.toLowerCase();
  if (normalized.includes("video") || normalized.includes("youtube") || normalized.includes("facebook")) {
    return {
      content: "The indexed evidence affidavit contains source-linked video references on pages 24–26. The gallery keeps each external video traceable to its source-page reference and opens it in a read-only media view. This is a source traceability summary, not a legal conclusion.",
      citations: [citationForVideo, citationForDossier],
    };
  }
  if (normalized.includes("drive") || normalized.includes("document") || normalized.includes("file") || normalized.includes("evidence")) {
    return {
      content: "The evidence index records a Google Drive source folder on page 21 and maps the supplied media references into the final dossier appendix. The official affidavit text remains separate and unchanged; evidence is presented as traceable supporting material.",
      citations: [citationForDrive, citationForDossier],
    };
  }
  return {
    content: "The current source manifest identifies 12 official source pages, 26 pages in the supplied evidence-affidavit export, 393 unique source images, and an 87-page final dossier structure. Answers are limited to these indexed references and should be reviewed against the original source before any formal use.",
    citations: [citationForDossier, citationForDrive],
  };
}

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function getInitialRole(): DraftRole {
  return "admin";
}

export default function MasterKanorChatAgent() {
  const [role, setRole] = useState<DraftRole | null>(getInitialRole());
  const [authorEmail, setAuthorEmail] = useState("admin@masterkanorcase.online");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I can answer from the indexed affidavit and evidence manifest. I will include source-page citations and clearly distinguish traceability summaries from legal conclusions.",
      citations: [citationForDossier],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draftInsights, setDraftInsights] = useState<DraftInsight[]>(() => loadDraftInsights());
  const [historyInsights, setHistoryInsights] = useState<UndoneInsight[]>(() => loadUndoneInsights());
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const email = data.user?.email ?? "admin@masterkanorcase.online";
      setAuthorEmail(email);
      setRole(checkIsOwner(email) ? "owner" : checkIsAdmin(email) ? "admin" : null);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const filteredHistory = useMemo(
    () => filterHistoryInsights(historyInsights, historyQuery, historyFrom, historyTo),
    [historyInsights, historyQuery, historyFrom, historyTo],
  );

  const refreshDraftState = () => {
    setDraftInsights(loadDraftInsights());
    setHistoryInsights(loadUndoneInsights());
  };

  const saveMessageToDraft = (message: Message) => {
    if (!canManageDraft(role)) {
      setToast({ tone: "error", message: "Only the owner or an administrator can save AI insights to the working draft." });
      return;
    }
    const result = appendDraftInsight({ content: message.content, citations: message.citations, authorEmail });
    refreshDraftState();
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, savedInsightId: result.insight.id } : item));
    setToast({
      tone: result.duplicate ? "info" : "success",
      message: result.duplicate ? "This insight is already in the working draft." : "AI insight saved to the editable draft.",
      insightId: result.insight.id,
    });
  };

  const undoSavedInsight = (id?: string) => {
    if (!id) return;
    const result = undoDraftInsight(id);
    refreshDraftState();
    if (result.removed) {
      setMessages((current) => current.map((item) => item.savedInsightId === id ? { ...item, savedInsightId: undefined } : item));
      setToast({ tone: "success", message: "The draft save was undone and added to history.", insightId: undefined });
    } else {
      setToast({ tone: result.alreadyUndone ? "info" : "error", message: result.alreadyUndone ? "That draft save was already undone." : "The draft insight could not be found." });
    }
  };

  const restoreInsight = (id: string) => {
    if (!canManageDraft(role)) {
      setToast({ tone: "error", message: "Only the owner or an administrator can restore draft insights." });
      return;
    }
    const result = restoreUndoneInsight(id);
    refreshDraftState();
    setToast({
      tone: result.duplicate ? "info" : result.restored ? "success" : "error",
      message: result.duplicate ? "That insight is already present in the working draft." : result.restored ? "The insight was restored to the editable draft." : "The history entry is no longer available.",
    });
  };

  const handleSendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;
    const userMessage: Message = { id: `${Date.now()}-user`, role: "user", content: question, citations: [], timestamp: new Date() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const response = getGroundedResponse(question);
    setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: "assistant", ...response, timestamp: new Date() }]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" /><span><strong>Grounded workspace:</strong> responses use the read-only source manifest and do not edit the official affidavit.</span></div>
        <span className="font-medium">{role === "owner" ? "Owner" : role === "admin" ? "Administrator" : "Read-only"}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white" aria-label="AI evidence assistant">
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl rounded-xl px-4 py-3 ${message.role === "user" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    {message.citations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200/70 pt-2">
                        {message.citations.map((citation) => (
                          <button
                            type="button"
                            key={citation.id}
                            onClick={() => citation.url && window.open(citation.url, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 text-left text-xs font-medium text-slate-700 transition hover:border-amber-500 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            {citation.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.role === "assistant" && message.id !== "welcome" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => saveMessageToDraft(message)} disabled={!canManageDraft(role)}>
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          {message.savedInsightId ? "Saved to Draft" : "Save to Draft"}
                        </Button>
                        {message.savedInsightId && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Working draft</span>}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] opacity-60">{formatDate(message.timestamp)}</p>
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex items-center gap-2 text-sm text-slate-500" role="status"><Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />Preparing a grounded response...</div>}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-3 text-xs sm:grid-cols-4">
            <div><p className="text-slate-500">Source pages</p><p className="font-semibold text-slate-800">{sourceEvidenceManifest.officialSourcePageCount}</p></div>
            <div><p className="text-slate-500">Evidence export</p><p className="font-semibold text-slate-800">{sourceEvidenceManifest.unofficialSourcePageCount} pages</p></div>
            <div><p className="text-slate-500">Source images</p><p className="font-semibold text-slate-800">{sourceEvidenceManifest.uniqueSourceImageCount}</p></div>
            <div><p className="text-slate-500">Draft insights</p><p className="font-semibold text-slate-800">{draftInsights.length}</p></div>
          </div>

          <div className="flex gap-2 border-t border-slate-200 bg-white p-4">
            <Input
              aria-label="Ask about the case evidence"
              placeholder="Ask about the case evidence..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void handleSendMessage(); }}
              disabled={isLoading}
            />
            <Button type="button" onClick={() => void handleSendMessage()} disabled={isLoading || !input.trim()}>Send</Button>
          </div>
        </section>

        <aside className="space-y-4" aria-label="Draft workspace and history">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-semibold text-slate-900">Editable Draft Workspace</h3><p className="mt-1 text-xs text-slate-500">Owner/admin working copy. The official affidavit stays read-only.</p></div>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">{draftInsights.length}</span>
            </div>
            <div className="mt-3 max-h-52 space-y-2 overflow-auto">
              {draftInsights.length === 0 && <p className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">Save a grounded AI response to begin a working draft.</p>}
              {draftInsights.map((insight) => (
                <article key={insight.id} className="rounded-md border border-slate-200 p-3">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-700">{insight.content}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(insight.createdAt)} · {insight.citations.length} citation(s)</p>
                  <Button type="button" size="sm" variant="ghost" className="mt-1 h-7 px-2 text-xs" onClick={() => undoSavedInsight(insight.id)}><Undo2 className="mr-1 h-3 w-3" aria-hidden="true" />Undo save</Button>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-semibold text-slate-900"><History className="h-4 w-4" aria-hidden="true" />Undone Insight History</h3><p className="mt-1 text-xs text-slate-500">Review and restore previously undone draft insights.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{filteredHistory.length}/{historyInsights.length}</span></div>
            <div className="mt-3 space-y-2">
              <label className="relative block"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" /><Input aria-label="Search undone insights" className="pl-8" placeholder="Search content, citation, author..." value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} /></label>
              <div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-500">From<input aria-label="History date from" type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700" /></label><label className="text-[11px] text-slate-500">To<input aria-label="History date to" type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700" /></label></div>
              {(historyQuery || historyFrom || historyTo) && <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setHistoryQuery(""); setHistoryFrom(""); setHistoryTo(""); }}><X className="mr-1 h-3 w-3" aria-hidden="true" />Clear filters</Button>}
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-auto">
              {filteredHistory.length === 0 && <p className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">No undone insights match the current filters.</p>}
              {filteredHistory.map((insight) => (
                <article key={insight.id} className="rounded-md border border-slate-200 p-3">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-700">{insight.content}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400"><Clock3 className="h-3 w-3" aria-hidden="true" />Undone {formatDate(insight.undoneAt)}</p>
                  <Button type="button" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => restoreInsight(insight.id)} disabled={!canManageDraft(role)}><RotateCcw className="mr-1 h-3 w-3" aria-hidden="true" />Restore</Button>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {toast && <div role={toast.tone === "error" ? "alert" : "status"} aria-live="polite" className={`fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl ${toast.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : toast.tone === "info" ? "border-sky-200 bg-sky-50 text-sky-900" : "border-red-200 bg-red-50 text-red-900"}`}>
        <span className="flex-1">{toast.message}</span>
        {toast.insightId && <Button type="button" size="sm" variant="outline" className="h-7 shrink-0" onClick={() => undoSavedInsight(toast.insightId)}><Undo2 className="mr-1 h-3 w-3" aria-hidden="true" />Undo</Button>}
        <button type="button" aria-label="Dismiss notification" className="rounded p-1 hover:bg-black/5" onClick={() => setToast(null)}><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>}
    </div>
  );
}
