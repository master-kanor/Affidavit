import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface CaseTextBlock { number: string | null; text: string; }
export interface CaseGalleryItem { id: string; title: string; icon: string; type: string; verificationState: string; source: string; previewUrl?: string | null; sourceUrl?: string | null; }
export interface CaseGallery { id: string; title: string; items: CaseGalleryItem[]; }
export interface CaseSection { id: string; number: string; title: string; badge: string; sourceLabel: string; sourceText: CaseTextBlock[]; galleries: CaseGallery[]; links: Array<{ id: string; label: string; url: string; type: string }>; }
export interface CanonicalCase { case: { id: string; title: string; subtitle: string; affiant: string; sourceIntegrityNote: string }; sections: CaseSection[]; access: { role: string; canViewEvidence: boolean; canViewDossier: boolean; canExport: boolean }; }

export interface WorkspacePayload {
  case: { id: string; title: string; description?: string | null };
  sections: Array<{ id: string; section_number?: string | null; title: string; source_label?: string | null; approval_status?: string }>;
  textVersions: Array<{ section_id: string; text_content: string; created_at: string }>;
  evidence: Array<{ id: string; title: string; asset_type: string; preview_url?: string | null; source_url?: string | null; verification_state: string; provenance_kind: string; metadata?: Record<string, unknown> }>;
  access: CanonicalCase["access"];
}

export function normalizeWorkspacePayload(payload: WorkspacePayload): CanonicalCase {
  return {
    case: {
      id: payload.case.id,
      title: payload.case.title,
      subtitle: payload.case.description ?? "Authorized case workspace",
      affiant: "Authorized affiant",
      sourceIntegrityNote: "Source text is served from the authorized case workspace. Evidence and editorial records remain separate from the immutable source text.",
    },
    sections: payload.sections.map((section) => {
      const sectionEvidence = payload.evidence.filter((asset) => String(asset.metadata?.section_id ?? "") === section.id);
      const galleries = sectionEvidence.reduce<CaseGallery[]>((groups, asset) => {
        const galleryId = String(asset.metadata?.gallery_id ?? `${section.id}-gallery`);
        const galleryTitle = String(asset.metadata?.gallery_title ?? "Evidence Gallery");
        let gallery = groups.find((entry) => entry.id === galleryId);
        if (!gallery) { gallery = { id: galleryId, title: galleryTitle, items: [] }; groups.push(gallery); }
        gallery.items.push({ id: asset.id, title: asset.title, icon: typeof asset.metadata?.icon === "string" ? asset.metadata.icon : "📎", type: asset.asset_type, verificationState: asset.verification_state, source: asset.provenance_kind, previewUrl: asset.preview_url, sourceUrl: asset.source_url });
        return groups;
      }, []);
      return {
        id: section.id,
        number: section.section_number ?? "",
        title: section.title,
        badge: section.approval_status === "accepted" ? "OFFICIAL TEXT" : "REVIEW STATUS",
        sourceLabel: section.source_label ?? "Authorized case source",
        sourceText: payload.textVersions.filter((version) => version.section_id === section.id).map((version) => ({ number: null, text: version.text_content })),
        galleries,
        links: sectionEvidence.filter((asset) => asset.source_url).map((asset) => ({ id: asset.id, label: asset.title, url: asset.source_url as string, type: asset.asset_type })),
      };
    }),
    access: payload.access,
  };
}

const WorkspaceContext = createContext<CanonicalCase | null>(null);
export function CaseWorkspaceProvider({ value, children }: { value: CanonicalCase; children: ReactNode }) { return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>; }
export function useCaseWorkspace() { const value = useContext(WorkspaceContext); if (!value) throw new Error("CaseWorkspaceProvider is required"); return value; }

export function useCaseWorkspaceQuery(caseId: string) {
  const [data, setData] = useState<CanonicalCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true); setError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { if (mounted) { setError("Authentication is required to load the case workspace."); setIsLoading(false); } return; }
      try {
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/workspace`, { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json() as WorkspacePayload & { message?: string };
        if (!response.ok) throw new Error(payload.message ?? "The case workspace could not be loaded.");
        if (mounted) setData(normalizeWorkspacePayload(payload));
      } catch (cause) { if (mounted) setError(cause instanceof Error ? cause.message : "The case workspace could not be loaded."); }
      finally { if (mounted) setIsLoading(false); }
    };
    void load();
    return () => { mounted = false; };
  }, [caseId]);
  return { data, isLoading, error };
}
