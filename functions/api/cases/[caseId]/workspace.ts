import type { PagesFunction } from '@cloudflare/workers-types';
import type { Env } from '../../../_shared/supabase';
import { json, requireAuth } from '../../../_shared/supabase';

type Context = { request: Request; env: Env; params: { caseId: string } };

function apiUrl(env: Env, path: string) {
  return `${env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')}/rest/v1/${path}`;
}

function serviceHeaders(env: Env) {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
}

async function readJson<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(env, path), { ...init, headers: { ...serviceHeaders(env), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`Supabase query failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context as unknown as Context;
  if (request.method === 'OPTIONS') return json(request, env, null, 204);
  if (request.method !== 'GET') return json(request, env, { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }, 405);
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const caseId = params.caseId;
  if (!caseId || !/^[a-zA-Z0-9_-]{1,120}$/.test(caseId)) return json(request, env, { code: 'INVALID_CASE_ID', message: 'The case identifier is invalid.' }, 400);

  try {
    const membership = await readJson<Array<{ can_view: boolean; can_edit: boolean; can_export: boolean }>>(env, `case_members?case_id=eq.${encodeURIComponent(caseId)}&user_id=eq.${encodeURIComponent(auth.userId)}&can_view=eq.true&select=can_view,can_edit,can_export&limit=1`);
    if (auth.profile.role !== 'owner' && membership.length === 0) return json(request, env, { code: 'ACCESS_DENIED', message: 'The requested case is not available.' }, 403);

    const cases = await readJson<Array<Record<string, unknown>>>(env, `case_records?id=eq.${encodeURIComponent(caseId)}&select=id,title,description,status,created_at,updated_at&limit=1`);
    if (cases.length === 0) return json(request, env, { code: 'NOT_FOUND', message: 'The requested case is not available.' }, 404);

    const sections = await readJson<Array<Record<string, unknown>>>(env, `affidavit_sections?case_id=eq.${encodeURIComponent(caseId)}&select=id,section_number,title,sort_order,source_label,approval_status&order=sort_order.asc`);
    const sectionIds = sections.map((section) => String(section.id));
    const sectionFilter = sectionIds.length ? `&section_id=in.(${sectionIds.map(encodeURIComponent).join(',')})` : '&section_id=in.(null)';
    const textVersions = await readJson<Array<Record<string, unknown>>>(env, `affidavit_text_versions?version_kind=eq.source_original${sectionFilter}&select=id,section_id,version_kind,text_content,source_reference,created_at&order=created_at.asc`);

    const canViewEvidence = auth.profile.role === 'owner' || auth.permissions.can_view_evidence === true;
    const canViewDossier = auth.profile.role === 'owner' || auth.permissions.can_view_dossier === true;
    const evidence = canViewEvidence ? await readJson<Array<Record<string, unknown>>>(env, `evidence_assets?case_id=eq.${encodeURIComponent(caseId)}&select=id,title,description,asset_type,preview_url,source_url,verification_state,provenance_kind,metadata,created_at,updated_at&order=created_at.asc`) : [];
    const testimonies = auth.profile.role === 'owner' || auth.permissions.can_view_testimony === true ? await readJson<Array<Record<string, unknown>>>(env, `testimonies?case_id=eq.${encodeURIComponent(caseId)}&select=id,title,content,verification_state,provenance_kind,created_at,updated_at&order=created_at.asc`) : [];
    const timeline = auth.profile.role === 'owner' || auth.permissions.can_view_timeline === true ? await readJson<Array<Record<string, unknown>>>(env, `timeline_events?case_id=eq.${encodeURIComponent(caseId)}&select=id,event_date,title,description,verification_state,source_reference,created_at&order=event_date.asc.nullslast`) : [];
    const documentaries = canViewDossier ? await readJson<Array<Record<string, unknown>>>(env, `documentaries?case_id=eq.${encodeURIComponent(caseId)}&select=id,title,description,status,version,created_at,updated_at&order=updated_at.desc`) : [];
    const documentaryIds = documentaries.map((item) => String(item.id));
    const documentaryFilter = documentaryIds.length ? `&documentary_id=in.(${documentaryIds.map(encodeURIComponent).join(',')})` : '&documentary_id=in.(null)';
    const chapters = canViewDossier ? await readJson<Array<Record<string, unknown>>>(env, `documentary_chapters?select=id,documentary_id,title,description,narration,sort_order,status,version,created_at,updated_at&order=sort_order.asc${documentaryFilter}`) : [];
    const chapterIds = chapters.map((item) => String(item.id));
    const chapterFilter = chapterIds.length ? `&chapter_id=in.(${chapterIds.map(encodeURIComponent).join(',')})` : '&chapter_id=in.(null)';
    const documentaryItems = canViewDossier ? await readJson<Array<Record<string, unknown>>>(env, `documentary_items?select=id,chapter_id,resource_type,resource_id,caption,notes,sort_order,created_at&order=sort_order.asc${chapterFilter}`) : [];
    const relationships = canViewDossier ? await readJson<Array<Record<string, unknown>>>(env, `case_relationships?case_id=eq.${encodeURIComponent(caseId)}&approval_status=neq.rejected&select=id,source_type,source_id,target_type,target_id,relationship_type,confidence,approval_status,notes,verified_by,verified_at,created_at&order=created_at.asc`) : [];

    return json(request, env, {
      case: cases[0],
      sections,
      textVersions,
      evidence,
      testimonies,
      timeline,
      documentaries,
      chapters,
      documentaryItems,
      relationships,
      access: { role: auth.profile.role, canViewEvidence, canViewDossier, canExport: auth.profile.role === 'owner' || membership[0]?.can_export === true },
    });
  } catch (cause) {
    console.error('case workspace request failed', cause instanceof Error ? cause.message : 'unknown');
    return json(request, env, { code: 'WORKSPACE_UNAVAILABLE', message: 'The case workspace is temporarily unavailable.' }, 503);
  }
};
