from __future__ import annotations

import json
import re
import shutil
import zipfile
from pathlib import Path

from PIL import Image, ImageOps

PROJECT = Path('/home/ubuntu/evidence-website')
INVENTORY = Path('/tmp/gallery-asset-inventory.json')
NESTED_ZIP = Path('/tmp/evidence-export-part-1.zip')
ASSET_ROOT = Path('/home/ubuntu/webdev-static-assets/evidence-website/gallery')
OUTPUT_MANIFEST = PROJECT / 'source-extract/gallery-asset-manifest.json'

ASSET_ROOT.mkdir(parents=True, exist_ok=True)
for existing in ASSET_ROOT.iterdir():
    if existing.is_file():
        existing.unlink()

inventory = json.loads(INVENTORY.read_text())
entries = []
seen_members: set[str] = set()

with zipfile.ZipFile(NESTED_ZIP) as archive:
    for match in inventory['matches']:
        filename = match['filename']
        members = [member for member in match['members'] if member not in seen_members]
        if not members:
            continue
        member = members[0]
        seen_members.add(member)
        safe_id = re.sub(r'[^a-zA-Z0-9_-]+', '-', Path(filename).stem).strip('-').lower()
        destination = ASSET_ROOT / f"{len(entries) + 1:04d}-{safe_id}.webp"
        raw_path = ASSET_ROOT / f".raw-{len(entries):04d}{Path(filename).suffix.lower()}"
        raw_path.write_bytes(archive.read(member))
        try:
            with Image.open(raw_path) as image:
                image = ImageOps.exif_transpose(image).convert('RGB')
                image.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                image.save(destination, 'WEBP', quality=78, method=6)
            width, height = image.size
        finally:
            raw_path.unlink(missing_ok=True)
        entries.append({
            'filename': filename,
            'archiveMember': member,
            'assetPath': str(destination.relative_to(Path('/home/ubuntu/webdev-static-assets'))),
            'width': width,
            'height': height,
        })

OUTPUT_MANIFEST.write_text(json.dumps({
    'sourceArchive': 'supplied nested evidence archive',
    'assetCount': len(entries),
    'assets': entries,
}, indent=2) + '\n')
print(json.dumps({
    'assetCount': len(entries),
    'assetRoot': str(ASSET_ROOT),
    'manifest': str(OUTPUT_MANIFEST),
}, indent=2))
