-- Preserve the pre-Supabase/Manus-era table before creating the case workspace.
-- PostgreSQL updates dependent foreign keys when a referenced table is renamed.
do $$
begin
  if to_regclass('public.affidavit_sections') is not null
     and not exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'affidavit_sections'
         and column_name = 'case_id'
     )
     and to_regclass('public.legacy_affidavit_sections') is null then
    alter table public.affidavit_sections rename to legacy_affidavit_sections;
  end if;
end
$$;