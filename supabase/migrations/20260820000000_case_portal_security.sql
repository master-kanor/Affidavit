-- Master Kanor Case production authorization and documentary workspace.
-- Apply through Supabase migrations after reviewing existing production tables.
-- No plaintext passwords or provider secrets belong in this file.

create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('owner', 'admin', 'user'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_status as enum ('active', 'disabled', 'pending'); exception when duplicate_object then null; end $$;
do $$ begin create type public.approval_status as enum ('suggested', 'accepted', 'modified', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.documentary_status as enum ('draft', 'review', 'approved', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.verification_state as enum ('unverified', 'owner_verified', 'admin_verified', 'disputed', 'archived'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'user',
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  can_view_dashboard boolean not null default false,
  can_view_evidence boolean not null default false,
  can_view_dossier boolean not null default false,
  can_view_testimony boolean not null default false,
  can_view_timeline boolean not null default false,
  can_view_documents boolean not null default false,
  can_view_images boolean not null default false,
  can_view_videos boolean not null default false,
  can_download boolean not null default false,
  can_export boolean not null default false,
  can_share boolean not null default false,
  can_ask_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  can_view boolean not null default false,
  can_download boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, resource_type, resource_id)
);

create table if not exists public.case_records (
  id text primary key,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_members (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  can_view boolean not null default true,
  can_edit boolean not null default false,
  can_export boolean not null default false,
  created_at timestamptz not null default now(),
  unique (case_id, user_id)
);

create table if not exists public.affidavit_sections (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  section_number text,
  title text not null,
  sort_order integer not null,
  source_label text,
  approval_status public.approval_status not null default 'accepted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affidavit_text_versions (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.affidavit_sections(id) on delete cascade,
  version_kind text not null check (version_kind in ('source_original', 'current_approved', 'ai_proposed')),
  text_content text not null,
  source_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_assets (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  title text not null,
  description text,
  asset_type text not null check (asset_type in ('image', 'video', 'document', 'audio', 'external_link')),
  preview_url text,
  source_url text,
  original_object_key text,
  checksum_sha256 text,
  verification_state public.verification_state not null default 'unverified',
  provenance_kind text not null default 'unverified',
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
  verification_state public.verification_state not null default 'unverified',
  provenance_kind text not null default 'unverified',
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

create table if not exists public.documentaries (
  id text primary key,
  case_id text not null references public.case_records(id) on delete cascade,
  title text not null,
  description text,
  status public.documentary_status not null default 'draft',
  version integer not null default 1,
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
  status public.documentary_status not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documentary_items (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null references public.documentary_chapters(id) on delete cascade,
  resource_type text not null,
  resource_id text not null,
  caption text,
  notes text,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  unique (chapter_id, resource_type, resource_id)
);

create table if not exists public.case_relationships (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.case_records(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  relationship_type text not null,
  confidence integer check (confidence between 0 and 100),
  approval_status public.approval_status not null default 'suggested',
  notes text,
  created_by uuid references auth.users(id),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.case_audit_log (
  id uuid primary key default gen_random_uuid(),
  case_id text references public.case_records(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_role public.app_role,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_value jsonb,
  after_value jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists resource_permissions_user_resource_idx on public.resource_permissions(user_id, resource_type, resource_id);
create index if not exists case_members_user_case_idx on public.case_members(user_id, case_id);
create index if not exists affidavit_sections_case_order_idx on public.affidavit_sections(case_id, sort_order);
create index if not exists evidence_assets_case_type_idx on public.evidence_assets(case_id, asset_type);
create index if not exists documentaries_case_status_idx on public.documentaries(case_id, status);
create index if not exists documentary_chapters_documentary_order_idx on public.documentary_chapters(documentary_id, sort_order);
create index if not exists documentary_items_chapter_order_idx on public.documentary_items(chapter_id, sort_order);
create index if not exists case_audit_case_created_idx on public.case_audit_log(case_id, created_at desc);

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and status = 'active' limit 1;
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'owner', false);
$$;

create or replace function public.is_admin_or_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('owner', 'admin'), false);
$$;

create or replace function public.has_permission(permission_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare allowed boolean;
begin
  if public.current_app_role() = 'owner' then return true; end if;
  execute format('select %I from public.user_permissions where user_id = $1', permission_name) into allowed using auth.uid();
  return coalesce(allowed, false);
exception when undefined_column then return false;
end;
$$;

create or replace function public.can_view_case(target_case_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_app_role() = 'owner'
    or (public.current_app_role() = 'admin' and exists (select 1 from public.case_members cm where cm.case_id = target_case_id and cm.user_id = auth.uid() and cm.can_view))
    or (public.current_app_role() = 'user' and exists (select 1 from public.case_members cm where cm.case_id = target_case_id and cm.user_id = auth.uid() and cm.can_view));
$$;

create or replace function public.can_edit_case(target_case_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_app_role() = 'owner'
    or (public.current_app_role() = 'admin' and exists (select 1 from public.case_members cm where cm.case_id = target_case_id and cm.user_id = auth.uid() and cm.can_edit));
$$;

create or replace function public.can_view_resource(target_resource_type text, target_resource_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_app_role() = 'owner'
    or exists (select 1 from public.resource_permissions rp where rp.user_id = auth.uid() and rp.resource_type = target_resource_type and rp.resource_id = target_resource_id and rp.can_view);
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists user_permissions_touch_updated_at on public.user_permissions;
create trigger user_permissions_touch_updated_at before update on public.user_permissions for each row execute function public.touch_updated_at();
drop trigger if exists resource_permissions_touch_updated_at on public.resource_permissions;
create trigger resource_permissions_touch_updated_at before update on public.resource_permissions for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id, status, role) values (new.id, 'pending', 'user') on conflict (user_id) do nothing;
  insert into public.user_permissions(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.resource_permissions enable row level security;
alter table public.case_records enable row level security;
alter table public.case_members enable row level security;
alter table public.affidavit_sections enable row level security;
alter table public.affidavit_text_versions enable row level security;
alter table public.evidence_assets enable row level security;
alter table public.testimonies enable row level security;
alter table public.timeline_events enable row level security;
alter table public.documentaries enable row level security;
alter table public.documentary_chapters enable row level security;
alter table public.documentary_items enable row level security;
alter table public.case_relationships enable row level security;
alter table public.case_audit_log enable row level security;

-- Drop only policies owned by this migration so re-running is safe.
drop policy if exists profiles_self_or_admin on public.profiles;
create policy profiles_self_or_admin on public.profiles for select using (user_id = auth.uid() or public.is_admin_or_owner());
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update using (public.is_owner()) with check (public.is_owner());

drop policy if exists user_permissions_self_or_admin on public.user_permissions;
create policy user_permissions_self_or_admin on public.user_permissions for select using (user_id = auth.uid() or public.is_admin_or_owner());
drop policy if exists user_permissions_admin_write on public.user_permissions;
create policy user_permissions_admin_write on public.user_permissions for all using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());

drop policy if exists resource_permissions_self_or_admin on public.resource_permissions;
create policy resource_permissions_self_or_admin on public.resource_permissions for select using (user_id = auth.uid() or public.is_admin_or_owner());
drop policy if exists resource_permissions_admin_write on public.resource_permissions;
create policy resource_permissions_admin_write on public.resource_permissions for all using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());

drop policy if exists case_records_view on public.case_records;
create policy case_records_view on public.case_records for select using (public.can_view_case(id));
drop policy if exists case_records_owner_write on public.case_records;
create policy case_records_owner_write on public.case_records for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists case_members_view on public.case_members;
create policy case_members_view on public.case_members for select using (user_id = auth.uid() or public.is_admin_or_owner());
drop policy if exists case_members_admin_write on public.case_members;
create policy case_members_admin_write on public.case_members for all using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());

-- Case-scoped source and documentary reads.
drop policy if exists affidavit_sections_view on public.affidavit_sections;
create policy affidavit_sections_view on public.affidavit_sections for select using (public.can_view_case(case_id) and (public.has_permission('can_view_dossier') or public.can_view_resource('affidavit_section', id)));
drop policy if exists affidavit_sections_edit on public.affidavit_sections;
create policy affidavit_sections_edit on public.affidavit_sections for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));
drop policy if exists affidavit_text_versions_view on public.affidavit_text_versions;
create policy affidavit_text_versions_view on public.affidavit_text_versions for select using (exists (select 1 from public.affidavit_sections s where s.id = section_id and public.can_view_case(s.case_id) and (public.has_permission('can_view_dossier') or public.can_view_resource('affidavit_section', s.id))));
drop policy if exists affidavit_text_versions_insert on public.affidavit_text_versions;
create policy affidavit_text_versions_insert on public.affidavit_text_versions for insert with check (public.is_owner() and version_kind = 'ai_proposed');

drop policy if exists evidence_assets_view on public.evidence_assets;
create policy evidence_assets_view on public.evidence_assets for select using (public.can_view_case(case_id) and public.has_permission('can_view_evidence') and (public.can_view_resource('evidence', id) or public.current_app_role() in ('owner','admin')));
drop policy if exists evidence_assets_admin_write on public.evidence_assets;
create policy evidence_assets_admin_write on public.evidence_assets for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));

drop policy if exists testimonies_view on public.testimonies;
create policy testimonies_view on public.testimonies for select using (public.can_view_case(case_id) and public.has_permission('can_view_testimony') and (public.can_view_resource('testimony', id) or public.current_app_role() in ('owner','admin')));
drop policy if exists testimonies_admin_write on public.testimonies;
create policy testimonies_admin_write on public.testimonies for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));

drop policy if exists timeline_events_view on public.timeline_events;
create policy timeline_events_view on public.timeline_events for select using (public.can_view_case(case_id) and public.has_permission('can_view_timeline') and (public.can_view_resource('timeline', id) or public.current_app_role() in ('owner','admin')));
drop policy if exists timeline_events_admin_write on public.timeline_events;
create policy timeline_events_admin_write on public.timeline_events for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));

drop policy if exists documentaries_view on public.documentaries;
create policy documentaries_view on public.documentaries for select using (public.can_view_case(case_id) and (public.has_permission('can_view_dossier') or public.current_app_role() in ('owner','admin')));
drop policy if exists documentaries_admin_write on public.documentaries;
create policy documentaries_admin_write on public.documentaries for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));

drop policy if exists documentary_chapters_view on public.documentary_chapters;
create policy documentary_chapters_view on public.documentary_chapters for select using (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_view_case(d.case_id) and public.has_permission('can_view_dossier')));
drop policy if exists documentary_chapters_admin_write on public.documentary_chapters;
create policy documentary_chapters_admin_write on public.documentary_chapters for all using (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_edit_case(d.case_id))) with check (exists (select 1 from public.documentaries d where d.id = documentary_id and public.can_edit_case(d.case_id)));

drop policy if exists documentary_items_view on public.documentary_items;
create policy documentary_items_view on public.documentary_items for select using (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_view_case(d.case_id) and public.has_permission('can_view_dossier')));
drop policy if exists documentary_items_admin_write on public.documentary_items;
create policy documentary_items_admin_write on public.documentary_items for all using (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_edit_case(d.case_id))) with check (exists (select 1 from public.documentary_chapters c join public.documentaries d on d.id = c.documentary_id where c.id = chapter_id and public.can_edit_case(d.case_id)));

drop policy if exists case_relationships_view on public.case_relationships;
create policy case_relationships_view on public.case_relationships for select using (public.can_view_case(case_id) and (public.has_permission('can_view_dossier') or public.current_app_role() in ('owner','admin')));
drop policy if exists case_relationships_admin_write on public.case_relationships;
create policy case_relationships_admin_write on public.case_relationships for all using (public.can_edit_case(case_id)) with check (public.can_edit_case(case_id));

drop policy if exists case_audit_log_admin_view on public.case_audit_log;
create policy case_audit_log_admin_view on public.case_audit_log for select using (public.is_admin_or_owner());
drop policy if exists case_audit_log_admin_insert on public.case_audit_log;
create policy case_audit_log_admin_insert on public.case_audit_log for insert with check (public.is_admin_or_owner());

insert into storage.buckets (id, name, public) values ('case-evidence', 'case-evidence', false) on conflict (id) do update set public = false;

create or replace function public.storage_case_id(object_name text)
returns text language sql immutable as $$ select nullif(split_part(object_name, '/', 2), ''); $$;

drop policy if exists case_evidence_read on storage.objects;
create policy case_evidence_read on storage.objects for select using (bucket_id = 'case-evidence' and public.can_view_case(public.storage_case_id(name)) and (public.has_permission('can_view_evidence') or public.current_app_role() in ('owner','admin')));
drop policy if exists case_evidence_write on storage.objects;
create policy case_evidence_write on storage.objects for insert with check (bucket_id = 'case-evidence' and public.can_edit_case(public.storage_case_id(name)));
drop policy if exists case_evidence_update on storage.objects;
create policy case_evidence_update on storage.objects for update using (bucket_id = 'case-evidence' and public.can_edit_case(public.storage_case_id(name))) with check (bucket_id = 'case-evidence' and public.can_edit_case(public.storage_case_id(name)));
drop policy if exists case_evidence_delete on storage.objects;
create policy case_evidence_delete on storage.objects for delete using (bucket_id = 'case-evidence' and public.can_edit_case(public.storage_case_id(name)));
