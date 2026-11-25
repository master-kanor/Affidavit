#!/usr/bin/env python3
"""Idempotently seed the canonical Master Kanor case into Supabase.

This script intentionally uses only the server-side service-role credential. It
never prints credentials or affidavit body text. The source JSON is committed
at supabase/seed/canonical-case.json and all records use deterministic IDs or
PostgREST conflict keys so rerunning the script is safe.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

BASE = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SEED = Path(__file__).resolve().parents[1] / "supabase" / "seed" / "canonical-case.json"
OWNER = "62d6e3ec-a8a2-42b0-affd-8dcd24e46464"
ADMIN = "87c7a0fe-69f6-4d78-934c-4c16c69e011c"
USER = "8fb303e1-bca0-4c54-bc71-f233a09749c8"
CASE_ID = "master-kanor-case"

if not BASE or not KEY:
    raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
if not SEED.is_file():
    raise SystemExit(f"Canonical seed source not found: {SEED}")

data = json.loads(SEED.read_text(encoding="utf-8"))
case = data["case"]
sections = data["sections"]

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Accept-Profile": "public",
    "Content-Profile": "public",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}


def request_json(path: str, *, method: str = "GET", body: object | None = None, prefer: str | None = None):
    request_headers = dict(headers)
    if prefer:
        request_headers["Prefer"] = prefer
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE}/rest/v1/{path}", data=payload, headers=request_headers, method=method
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:1000]
        raise RuntimeError(f"Supabase request failed for {path}: HTTP {exc.code}: {detail}") from exc


def upsert(table: str, rows: list[dict], conflict: str) -> None:
    if not rows:
        return
    request_json(
        f"{table}?on_conflict={urllib.parse.quote(conflict, safe=',')}",
        method="POST",
        body=rows,
    )


# Validate the source before touching the database.
text_count = sum(len(section.get("sourceText", [])) for section in sections)
raw_evidence_count = sum(
    len(gallery.get("items", []))
    for section in sections
    for gallery in section.get("galleries", [])
)
evidence_ids = {
    item["id"]
    for section in sections
    for gallery in section.get("galleries", [])
    for item in gallery.get("items", [])
}
if len(sections) != 18 or text_count != 98 or len(evidence_ids) != 66:
    raise SystemExit(
        f"Unexpected canonical source counts: sections={len(sections)}, "
        f"source_text={text_count}, gallery_evidence={raw_evidence_count}, "
        f"unique_evidence={len(evidence_ids)}; expected 18/98/66"
    )

upsert(
    "case_records",
    [{
        "id": CASE_ID,
        "title": case["title"],
        "description": case["subtitle"],
        "status": "active",
        "created_by": OWNER,
    }],
    "id",
)

section_rows: list[dict] = []
text_rows: list[dict] = []
for sort_order, section in enumerate(sections, start=1):
    section_rows.append({
        "id": section["id"],
        "case_id": CASE_ID,
        "section_number": section.get("number") or None,
        "title": section["title"],
        "sort_order": sort_order,
        "source_label": section.get("sourceLabel") or None,
        "approval_status": "accepted",
    })
    for paragraph_order, paragraph in enumerate(section.get("sourceText", []), start=1):
        text_rows.append({
            "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{CASE_ID}/source-original/{section['id']}/{paragraph_order}")),
            "section_id": section["id"],
            "version_kind": "source_original",
            "text_content": paragraph["text"],
            "source_reference": f"{section.get('sourceLabel') or 'Canonical affidavit source'}; paragraph {paragraph.get('number') or paragraph_order}",
            "created_by": OWNER,
        })
upsert("affidavit_sections", section_rows, "id")
upsert("affidavit_text_versions", text_rows, "id")

evidence_rows: list[dict] = []
for section in sections:
    for gallery in section.get("galleries", []):
        for item in gallery.get("items", []):
            evidence_rows.append({
                "id": item["id"],
                "case_id": CASE_ID,
                "title": item["title"],
                "description": gallery.get("title"),
                "asset_type": item.get("type", "image"),
                "preview_url": None,
                "source_url": None,
                "verification_state": item.get("verificationState", "unverified"),
                "provenance_kind": "unofficial_evidence_landing_source",
                "metadata": {
                    "section_id": section["id"],
                    "gallery_id": gallery["id"],
                    "icon": item.get("icon"),
                    "source": item.get("source"),
                },
                "created_by": OWNER,
            })
upsert("evidence_assets", evidence_rows, "id")

upsert(
    "case_members",
    [
        {"case_id": CASE_ID, "user_id": OWNER, "can_view": True, "can_edit": True, "can_export": True},
        {"case_id": CASE_ID, "user_id": ADMIN, "can_view": True, "can_edit": True, "can_export": True},
        {"case_id": CASE_ID, "user_id": USER, "can_view": True, "can_edit": False, "can_export": True},
    ],
    "case_id,user_id",
)

grants = [
    {"user_id": USER, "resource_type": "affidavit_section", "resource_id": section["id"], "can_view": True, "can_download": True}
    for section in sections
]
grants.extend(
    {"user_id": USER, "resource_type": "evidence", "resource_id": item["id"], "can_view": True, "can_download": True}
    for item in evidence_rows
)
upsert("resource_permissions", grants, "user_id,resource_type,resource_id")


def count(table: str, query: str) -> int:
    _, rows = request_json(f"{table}?{query}")
    return len(rows or [])

actual = {
    "case_records": count("case_records", f"id=eq.{CASE_ID}&select=id"),
    "sections": count("affidavit_sections", f"case_id=eq.{CASE_ID}&select=id"),
    "source_text_entries": count("affidavit_text_versions", "version_kind=eq.source_original&select=id"),
    "evidence_assets": count("evidence_assets", f"case_id=eq.{CASE_ID}&select=id"),
    "case_members": count("case_members", f"case_id=eq.{CASE_ID}&select=id"),
    "user_resource_grants": count("resource_permissions", f"user_id=eq.{USER}&select=user_id"),
}
expected = {
    "case_records": 1,
    "sections": 18,
    "source_text_entries": 98,
    "evidence_assets": 66,
    "case_members": 3,
    "user_resource_grants": 84,
}
if actual != expected:
    raise SystemExit(f"Seed verification failed: {json.dumps(actual, sort_keys=True)}")
print(json.dumps(actual, indent=2, sort_keys=True))
