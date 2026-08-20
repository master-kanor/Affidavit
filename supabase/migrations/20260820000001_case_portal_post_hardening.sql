-- Restrict the new legal-case workspace to authenticated, provisioned accounts.
-- Preserve legacy tables, but remove them from the public Data/GraphQL API.

do $$
begin
  if to_regclass('public.legacy_affidavit_sections') is not null then
    revoke all on table public.legacy_affidavit_sections from anon, authenticated;
  end if;
end
$$;
revoke all on table public.evidence_folders from anon, authenticated;
revoke all on table public.evidence_files from anon, authenticated;
revoke all on table public.content_exports from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.ai_audits from anon, authenticated;
revoke all on table public.case_logs from anon, authenticated;
revoke all on table public.team_messages from anon, authenticated;
revoke all on table public.users from anon, authenticated;

revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.is_owner() from public, anon;
revoke execute on function public.is_admin_or_owner() from public, anon;
revoke execute on function public.has_permission(text) from public, anon;
revoke execute on function public.can_view_case(text) from public, anon;
revoke execute on function public.can_edit_case(text) from public, anon;
revoke execute on function public.can_view_resource(text, text) from public, anon;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.is_admin_or_owner() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.can_view_case(text) to authenticated;
grant execute on function public.can_edit_case(text) to authenticated;
grant execute on function public.can_view_resource(text, text) to authenticated;

insert into public.profiles (user_id, display_name, role, status)
select id, coalesce(raw_user_meta_data ->> 'name', email), 'owner', 'active'
from auth.users
where lower(email) = lower('tanauancharles1@gmail.com')
on conflict (user_id) do update
set role = 'owner', status = 'active', updated_at = now();

insert into public.user_permissions (
  user_id, can_view_dashboard, can_view_evidence, can_view_dossier,
  can_view_testimony, can_view_timeline, can_view_documents,
  can_view_images, can_view_videos, can_download, can_export,
  can_share, can_ask_ai
)
select id, true, true, true, true, true, true, true, true, true, true, true, true
from auth.users
where lower(email) = lower('tanauancharles1@gmail.com')
on conflict (user_id) do update set
  can_view_dashboard = true,
  can_view_evidence = true,
  can_view_dossier = true,
  can_view_testimony = true,
  can_view_timeline = true,
  can_view_documents = true,
  can_view_images = true,
  can_view_videos = true,
  can_download = true,
  can_export = true,
  can_share = true,
  can_ask_ai = true,
  updated_at = now();

insert into storage.buckets (
  id, name, public, file_size_limit,
  allowed_mime_types
)
values (
  'case-evidence', 'case-evidence', false, 104857600,
  array['application/pdf','image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','video/mp4','text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create index if not exists case_logs_user_id_idx on public.case_logs(user_id);
create index if not exists evidence_user_id_idx on public.evidence(user_id);
create index if not exists evidence_files_folder_id_idx on public.evidence_files(folder_id);
create index if not exists team_messages_sender_id_idx on public.team_messages(sender_id);
create index if not exists team_messages_recipient_id_idx on public.team_messages(recipient_id);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
