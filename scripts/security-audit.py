import os
import subprocess
from pathlib import Path

names = [
    'SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDFLARE_API_TOKEN', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY',
    'GITHUB_TOKEN', 'GH_TOKEN'
]
for name in names:
    value = os.environ.get(name)
    print(f'{name}=' + (f'set(length={len(value)})' if value else 'unset'))

root = Path('/home/ubuntu/Affidavit')
tracked = subprocess.run(['git', '-C', str(root), 'ls-files'], capture_output=True, text=True, check=True).stdout.splitlines()
print('tracked_secret_like_files:')
for path in tracked:
    lowered = path.lower()
    if path.startswith('.env') or any(token in lowered for token in ('credential', 'secret', 'private-key')):
        print(path)

patterns = 'sk-or-v1-|ghp_[A-Za-z0-9]|sbp_[A-Za-z0-9]|service_role|SUPABASE_SERVICE_ROLE_KEY|CLOUDFLARE_API_TOKEN'
result = subprocess.run(
    ['git', '-C', str(root), 'grep', '-IlE', patterns, '--', ':!*.lock', ':!node_modules/**', ':!dist/**'],
    capture_output=True, text=True
)
print('tracked_high_risk_token_pattern_files:')
if result.returncode in (0, 1):
    for path in result.stdout.splitlines():
        print(path)
else:
    print(f'git_grep_error={result.stderr.strip()[:160]}')
