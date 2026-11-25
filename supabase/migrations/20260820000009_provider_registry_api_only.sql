revoke select on public.ai_provider_connections, public.ai_provider_models, public.ai_routing_policies from authenticated;

drop policy if exists "provider registry managers read connections" on public.ai_provider_connections;
drop policy if exists "provider registry managers read models" on public.ai_provider_models;
drop policy if exists "provider registry managers read policies" on public.ai_routing_policies;

comment on table public.ai_provider_connections is 'API-only credential registry. Browser roles have no table privileges; trusted endpoints return masked metadata.';
