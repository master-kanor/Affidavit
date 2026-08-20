# Documentary Workspace Database Integration Design

## Status and scope

This document defines the next implementation boundary for connecting the documentary workspace to the canonical case database. It is a design specification, not a migration or deployment. The design preserves the existing authority model: **Owner** has full control, **Admin** has delegated management, and **Guest Reviewer** has read-only access. It also preserves the source-integrity rule: documentary organization, narration, and media relationships are never silently promoted into official affidavit facts.

The verified repository currently renders `DocumentaryView()` from in-memory slices of `canonicalCase.sections` in `client/src/pages/CaseReview.tsx`. There is no active `server/` directory or API route layer; the current package scripts identify the project as a Vite client with Supabase authentication. The existing Drizzle schema already defines `documentaries`, `documentary_chapters`, `documentary_items`, `case_relationships`, `ai_recommendations`, `resource_permissions`, and related canonical case entities. The design below therefore separates the **logical API contract** from the future route implementation and recommends a thin authenticated API façade over Supabase rather than direct browser-side mutation of documentary tables.

## 1. Recommended integration approach

Three implementation approaches were considered.

| Approach | Strengths | Risks | Decision |
|---|---|---|---|
| Direct Supabase reads/writes from the browser | Fastest initial implementation; minimal infrastructure | Mutation authorization is scattered across the client; audit logging can be bypassed; difficult to enforce review transitions consistently | Use only for read-only fallback or local preview, not for documentary mutations |
| Thin authenticated API façade over Supabase | Centralizes permission checks, transition rules, audit logging, validation, and optimistic-concurrency checks; compatible with Cloudflare Pages Functions or Supabase Edge Functions | Requires a small route layer and shared DTOs | **Recommended** |
| Full application server with a domain service and ORM repository | Strongest long-term domain isolation and testability | More infrastructure than the current Vite/Supabase project needs; adds deployment and secret-management surface | Defer until the case-management API grows materially |

The recommended flow is:

```text
React documentary workspace
  -> documentaryApi client
    -> authenticated /api/cases/:caseId/documentaries endpoints
      -> authorization + transition service
        -> Supabase/Drizzle persistence
          -> documentary tables + case_relationships + case_audit_log
```

Read-only public or Guest rendering may use a cached canonical snapshot when no session is available. Any mutation, export approval, or media association must pass through an authenticated Owner/Admin route. The browser must never receive a service-role key.

## 2. Canonical response shape

The frontend should consume one aggregate response instead of assembling chapters, items, relationships, and permissions independently. This keeps the documentary workspace consistent and reduces transient states where an item appears without its relationship or approval metadata.

```ts
export type DocumentaryStatus = "draft" | "review" | "approved" | "archived";
export type ChapterStatus = "draft" | "review" | "approved";
export type ReviewAction = "submit" | "approve" | "reject" | "reopen" | "archive";
export type ResourceType = "affidavit_section" | "evidence_asset" | "testimony" | "timeline_event" | "external_link";

export interface DocumentaryWorkspace {
  documentary: {
    id: string;
    caseId: string;
    title: string;
    description: string | null;
    status: DocumentaryStatus;
    version: number;
    updatedAt: string;
  };
  chapters: DocumentaryChapterView[];
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canReview: boolean;
    canExport: boolean;
  };
  sourceIntegrity: {
    canonicalSourceVersion: string;
    sourceTextReadOnly: true;
    unsavedChanges: boolean;
  };
  audit: {
    lastAction: string | null;
    lastActor: string | null;
    lastActionAt: string | null;
  };
}

export interface DocumentaryChapterView {
  id: string;
  documentaryId: string;
  title: string;
  description: string | null;
  narration: string | null;
  sortOrder: number;
  status: ChapterStatus;
  reviewLabel: "AI suggestion · needs approval" | "Owner/Admin approved" | "Rejected";
  items: DocumentaryItemView[];
}

export interface DocumentaryItemView {
  id: string;
  chapterId: string;
  resourceType: ResourceType;
  resourceId: string;
  sortOrder: number;
  caption: string | null;
  notes: string | null;
  resource: {
    title: string;
    previewUrl: string | null;
    sourceUrl: string | null;
    verificationState: string;
    provenanceKind: string;
  };
  relationship: {
    id: string | null;
    relationshipType: string | null;
    approvalStatus: "suggested" | "accepted" | "modified" | "rejected";
    confidence: number | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
  };
}
```

The response must include only resources the current principal can view. A Guest can see an approved documentary and explicitly permitted draft content, but should not receive pending AI recommendations or unapproved private evidence merely because it is linked to a chapter.

## 3. Frontend component design

The existing `DocumentaryView` should be decomposed into small components with explicit mutation boundaries. The current static chapter mapping can remain as a fallback fixture while the API-backed path is introduced behind the same component interfaces.

| Component | Responsibility | Key props/state |
|---|---|---|
| `DocumentaryWorkspacePage` | Route-level loading, auth, workspace query, error boundary, and mode selection | `caseId`, `documentaryId` |
| `DocumentaryWorkspaceHeader` | Title, documentary status, source-integrity badge, version, and action buttons | `documentary`, `permissions`, `onSubmit`, `onExport` |
| `DocumentaryChapterList` | Ordered chapter list, keyboard reorder, empty state, and chapter selection | `chapters`, `selectedChapterId`, `onSelect`, `onReorder` |
| `DocumentaryChapterCard` | Chapter title, description, narration preview, status, review label, and item count | `chapter`, `permissions`, `onEdit`, `onReview` |
| `ChapterEditorDrawer` | Edit title, description, narration, and chapter status proposal; never edits canonical source text | `chapter`, `onSave`, `onCancel` |
| `DocumentaryItemGrid` | Render ordered resources, drag/drop placeholder, source/provenance labels, and relationship state | `items`, `permissions`, `onReorder`, `onRemove` |
| `DocumentaryItemCard` | Thumbnail/document/video preview, caption, notes, verification state, and source link | `item`, `canEdit`, `onEdit`, `onOpenSource` |
| `ResourcePicker` | Select an existing approved/visible case resource by type and search term | `caseId`, `allowedResourceTypes`, `onAdd` |
| `RelationshipReviewPanel` | Show why the resource is linked, confidence, provenance, and current approval state | `relationship`, `canReview`, `onReview` |
| `ReviewActionDialog` | Require explicit action, optional reason, and current version confirmation | `action`, `target`, `onConfirm` |
| `AuditTimeline` | Show documentary/chapter/item actions, actor, timestamp, and before/after summary | `entries`, `cursor` |
| `ExportReviewDialog` | Show exactly what will be exported and whether all required chapters/items are approved | `workspace`, `onConfirm` |

The visual language should retain the current dossier styling: cream cards, slate background, gold provenance markers, and compact uppercase state badges. The difference is that status badges become data-driven rather than hard-coded. A chapter with `draft` status must display **AI suggestion · needs approval** only when its origin is an AI/editorial proposal. A chapter with `approved` status must display the reviewer identity and timestamp, not merely a generic approval label.

### Component state rules

The workspace should use a service-layer query and mutation store rather than direct `useEffect` calls inside presentational components. At minimum, the client needs these states:

| State | Behavior |
|---|---|
| `loading` | Skeleton chapter cards and disabled mutation controls |
| `loaded` | Render aggregate workspace response |
| `dirty` | Show unsaved-change banner; disable review/export until saved |
| `saving` | Disable duplicate submits and show inline progress |
| `conflict` | Refetch latest version and present a merge/reload choice; do not overwrite silently |
| `forbidden` | Render read-only mode with a clear permission explanation |
| `error` | Preserve the last successful workspace snapshot and offer retry |

## 4. Review-gated workflow

The review workflow must be an explicit state machine. A documentary cannot be exported as approved while any included chapter or relationship remains pending, rejected, or unverified.

```text
draft -> review -> approved -> archived
  ^        |         |
  |        v         v
  +----- rejected <- reopen
```

Recommended transition rules:

| Current state | Action | Allowed principal | Result |
|---|---|---|---|
| `draft` | Submit for review | Owner/Admin | Documentary becomes `review`; audit entry created |
| `review` | Approve | Owner/Admin reviewer | Documentary becomes `approved` only if all included resources and relationships satisfy approval policy |
| `review` | Reject | Owner/Admin reviewer | Documentary returns to `draft`; reason required |
| `approved` | Reopen | Owner only, or Admin if delegated | Documentary becomes `review`; reason required |
| Any non-archived state | Archive | Owner/Admin | Documentary becomes `archived`; no further editing except restore by Owner |

Chapter status follows the same pattern but is constrained by documentary status. A chapter cannot be approved while its `documentary_items` contain a rejected relationship or a resource outside the reviewer’s visibility scope. The UI should offer **Accept**, **Modify**, and **Reject** for suggested relationships. These actions update `case_relationships`, not the canonical affidavit text.

## 5. API endpoint contract

The route layer should be versioned under `/api/v1`. All routes require a Supabase access token except explicitly marked public read routes. The API should return a stable error envelope:

```json
{
  "error": {
    "code": "DOCUMENTARY_VERSION_CONFLICT",
    "message": "The workspace changed since it was loaded.",
    "details": { "expectedVersion": 4, "actualVersion": 5 },
    "requestId": "req_..."
  }
}
```

### Documentary workspace endpoints

| Method and route | Purpose | Body/query | Authorization |
|---|---|---|---|
| `GET /api/v1/cases/:caseId/documentaries` | List visible documentaries for a case | `status`, `cursor`, `limit` | Guest view; Owner/Admin see drafts |
| `POST /api/v1/cases/:caseId/documentaries` | Create a documentary shell | title, description, source version | Owner/Admin |
| `GET /api/v1/documentaries/:documentaryId/workspace` | Load aggregate workspace response | `includeAudit`, `auditCursor` | View permission |
| `PATCH /api/v1/documentaries/:documentaryId` | Update title/description | `title`, `description`, `expectedVersion` | Owner/Admin |
| `POST /api/v1/documentaries/:documentaryId/review-actions` | Submit, approve, reject, reopen, archive | action, reason, expectedVersion | Owner/Admin; reopen may be Owner-only |
| `POST /api/v1/documentaries/:documentaryId/export-check` | Validate export readiness | format, expectedVersion | Owner/Admin; Guest may view result only if permitted |
| `GET /api/v1/documentaries/:documentaryId/audit` | Paginate audit history | cursor, limit | Owner/Admin |

### Chapter endpoints

| Method and route | Purpose | Body | Authorization |
|---|---|---|---|
| `POST /api/v1/documentaries/:documentaryId/chapters` | Create a proposed chapter | title, description, narration, sortOrder, sourceSectionIds | Owner/Admin |
| `PATCH /api/v1/documentary-chapters/:chapterId` | Edit chapter metadata | title, description, narration, expectedVersion | Owner/Admin |
| `DELETE /api/v1/documentary-chapters/:chapterId` | Remove a draft/review chapter | expectedVersion, reason | Owner/Admin; blocked when approved unless reopened |
| `POST /api/v1/documentary-chapters/:chapterId/reorder` | Move a chapter | `sortOrder`, `expectedVersion` | Owner/Admin |
| `POST /api/v1/documentary-chapters/:chapterId/review-actions` | Submit, approve, reject, reopen | action, reason, expectedVersion | Owner/Admin |

### Item and relationship endpoints

| Method and route | Purpose | Body | Authorization |
|---|---|---|---|
| `GET /api/v1/cases/:caseId/resources` | Search visible sections, evidence, testimonies, events, and links | type, query, cursor, limit | View permission |
| `POST /api/v1/documentary-chapters/:chapterId/items` | Add a visible resource to a chapter | resourceType, resourceId, caption, notes, sortOrder | Owner/Admin |
| `PATCH /api/v1/documentary-items/:itemId` | Edit caption/notes/order | fields, expectedVersion | Owner/Admin |
| `DELETE /api/v1/documentary-items/:itemId` | Remove a resource from a chapter | reason, expectedVersion | Owner/Admin |
| `POST /api/v1/documentary-chapters/:chapterId/items/reorder` | Batch reorder items | ordered item IDs, expectedVersion | Owner/Admin |
| `GET /api/v1/case-relationships` | View relationships for a resource/chapter | sourceType, sourceId, targetType, targetId | View permission with redaction |
| `POST /api/v1/case-relationships/:relationshipId/review` | Accept, modify, or reject a proposed mapping | action, relationshipType, notes, expectedVersion | Owner/Admin |
| `POST /api/v1/documentary-chapters/:chapterId/relationships` | Create an explicit chapter-to-resource mapping | resourceType, resourceId, relationshipType, confidence, notes | Owner/Admin |

### Audit endpoint

Every mutation endpoint must write one `case_audit_log` row in the same transaction as the domain change. The API should not accept a client-supplied actor ID. The actor is derived from the validated access token. Audit records should include the action, resource type/ID, before value, after value, expected version, request ID, and optional recommendation ID. The browser may display audit rows but must not edit or delete them.

## 6. Authorization and validation

Authorization has two layers. The route service checks the session principal and role before starting the operation. Database RLS remains the final enforcement layer. Owner/Admin status must come from case membership or an equivalent server-verified profile, not from a client-provided role field or email-only check.

Validation rules include the following:

1. `caseId`, `documentaryId`, `chapterId`, and `itemId` must be opaque IDs validated against the database.
2. `expectedVersion` is required for all updates and deletes. The service rejects stale writes with `409 DOCUMENTARY_VERSION_CONFLICT`.
3. `sortOrder` is normalized server-side. The client sends an ordered ID list for batch reorder; the server assigns contiguous order values.
4. A resource must belong to the same case as the documentary before it can be added.
5. A documentary item cannot expose a resource that the current principal cannot view.
6. Approval requires all included chapter/item relationships to be acceptable under policy. At minimum, each included item must have an accepted relationship or be an explicitly source-backed section reference.
7. Narration is editorial content and must be stored separately from `affidavit_text_versions`. The API must reject requests attempting to update canonical affidavit text through documentary routes.
8. External media URLs must be normalized and allowlisted by provider. The UI may embed YouTube thumbnails/players, but it must not manufacture missing Facebook or other URLs.
9. Export operations must create a snapshot reference so an approved documentary can be reproduced exactly later.

## 7. Client service and query keys

Add `client/src/services/documentaryApi.ts` with typed methods matching the endpoint contract and `client/src/stores/documentaryWorkspaceStore.ts` or the project’s selected data-fetching pattern. Suggested query keys are:

```ts
["documentary-workspace", documentaryId]
["documentary-audit", documentaryId, cursor]
["case-resources", caseId, resourceType, query]
["case-relationships", caseId, sourceType, sourceId]
```

The service must attach the current Supabase access token, parse the stable error envelope, and return typed DTOs. Mutation methods should invalidate the workspace query only after a successful response. A failed mutation must preserve the last server snapshot and show the returned reason.

## 8. Implementation sequence

| Stage | Deliverable | Verification |
|---|---|---|
| 1 | Normalize schema enums and add documentary version columns | Typecheck; migration review; enum compatibility check |
| 2 | Add route layer and shared DTO/error schemas | Unit tests for auth, validation, and error envelopes |
| 3 | Implement workspace aggregate query | Guest/Owner/Admin visibility tests; pagination tests |
| 4 | Implement chapter/item CRUD and reorder operations | Transaction tests; stale-version conflict tests |
| 5 | Implement relationship review actions | State-machine tests; audit-row assertions |
| 6 | Replace static `DocumentaryView` cards with query-backed components | Loading/error/forbidden/conflict UI tests |
| 7 | Add export readiness and snapshot endpoint | Cannot export unapproved or mixed-provenance content |
| 8 | Add end-to-end review flow | Create → edit → submit → reject/modify → approve → audit verification |

## 9. Key design decision

The documentary workspace should be treated as a **reviewable editorial projection** of the canonical case, not as a second affidavit editor. Chapters can reference official sections and evidence, but their narration, ordering, captions, and relationships remain separate records with explicit provenance and approval state. This preserves the user’s requirement that the official affidavit text remain unchanged while still allowing Owner/Admin to improve organization, traceability, presentation, and completeness.

## References

[1]: `client/src/pages/CaseReview.tsx` — Current documentary workspace and static chapter grouping implementation.
[2]: `drizzle/schema.ts` — Existing documentary, relationship, permission, and canonical case table definitions.
[3]: `drizzle/migrations/0001_canonical_case_knowledge.sql` — Reviewable Postgres/Supabase migration with documentary and audit tables/RLS policies.
[4]: `client/src/lib/supabaseClient.ts` — Current browser authentication client and session boundary.
[5]: `client/src/App.tsx` — Existing route map for `/documentary`, `/case-review`, `/dossier`, and authentication routes.
