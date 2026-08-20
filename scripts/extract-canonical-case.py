from __future__ import annotations

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

SOURCE = Path('/home/ubuntu/projects/affidavit-f87b34c0/affidavit_evidence_landing.html')
OUTPUT = Path('/home/ubuntu/Affidavit/supabase/seed/canonical-case.json')
TS_OUTPUT = Path('/home/ubuntu/Affidavit/supabase/seed/canonicalCase.source.ts')


def clean(value: str) -> str:
    return ' '.join(value.split()).strip()


def extract_section(block) -> dict:
    header = block.select_one('.section-header')
    number = header.select_one('.section-num') if header else None
    title = header.select_one('.section-title') if header else None
    badge = header.select_one('.section-badge') if header else None
    testimony = block.select_one('.testimony-block')
    label = testimony.select_one('.testimony-label') if testimony else None
    text_node = testimony.select_one('.testimony-text') if testimony else None

    paragraphs = []
    if text_node:
        for idx, li in enumerate(text_node.select('li')):
            start = int(li.parent.get('start')) if li.parent and li.parent.has_attr('start') and str(li.parent.get('start')).isdigit() else None
            paragraphs.append({'number': str(start + idx) if start is not None else None, 'text': li.get_text(' ', strip=True)})
        if not paragraphs:
            raw = text_node.get_text('\n', strip=True)
            paragraphs = [{'number': None, 'text': line.strip()} for line in raw.splitlines() if line.strip()]

    galleries = []
    for gallery in block.select('.evidence-gallery'):
        gallery_title = gallery.select_one('.evidence-gallery-title')
        items = []
        for idx, card in enumerate(gallery.select('.photo-card, .video-card, .document-card, .evidence-card')):
            evidence_id = None
            onclick = card.get('onclick', '')
            match = re.search(r"['\"]([^'\"]+)['\"]", onclick)
            if match:
                evidence_id = match.group(1)
            icon = card.select_one('.ph-icon, .video-icon, .doc-icon')
            item_title = card.select_one('.ph-label, .video-label, .doc-label, .evidence-label')
            items.append({
                'id': evidence_id or f"{block.get('id', 'section')}-evidence-{idx + 1}",
                'title': clean(item_title.get_text(' ', strip=True) if item_title else card.get_text(' ', strip=True).replace('Upload / View', '')),
                'icon': clean(icon.get_text(' ', strip=True) if icon else 'Evidence'),
                'type': 'image',
                'verificationState': 'unverified',
                'source': 'Unofficial affidavit evidence landing source',
            })
        galleries.append({
            'id': f"{block.get('id', 'section')}-gallery-{len(galleries) + 1}",
            'title': clean(gallery_title.get_text(' ', strip=True) if gallery_title else 'Evidence Gallery'),
            'items': items,
        })

    links = []
    for a in block.select('a[href]'):
        href = a.get('href', '').strip()
        if href.startswith('http'):
            links.append({'label': clean(a.get_text(' ', strip=True)) or href, 'url': href})

    source_label = clean(label.get_text(' ', strip=True) if label else '')
    section_id = block.get('id') or 'section'
    return {
        'id': section_id,
        'number': clean(number.get_text(' ', strip=True) if number else ''),
        'title': clean(title.get_text(' ', strip=True) if title else block.get_text(' ', strip=True)[:120]),
        'badge': clean(badge.get_text(' ', strip=True) if badge else 'SOURCE TEXT'),
        'sourceLabel': source_label,
        'sourceText': paragraphs,
        'galleries': galleries,
        'links': links,
    }


def main() -> None:
    soup = BeautifulSoup(SOURCE.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
    sections = [extract_section(block) for block in soup.select('.section-block')]
    payload = {
        'case': {
            'id': 'master-kanor-case',
            'title': 'MASTER KANOR CASE',
            'subtitle': 'AI KNOWLEDGE, MEMORY, EVIDENCE INTELLIGENCE, AFFIDAVIT BUILDER AND DOCUMENTARY SYSTEM',
            'affiant': 'CHARLES TANAUAN',
            'sourceLabel': 'Supplied unofficial evidence landing source mapped to supplied official affidavit text source',
            'sourceIntegrityNote': 'Source text is preserved exactly as extracted. Gallery labels and relationships are separate records and are not inserted into the text-only source.',
        },
        'sections': sections,
        'generatedFrom': str(SOURCE),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, ensure_ascii=False, indent=2)
    OUTPUT.write_text(serialized + '\n', encoding='utf-8')
    TS_OUTPUT.write_text('export const canonicalCase = ' + serialized + ' as const;\n', encoding='utf-8')
    print(f'Wrote {OUTPUT} and {TS_OUTPUT} with {len(sections)} sections')
    for section in sections:
        paragraph_count = len(section['sourceText'])
        evidence_count = sum(len(g['items']) for g in section['galleries'])
        print(f"{section['id']}: paragraphs={paragraph_count} evidence={evidence_count}")


if __name__ == '__main__':
    main()
