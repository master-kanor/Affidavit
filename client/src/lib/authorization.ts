import type { User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type AppRole = "owner" | "admin" | "user";
export type AccountStatus = "active" | "disabled";

export type PermissionKey =
  | "can_view_dashboard"
  | "can_view_evidence"
  | "can_view_dossier"
  | "can_view_testimony"
  | "can_view_timeline"
  | "can_view_documents"
  | "can_view_images"
  | "can_view_videos"
  | "can_download"
  | "can_export"
  | "can_share"
  | "can_ask_ai";

export type ResourceType = "case" | "affidavit_section" | "evidence" | "testimony" | "timeline" | "document" | "video" | "image";

export interface AuthorizationProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  role: AppRole;
  status: AccountStatus;
}

export interface AuthorizationState {
  profile: AuthorizationProfile | null;
  permissions: Partial<Record<PermissionKey, boolean>>;
  isOwner: boolean;
  isAdmin: boolean;
  isGuestReviewer: boolean;
  can: (permission: PermissionKey) => boolean;
  canViewResource: (resourceType: ResourceType, resourceId: string) => boolean;
}

const deniedState: AuthorizationState = {
  profile: null,
  permissions: {},
  isOwner: false,
  isAdmin: false,
  isGuestReviewer: false,
  can: () => false,
  canViewResource: () => false,
};

export function createAuthorizationState(profile: AuthorizationProfile | null, permissions: Partial<Record<PermissionKey, boolean>>, resourceIds: Set<string>): AuthorizationState {
  const activeProfile = profile?.status === "active" ? profile : null;
  const can = (permission: PermissionKey) => Boolean(activeProfile && (activeProfile.role === "owner" || permissions[permission] === true));
  return {
    profile: activeProfile,
    permissions,
    isOwner: activeProfile?.role === "owner",
    isAdmin: activeProfile?.role === "admin",
    isGuestReviewer: activeProfile?.role === "user",
    can,
    canViewResource: (_resourceType, resourceId) => Boolean(activeProfile && (activeProfile.role === "owner" || resourceIds.has(resourceId))),
  };
}

export async function loadAuthorizationState(user: SupabaseUser | null): Promise<AuthorizationState> {
  if (!isSupabaseConfigured || !user) return deniedState;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,user_id,display_name,role,status")
    .eq("user_id", user.id)
    .maybeSingle<AuthorizationProfile>();

  if (profileError || !profile || !["owner", "admin", "user"].includes(profile.role) || profile.status !== "active") {
    return deniedState;
  }

  const { data: permissionRow, error: permissionError } = await supabase
    .from("user_permissions")
    .select("can_view_dashboard,can_view_evidence,can_view_dossier,can_view_testimony,can_view_timeline,can_view_documents,can_view_images,can_view_videos,can_download,can_export,can_share,can_ask_ai")
    .eq("user_id", user.id)
    .maybeSingle<Partial<Record<PermissionKey, boolean>>>();

  if (permissionError && permissionError.code !== "PGRST116") return deniedState;

  const { data: resourceRows, error: resourceError } = await supabase
    .from("resource_permissions")
    .select("resource_id")
    .eq("user_id", user.id)
    .eq("can_view", true)
    .limit(1000);

  if (resourceError) return deniedState;

  return createAuthorizationState(profile, permissionRow ?? {}, new Set((resourceRows ?? []).map((row) => String(row.resource_id))));
}

export function isSupabaseUser(value: unknown): value is SupabaseUser {
  return Boolean(value && typeof value === "object" && "id" in value && "email" in value);
}
