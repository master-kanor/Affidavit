from pathlib import Path
from zipfile import ZipFile

archive = Path('/tmp/evidence-archive-inspect/part-1.zip')
out = Path('/home/ubuntu/evidence-website/source-extract')
out.mkdir(parents=True, exist_ok=True)

best_name = 'Export-4888d1a3-5722-4e6e-bb10-88add48b750d/Private & Shared/DONE FULL FINAL WITH EVIDENCE TESTIMONY THE STORY  23e1958629d6801e8bf3ec833d40ffba.md'
official_name = 'Export-4888d1a3-5722-4e6e-bb10-88add48b750d/Private & Shared/BACKUP OFFICIAL AFFIDAVIT STATEMENT OF CHARLES TAN 3811958629d6800bb97dfd57d76b1a41.md'

with ZipFile(archive) as z:
    best = z.read(best_name).decode('utf-8', errors='replace')
    official = z.read(official_name).decode('utf-8', errors='replace')

(out / 'best-unofficial-affidavit.md').write_text(best, encoding='utf-8')
(out / 'official-markdown-source.md').write_text(official, encoding='utf-8')
print('best unofficial:', len(best), 'chars', len(best.splitlines()), 'lines')
print('official markdown:', len(official), 'chars', len(official.splitlines()), 'lines')
print('\n--- unofficial headings and links ---')
for i, line in enumerate(best.splitlines(), 1):
    low = line.lower()
    if line.startswith('#') or 'youtube' in low or 'facebook' in low or 'drive.google' in low or 'evidence' in low:
        print(f'{i}: {line[:500]}')
print('\n--- official markdown first 60 lines ---')
for i, line in enumerate(official.splitlines()[:60], 1):
    print(f'{i}: {line[:500]}')
