from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

source = Path('/home/ubuntu/upload/affidavit_evidence_landing.docx')
out = Path('/home/ubuntu/evidence-website/source-extract')
out.mkdir(parents=True, exist_ok=True)

ns = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

with ZipFile(source) as z:
    document_xml = z.read('word/document.xml')
    rels = {}
    if 'word/_rels/document.xml.rels' in z.namelist():
        rel_root = ET.fromstring(z.read('word/_rels/document.xml.rels'))
        for rel in rel_root:
            rels[rel.attrib.get('Id')] = rel.attrib.get('Target')

root = ET.fromstring(document_xml)
paragraphs = []
links = []
for p in root.findall('.//w:body/w:p', ns):
    text_parts = []
    for node in p.iter():
        if node.tag == f"{{{ns['w']}}}t":
            text_parts.append(node.text or '')
        if node.tag == f"{{{ns['w']}}}tab":
            text_parts.append('\t')
        if node.tag == f"{{{ns['w']}}}br":
            text_parts.append('\n')
    text = ''.join(text_parts).strip()
    if text:
        paragraphs.append(text)
    for hyperlink in p.findall('.//w:hyperlink', ns):
        rid = hyperlink.attrib.get(f"{{{ns['r']}}}id")
        label = ''.join((t.text or '') for t in hyperlink.findall('.//w:t', ns))
        target = rels.get(rid)
        links.append((label, target))

(out / 'affidavit_evidence_landing.txt').write_text('\n\n'.join(paragraphs), encoding='utf-8')
with (out / 'affidavit_evidence_landing.links.txt').open('w', encoding='utf-8') as f:
    for label, target in links:
        f.write(f'{label}\t{target}\n')
print(f'Extracted {len(paragraphs)} paragraphs and {len(links)} hyperlinks')
print('Output:', out / 'affidavit_evidence_landing.txt')
print('Links:', out / 'affidavit_evidence_landing.links.txt')

def print_matches(path):
    print(f'--- matches in {path.name} ---')
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    needles = ('testimony', 'evidence', 'gallery', 'youtube', 'facebook', 'http://', 'https://', 'section')
    for index, line in enumerate(lines, 1):
        if any(needle in line.lower() for needle in needles):
            print(f'{index}: {line[:500]}')

print_matches(out / 'affidavit_evidence_landing.txt')
print_matches(out / 'affidavit_evidence_landing.links.txt')

for name in ('official-layout.txt', 'unofficial-layout.txt'):
    path = out / name
    if path.exists():
        print_matches(path)
    else:
        print(f'Missing {path}')

# Also create layout-preserving PDF text using the installed Poppler utility.
import subprocess
subprocess.run([
    'pdftotext', '-layout',
    '/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf',
    str(out / 'official-layout.txt'),
], check=True)
subprocess.run([
    'pdftotext', '-layout',
    '/home/ubuntu/upload/officialaffidavitwithevidence(1).pdf',
    str(out / 'unofficial-layout.txt'),
], check=True)
print('PDF layout extraction complete.')
print_matches(out / 'official-layout.txt')
print_matches(out / 'unofficial-layout.txt')

# Re-write a compact JSON manifest with page counts and fingerprints.
import hashlib, json
manifest = {}
for path in (source, Path('/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf'), Path('/home/ubuntu/upload/officialaffidavitwithevidence(1).pdf')):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    manifest[path.name] = {'path': str(path), 'bytes': path.stat().st_size, 'sha256': digest}
(out / 'source-fingerprints.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print('Fingerprints written.')

def page_texts(pdf_path):
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    return [page.extract_text() or '' for page in reader.pages]
page_manifest = {
    'official_page_count': len(page_texts(Path('/home/ubuntu/upload/BACKUP_OFFICIAL_AFFIDAVIT_STATEMENT_OF_CHARLES_TANAUAN_CASE_PRESENTATION_2025_(1)(1).pdf'))),
    'unofficial_page_count': len(page_texts(Path('/home/ubuntu/upload/officialaffidavitwithevidence(1).pdf'))),
}
(out / 'page-counts.json').write_text(json.dumps(page_manifest, indent=2), encoding='utf-8')
print('Page counts written:', page_manifest)
