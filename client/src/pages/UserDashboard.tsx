import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { PortalShell, type PortalSection } from "@/components/PortalShell";
import { Button } from "@/components/ui/button";
import { useAuthorization } from "@/hooks/useAuthorization";
import { supabase } from "@/lib/supabaseClient";

type Publication = {
  id: string;
  title: string;
  summary: string;
  resource_type: string;
  resource_url: string | null;
  published_at: string;
  acknowledged_at: string | null;
};

export default function UserDashboard() {
  const [section, setSection] = useState<PortalSection>("overview");
  const [publications, setPublications] = useState<Publication[]>([]);
  const [, setLocation] = useLocation();
  const { profile, permissions, can } = useAuthorization();
  useEffect(() => {
    void supabase
      .from("portal_publications")
      .select(
        "id,title,summary,resource_type,resource_url,published_at,acknowledged_at"
      )
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => setPublications((data ?? []) as Publication[]));
  }, []);
  const acknowledge = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase.rpc("acknowledge_portal_publication", {
      target_publication_id: id,
    });
    if (!error)
      setPublications(rows =>
        rows.map(row =>
          row.id === id ? { ...row, acknowledged_at: now } : row
        )
      );
  };
  const allowed = Object.values(permissions).filter(Boolean).length;

  return (
    <PortalShell active={section} onSelect={setSection}>
      <div className="mb-7 border-b border-[#cbd4d8] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6537]">
          Guest Reviewer · Secure Affidavit Review Portal
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">
          {section === "assistant"
            ? "AI case assistant"
            : `Welcome${profile?.display_name ? `, ${profile.display_name}` : ""}`}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68767e]">
          Only material assigned to this account appears here. Access can be
          changed by the Owner or an authorized Admin.
        </p>
      </div>
      {section === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-[#ccd5da] bg-[#fffdfa] p-5">
              <FileCheck2 className="h-5 w-5 text-[#8a6537]" />
              <p className="mt-5 font-serif text-3xl font-semibold">
                {publications.length}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#75838a]">
                Assigned items
              </p>
            </div>
            <div className="border border-[#ccd5da] bg-[#fffdfa] p-5">
              <ShieldCheck className="h-5 w-5 text-[#4f7a5a]" />
              <p className="mt-5 font-serif text-3xl font-semibold">
                {allowed}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#75838a]">
                Allowed capabilities
              </p>
            </div>
            <div className="border border-[#ccd5da] bg-[#fffdfa] p-5">
              <LockKeyhole className="h-5 w-5 text-[#8a6537]" />
              <p className="mt-5 font-serif text-3xl font-semibold">Private</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#75838a]">
                Workspace status
              </p>
            </div>
          </div>
          <section className="mt-6 border border-[#ccd5da] bg-[#fffdfa]">
            <div className="flex items-center justify-between border-b border-[#d8dfe2] p-5">
              <div>
                <h2 className="text-lg font-semibold">Published to you</h2>
                <p className="mt-1 text-xs text-[#75838a]">
                  Notices, review assignments, and approved links
                </p>
              </div>
              <Clock3 className="h-5 w-5 text-[#8a6537]" />
            </div>
            {publications.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#75838a]">
                No items have been published to this dashboard.
              </div>
            ) : (
              <div className="divide-y divide-[#e0e5e7]">
                {publications.map(item => (
                  <article key={item.id} className="p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8a6537]">
                          {item.resource_type} {""}
                          {item.acknowledged_at && (
                            <span className="inline-flex items-center gap-1 text-[#4f7a5a]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {""}
                              Acknowledged
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-lg font-semibold">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#68767e]">
                          {item.summary}
                        </p>
                        <p className="mt-3 text-xs text-[#88949a]">
                          Published {""}
                          {new Date(item.published_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        {item.resource_url && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(
                                item.resource_url!,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            Open
                          </Button>
                        )}
                        {!item.acknowledged_at && (
                          <Button
                            className="bg-[#21313a]"
                            onClick={() => void acknowledge(item.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <div className="mt-6 flex flex-col gap-4 border border-[#cdbb86] bg-[#fff8e6] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Authorized case workspace</h2>
              <p className="mt-1 text-sm text-[#6f6044]">
                Open only the evidence and dossier sections allowed for your
                account.
              </p>
            </div>
            <Button
              disabled={!can("can_view_dossier")}
              onClick={() => setLocation("/dossier")}
              className="gap-2 bg-[#21313a]"
            >
              Open case <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      {section === "assistant" && (
        <div className="flex min-h-[620px] flex-col border border-[#ccd5da] bg-[#fffdfa]">
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-lg text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#cdbb86] bg-[#fff8e6]">
                <Bot className="h-5 w-5 text-[#8a6537]" />
              </span>
              <h2 className="mt-5 font-serif text-3xl font-semibold">
                Permission-gated assistant
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#68767e]">
                {can("can_ask_ai")
                  ? "Your account may use AI after the Owner connects a server-side model provider."
                  : "The Owner or Admin has not allowed AI access for this account."}
              </p>
            </div>
          </div>
          <div className="border-t border-[#d8dfe2] p-4">
            <div className="mx-auto flex max-w-3xl gap-2">
              <input
                disabled
                className="min-h-11 flex-1 border border-[#cbd4d8] bg-[#f4f5f5] px-4 text-sm"
                placeholder="AI provider connection required"
              />
              <Button disabled>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}