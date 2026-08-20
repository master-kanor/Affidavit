from __future__ import annotations

import json
from pathlib import Path

source = Path("artifacts/official-affidavit-evidence-dossier-87-pages.json")
out = Path("client/src/data/affidavitImageCatalog.ts")
data = json.loads(source.read_text(encoding="utf-8"))
items = data["appendix_asset_index"]
records = []
for item in items:
    records.append(
        {
            "id": f"source-image-{item['evidence_item']}",
            "evidenceItem": item["evidence_item"],
            "appendixPage": item["appendix_page"],
            "slot": item["slot"],
            "filename": item["filename"],
            "group": item["group"],
            "width": item["width"],
            "height": item["height"],
            "mime": item["mime"],
        }
    )
out.write_text(
    "// Generated from the verified appendix asset index. Metadata only; no source bytes are duplicated here.\n"
    "export interface AffidavitImageCatalogItem {\n"
    "  id: string; evidenceItem: number; appendixPage: number; slot: number; filename: string; group: string; width: number; height: number; mime: string;\n"
    "}\n\n"
    f"export const affidavitImageCatalog: readonly AffidavitImageCatalogItem[] = {json.dumps(records, ensure_ascii=False, indent=2)} as const;\n",
    encoding="utf-8",
)
print({"output": str(out), "items": len(records)})
