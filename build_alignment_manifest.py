from pathlib import Path
from pypdf import PdfReader
from difflib import SequenceMatcher
import json
import re

OFFICIAL = Path('/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf')
UNOFFICIAL = Path('/home/ubuntu/upload/officialaffidavitwithevidence(1).pdf')
OUT = Path('/home/ubuntu/evidence-website/source-extract')
OUT.mkdir(parents=True, exist_ok=True)


def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text or '').strip().casefold()


def page_records(path: Path):
    reader = PdfReader(str(path))
    return [{'page': index + 1, 'text': page.extract_text() or ''} for index, page in enumerate(reader.pages)]

official = page_records(OFFICIAL)
unofficial = page_records(UNOFFICIAL)

alignment = []
for official_page in official:
    best = None
    for unofficial_page in unofficial:
        score = SequenceMatcher(None, normalize(official_page['text']), normalize(unofficial_page['text'])).ratio()
        candidate = {'unofficial_page': unofficial_page['page'], 'similarity': round(score, 6)}
        if best is None or score > best['similarity']:
            best = candidate
    alignment.append({'official_page': official_page['page'], 'best_unofficial_match': best})

url_re = re.compile(r'https?://[^\s)\]>]+', re.I)
url_records = []
for record in unofficial:
    for match in url_re.findall(record['text']):
        url = match.rstrip('.,;')
        if 'youtube' in url.lower() or 'youtu.be' in url.lower():
            provider = 'youtube'
        elif 'facebook' in url.lower():
            provider = 'facebook'
        elif 'drive.google' in url.lower():
            provider = 'google-drive'
        else:
            provider = 'external'
        url_records.append({'unofficial_page': record['page'], 'provider': provider, 'url': url})

# De-duplicate exact URL occurrences while retaining the source page list.
dedup = {}
for item in url_records:
    key = (item['provider'], item['url'])
    dedup.setdefault(key, {'provider': item['provider'], 'url': item['url'], 'unofficial_pages': []})
    if item['unofficial_page'] not in dedup[key]['unofficial_pages']:
        dedup[key]['unofficial_pages'].append(item['unofficial_page'])

section_re = re.compile(r'^(?:\s*(?:TESTIMONY|EVIDENCE|AFFIDAVIT|SECTION|I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|VIII\.|IX\.|X\.|XI\.|XII\.).*)$', re.I)
sections = []
for record in official:
    lines = [line.strip() for line in record['text'].splitlines() if line.strip()]
    hits = [line for line in lines if section_re.match(line)]
    sections.append({'official_page': record['page'], 'candidate_headings': hits[:20]})

manifest = {
    'source_integrity': {
        'official_path': str(OFFICIAL),
        'unofficial_path': str(UNOFFICIAL),
        'official_page_count': len(official),
        'unofficial_page_count': len(unofficial),
        'official_text_is_not_rewritten': True,
        'matching_method': 'casefolded whitespace-normalized page-text similarity; source bytes remain unchanged',
    },
    'page_alignment': alignment,
    'candidate_sections': sections,
    'external_evidence_links': list(dedup.values()),
}
(OUT / 'official-unofficial-alignment.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

with (OUT / 'official-unofficial-alignment.md').open('w', encoding='utf-8') as f:
    f.write('# Official / Unofficial Affidavit Alignment Manifest\n\n')
    f.write('This is a source-traceability manifest. It does not alter the official affidavit text.\n\n')
    f.write(f"Official source pages: {len(official)}  \nUnofficial evidence source pages: {len(unofficial)}\n\n")
    f.write('## Page Alignment\n\n')
    f.write('| Official page | Best matching unofficial page | Similarity |\n|---:|---:|---:|\n')
    for item in alignment:
        match = item['best_unofficial_match']
        f.write(f"| {item['official_page']} | {match['unofficial_page']} | {match['similarity']:.4f} |\n")
    f.write('\n## Evidence Links\n\n')
    f.write('| Provider | Source page(s) | Link |\n|---|---:|---|\n')
    for item in dedup.values():
        pages = ', '.join(str(page) for page in item['unofficial_pages'])
        f.write(f"| {item['provider']} | {pages} | {item['url']} |\n")
    f.write('\n## Candidate Section Headings\n\n')
    for item in sections:
        if item['candidate_headings']:
            f.write(f"### Official page {item['official_page']}\n\n")
            for heading in item['candidate_headings']:
                f.write(f"- {heading}\n")
            f.write('\n')

print(f'Wrote {OUT / "official-unofficial-alignment.json"}')
print(f'Wrote {OUT / "official-unofficial-alignment.md"}')
print(f'Indexed {len(dedup)} unique external evidence links')
for item in dedup.values():
    print(item['provider'], item['url'])
