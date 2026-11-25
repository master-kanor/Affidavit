-- Final authority override: database role `user` is a read-only Guest Reviewer.
-- All permission mutations go through audited, role-safe RPCs.

drop policy if exists user_permissions_admin_write on public.user_permissions;
drop policy if exists resource_permissions_admin_write on public.resource_permissions;
drop policy if exists case_members_admin_write on public.case_members;

create policy case_members_owner_write on public.case_members for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create or replace function public.set_resource_access(
  target_user_id uuid,
  target_resource_type text,
  target_resource_id text,
  allow_view boolean,
  allow_download boolean default false
) returns void language plpgsql security definer set search_path = public as $$
declare actor_role public.app_role; target_role public.app_role;
begin
  actor_role := public.current_app_role();
  select role into target_role from public.profiles where user_id = target_user_id and status in ('active','pending');
  if actor_role not in ('owner','admin') then raise exception 'Access denied'; end if;
  if target_role <> 'user' then raise exception 'Resource access may only be assigned to Guest Reviewers'; end if;
  if target_user_id = auth.uid() then raise exception 'Self-access changes are not allowed'; end if;
  if target_resource_type not in ('case','affidavit_section','evidence','testimony','timeline','document','video','image') then raise exception 'Unsupported resource type'; end if;

  insert into public.resource_permissions(user_id, resource_type, resource_id, can_view, can_download)
  values (target_user_id, target_resource_type, target_resource_id, allow_view, allow_download)
  on conflict (user_id, resource_type, resource_id) do update
    set can_view = excluded.can_view, can_download = excluded.can_download, updated_at = now();

  insert into public.case_audit_log(actor_id, actor_role, action, resource_type, resource_id, after_value)
  values (auth.uid(), actor_role, 'guest_resource_access_updated', target_resource_type, target_resource_id,
    jsonb_build_object('guest_user_id', target_user_id, 'can_view', allow_view, 'can_download', allow_download));
end;
$$;

revoke all on function public.set_resource_access(uuid, text, text, boolean, boolean) from public, anon;
grant execute on function public.set_resource_access(uuid, text, text, boolean, boolean) to authenticated;

drop policy if exists portal_publications_insert on public.portal_publications;
create policy portal_publications_insert on public.portal_publications for insert to authenticated
  with check (
    published_by = auth.uid()
    and (
      public.is_owner()
      or (
        public.current_app_role() = 'admin'
        and exists (select 1 from public.profiles p where p.user_id = recipient_user_id and p.role = 'user')
      )
    )
  );

-- Explicitly forbid Guest Reviewer writes to all canonical case resources.
revoke insert, update, delete on table public.case_records from authenticated;
revoke insert, update, delete on table public.case_members from authenticated;
revoke insert, update, delete on table public.affidavit_sections from authenticated;
revoke insert, update, delete on table public.affidavit_text_versions from authenticated;
revoke insert, update, delete on table public.evidence_assets from authenticated;
revoke insert, update, delete on table public.testimonies from authenticated;
revoke insert, update, delete on table public.timeline_events from authenticated;
revoke insert, update, delete on table public.documentaries from authenticated;
revoke insert, update, delete on table public.documentary_chapters from authenticated;
revoke insert, update, delete on table public.documentary_items from authenticated;
revoke insert, update, delete on table public.case_relationships from authenticated;
revoke insert, update, delete on table public.case_audit_log from authenticated;

-- Reads remain governed by RLS. Trusted writes use service-side endpoints/RPCs.

