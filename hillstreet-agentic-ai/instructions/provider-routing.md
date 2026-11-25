# Provider Routing Policy

## Routing Tiers

### Tier 1 — Primary AI Gateway
Configured centralized AI gateway using available authorized free or included-capacity models.

### Tier 2 — Free Provider Fallback
Available free-tier API providers (OpenRouter free models, NVIDIA free tier, etc.)

### Tier 3 — Self-Hosted Inference
Approved local or cloud-hosted open-source models (Ollama, etc.)

### Tier 4 — Subscription-Backed
Existing authorized subscription-backed AI execution (ChatGPT, Codex)

### Tier 5 — Paid API Fallback
Approved paid API providers within established budgets.

## Routing Algorithm

1. Classify task by capability requirements
2. Check available authorized providers
3. Check quota/health of each provider
4. Route to highest-tier available provider
5. On failure: respect rate-limit, wait or fallback
6. Log routing decision for audit

## Quota Management

- Track usage per provider
- Respect rate-limit responses and Retry-After headers
- Queue non-urgent tasks when capacity is low
- Never rotate accounts to circumvent quotas
- Never automatically incur paid usage without approval

## Provider Registry

| Provider | Tier | Free Tier | Capabilities | Status |
|----------|------|-----------|--------------|--------|
| Kilo Code | 1 | Yes | Coding, debugging, testing | Active |
| Open Code | 1 | Yes | Coding, shell, git | Available |
| OpenRouter | 2 | Yes | Multi-model routing | Available |
| NVIDIA NIM | 2 | Yes | LLM inference | Available |
| ChatGPT | 4 | No | Reasoning, architecture | Available (subscription) |
| Codex | 4 | No | Code review, refactoring | Available (subscription) |

## Circuit Breaker

- Track consecutive failures per provider
- After 3 consecutive failures, temporarily disable provider
- Auto-recover after cooldown period
- Log all circuit breaker events