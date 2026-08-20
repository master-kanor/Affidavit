import type { AffidavitImageCatalogItem } from "@/data/affidavitImageCatalog";
import { loadAdminAnnotations } from "@/utils/adminAnnotations";

export function exportCatalogToPdfReport(items: readonly AffidavitImageCatalogItem[], searchFilter?: string) {
  const filterLabel = searchFilter ? `Search Query: "${searchFilter}"` : "All Indexed Evidence Records";
  const timestamp = new Date().toLocaleString();
  const annotations = loadAdminAnnotations();

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Master Kanor Affidavit - Filtered Evidence Catalog Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; }
    header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; }
    .meta { font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
    .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: middle; }
    th { background: #0f172a; color: #fff; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .thumb { width: 48px; height: 36px; background: #e2e8f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #475569; font-weight: 600; }
    footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Master Kanor Affidavit — Evidence Catalog Report</h1>
    <div class="meta">
      <span>Location: Tacloban City, Leyte, 6500</span>
      <span>Generated: ${timestamp}</span>
    </div>
  </header>

  <div class="summary">
    <strong>Report Scope:</strong> ${filterLabel}<br>
    <strong>Total Matched Records:</strong> ${items.length} extracted image assets<br>
    <strong>Source Traceability:</strong> Mapped to verified official affidavit appendix pages (87-page dossier standard).
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px;">Ref</th>
        <th style="width: 60px;">Preview</th>
        <th>Filename / Asset</th>
        <th>Category / Group</th>
        <th style="width: 90px;">Appendix Page</th>
        <th style="width: 80px;">Dimensions</th>
        <th>Admin Tags / Annotation</th>
      </tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item) => `
        <tr>
          <td><strong>#${item.evidenceItem}</strong></td>
          <td><div class="thumb">P.${item.appendixPage}</div></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${item.filename}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace;">ID: ${item.id}</div>
          </td>
          <td>${item.group}</td>
          <td>Page ${item.appendixPage} (Slot ${item.slot})</td>
          <td>${item.width}×${item.height}</td>
          <td>
            <div style="font-size: 10px; color: #0f172a;">${(annotations[item.id]?.tags ?? []).join(", ") || "—"}</div>
            <div style="font-size: 10px; color: #64748b;">${annotations[item.id]?.note || "No annotation"}</div>
          </td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <footer>
    Official Affidavit &amp; Evidence Documentation System · Confidential Legal Record
  </footer>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the PDF report.");
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
