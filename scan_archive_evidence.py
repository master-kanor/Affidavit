from pathlib import Path
from zipfile import ZipFile
import json
import re

archive = Path('/tmp/evidence-archive-inspect/part-1.zip')
out = Path('/home/ubuntu/evidence-website/source-extract')
out.mkdir(parents=True, exist_ok=True)

patterns = {
    'testimony': re.compile(r'\btestimony\b|\btestimon', re.I),
    'evidence': re.compile(r'\bevidence\b|\baffidavit\b|\bexhibit\b|\bgallery\b', re.I),
    'youtube': re.compile(r'(?:youtube\.com|youtu\.be)', re.I),
    'facebook': re.compile(r'facebook\.com', re.I),
    'drive': re.compile(r'drive\.google\.com', re.I),
    'url': re.compile(r'https?://\S+', re.I),
}

items = []
with ZipFile(archive) as z:
    for info in z.infolist():
        name = info.filename
        if name.endswith('/') or not name.lower().endswith(('.md', '.csv', '.txt')):
            continue
        try:
            text = z.read(name).decode('utf-8', errors='replace')
        except Exception:
            continue
        hits = {}
        lines = text.splitlines()
        for label, pattern in patterns.items():
            matches = []
            for idx, line in enumerate(lines, 1):
                if pattern.search(line):
                    matches.append({'line': idx, 'text': line[:600]})
            if matches:
                hits[label] = matches[:100]
        if hits:
            items.append({'name': name, 'size': info.file_size, 'hits': hits})

manifest = {
    'archive': str(archive),
    'matching_files': len(items),
    'files': items,
}
(out / 'archive-evidence-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

# Write a human-readable summary for review.
with (out / 'archive-evidence-manifest.md').open('w', encoding='utf-8') as f:
    f.write('# Archive Evidence Manifest\n\n')
    f.write('This manifest is a read-only extraction of text and link references from the supplied nested archive.\n\n')
    f.write(f"Matching files: {len(items)}\n\n")
    for item in items:
        f.write(f"## {item['name']}\n\n")
        for label, matches in item['hits'].items():
            f.write(f"### {label}\n\n")
            for match in matches:
                text = match['text'].replace('\n', ' ')
                f.write(f"- Line {match['line']}: {text}\n")
            f.write('\n')

print(f'Wrote {len(items)} matching archive files to {out / "archive-evidence-manifest.json"}')
for item in items[:20]:
    labels = ', '.join(item['hits'])
    print(f'{labels}: {item["name"]}')
