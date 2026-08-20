-- Recipients may acknowledge a publication but may not modify its content.
drop policy if exists portal_publications_read on public.portal_publications;
drop policy if exists portal_publications_manage on public.portal_publications;
drop policy if exists portal_publications_acknowledge on public.portal_publications;

create policy portal_publications_read on public.portal_publications for select to authenticated
  using (recipient_user_id = auth.uid() or public.is_admin_or_owner());
create policy portal_publications_insert on public.portal_publications for insert to authenticated
  with check (public.is_admin_or_owner() and published_by = auth.uid());
create policy portal_publications_update on public.portal_publications for update to authenticated
  using (public.is_admin_or_owner()) with check (public.is_admin_or_owner());
create policy portal_publications_delete on public.portal_publications for delete to authenticated
  using (public.is_admin_or_owner());

create or replace function public.acknowledge_portal_publication(target_publication_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.portal_publications
    set acknowledged_at = coalesce(acknowledged_at, now())
    where id = target_publication_id and recipient_user_id = auth.uid() and is_active = true;
  if not found then raise exception 'Publication was not found or is not available'; end if;
end;
$$;

revoke all on function public.acknowledge_portal_publication(uuid) from public, anon;
grant execute on function public.acknowledge_portal_publication(uuid) to authenticated;