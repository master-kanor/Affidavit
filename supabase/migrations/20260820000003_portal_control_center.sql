-- Role-safe access management and Owner/Admin publishing channel.
create table if not exists public.portal_publications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  summary text not null default '',
  resource_type text not null check (resource_type in ('notice', 'case', 'evidence', 'document', 'task', 'link')),
  resource_id text,
  resource_url text,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  acknowledged_at timestamptz,
  is_active boolean not null default true
);

create index if not exists portal_publications_recipient_idx on public.portal_publications(recipient_user_id, published_at desc);
alter table public.portal_publications enable row level security;

drop policy if exists portal_publications_read on public.portal_publications;
create policy portal_publications_read on public.portal_publications for select
  using (recipient_user_id = auth.uid() or public.is_admin_or_owner());
drop policy if exists portal_publications_manage on public.portal_publications;
create policy portal_publications_manage on public.portal_publications for all
  using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());
drop policy if exists portal_publications_acknowledge on public.portal_publications;
create policy portal_publications_acknowledge on public.portal_publications for update
  using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

create or replace function public.set_user_access(
  target_user_id uuid,
  next_status public.account_status,
  next_role public.app_role,
  next_permissions jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare actor_role public.app_role; target_role public.app_role;
begin
  actor_role := public.current_app_role();
  select role into target_role from public.profiles where user_id = target_user_id for update;
  if target_role is null then raise exception 'Target profile was not found'; end if;
  if actor_role = 'admin' and (target_role <> 'user' or next_role <> 'user') then
    raise exception 'Admins may only manage User accounts';
  end if;
  if actor_role <> 'owner' and actor_role <> 'admin' then raise exception 'Access denied'; end if;
  if target_user_id = auth.uid() then raise exception 'Self-access changes are not allowed'; end if;

  update public.profiles set status = next_status, role = next_role where user_id = target_user_id;
  update public.user_permissions set
    can_view_dashboard = coalesce((next_permissions->>'can_view_dashboard')::boolean, false),
    can_view_evidence = coalesce((next_permissions->>'can_view_evidence')::boolean, false),
    can_view_dossier = coalesce((next_permissions->>'can_view_dossier')::boolean, false),
    can_view_testimony = coalesce((next_permissions->>'can_view_testimony')::boolean, false),
    can_view_timeline = coalesce((next_permissions->>'can_view_timeline')::boolean, false),
    can_view_documents = coalesce((next_permissions->>'can_view_documents')::boolean, false),
    can_view_images = coalesce((next_permissions->>'can_view_images')::boolean, false),
    can_view_videos = coalesce((next_permissions->>'can_view_videos')::boolean, false),
    can_download = coalesce((next_permissions->>'can_download')::boolean, false),
    can_export = coalesce((next_permissions->>'can_export')::boolean, false),
    can_share = coalesce((next_permissions->>'can_share')::boolean, false),
    can_ask_ai = coalesce((next_permissions->>'can_ask_ai')::boolean, false)
  where user_id = target_user_id;

  insert into public.case_audit_log(actor_id, actor_role, action, resource_type, resource_id, after_value)
  values (auth.uid(), actor_role, 'user_access_updated', 'profile', target_user_id::text,
    jsonb_build_object('role', next_role, 'status', next_status, 'permissions', next_permissions));
end;
$$;

revoke all on function public.set_user_access(uuid, public.account_status, public.app_role, jsonb) from public, anon;
grant execute on function public.set_user_access(uuid, public.account_status, public.app_role, jsonb) to authenticated;
revoke all on table public.portal_publications from anon;
grant select, insert, update, delete on table public.portal_publications to authenticated;
