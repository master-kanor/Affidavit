-- Remove unauthenticated Data/GraphQL visibility and pin function search paths.
revoke all on table public.profiles from anon;
revoke all on table public.user_permissions from anon;
revoke all on table public.resource_permissions from anon;
revoke all on table public.case_records from anon;
revoke all on table public.case_members from anon;
revoke all on table public.affidavit_sections from anon;
revoke all on table public.affidavit_text_versions from anon;
revoke all on table public.evidence_assets from anon;
revoke all on table public.testimonies from anon;
revoke all on table public.timeline_events from anon;
revoke all on table public.documentaries from anon;
revoke all on table public.documentary_chapters from anon;
revoke all on table public.documentary_items from anon;
revoke all on table public.case_relationships from anon;
revoke all on table public.case_audit_log from anon;
do $$
begin
  if to_regclass('public.evidence') is not null then
    revoke all on table public.evidence from anon;
  end if;
end
$$;

alter function public.touch_updated_at() set search_path = pg_catalog, public;
alter function public.storage_case_id(text) set search_path = pg_catalog, public;
