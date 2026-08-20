import React, { useState } from "react";
import { ShieldCheck, Download, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface SecureOriginalDownloadButtonProps {
  documentTitle: string;
  documentId: string;
  originalAssetPath?: string;
  className?: string;
}

export const SecureOriginalDownloadButton: React.FC<SecureOriginalDownloadButtonProps> = ({
  documentTitle,
  documentId,
  originalAssetPath = "/artifacts/official-affidavit-evidence-dossier-87-pages.pdf",
  className = "",
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isRevoked = (() => {
    try {
      const stored = localStorage.getItem("affidavit_revoked_emails");
      if (stored && user?.email) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(user.email)) return true;
      }
    } catch {
      // Ignore storage errors
    }
    return false;
  })();

  const isAdminOrAuthorized = (user?.role === "admin" || user?.email?.endsWith("@masterkanorcase.online") || user?.email === "tanauancharles1@gmail.com") && !isRevoked;

  const handleSecureDownload = async () => {
    setAuthError(null);
    if (!isAuthenticated || !user) {
      setAuthError("Authentication required. Please sign in with an authorized account to download the unredacted original document.");
      return;
    }

    if (isRevoked) {
      setAuthError("Access revoked. Your account's privilege to download original unredacted affidavits has been revoked by an administrator.");
      return;
    }

    if (!isAdminOrAuthorized) {
      setAuthError("Access denied. The non-anonymized original affidavit is restricted to designated administrators and authorized case officers.");
      return;
    }

    setIsVerifying(true);
    try {
      // Log audit trail event (simulated secure audit webhook / audit log entry)
      console.log(`[AUDIT] Secure original document download authorized for user: ${user.email} (ID: ${user.id}) - Doc: ${documentId} (${documentTitle}) at ${new Date().toISOString()}`);

      // Simulate cryptographic verification and signed asset retrieval
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Trigger secure download
      const anchor = window.document.createElement("a");
      anchor.href = originalAssetPath;
      anchor.download = `AFFIDAVIT_ORIGINAL_UNREDACTED_${documentId}.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
    } catch (err) {
      console.error("Secure download failed:", err);
      setAuthError("Failed to initialize secure download channel. Please retry.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSecureDownload}
        disabled={isVerifying}
        className={`inline-flex items-center gap-2 border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/60 transition-colors ${className}`}
        title="Securely download the unredacted original affidavit (Authorized personnel only)"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Verifying Authorization...</span>
          </>
        ) : isAdminOrAuthorized ? (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Download Original (Secure)</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Download Original (Restricted)</span>
          </>
        )}
      </Button>

      {authError && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Authorization Required</p>
            <p className="mt-0.5">{authError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
