import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Check,
  FileCheck2,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PortalShell, type PortalSection } from "@/components/PortalShell";
import { ProviderManager } from "@/components/ProviderManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useAuthorization } from "@/hooks/useAuthorization";
import type { AppRole, PermissionKey } from "@/lib/authorization";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  role: AppRole;
  status: "active" | "disabled" | "pending";
  user_permissions?: Record<string, boolean>[] | Record<string, boolean> | null;
};
const permissionGroups: { label: string; keys: PermissionKey[] }[] = [
  {
    label: "Portal",
    keys: ["can_view_dashboard", "can_view_dossier", "can_ask_ai"],
  },
  {
    label: "Case material",
    keys: [
      "can_view_evidence",
      "can_view_testimony",
      "can_view_timeline",
      "can_view_documents",
      "can_view_images",
      "can_view_videos",
    ],
  },
  { label: "Actions", keys: ["can_download", "can_export", "can_share"] },
];
const labelFor = (key: string) => key.replace(/^can_/, "").replaceAll("_", " ");

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="border border-[#ccd5da] bg-[#fffdfa] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#75838a]">
        {label}
      </p>
      <p className="mt-3 font-serif text-4xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-[#75838a]">{note}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [section, setSection] = useState<PortalSection>("overview");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishSummary, setPublishSummary] = useState("");
  const [publishType, setPublishType] = useState("notice");
  const [publishUrl, setPublishUrl] = useState("");
  const { isOwner, profile } = useAuthorization();

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,display_name,role,status,user_permissions(*)")
      .order("created_at");
    if (error)
      toast.error("User access could not be loaded", {
        description: error.message,
      });
    else {
      const rows = (data ?? []) as ProfileRow[];
      setProfiles(rows);
      setSelectedId(
        current =>
          current ??
          rows.find(row => row.user_id !== profile?.user_id)?.user_id ??
          null
      );
    }
    setLoading(false);
  }, [profile?.user_id]);
  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const selected = profiles.find(row => row.user_id === selectedId) ?? null;
  const selectedPermissions = useMemo(() => {
    if (!selected) return {} as Record<string, boolean>;
    const value = selected.user_permissions;
    return (Array.isArray(value) ? value[0] : value) ?? {};
  }, [selected]);

  const patchSelected = (
    patch: Partial<ProfileRow>,
    permissionPatch?: Record<string, boolean>
  ) =>
    setProfiles(rows =>
      rows.map(row =>
        row.user_id === selectedId
          ? {
              ...row,
              ...patch,
              user_permissions: { ...selectedPermissions, ...permissionPatch },
            }
          : row
      )
    );
  const saveAccess = async () => {
    if (!selected) return;
    setSaving(true);
    const permissions = Array.isArray(selected.user_permissions)
      ? (selected.user_permissions[0] ?? {})
      : (selected.user_permissions ?? {});
    const { error } = await supabase.rpc("set_user_access", {
      target_user_id: selected.user_id,
      next_status: selected.status,
      next_role: selected.role,
      next_permissions: permissions,
    });
    setSaving(false);
    if (error)
      toast.error("Access update was rejected", { description: error.message });
    else toast.success("User access updated and audited");
  };
  const publish = async () => {
    if (!selected || !publishTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("portal_publications").insert({
      recipient_user_id: selected.user_id,
      title: publishTitle.trim(),
      summary: publishSummary.trim(),
      resource_type: publishType,
      resource_url: publishUrl.trim() || null,
      published_by: profile?.user_id,
    });
    setSaving(false);
    if (error)
      toast.error("Publication failed", { description: error.message });
    else {
      toast.success("Published to the selected user");
      setPublishTitle("");
      setPublishSummary("");
      setPublishUrl("");
    }
  };

  return (
    <PortalShell active={section} onSelect={setSection}>
      <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#cbd4d8] pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6537]">
            {isOwner ? "Owner authority" : "Delegated administration"}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">
            {section === "overview"
              ? "Control center"
              : section === "access"
                ? "Users and access"
                : section === "publishing"
                  ? "Publish to users"
                  : section === "assistant"
                    ? "AI case assistant"
                    : section[0].toUpperCase() + section.slice(1)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68767e]">
            Owner authority remains protected at the database layer. Every
            access change is recorded in the audit log.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-[#fffdfa]"
          onClick={() => void loadProfiles()}
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {section === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Accounts"
              value={profiles.length}
              note="Provisioned profiles"
            />
            <Metric
              label="Active users"
              value={profiles.filter(p => p.status === "active").length}
              note="Currently authorized"
            />
            <Metric
              label="Pending"
              value={profiles.filter(p => p.status === "pending").length}
              note="Awaiting review"
            />
            <Metric
              label="Admins"
              value={profiles.filter(p => p.role === "admin").length}
              note="Delegated operators"
            />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <button
              onClick={() => setSection("access")}
              className="border border-[#ccd5da] bg-[#fffdfa] p-6 text-left hover:border-[#8e9ba2]"
            >
              <UserCog className="h-5 w-5 text-[#8a6537]" />
              <h2 className="mt-5 text-lg font-semibold">Control access</h2>
              <p className="mt-2 text-sm leading-6 text-[#68767e]">
                Activate, disable, assign roles, and allow individual
                capabilities.
              </p>
            </button>
            <button
              onClick={() => setSection("publishing")}
              className="border border-[#ccd5da] bg-[#fffdfa] p-6 text-left hover:border-[#8e9ba2]"
            >
              <FileCheck2 className="h-5 w-5 text-[#8a6537]" />
              <h2 className="mt-5 text-lg font-semibold">
                Publish to a dashboard
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#68767e]">
                Send a notice, task, case link, document, or evidence
                assignment.
              </p>
            </button>
            <button
              onClick={() => setSection("assistant")}
              className="border border-[#ccd5da] bg-[#fffdfa] p-6 text-left hover:border-[#8e9ba2]"
            >
              <Bot className="h-5 w-5 text-[#8a6537]" />
              <h2 className="mt-5 text-lg font-semibold">AI assistant</h2>
              <p className="mt-2 text-sm leading-6 text-[#68767e]">
                Analyze only the authorized context supplied to the session.
              </p>
            </button>
          </div>
        </>
      )}

      {(section === "access" || section === "publishing") && (
        <div className="grid min-h-[600px] overflow-hidden border border-[#cbd4d8] bg-[#fffdfa] lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-[#cbd4d8] bg-[#f5f6f6] lg:border-b-0 lg:border-r">
            <div className="p-4">
              <Input
                placeholder="Search provisioned users"
                aria-label="Search provisioned users"
              />
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                profiles
                  .filter(row => row.user_id !== profile?.user_id)
                  .map(row => (
                    <button
                      key={row.user_id}
                      onClick={() => setSelectedId(row.user_id)}
                      className={`flex w-full items-center gap-3 border-t border-[#dde3e6] p-4 text-left ${selectedId === row.user_id ? "bg-white" : "hover:bg-white/70"}`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#21313a] text-xs font-bold text-white">
                        {(row.display_name || "U").slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {row.display_name || "Unnamed account"}
                        </strong>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-[#75838a]">
                          {row.role === "user" ? "Guest Reviewer" : row.role} ·{" "}
                          {row.status}
                        </span>
                      </span>
                    </button>
                  ))
              )}
            </div>
          </aside>
          <section className="p-5 sm:p-7">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-sm text-[#75838a]">
                Select an account to continue.
              </div>
            ) : section === "access" ? (
              <div>
                <div className="flex flex-col justify-between gap-4 border-b border-[#d8dfe2] pb-6 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selected.display_name || "Unnamed account"}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-[#75838a]">
                      {selected.user_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selected.status}
                      onChange={e =>
                        patchSelected({
                          status: e.target.value as ProfileRow["status"],
                        })
                      }
                      className="min-h-10 border border-[#cbd4d8] bg-white px-3 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                    <select
                      value={selected.role}
                      disabled={!isOwner}
                      onChange={e =>
                        patchSelected({ role: e.target.value as AppRole })
                      }
                      className="min-h-10 border border-[#cbd4d8] bg-white px-3 text-sm disabled:opacity-60"
                    >
                      <option value="user">Guest Reviewer</option>
                      <option value="admin">Admin</option>
                      {isOwner && <option value="owner">Owner</option>}
                    </select>
                  </div>
                </div>
                <div className="mt-6 space-y-7">
                  {permissionGroups.map(group => (
                    <fieldset key={group.label}>
                      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8a6537]">
                        {group.label}
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {group.keys.map(key => (
                          <label
                            key={key}
                            className="flex min-h-12 items-center justify-between gap-3 border border-[#d8dfe2] bg-white px-4 text-sm capitalize"
                          >
                            <span>{labelFor(key)}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(selectedPermissions[key])}
                              onChange={e =>
                                patchSelected({}, { [key]: e.target.checked })
                              }
                              className="h-4 w-4 accent-[#21313a]"
                            />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-[#d8dfe2] pt-5">
                  <p className="text-xs text-[#75838a]">
                    Changes take effect on the user’s next authorization
                    refresh.
                  </p>
                  <Button
                    disabled={saving}
                    onClick={() => void saveAccess()}
                    className="gap-2 bg-[#21313a]"
                  >
                    <Check className="h-4 w-4" /> Save access
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold">
                  Publish to {selected.display_name || "selected user"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#68767e]">
                  The item appears in this user’s private dashboard. Publishing
                  does not override evidence or case permissions.
                </p>
                <div className="mt-7 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        className="text-sm font-semibold"
                        htmlFor="publish-type"
                      >
                        Item type
                      </label>
                      <select
                        id="publish-type"
                        value={publishType}
                        onChange={event => setPublishType(event.target.value)}
                        className="mt-2 min-h-10 w-full border border-[#cbd4d8] bg-white px-3 text-sm"
                      >
                        <option value="notice">Notice</option>
                        <option value="task">Task</option>
                        <option value="case">Case</option>
                        <option value="evidence">Evidence</option>
                        <option value="document">Document</option>
                        <option value="link">Secure link</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className="text-sm font-semibold"
                        htmlFor="publish-url"
                      >
                        Authorized URL (optional)
                      </label>
                      <Input
                        id="publish-url"
                        className="mt-2"
                        type="url"
                        value={publishUrl}
                        onChange={event => setPublishUrl(event.target.value)}
                        placeholder="https://masterkanorcase.online/..."
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-sm font-semibold"
                      htmlFor="publish-title"
                    >
                      Title
                    </label>
                    <Input
                      id="publish-title"
                      className="mt-2"
                      value={publishTitle}
                      onChange={e => setPublishTitle(e.target.value)}
                      placeholder="Review assigned evidence set"
                      maxLength={140}
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm font-semibold"
                      htmlFor="publish-summary"
                    >
                      Instructions or summary
                    </label>
                    <textarea
                      id="publish-summary"
                      className="mt-2 min-h-36 w-full border border-[#cbd4d8] bg-white p-3 text-sm outline-none focus:border-[#8a6537]"
                      value={publishSummary}
                      onChange={e => setPublishSummary(e.target.value)}
                      placeholder="Explain what the user should review or acknowledge."
                    />
                  </div>
                  <Button
                    disabled={saving || !publishTitle.trim()}
                    onClick={() => void publish()}
                    className="gap-2 bg-[#21313a]"
                  >
                    <Send className="h-4 w-4" /> Publish privately
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {section === "assistant" && (
        <div className="grid min-h-[620px] overflow-hidden border border-[#cbd4d8] bg-[#fffdfa] lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col">
            <div className="flex-1 p-6 sm:p-10">
              <div className="mx-auto max-w-xl text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#cdbb86] bg-[#fff8e6]">
                  <Bot className="h-5 w-5 text-[#8a6537]" />
                </span>
                <h2 className="mt-5 font-serif text-3xl font-semibold">
                  Ask about authorized case material
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#68767e]">
                  AI output is a working aid, never verified evidence, legal
                  advice, or an authority finding.
                </p>
              </div>
            </div>
            <div className="border-t border-[#d8dfe2] p-4">
              <div className="mx-auto flex max-w-3xl gap-2">
                <Input
                  placeholder="AI provider connection required before messages can be sent"
                  disabled
                />
                <Button disabled aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <aside className="border-t border-[#d8dfe2] bg-[#f5f6f6] p-5 lg:border-l lg:border-t-0">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">
              Assistant controls
            </h3>
            <p className="mt-4 text-sm leading-6 text-[#68767e]">
              Configure a server-side AI provider in Integrations. API keys are
              never stored in the browser.
            </p>
            <div className="mt-5 border border-[#d8dfe2] bg-white p-4">
              <LockKeyhole className="h-4 w-4 text-[#4f7a5a]" />
              <p className="mt-2 text-xs leading-5 text-[#68767e]">
                Permission required: <strong>ask AI</strong>
              </p>
            </div>
          </aside>
        </div>
      )}

      {section === "integrations" && <ProviderManager />}

      {section === "settings" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="border border-[#ccd5da] bg-[#fffdfa] p-6">
            <Settings className="h-5 w-5 text-[#8a6537]" />
            <h2 className="mt-5 text-lg font-semibold">Portal policy</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between border-b pb-3">
                <dt>Public registration</dt>
                <dd className="font-semibold">Disabled</dd>
              </div>
              <div className="flex justify-between border-b pb-3">
                <dt>Default new account</dt>
                <dd className="font-semibold">Pending user</dd>
              </div>
              <div className="flex justify-between">
                <dt>Evidence storage</dt>
                <dd className="font-semibold">Private</dd>
              </div>
            </dl>
          </div>
          <div className="border border-[#ccd5da] bg-[#fffdfa] p-6">
            <ShieldCheck className="h-5 w-5 text-[#4f7a5a]" />
            <h2 className="mt-5 text-lg font-semibold">Authority boundaries</h2>
            <p className="mt-3 text-sm leading-6 text-[#68767e]">
              Only the Owner can assign administrative or owner roles. Admins
              can manage User permissions and publish assigned material. Users
              cannot grant themselves access.
            </p>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
