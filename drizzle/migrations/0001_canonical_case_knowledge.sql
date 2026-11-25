-- Canonical Master Kanor case knowledge model.
-- Source text and original evidence remain separate from presentation relationships.
-- Apply only after reviewing against the target Supabase schema.

create extension if not exists pgcrypto;

do $$ begin
  create type public.case_member_role as enum ('owner', 'admin', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status as enum ('source', 'approved', 'proposed', 'needs_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_state as enum ('unverified', 'owner_verified', 'admin_verified', 'disputed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.provenance_kind as enum ('source_fact', 'owner_content', 'ai_inference', 'ai_suggestion', 'unverified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_type as enum ('image', 'video', 'document', 'audio', 'external_link');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.relationship_type as enum ('supports', 'references', 'related_to', 'corroborates', 'contradicts', 'derived_from', 'source_of', 'appears_in', 'mentioned_in', 'timeline_related', 'documented_by');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recommendation_status as enum ('pending', 'accepted', 'rejected', 'modified', 'applied');
exception when duplicate_object then null; end $$;

create table if not exists public.case_records (
  id text primary key,
  title text not null,
  description text,
  status public.case_status not null default 'active',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.case_member_role not null,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);

create table if not exists public.affidavit_sections (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  section_number text not null,
  title text not null,
  sort_order integer not null,
  source_label text,
  approval_status public.approval_status not null default 'source',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affidavit_text_versions (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.affidavit_sections(id) on delete cascade,
  version_kind text not null check (version_kind in ('source_original', 'current_approved', 'ai_proposed')),
  text_content text not null,
  source_reference text,
  recommendation_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_assets (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  title text not null,
  description text,
  asset_type public.asset_type not null,
  preview_url text,
  source_url text,
  original_object_key text,
  checksum_sha256 text,
  verification_state public.verification_state not null default 'unverified',
  provenance_kind public.provenance_kind not null default 'unverified',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonies (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  title text not null,
  content text not null,
  provenance_kind public.provenance_kind not null default 'unverified',
  verification_state public.verification_state not null default 'unverified',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  event_date timestamptz,
  title text not null,
  description text,
  verification_state public.verification_state not null default 'unverified',
  source_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.case_relationships (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  relationship_type public.relationship_type not null,
  confidence integer check (confidence between 0 and 100),
  approval_status public.approval_status not null default 'proposed',
  notes text,
  created_by uuid references auth.users(id),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  agent_id text not null,
  recommendation_type text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  target_resource_type text not null,
  target_resource_id text not null,
  title text not null,
  explanation text not null,
  suggested_change text,
  supporting_sources jsonb not null default '[]'::jsonb,
  confidence integer check (confidence between 0 and 100),
  status public.recommendation_status not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.documentaries (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentary_chapters (
  id text primary key,
  documentary_id text not null references public.documentaries(id) on delete cascade,
  title text not null,
  description text,
  narration text,
  sort_order integer not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved')),
  created_at timestamptz not null default now()
);

create table if not exists public.documentary_items (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null references public.documentary_chapters(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  caption text,
  notes text,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.case_audit_log (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id text,
  before_value jsonb,
  after_value jsonb,
  recommendation_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists case_members_user_idx on public.case_members(user_id, case_id);
create index if not exists affidavit_sections_case_order_idx on public.affidavit_sections(case_id, sort_order);
create index if not exists affidavit_text_section_kind_idx on public.affidavit_text_versions(section_id, version_kind);
create index if not exists evidence_assets_case_type_idx on public.evidence_assets(case_id, asset_type);
create index if not exists case_relationships_case_idx on public.case_relationships(case_id);
create index if not exists ai_recommendations_case_status_idx on public.ai_recommendations(case_id, status);
create index if not exists timeline_events_case_date_idx on public.timeline_events(case_id, event_date);

create or replace function public.can_view_case(p_case_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.case_members
    where case_id = p_case_id and user_id = auth.uid() and can_view = true
  );
$$;

create or replace function public.can_edit_case(p_case_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.case_members
    where case_id = p_case_id and user_id = auth.uid() and can_edit = true
  );
$$;

create or replace function public.can_export_case(p_case_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.case_members
    where case_id = p_case_id and user_id = auth.uid() and can_export = true
  );
$$;

alter table public.case_records enable row level security;
alter table public.case_members enable row level security;
alter table public.affidavit_sections enable row level security;
alter table public.affidavit_text_versions enable row level security;
alter table public.evidence_assets enable row level security;
alter table public.testimonies enable row level security;
alter table public.timeline_events enable row level security;
alter table public.case_relationships enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.documentaries enable row level security;
alter table public.documentary_chapters enable row level security;
alter table public.documentary_items enable row level security;
alter table public.case_audit_log enable row level security;

-- Idempotent policy replacement keeps deployments repeatable.
drop policy if exists case_records_view on public.case_records;
create policy case_records_view on public.case_records for select using (public.can_view_case(id));
drop policy if exists case_members_self_view on public.case_members;
create policy case_members_self_view on public.case_members for select using (user_id = auth.uid() or public.can_edit_case(case_id));
drop policy if exists affidavit_sections_view on public.affidavit_sections;
create policy affidavit_sections_view on public.affidavit_sections for select using (public.can_view_case(case_id));
drop policy if exists affidavit_sections_edit on public.affidavit_sections;
create policy affidavit_sections_edit on public.affidavit_sections for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists affidavit_text_view on public.affidavit_text_versions;
create policy affidavit_text_view on public.affidavit_text_versions for select using (exists (select 1 from public.affidavit_sections s where s.id = section_id and public.can_view_case(s.case_id)));
drop policy if exists affidavit_text_edit on public.affidavit_text_versions;
create policy affidavit_text_edit on public.affidavit_text_versions for insert with check (exists (select 1 from public.affidavit_sections s where s.id = section_id and public.can_edit_case(s.case_id)));
drop policy if exists evidence_assets_view on public.evidence_assets;
create policy evidence_assets_view on public.evidence_assets for select using (public.can_view_case(case_id));
drop policy if exists evidence_assets_edit on public.evidence_assets;
create policy evidence_assets_edit on public.evidence_assets for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists testimonies_view on public.testimonies;
create policy testimonies_view on public.testimonies for select using (public.can_view_case(case_id));
drop policy if exists testimonies_edit on public.testimonies;
create policy testimonies_edit on public.testimonies for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists timeline_events_view on public.timeline_events;
create policy timeline_events_view on public.timeline_events for select using (public.can_view_case(case_id));
drop policy if exists timeline_events_edit on public.timeline_events;
create policy timeline_events_edit on public.timeline_events for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists case_relationships_view on public.case_relationships;
create policy case_relationships_view on public.case_relationships for select using (public.can_view_case(case_id));
drop policy if exists case_relationships_edit on public.case_relationships;
create policy case_relationships_edit on public.case_relationships for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists ai_recommendations_view on public.ai_recommendations;
create policy ai_recommendations_view on public.ai_recommendations for select using (public.can_edit_case(case_id));
drop policy if exists ai_recommendations_edit on public.ai_recommendations;
create policy ai_recommendations_edit on public.ai_recommendations for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists documentaries_view on public.documentaries;
create policy documentaries_view on public.documentaries for select using (public.can_view_case(case_id));
drop policy if exists documentaries_edit on public.documentaries;
create policy documentaries_edit on public.documentaries for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists documentary_chapters_view on public.documentary_chapters;
create policy documentary_chapters_view on public.documentary_chapters for select using (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_view_case(d.case_id)));
drop policy if exists documentary_chapters_edit on public.documentary_chapters;
create policy documentary_chapters_edit on public.documentary_chapters for all using (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_edit_case(d.case_id))) with check (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_edit_case(d.case_id)));
drop policy if exists documentary_items_view on public.documentary_items;
create policy documentary_items_view on public.documentary_items for select using (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_view_case(d.case_id)));
drop policy if exists documentary_items_edit on public.documentary_items;
create policy documentary_items_edit on public.documentary_items for all using (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_edit_case(d.case_id))) with check (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_edit_case(d.case_id)));
drop policy if exists case_audit_log_view on public.case_audit_log;
create policy case_audit_log_view on public.case_audit_log for select using (public.can_edit_case(case_id));
drop policy if exists case_audit_log_insert on public.case_audit_log;
create policy case_audit_log_insert on public.case_audit_log for insert with check (public.can_edit_case(case_id));
