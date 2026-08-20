import React, { useState, useEffect } from "react";
import { ShieldAlert, Search, RefreshCw, User, FileText, ShieldCheck, UserX, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface DownloadAuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userId: string;
  documentId: string;
  documentTitle: string;
  ipAddress: string;
  userAgent: string;
  status: "authorized" | "verified" | "restricted" | "revoked";
}

const MOCK_AUDIT_LOGS: DownloadAuditLogEntry[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userName: "Charles Tanauan",
    userEmail: "tanauancharles1@gmail.com",
    userId: "admin-owner-id",
    documentId: "doc-87-pages-affidavit",
    documentTitle: "Official Affidavit of Evidence (87-Page Unredacted Master Dossier)",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/122.0.0.0",
    status: "authorized",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    userName: "External Suspicious Agent",
    userEmail: "suspicious-user@external-domain.com",
    userId: "user-suspicious-99",
    documentId: "doc-evidence-append-01",
    documentTitle: "Tacloban Cybercrime Investigation Evidence Archive (Verified Gallery Set)",
    ipAddress: "185.220.101.5",
    userAgent: "Python-urllib/3.9",
    status: "verified",
  },
];

export const AdminAuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<DownloadAuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "revoked" | "authorized">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokedEmails, setRevokedEmails] = useState<Set<string>>(new Set());
  const [confirmingRevokeEmail, setConfirmingRevokeEmail] = useState<string | null>(null);
  const [confirmingRestoreEmail, setConfirmingRestoreEmail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedRevoked = localStorage.getItem("affidavit_revoked_emails");
      if (storedRevoked) {
        const parsed = JSON.parse(storedRevoked);
        if (Array.isArray(parsed)) {
          setRevokedEmails(new Set(parsed));
        }
      }

      const storedLogs = localStorage.getItem("affidavit_download_audit_logs");
      if (storedLogs) {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs([...parsed, ...MOCK_AUDIT_LOGS]);
        }
      }
    } catch (err) {
      console.error("Failed to load audit state from localStorage:", err);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Timestamp", "User Email", "User ID", "Document ID", "Document Title", "IP Address", "User Agent", "Access Status"];
    const rows = filteredLogs.map((log) => {
      const isRevoked = revokedEmails.has(log.userEmail) || log.status === "revoked";
      const status = isRevoked ? "revoked" : log.status;
      return [
        `"${log.timestamp}"`,
        `"${log.userEmail}"`,
        `"${log.userId}"`,
        `"${log.documentId}"`,
        `"${log.documentTitle.replace(/"/g, '""')}"`,
        `"${log.ipAddress}"`,
        `"${log.userAgent.replace(/"/g, '""')}"`,
        `"${status}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `affidavit_download_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Successfully exported ${filteredLogs.length} audit log entries to CSV.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRevokeAccess = (email: string) => {
    const nextRevoked = new Set(revokedEmails);
    nextRevoked.add(email);
    setRevokedEmails(nextRevoked);

    try {
      localStorage.setItem("affidavit_revoked_emails", JSON.stringify(Array.from(nextRevoked)));
    } catch (err) {
      console.error("Failed to persist revocation state:", err);
    }

    const updatedLogs = logs.map((log) => (log.userEmail === email ? { ...log, status: "revoked" as const } : log));
    setLogs(updatedLogs);

    setConfirmingRevokeEmail(null);
    setToastMessage(`Access successfully revoked for ${email}. Future original affidavit downloads will be blocked.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRestoreAccess = (email: string) => {
    const nextRevoked = new Set(revokedEmails);
    nextRevoked.delete(email);
    setRevokedEmails(nextRevoked);

    try {
      localStorage.setItem("affidavit_revoked_emails", JSON.stringify(Array.from(nextRevoked)));
    } catch (err) {
      console.error("Failed to persist restoration state:", err);
    }

    const updatedLogs = logs.map((log) => (log.userEmail === email ? { ...log, status: "authorized" as const } : log));
    setLogs(updatedLogs);

    setConfirmingRestoreEmail(null);
    setToastMessage(`Access successfully restored for ${email}. The account can now download original affidavits.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchTerm.toLowerCase();
    const isRevoked = revokedEmails.has(log.userEmail) || log.status === "revoked";
    
    if (statusFilter === "revoked" && !isRevoked) return false;
    if (statusFilter === "authorized" && isRevoked) return false;

    const logDate = new Date(log.timestamp).getTime();
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      if (!isNaN(startMs) && logDate < startMs) return false;
    }
    if (endDate) {
      // Include the entire end day (set to 23:59:59.999)
      const endMs = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
      if (!isNaN(endMs) && logDate > endMs) return false;
    }

    return (
      (log.userName && log.userName.toLowerCase().includes(query)) ||
      log.userEmail.toLowerCase().includes(query) ||
      log.documentTitle.toLowerCase().includes(query) ||
      log.documentId.toLowerCase().includes(query) ||
      log.ipAddress.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Original Affidavit Download Audit Logs</span>
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of authenticated downloads of unredacted case dossiers with instant revocation controls.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/40"
            title="Download currently filtered audit logs as a CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Logs</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4 relative">
        {/* Top-Right Fixed Success Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md" role="status" aria-live="polite">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div className="text-xs font-medium flex-1">
              <p>{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer ml-1"
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar, Status Filter, and Date Range Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by officer email, document title, or IP address..."
              className="w-full h-10 pl-9 pr-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "revoked" | "authorized")}
              aria-label="Filter audit logs by access status"
              className="h-10 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="revoked">Revoked Only</option>
              <option value="authorized">Authorized Only</option>
            </select>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-10">
              <span className="text-[11px] text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Start date filter"
                className="text-xs bg-transparent text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              />
              <span className="text-[11px] text-slate-400 font-medium ml-1">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="End date filter"
                className="text-xs bg-transparent text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1 px-1 font-medium"
                  title="Clear date filter"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-2">
              {filteredLogs.length} / {logs.length}
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/80">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">User Account</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">Accessed Document</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300">IP & Client</TableHead>
                <TableHead className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">Status & Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No matching audit events found.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const isRevoked = revokedEmails.has(log.userEmail) || log.status === "revoked";
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${isRevoked ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400" : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"}`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{log.userEmail}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">ID: {log.userId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate" title={log.documentTitle}>
                          {log.documentTitle}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">Doc ID: {log.documentId}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                        <p className="truncate">{log.ipAddress}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]" title={log.userAgent}>
                          {log.userAgent}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isRevoked ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <UserX className="w-3 h-3" />
                                <span>REVOKED</span>
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmingRestoreEmail(log.userEmail)}
                                className="h-7 px-2 text-[11px] font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                                title="Restore affidavit download access for this user"
                              >
                                Restore
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck className="w-3 h-3" />
                                <span>AUTHORIZED</span>
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmingRevokeEmail(log.userEmail)}
                                className="h-7 px-2 text-[11px] font-medium border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
                                title="Revoke affidavit download access for this user"
                              >
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Confirmation Modal for Revoking Access */}
      {confirmingRevokeEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-full text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Access Revocation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action blocks further downloads immediately.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to revoke original affidavit download access for <strong className="text-slate-900 dark:text-white font-mono">{confirmingRevokeEmail}</strong>? Their historical audit trail will be preserved, but any new download requests will be strictly denied.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingRevokeEmail(null)}
                className="border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevokeAccess(confirmingRevokeEmail)}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Revoke Access
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Restoring Access */}
      {confirmingRestoreEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 rounded-full text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Confirm Access Restoration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action reinstates download privileges.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to restore original affidavit download access for <strong className="text-slate-900 dark:text-white font-mono">{confirmingRestoreEmail}</strong>? The user will immediately be permitted to download unredacted original case files again.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingRestoreEmail(null)}
                className="border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleRestoreAccess(confirmingRestoreEmail)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Yes, Restore Access
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
