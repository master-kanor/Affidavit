import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { checkIsAdmin } from "@/lib/authConfig";
import { buildEvidenceStorageKey, validateAdminUpload } from "@/adminUpload";

export type EvidenceRecord = {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  category?: string | null;
  fileUrl?: string | null;
  fileKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  status: "pending" | "verified" | "disputed" | "archived";
  createdAt?: string | null;
  updatedAt?: string | null;
};

type EvidenceResult = {
  evidence: EvidenceRecord[];
  total: number;
  error: string | null;
};

type EvidenceFilters = {
  limit?: number;
  offset?: number;
  status?: EvidenceRecord["status"];
  category?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
};

const EVIDENCE_COLUMNS =
  "id, title, description, type, category, fileUrl, fileKey, mimeType, fileSize, uploadedBy, status, createdAt, updatedAt";

// The production audit found the existing Supabase bucket is named `Master`.
// Keep it configurable for future environments, but do not silently target a
// bucket that is not present in the configured project.
const EVIDENCE_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "Master";

async function fetchEvidence(filters: EvidenceFilters = {}): Promise<EvidenceResult> {
  let query: any = supabase
    .from("evidence")
    .select(EVIDENCE_COLUMNS, { count: "exact" })
    .order("createdAt", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.type) query = query.ilike("type", `%${filters.type}%`);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }
  if (filters.startDate) query = query.gte("createdAt", filters.startDate);
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setDate(end.getDate() + 1);
    query = query.lt("createdAt", end.toISOString());
  }

  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Supabase evidence query failed:", error.message);
    return { evidence: [], total: 0, error: error.message };
  }

  return {
    evidence: (data ?? []) as EvidenceRecord[],
    total: count ?? 0,
    error: null,
  };
}

export function useEvidenceList(options: EvidenceFilters = {}) {
  const { enabled = true, ...filters } = options;
  return useQuery({
    queryKey: ["evidence", filters],
    queryFn: () => fetchEvidence(filters),
    enabled,
  });
}

export function useEvidenceById(id: string) {
  return useQuery({
    queryKey: ["evidence", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return { evidence: data as EvidenceRecord, error: null };
    },
    enabled: Boolean(id),
  });
}

export function useCreateEvidence() {
  return useMutation({
    mutationFn: async (input: Partial<EvidenceRecord>) => {
      const { data, error } = await supabase
        .from("evidence")
        .insert({ ...input, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return { evidence: data as EvidenceRecord, error: null };
    },
  });
}

export function useUploadEvidence() {
  return useMutation({
    mutationFn: async (input: {
      file: File;
      title?: string;
      description?: string;
      category?: string;
    }) => {
      const validation = validateAdminUpload(input.file);
      if (!validation.valid) throw new Error(validation.error);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("An authenticated admin session is required to upload evidence.");
      if (!checkIsAdmin(userData.user.email)) throw new Error("Unauthorized: Owner/admin privileges are required to upload evidence.");

      const storageKey = buildEvidenceStorageKey(userData.user.id, input.file);
      const { error: uploadError } = await supabase.storage.from(EVIDENCE_STORAGE_BUCKET).upload(storageKey, input.file, {
        contentType: input.file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(EVIDENCE_STORAGE_BUCKET).getPublicUrl(storageKey);
      const { data, error } = await supabase
        .from("evidence")
        .insert({
          title: input.title?.trim() || input.file.name,
          description: input.description?.trim() || null,
          category: input.category?.trim() || "Uncategorized",
          type: input.file.type || "application/octet-stream",
          mimeType: input.file.type || "application/octet-stream",
          fileSize: input.file.size,
          fileKey: storageKey,
          fileUrl: publicUrlData.publicUrl,
          uploadedBy: userData.user.id,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      return { evidence: data as EvidenceRecord, storageKey };
    },
  });
}

export function useUpdateEvidenceStatus() {
  return useMutation({
    mutationFn: async (input: { id: string; status: EvidenceRecord["status"] }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user || !checkIsAdmin(userData.user.email)) {
        throw new Error("Unauthorized: Owner/admin privileges are required to update evidence status.");
      }
      const { data, error } = await supabase
        .from("evidence")
        .update({ status: input.status, updatedAt: new Date().toISOString() })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return { evidence: data as EvidenceRecord, error: null };
    },
  });
}

export function useEvidenceByCategory(category: string, options: EvidenceFilters = {}) {
  return useEvidenceList({ ...options, category });
}

export function useEvidenceCategories(enabled = true) {
  return useQuery({
    queryKey: ["evidence-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidence")
        .select("category")
        .not("category", "is", null)
        .order("category");
      if (error) throw error;
      const categories = Array.from(
        new Set((data ?? []).map((row: { category: string | null }) => row.category).filter(Boolean)),
      ) as string[];
      return { categories, error: null };
    },
    enabled,
  });
}

export function useEvidenceStats() {
  const query = useEvidenceList({ limit: 1000 });
  const stats = useMemo(() => {
    const rows = query.data?.evidence ?? [];
    return {
      total: query.data?.total ?? rows.length,
      verified: rows.filter((row) => row.status === "verified").length,
      pending: rows.filter((row) => row.status === "pending").length,
      disputed: rows.filter((row) => row.status === "disputed").length,
      archived: rows.filter((row) => row.status === "archived").length,
      byType: rows.reduce<Record<string, number>>((result, row) => {
        const type = row.type ?? "unknown";
        result[type] = (result[type] ?? 0) + 1;
        return result;
      }, {}),
    };
  }, [query.data]);
  return { ...query, data: { stats } };
}

export function useVerifiedEvidence(options: EvidenceFilters = {}) {
  return useEvidenceList({ ...options, status: "verified" });
}

export function useEvidenceByCategoryMemo(category: string | null) {
  const query = useEvidenceByCategory(category ?? "", { limit: 100, enabled: Boolean(category) });
  return useMemo(
    () => ({
      evidence: category ? query.data?.evidence ?? [] : [],
      total: category ? query.data?.total ?? 0 : 0,
      isLoading: query.isLoading,
      error: query.error instanceof Error ? query.error.message : query.data?.error ?? null,
    }),
    [category, query.data, query.error, query.isLoading],
  );
}

export function useEvidenceSearch(
  searchQuery: string,
  startDate?: Date | null,
  endDate?: Date | null,
  options: EvidenceFilters = {},
) {
  return useEvidenceList({
    ...options,
    search: searchQuery || undefined,
    startDate: startDate?.toISOString().split("T")[0],
    endDate: endDate?.toISOString().split("T")[0],
  });
}

export function useVerifiedEvidenceByCategory() {
  const query = useVerifiedEvidence({ limit: 1000 });
  const grouped = useMemo(() => {
    return (query.data?.evidence ?? []).reduce<Record<string, EvidenceRecord[]>>((result, row) => {
      const category = row.category ?? "Uncategorized";
      (result[category] ??= []).push(row);
      return result;
    }, {});
  }, [query.data]);

  return {
    categories: Object.keys(grouped),
    isLoading: query.isLoading,
    error: query.error ?? null,
    queries: Object.entries(grouped).map(([category, evidence]) => ({ category, evidence })),
  };
}
