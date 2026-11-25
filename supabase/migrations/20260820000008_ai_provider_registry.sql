create table if not exists public.ai_provider_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openrouter','nvidia','ollama','mistral','gemini')),
  display_name text not null,
  encrypted_api_key text not null,
  key_fingerprint text not null,
  base_url text,
  enabled boolean not null default true,
  priority integer not null default 100,
  free_only boolean not null default true,
  paid_backup boolean not null default false,
  status text not null default 'authorization_required' check (status in ('connected','error','authorization_required','disabled')),
  last_tested_at timestamptz,
  last_error text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, display_name)
);

create table if not exists public.ai_provider_models (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.ai_provider_connections(id) on delete cascade,
  provider_model_id text not null,
  display_name text not null,
  capabilities jsonb not null default '{}'::jsonb,
  pricing jsonb not null default '{}'::jsonb,
  is_free boolean not null default false,
  enabled boolean not null default false,
  last_seen_at timestamptz not null default now(),
  unique (connection_id, provider_model_id)
);

create table if not exists public.ai_routing_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true,
  free_first boolean not null default true,
  rotate_on_status integer[] not null default array[402,408,429,500,502,503,504],
  max_attempts integer not null default 8 check (max_attempts between 1 and 20),
  paid_backup_enabled boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_connections enable row level security;
alter table public.ai_provider_models enable row level security;
alter table public.ai_routing_policies enable row level security;

revoke all on public.ai_provider_connections, public.ai_provider_models, public.ai_routing_policies from anon, authenticated;
grant select on public.ai_provider_connections, public.ai_provider_models, public.ai_routing_policies to authenticated;

create policy "provider registry managers read connections" on public.ai_provider_connections for select to authenticated
using (public.current_app_role() in ('owner','admin'));
create policy "provider registry managers read models" on public.ai_provider_models for select to authenticated
using (public.current_app_role() in ('owner','admin'));
create policy "provider registry managers read policies" on public.ai_routing_policies for select to authenticated
using (public.current_app_role() in ('owner','admin'));

create index if not exists ai_provider_connections_route_idx on public.ai_provider_connections(enabled, free_only, priority);
create index if not exists ai_provider_models_route_idx on public.ai_provider_models(connection_id, enabled, is_free);

comment on column public.ai_provider_connections.encrypted_api_key is 'AES-GCM ciphertext; encryption key exists only in the Cloudflare secret store.';