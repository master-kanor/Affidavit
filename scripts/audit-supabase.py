import os
import requests

base = os.environ.get('SUPABASE_URL', '').rstrip('/')
if base.endswith('/rest/v1'):
    base = base[:-len('/rest/v1')]
key = os.environ.get('SUPABASE_KEY', '')
if not base or not key:
    raise SystemExit('SUPABASE_URL or SUPABASE_KEY is unset')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

health = requests.get(f'{base}/auth/v1/settings', headers=headers, timeout=15)
print('auth_settings_status:', health.status_code)
if health.ok:
    data = health.json()
    print('external_email_enabled:', data.get('external', {}).get('email'))
    print('disable_signup:', data.get('disable_signup'))

for table in [
    'profiles', 'user_permissions', 'resource_permissions', 'case_records',
    'affidavit_sections', 'affidavit_text_versions', 'evidence_assets',
    'testimonies', 'timeline_events', 'case_relationships', 'documentaries',
    'documentary_chapters', 'documentary_items', 'case_audit_log'
]:
    response = requests.get(
        f'{base}/rest/v1/{table}',
        headers={**headers, 'Range': '0-0'},
        params={'select': '*'},
        timeout=15,
    )
    if response.status_code in (200, 206):
        try:
            body = response.json()
            print(f'{table}: present rows_returned={len(body) if isinstance(body, list) else "unknown"}')
        except ValueError:
            print(f'{table}: present non_json_response')
    elif response.status_code == 401:
        print(f'{table}: unauthorized')
    elif response.status_code == 404:
        print(f'{table}: missing_or_unexposed')
    else:
        print(f'{table}: status={response.status_code}')
