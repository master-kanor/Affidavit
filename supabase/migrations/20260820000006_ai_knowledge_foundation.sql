-- Controlled AI knowledge, recommendations, memory, skills, and conversations.
create extension if not exists vector;

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(), case_id text references public.case_records(id) on delete cascade,
  name text not null, agent_kind text not null check (agent_kind in ('owner','admin','guest_ask')),
  owner_user_id uuid references auth.users(id), enabled boolean not null default false,
  model_provider text, model_name text, instructions text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_skills (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text not null,
  allowed_roles public.app_role[] not null default '{}', required_permissions text[] not null default '{}',
  allowed_tools text[] not null default '{}', access_class text not null check (access_class in ('read','write','mixed')),
  output_schema jsonb not null default '{}'::jsonb, enabled boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(), case_id text not null references public.case_records(id) on delete cascade,
  agent_id uuid references public.ai_agents(id), recommendation_type text not null, priority text not null check (priority in ('low','medium','high','critical')),
  target_resource_type text not null, target_resource_id text, title text not null, explanation text not null,
  suggested_change jsonb not null default '{}'::jsonb, supporting_sources jsonb not null default '[]'::jsonb,
  confidence integer check (confidence between 0 and 100), status text not null default 'pending' check (status in ('pending','accepted','rejected','modified','applied')),
  created_by uuid references auth.users(id), reviewed_by uuid references auth.users(id), created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(), case_id text references public.case_records(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade, owner_user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (memory_type in ('preference','decision','organization','integration','workflow','correction')),
  content text not null, source_reference text, status text not null default 'pending' check (status in ('pending','approved','rejected','forgotten')),
  created_at timestamptz not null default now(), approved_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(), case_id text not null references public.case_records(id) on delete cascade,
  resource_type text not null, resource_id text not null, section_id text, source_reference text,
  content text not null, content_class text not null check (content_class in ('source_fact','owner_admin_content','ai_inference','ai_suggestion','unverified')),
  version text not null, permission_scope jsonb not null default '{}'::jsonb, embedding vector(1536),
  search_vector tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(resource_type, resource_id, version)
);
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(), case_id text references public.case_records(id), agent_id uuid not null references public.ai_agents(id),
  user_id uuid not null references auth.users(id) on delete cascade, title text not null default 'New conversation', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','tool')), content text not null, citations jsonb not null default '[]'::jsonb,
  safe_metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_search_idx on public.knowledge_chunks using gin(search_vector);
create index if not exists knowledge_chunks_resource_idx on public.knowledge_chunks(case_id, resource_type, resource_id);
create index if not exists ai_recommendations_review_idx on public.ai_recommendations(case_id, status, priority);

alter table public.ai_agents enable row level security; alter table public.ai_skills enable row level security;
alter table public.ai_recommendations enable row level security; alter table public.agent_memories enable row level security;
alter table public.knowledge_chunks enable row level security; alter table public.ai_conversations enable row level security; alter table public.ai_messages enable row level security;

create policy ai_agents_manager_read on public.ai_agents for select to authenticated using (public.is_admin_or_owner());
create policy ai_skills_manager_read on public.ai_skills for select to authenticated using (public.is_admin_or_owner());
create policy ai_recommendations_manager on public.ai_recommendations for select to authenticated using (public.is_admin_or_owner() and public.can_view_case(case_id));
create policy agent_memories_own on public.agent_memories for select to authenticated using (owner_user_id = auth.uid());
create policy knowledge_chunks_authorized_read on public.knowledge_chunks for select to authenticated using (
  public.can_view_case(case_id) and (
    public.current_app_role() in ('owner','admin')
    or public.can_view_resource(resource_type, resource_id)
  )
);
create policy ai_conversations_own on public.ai_conversations for select to authenticated using (user_id = auth.uid());
create policy ai_messages_own on public.ai_messages for select to authenticated using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

revoke all on table public.ai_agents, public.ai_skills, public.ai_recommendations, public.agent_memories, public.knowledge_chunks, public.ai_conversations, public.ai_messages from anon;
grant select on table public.ai_agents, public.ai_skills, public.ai_recommendations, public.agent_memories, public.knowledge_chunks, public.ai_conversations, public.ai_messages to authenticated;

insert into public.ai_skills(name, description, allowed_roles, required_permissions, allowed_tools, access_class, output_schema, enabled) values
('Affidavit Analyst','Reviews structure and traceability without changing source facts.',array['owner','admin']::public.app_role[],array['can_view_dossier'],array['search_affidavit','read_affidavit_section'],'read','{"type":"recommendation"}',true),
('Evidence Mapper','Suggests reviewable relationships between evidence and affidavit sections.',array['owner','admin']::public.app_role[],array['can_view_evidence'],array['search_evidence','read_evidence_metadata'],'read','{"type":"mapping_suggestion"}',true),
('Documentary Planner','Produces proposed chapters from approved materials only.',array['owner','admin']::public.app_role[],array['can_view_dossier'],array['read_affidavit_section','search_evidence','query_timeline'],'read','{"type":"documentary_plan"}',true),
('Affidavit Ask AI','Answers read-only questions using only the reviewer-authorized retrieval set.',array['user']::public.app_role[],array['can_ask_ai'],array['search_affidavit','read_affidavit_section','search_authorized_evidence','read_authorized_testimony','query_authorized_timeline'],'read','{"type":"grounded_answer","citations":true}',true)
on conflict (name) do update set description=excluded.description, allowed_roles=excluded.allowed_roles, required_permissions=excluded.required_permissions, allowed_tools=excluded.allowed_tools, access_class=excluded.access_class, output_schema=excluded.output_schema;
