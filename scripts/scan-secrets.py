import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tracked = subprocess.run(['git', '-C', str(root), 'ls-files'], capture_output=True, text=True, check=True).stdout.splitlines()
ignored_parts = {'node_modules', 'dist', 'coverage', '.git'}
ignored_suffixes = ('.lock', '.map')
ignored_names = {'.env.example'}
patterns = [
    re.compile(r'sk-or-v1-[A-Za-z0-9]{20,}'),
    re.compile(r'ghp_[A-Za-z0-9]{20,}'),
    re.compile(r'github_pat_[A-Za-z0-9_]{20,}'),
    re.compile(r'sb_secret_[A-Za-z0-9_-]{20,}'),
    re.compile(r'sbp_[A-Za-z0-9]{20,}'),
    re.compile(r'eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'),
    re.compile(r'cfat_[A-Za-z0-9]{20,}'),
]
findings = []
for relative in tracked:
    path = Path(relative)
    if path.name in ignored_names or path.suffix in ignored_suffixes or any(part in ignored_parts for part in path.parts):
        continue
    full = root / path
    try:
        text = full.read_text(errors='ignore')
    except OSError:
        continue
    for pattern in patterns:
        if pattern.search(text):
            findings.append(relative)
            break
if findings:
    print('Credential patterns found in tracked source files:')
    for finding in sorted(set(findings)):
        print(finding)
    raise SystemExit(1)
print('No credential token patterns found in tracked source files.')
