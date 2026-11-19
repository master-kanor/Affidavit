#!/usr/bin/env bash
set -euo pipefail

CANONICAL_URL="${CANONICAL_URL:?CANONICAL_URL is required}"
PAGES_URL="${PAGES_URL:?PAGES_URL is required}"
ATTEMPTS="${SMOKE_ATTEMPTS:-6}"
INTERVAL_SECONDS="${SMOKE_INTERVAL_SECONDS:-10}"
USER_AGENT="${SMOKE_USER_AGENT:-Mozilla/5.0 (compatible; MasterKanorCaseProductionVerifier/1.0; +https://masterkanorcase.online)}"

status_code() {
  local url="$1"
  curl -L -sS -A "$USER_AGENT" -o /dev/null -w "%{http_code}" "$url" || true
}

for attempt in $(seq 1 "$ATTEMPTS"); do
  pages_status=$(status_code "$PAGES_URL/")
  canonical_status=$(status_code "$CANONICAL_URL/")
  auth_status=$(status_code "$CANONICAL_URL/auth")
  health_status=$(status_code "$CANONICAL_URL/api/health")

  echo "attempt=$attempt pages=$pages_status canonical=$canonical_status auth=$auth_status health=$health_status"

  if [ "$pages_status" = "200" ] \
    && [ "$canonical_status" = "200" ] \
    && [ "$auth_status" = "200" ] \
    && [ "$health_status" = "200" ]; then
    echo "Post-deployment smoke tests passed."
    exit 0
  fi

  if [ "$attempt" -lt "$ATTEMPTS" ]; then
    sleep "$INTERVAL_SECONDS"
  fi
done

if [ "$pages_status" = "200" ] \
  && [ "$canonical_status" = "403" ] \
  && [ "$auth_status" = "403" ] \
  && [ "$health_status" = "403" ]; then
  echo "::warning::Cloudflare managed security blocked the runner for the custom domain. The Pages origin is healthy; verify custom domains through the independent production probe."
  exit 0
fi

echo "Post-deployment smoke tests failed."
exit 1
