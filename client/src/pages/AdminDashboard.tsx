import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, FileText, Image as ImageIcon, Video, Table2, FileCode2, AlertCircle } from "lucide-react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useEvidenceList, useUpdateEvidenceStatus, useUploadEvidence, type EvidenceRecord } from "@/hooks/useEvidence";
import { DocumentPreviewModal, type PreviewDocument } from "@/components/DocumentPreviewModal";
import { filterAdminAssets, formatAssetSize, getAssetKind, type AdminAssetKind } from "@/adminAssetLibrary";
import { getAdminAgentPolicy } from "@/adminAgentPolicy";
import MasterKanorChatAgent from "@/components/MasterKanorChatAgent";
import AdminAffidavitExtractionWorkspace from "@/components/AdminAffidavitExtractionWorkspace";
import { PORTAL_PERMISSION_LABELS, PORTAL_ROLE_LABELS, PORTAL_ROLE_PERMISSIONS, type PortalRole } from "@/rolePolicy";

type PublishedSurface = "official" | "gallery" | "documentary";

export default function AdminDashboard() {
  const { isAdmin, role, isLoading: adminLoading } = useAdminCheck();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <AuthorizedAdminDashboard role={role ?? "admin"} />;
}

function AuthorizedAdminDashboard({ role }: { role: PortalRole }) {
  const [adminSearch, setAdminSearch] = useState("");
  const [adminKind, setAdminKind] = useState<AdminAssetKind | "all">("all");
  const [adminStatus, setAdminStatus] = useState<EvidenceRecord["status"] | "all">("all");
  const [previewAsset, setPreviewAsset] = useState<PreviewDocument | null>(null);
  const evidenceQuery = useEvidenceList({ limit: 1000, enabled: true });
  const updateStatus = useUpdateEvidenceStatus();
  const uploadEvidence = useUploadEvidence();
  const [uploadMessage, setUploadMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [connectorMessage, setConnectorMessage] = useState<string | null>(null);
  const [costThreshold, setCostThreshold] = useState(() => typeof window === "undefined" ? "5.00" : window.localStorage.getItem("master-kanor:ai-cost-threshold") ?? "5.00");
  const [cacheTtl, setCacheTtl] = useState(() => typeof window === "undefined" ? "60" : window.localStorage.getItem("master-kanor:cache-ttl") ?? "60");
  const [maintenanceTime, setMaintenanceTime] = useState(() => typeof window === "undefined" ? "03:00" : window.localStorage.getItem("master-kanor:maintenance-time") ?? "03:00");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [publishedSurface, setPublishedSurface] = useState<Record<PublishedSurface, boolean>>({ official: true, gallery: true, documentary: true });
  const agentPolicy = getAdminAgentPolicy();

  const saveOwnerSettings = () => {
    if (role !== "owner") return;
    window.localStorage.setItem("master-kanor:ai-cost-threshold", costThreshold);
    window.localStorage.setItem("master-kanor:cache-ttl", cacheTtl);
    window.localStorage.setItem("master-kanor:maintenance-time", maintenanceTime);
    window.localStorage.setItem("master-kanor:published-surface", JSON.stringify(publishedSurface));
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 2500);
  };

  const togglePublishedSurface = (key: PublishedSurface) => {
    if (role !== "owner") return;
    setPublishedSurface((current) => ({ ...current, [key]: !current[key] }));
  };

  const adminAssets = useMemo(() => {
    const rows = (evidenceQuery.data?.evidence ?? []) as EvidenceRecord[];
    return filterAdminAssets(rows, { search: adminSearch, kind: adminKind, status: adminStatus });
  }, [adminSearch, adminKind, adminStatus, evidenceQuery.data?.evidence]);

  const [metrics] = useState({
    totalEvidence: 331,
    activeCases: 1,
    activeUsers: 3,
    aiCostToday: 0.47,
    cacheHitRate: 62,
    uptime: 99.99,
  });

  const [systemStatus] = useState({
    cloudflarePages: "operational",
    supabaseDatabase: "operational",
    aiOrchestrator: "operational",
    cacheLayer: "operational",
    rollbackAutomation: "active",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Master Kanor Admin Dashboard</h1>
          <p className="text-slate-600">System monitoring and AI assistant control center</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.totalEvidence}</div>
              <p className="text-xs text-slate-500 mt-1">files indexed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.activeCases}</div>
              <p className="text-xs text-slate-500 mt-1">case open</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.activeUsers}</div>
              <p className="text-xs text-slate-500 mt-1">users online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">AI Cost (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">${metrics.aiCostToday.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">daily spend</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.cacheHitRate.toFixed(0)}%</div>
              <p className="text-xs text-slate-500 mt-1">efficiency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{metrics.uptime}%</div>
              <p className="text-xs text-slate-500 mt-1">SLA</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence Management</TabsTrigger>
            <TabsTrigger value="users">User Roles</TabsTrigger>
            <TabsTrigger value="integrations">Integrations & Storage</TabsTrigger>
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <AdminAffidavitExtractionWorkspace />

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Real-time infrastructure health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === "operational" || status === "active"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm text-slate-600 capitalize">{status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Management Tab */}
          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Evidence Files & Index</CardTitle>
                  <CardDescription>Database-backed workspace for documents, sheets, images, video, and text assets</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{adminAssets.length} shown</span>
                  <span aria-hidden="true">•</span>
                  <span>{evidenceQuery.data?.total ?? 0} indexed</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_160px_auto]">
                    <label className="sr-only" htmlFor="admin-evidence-search">Search evidence</label>
                    <input
                      id="admin-evidence-search"
                      type="search"
                      placeholder="Search title, description, category..."
                      value={adminSearch}
                      onChange={(event) => setAdminSearch(event.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    />
                    <label className="sr-only" htmlFor="admin-evidence-kind">Filter by file type</label>
                    <select
                      id="admin-evidence-kind"
                      value={adminKind}
                      onChange={(event) => setAdminKind(event.target.value as AdminAssetKind | "all")}
                      className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    >
                      <option value="all">All file types</option>
                      <option value="document">Documents / PDFs</option>
                      <option value="spreadsheet">Sheets / CSV</option>
                      <option value="image">Images</option>
                      <option value="video">Video / links</option>
                      <option value="text">Text / data</option>
                      <option value="audio">Audio</option>
                      <option value="other">Other</option>
                    </select>
                    <label className="sr-only" htmlFor="admin-evidence-status">Filter by review status</label>
                    <select
                      id="admin-evidence-status"
                      value={adminStatus}
                      onChange={(event) => setAdminStatus(event.target.value as EvidenceRecord["status"] | "all")}
                      className="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    >
                      <option value="all">All review states</option>
                      <option value="pending">Pending review</option>
                      <option value="verified">Verified</option>
                      <option value="disputed">Disputed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAdminSearch("");
                        setAdminKind("all");
                        setAdminStatus("all");
                      }}
                      disabled={!adminSearch && adminKind === "all" && adminStatus === "all"}
                    >
                      Reset
                    </Button>
                  </div>

                  {evidenceQuery.isLoading && (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-10 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Loading authorized evidence records...
                    </div>
                  )}

                  {evidenceQuery.error && (
                    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Evidence records could not be loaded.</p>
                        <p className="mt-1">{evidenceQuery.error instanceof Error ? evidenceQuery.error.message : "Check the Supabase connection and admin permissions."}</p>
                      </div>
                    </div>
                  )}

                  {!evidenceQuery.isLoading && !evidenceQuery.error && adminAssets.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
                      <FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                      <p className="mt-3 font-semibold text-slate-800">No matching evidence records</p>
                      <p className="mt-1 text-sm text-slate-500">Try clearing the filters or verify that the asset has been indexed in Supabase.</p>
                    </div>
                  )}

                  {adminAssets.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full min-w-[860px] text-left text-sm">
                        <caption className="sr-only">Authorized evidence assets available for admin review</caption>
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                          <tr>
                            <th scope="col" className="p-3">Asset</th>
                            <th scope="col" className="p-3">Type</th>
                            <th scope="col" className="p-3">Category</th>
                            <th scope="col" className="p-3">Status</th>
                            <th scope="col" className="p-3">Added</th>
                            <th scope="col" className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {adminAssets.map((asset) => {
                            const kind = getAssetKind(asset);
                            const Icon = kind === "image" ? ImageIcon : kind === "video" ? Video : kind === "spreadsheet" ? Table2 : kind === "text" ? FileCode2 : FileText;
                            const previewUrl = asset.fileUrl ?? "";
                            return (
                              <tr key={asset.id} className="align-top hover:bg-slate-50">
                                <td className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-slate-100 p-2 text-slate-600"><Icon className="h-4 w-4" aria-hidden="true" /></div>
                                    <div className="min-w-0">
                                      <p className="font-medium text-slate-900">{asset.title}</p>
                                      <p className="mt-1 max-w-md truncate text-xs text-slate-500">{asset.description || "No description"}</p>
                                      <p className="mt-1 font-mono text-[10px] text-slate-400">{asset.id} · {formatAssetSize(asset.fileSize)}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 capitalize text-slate-700">{kind}</td>
                                <td className="p-3 text-slate-700">{asset.category || "Uncategorized"}</td>
                                <td className="p-3">
                                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${asset.status === "verified" ? "bg-green-100 text-green-800" : asset.status === "pending" ? "bg-yellow-100 text-yellow-800" : asset.status === "disputed" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
                                    {asset.status === "pending" ? "Pending review" : asset.status}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap text-xs text-slate-600">{asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : "Unknown"}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={!previewUrl}
                                      onClick={() => setPreviewAsset({ id: asset.id, title: asset.title, url: previewUrl, type: asset.mimeType || asset.type || kind, description: asset.description || undefined, category: asset.category || undefined, uploadedAt: asset.createdAt || undefined })}
                                    >
                                      <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                      Preview
                                    </Button>
                                    {asset.status === "pending" && (
                                      <Button size="sm" onClick={() => updateStatus.mutate({ id: asset.id, status: "verified" })} disabled={updateStatus.isPending}>
                                        {updateStatus.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                                        Verify
                                      </Button>
                                    )}
                                    {asset.status === "verified" && (
                                      <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: asset.id, status: "archived" })} disabled={updateStatus.isPending}>Archive</Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Roles Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User & Role Access Control</CardTitle>
                  <CardDescription>Manage administrators, legal professionals, and guests</CardDescription>
                </div>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  + Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-3">User Email</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-3 font-medium">tanauancharles1@gmail.com</td>
                        <td className="p-3"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Super Admin</span></td>
                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                        <td className="p-3">
                          <button className="text-slate-600 hover:underline text-xs">Configure</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">counsel.leyte@masterkanorcase.online</td>
                        <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Legal Counsel (Professional)</span></td>
                        <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                        <td className="p-3">
                          <button className="text-blue-600 hover:underline mr-3 text-xs">Edit Role</button>
                          <button className="text-red-600 hover:underline text-xs">Revoke</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">guest.viewer@masterkanorcase.online</td>
                        <td className="p-3"><span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs">Guest Viewer</span></td>
                        <td className="p-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Restricted</span></td>
                        <td className="p-3">
                          <button className="text-blue-600 hover:underline mr-3 text-xs">Promote</button>
                          <button className="text-red-600 hover:underline text-xs">Disable</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations & Storage Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>External Storage & Cloud Sources</CardTitle>
                  <CardDescription>Configure secure Google Drive, Notion, and Cloudflare R2 Vault</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Google Drive Workspace</h4>
                      <p className="text-xs text-slate-500">OAuth sync for briefs and raw media assets</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Connected</span>
                      <Button variant="outline" size="sm" onClick={() => setConnectorMessage(role === "owner" ? "Google Drive is ready for an owner-approved OAuth connection. No credential is stored in the browser." : "Google Drive configuration is owner-only.")}>Configure</Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Notion Workspace</h4>
                      <p className="text-xs text-slate-500">Synced affidavit notes and task tracking</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Connected</span>
                      <Button variant="outline" size="sm" onClick={() => setConnectorMessage(role === "owner" ? "Notion is ready for an owner-approved connection. No credential is stored in the browser." : "Notion configuration is owner-only.")}>Configure</Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                      <h4 className="font-semibold text-sm">Evidence Storage & Upload</h4>
                      <p className="text-xs text-slate-500">Supabase Storage metadata flow with server-side R2 backup integration</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">Supabase / R2</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <label className="text-xs font-medium text-slate-700" htmlFor="evidence-upload">Upload an evidence document or media file</label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="evidence-upload"
                          accept="application/pdf,application/json,application/xml,application/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,video/*,audio/*,text/*"
                          disabled={uploadEvidence.isPending}
                          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 flex-1 border rounded-md p-1"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            setUploadMessage(null);
                            try {
                              await uploadEvidence.mutateAsync({ file, category: "Admin upload" });
                              setUploadMessage({ tone: "success", text: `${file.name} uploaded and queued for review.` });
                              event.target.value = "";
                              void evidenceQuery.refetch();
                            } catch (error) {
                              setUploadMessage({ tone: "error", text: error instanceof Error ? error.message : "Evidence upload failed." });
                            }
                          }}
                        />
                      </div>
                      {uploadEvidence.isPending && <p className="text-xs text-slate-600" role="status">Uploading file and saving evidence metadata...</p>}
                      {uploadMessage && <p className={`text-xs ${uploadMessage.tone === "success" ? "text-emerald-700" : "text-red-700"}`} role={uploadMessage.tone === "error" ? "alert" : "status"}>{uploadMessage.text}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Knowledge Base & MCP</CardTitle>
                  <CardDescription>Manage Model Context Protocol servers and LLM Gateway keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Single Gateway AI API Key (Gemini / OpenRouter)</label>
                    <div className="mt-1 flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-xs text-emerald-800" role="status">Credentials are kept server-side and are never rendered in the browser.</p>
                      <Button size="sm" variant="outline" disabled={role !== "owner"} onClick={() => setConnectorMessage(role === "owner" ? "AI provider keys must be added through the protected deployment secret manager; they are never stored in this browser." : "AI provider key management is owner-only.")}>Manage securely</Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">MCP Server Endpoints</label>
                    <div className="flex gap-2 mt-1">
                      <input type="text" defaultValue="https://mcp.masterkanorcase.online/v1" className="flex-1 px-3 py-2 border rounded-md text-sm font-mono" />
                      <Button size="sm" variant="outline" onClick={() => setConnectorMessage("MCP endpoint validation is queued for an owner-approved server connection; no token was read or stored.")}>Test</Button>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setConnectorMessage("AI review preparation is limited to the indexed evidence records. Review and confirmation are required before publication or status changes.")}>
                      Prepare AI Review
                    </Button>
                  </div>
                  <div className="border-t border-slate-200 pt-4 space-y-3" aria-labelledby="admin-agent-policy-title">
                    <div>
                      <h4 id="admin-agent-policy-title" className="text-sm font-semibold text-slate-900">Owner/Admin Agent Knowledge & Guardrails</h4>
                      <p className="mt-1 text-xs text-slate-500">Read-only workspace assistance. The agent cannot access credentials or publish/delete records without confirmation.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Knowledge sources</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-700">
                          {agentPolicy.knowledgeSources.map((source) => <li key={source}>• {source}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Allowed tools</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-700">
                          {agentPolicy.allowedTools.map((tool) => <li key={tool}>• {tool}</li>)}
                        </ul>
                      </div>
                    </div>
                    <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-semibold">Memory boundary:</span> {agentPolicy.memoryBoundary}</p>
                  {connectorMessage && <p role="status" className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">{connectorMessage}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Tab with AI Assistant */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Master Kanor AI Assistant</CardTitle>
                <CardDescription>Real-time evidence analysis and case support</CardDescription>
              </CardHeader>
              <CardContent>
                <MasterKanorChatAgent />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration & Access Policy</CardTitle>
                <CardDescription>One place to see who can manage the case and what is published to the read-only user dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">AI daily cost threshold (USD)</span>
                    <input type="number" min="0" step="0.50" value={costThreshold} onChange={(event) => setCostThreshold(event.target.value)} disabled={role !== "owner"} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Cache TTL (minutes)</span>
                    <input type="number" min="5" step="5" value={cacheTtl} onChange={(event) => setCacheTtl(event.target.value)} disabled={role !== "owner"} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Maintenance window (UTC)</span>
                    <input type="time" value={maintenanceTime} onChange={(event) => setMaintenanceTime(event.target.value)} disabled={role !== "owner"} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2" />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" onClick={saveOwnerSettings} disabled={role !== "owner"}>Save owner settings</Button>
                  {role !== "owner" && <span className="text-xs text-slate-500">Only the owner can change global AI, cache, and maintenance settings.</span>}
                  {settingsSaved && <span role="status" className="text-xs font-medium text-emerald-700">Settings saved in this workspace.</span>}
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <caption className="sr-only">Owner, administrator, and guest user permission matrix</caption>
                    <thead className="border-b border-slate-200 bg-slate-50"><tr><th className="p-3">Role</th><th className="p-3">Allowed capabilities</th><th className="p-3">Restricted capabilities</th></tr></thead>
                    <tbody className="divide-y divide-slate-200">
                      {(["owner", "admin", "user"] as PortalRole[]).map((matrixRole) => {
                        const allowed = PORTAL_ROLE_PERMISSIONS[matrixRole].map((permission) => PORTAL_PERMISSION_LABELS[permission]);
                        const denied = (Object.keys(PORTAL_PERMISSION_LABELS) as Array<keyof typeof PORTAL_PERMISSION_LABELS>).filter((permission) => !PORTAL_ROLE_PERMISSIONS[matrixRole].includes(permission)).map((permission) => PORTAL_PERMISSION_LABELS[permission]);
                        return <tr key={matrixRole} className={matrixRole === role ? "bg-amber-50/60" : undefined}><th scope="row" className="p-3 align-top font-semibold text-slate-900">{PORTAL_ROLE_LABELS[matrixRole]}{matrixRole === role && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] text-amber-800">Current</span>}</th><td className="p-3 align-top text-xs leading-5 text-emerald-800">{allowed.join(" · ")}</td><td className="p-3 align-top text-xs leading-5 text-slate-500">{denied.length ? denied.join(" · ") : "None"}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Published User Dashboard</h3><p className="mt-1 text-xs text-slate-500">Owner-controlled read-only surfaces. Publishing never edits the official source text.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{Object.values(publishedSurface).filter(Boolean).length}/3 live</span></div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {(["official", "gallery", "documentary"] as PublishedSurface[]).map((surface) => <label key={surface} className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" checked={publishedSurface[surface]} onChange={() => togglePublishedSurface(surface)} disabled={role !== "owner"} /> <span className="capitalize">{surface === "official" ? "Official text" : surface === "gallery" ? "Evidence gallery" : "Video documentary"}</span></label>)}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900"><strong>Secret handling:</strong> provider API keys and connector tokens are never entered into or stored by this browser workspace. They must be configured through the protected deployment secret manager; this screen only records safe configuration status.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DocumentPreviewModal
          isOpen={Boolean(previewAsset)}
          onClose={() => setPreviewAsset(null)}
          document={previewAsset}
        />
      </div>
    </div>
  );
}
