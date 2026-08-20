from __future__ import annotations

import hashlib
import io
import json
import math
import os
import re
import shutil
import tempfile
from pathlib import Path
from zipfile import ZipFile

from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from PIL import Image

OFFICIAL = Path('/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf')
ARCHIVE = Path('/tmp/evidence-archive-inspect/part-1.zip')
OUT_DIR = Path('/home/ubuntu/evidence-website/artifacts')
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PDF = OUT_DIR / 'official-affidavit-evidence-dossier-87-pages.pdf'
OUT_MANIFEST = OUT_DIR / 'official-affidavit-evidence-dossier-87-pages.json'

TARGET_PAGE_COUNT = 87
ORIGINAL_PAGE_COUNT = len(PdfReader(str(OFFICIAL)).pages)
APPENDIX_PAGE_COUNT = TARGET_PAGE_COUNT - ORIGINAL_PAGE_COUNT
MAX_IMAGES_PER_PAGE = 6
MIN_IMAGES_PER_PAGE = 5


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def sanitize_name(value: str) -> str:
    value = re.sub(r'[^A-Za-z0-9._-]+', '_', value)
    return value[:160] or 'asset'


def fit_box(width: float, height: float, max_width: float, max_height: float) -> tuple[float, float]:
    if width <= 0 or height <= 0:
        return max_width, max_height
    scale = min(max_width / width, max_height / height)
    return width * scale, height * scale


def collect_assets(temp_dir: Path):
    assets = []
    seen_hashes = set()
    with ZipFile(ARCHIVE) as z:
        for info in z.infolist():
            name = info.filename
            if info.is_dir() or not name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
                continue
            raw = z.read(name)
            digest = hashlib.sha256(raw).hexdigest()
            # Preserve unique source images only; repeated archive exports are not
            # counted twice in the final gallery.
            if digest in seen_hashes:
                continue
            seen_hashes.add(digest)
            out = temp_dir / f'{len(assets)+1:04d}_{digest[:12]}.jpg'
            try:
                with Image.open(io.BytesIO(raw)) as img:
                    img.load()
                    if img.mode in ('RGBA', 'LA'):
                        background = Image.new('RGB', img.size, 'white')
                        background.paste(img.convert('RGBA'), mask=img.getchannel('A'))
                        img = background
                    else:
                        img = img.convert('RGB')
                    img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                    width, height = img.size
                    img.save(out, format='JPEG', quality=78, optimize=True)
            except Exception:
                continue
            parts = name.split('/')
            group = parts[-2] if len(parts) >= 2 else 'Source archive'
            assets.append({
                'archive_path': name,
                'local_path': str(out),
                'sha256': digest,
                'filename': Path(name).name,
                'group': group,
                'width': width,
                'height': height,
                'mime': 'image/jpeg',
            })
    return assets


def page_image_count(page_index: int, asset_count: int) -> int:
    base = asset_count // APPENDIX_PAGE_COUNT
    remainder = asset_count % APPENDIX_PAGE_COUNT
    return base + (1 if page_index < remainder else 0)


def build_appendix_pdf(path: Path, assets: list[dict], total_pages: int):
    page_width, page_height = 612, 792
    c = canvas.Canvas(str(path), pagesize=(page_width, page_height))
    margin_x = 28
    header_y = page_height - 32
    footer_y = 20
    gap_x = 12
    gap_y = 11
    card_width = (page_width - 2 * margin_x - gap_x) / 2
    card_height = 226
    image_max_w = card_width - 16
    image_max_h = 172
    title_font = 'Helvetica-Bold'
    body_font = 'Helvetica'

    for page_index in range(APPENDIX_PAGE_COUNT):
        appendix_page = page_index + 1
        absolute_page = ORIGINAL_PAGE_COUNT + appendix_page
        start = sum(page_image_count(index, len(assets)) for index in range(page_index))
        images_on_page = page_image_count(page_index, len(assets))
        chunk = assets[start:start + images_on_page]
        c.setFillColorRGB(0.96, 0.97, 0.98)
        c.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        c.setFillColorRGB(0.08, 0.12, 0.20)
        c.setFont(title_font, 13)
        c.drawString(margin_x, header_y, 'Testimony 1 — Evidence Gallery Appendix')
        c.setFont(body_font, 7.5)
        c.setFillColorRGB(0.28, 0.32, 0.38)
        c.drawRightString(page_width - margin_x, header_y, f'Page {absolute_page} of {total_pages}')
        c.setStrokeColorRGB(0.75, 0.78, 0.82)
        c.line(margin_x, header_y - 10, page_width - margin_x, header_y - 10)

        positions = [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0), (2, 1)]
        for slot, item in enumerate(chunk):
            row, col = positions[slot]
            x = margin_x + col * (card_width + gap_x)
            y = page_height - 58 - (row + 1) * card_height - row * gap_y
            c.setFillColorRGB(1, 1, 1)
            c.setStrokeColorRGB(0.83, 0.85, 0.88)
            c.roundRect(x, y, card_width, card_height, 8, fill=1, stroke=1)
            try:
                with Image.open(item['local_path']) as img:
                    iw, ih = img.size
                draw_w, draw_h = fit_box(iw, ih, image_max_w, image_max_h)
                image_x = x + (card_width - draw_w) / 2
                image_y = y + card_height - 186 + (image_max_h - draw_h) / 2
                c.drawImage(ImageReader(item['local_path']), image_x, image_y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask='auto')
            except Exception:
                c.setFillColorRGB(0.45, 0.48, 0.52)
                c.setFont(body_font, 9)
                c.drawCentredString(x + card_width / 2, y + 126, 'Image preview unavailable')
            c.setFillColorRGB(0.08, 0.12, 0.20)
            c.setFont(title_font, 8)
            c.drawString(x + 8, y + 28, f"Evidence item {start + slot + 1:03d}")
            c.setFillColorRGB(0.30, 0.33, 0.37)
            c.setFont(body_font, 7)
            label = f"{item['group']} / {item['filename']}"
            label = label if len(label) <= 70 else label[:67] + '...'
            c.drawString(x + 8, y + 16, label)

        c.setFillColorRGB(0.35, 0.38, 0.43)
        c.setFont(body_font, 7)
        c.drawString(margin_x, footer_y, 'Appendix images are copied from the supplied evidence archive. Original affidavit text pages precede this appendix unchanged.')
        c.drawRightString(page_width - margin_x, footer_y, f'Appendix {appendix_page}/{APPENDIX_PAGE_COUNT}')
        c.showPage()
    c.save()


def main():
    if ORIGINAL_PAGE_COUNT != 12:
        raise RuntimeError(f'Expected the supplied official source to be 12 pages; found {ORIGINAL_PAGE_COUNT}')
    with tempfile.TemporaryDirectory(prefix='affidavit-gallery-') as temp:
        assets = collect_assets(Path(temp))
        if len(assets) < APPENDIX_PAGE_COUNT * MIN_IMAGES_PER_PAGE:
            raise RuntimeError(f'Need at least {APPENDIX_PAGE_COUNT * MIN_IMAGES_PER_PAGE} unique images for {TARGET_PAGE_COUNT} pages; found {len(assets)}')
        appendix_pdf = Path(temp) / 'appendix.pdf'
        build_appendix_pdf(appendix_pdf, assets, TARGET_PAGE_COUNT)
        writer = PdfWriter()
        original_reader = PdfReader(str(OFFICIAL))
        for page in original_reader.pages:
            writer.add_page(page)
        appendix_reader = PdfReader(str(appendix_pdf))
        for page in appendix_reader.pages:
            writer.add_page(page)
        with OUT_PDF.open('wb') as f:
            writer.write(f)
        final_reader = PdfReader(str(OUT_PDF))
        original_text_hashes = [hashlib.sha256((p.extract_text() or '').encode('utf-8')).hexdigest() for p in original_reader.pages]
        final_text_hashes = [hashlib.sha256((final_reader.pages[i].extract_text() or '').encode('utf-8')).hexdigest() for i in range(ORIGINAL_PAGE_COUNT)]
        if original_text_hashes != final_text_hashes:
            raise RuntimeError('Original affidavit page text changed during append-only generation')
        if len(final_reader.pages) != TARGET_PAGE_COUNT:
            raise RuntimeError(f'Expected {TARGET_PAGE_COUNT} final pages; found {len(final_reader.pages)}')
        manifest = {
            'artifact': str(OUT_PDF),
            'official_source': str(OFFICIAL),
            'official_source_sha256': sha256(OFFICIAL),
            'final_artifact_sha256': sha256(OUT_PDF),
            'original_page_count': ORIGINAL_PAGE_COUNT,
            'appendix_page_count': APPENDIX_PAGE_COUNT,
            'final_page_count': len(final_reader.pages),
            'max_images_per_appendix_page': MAX_IMAGES_PER_PAGE,
            'min_images_per_appendix_page': MIN_IMAGES_PER_PAGE,
            'unique_source_image_count': len(assets),
            'original_text_page_hashes_preserved': True,
            'integrity_statement': 'The first 12 pages are copied from the supplied official PDF. Gallery pages are append-only source-asset pages and do not rewrite the original affidavit text.',
            'appendix_asset_index': [
                {
                    'evidence_item': index + 1,
                    'appendix_page': ORIGINAL_PAGE_COUNT + next(page for page in range(APPENDIX_PAGE_COUNT) if index < sum(page_image_count(i, len(assets)) for i in range(page + 1))) + 1,
                    'slot': index - sum(page_image_count(i, len(assets)) for i in range(next(page for page in range(APPENDIX_PAGE_COUNT) if index < sum(page_image_count(j, len(assets)) for j in range(page + 1))))) + 1,
                    'archive_path': item['archive_path'],
                    'group': item['group'],
                    'filename': item['filename'],
                    'sha256': item['sha256'],
                    'width': item['width'],
                    'height': item['height'],
                    'mime': item['mime'],
                }
                for index, item in enumerate(assets[:APPENDIX_PAGE_COUNT * MAX_IMAGES_PER_PAGE])
            ],
        }
        OUT_MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({
            'artifact': str(OUT_PDF),
            'manifest': str(OUT_MANIFEST),
            'original_page_count': ORIGINAL_PAGE_COUNT,
            'appendix_page_count': APPENDIX_PAGE_COUNT,
            'final_page_count': len(final_reader.pages),
            'indexed_unique_images': len(assets),
        }, indent=2))


if __name__ == '__main__':
    main()
