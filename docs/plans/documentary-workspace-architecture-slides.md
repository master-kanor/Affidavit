## Cover

# Documentary Workspace Architecture

### Persistent UI, review-gated APIs, and source-preserving case presentation

Master Kanor Affidavit System · Architecture Summary

## Slide 1

# The workspace is an editorial projection — not a second affidavit

- **Canonical affidavit text** remains immutable and isolated from documentary narration, ordering, captions, and mappings.
- **Documentary workspace** combines approved sections, evidence, testimony, timeline, and media into a traceable review surface.
- **Owner/Admin** decide what becomes approved; **Guest Reviewer** stays read-only.

> Core rule: AI or editorial organization never becomes a case fact without explicit approval.

## Slide 2

# Replace static chapter slices with a persistent workspace

| Today | Target state |
|---|---|
| In-memory grouping of canonical sections | `documentaries`, `documentary_chapters`, and `documentary_items` persisted in the case database |
| Hard-coded “needs approval” label | Data-driven draft, review, approved, rejected, and archived states |
| Local UI controls | Authenticated actions with validation, audit logs, and concurrency control |
| Source reference panels | Explicit, reviewable case relationships with provenance and verification state |

## Slide 3

# A thin API façade protects the case record

```text
React Documentary Workspace
          ↓
Typed documentary API client
          ↓
Authenticated API façade
  authorization · validation · state transitions · audit
          ↓
Supabase / canonical case database
```

- The browser receives a **workspace aggregate**, not unrestricted table access.
- Mutation routes use the session principal; actor IDs and privilege flags never come from the client.
- Database RLS remains the final guardrail.

## Slide 4

# UI components separate review, editing, and source viewing

| Component group | Purpose |
|---|---|
| `DocumentaryWorkspacePage` + header | Load workspace, show case status, permissions, source integrity, and export readiness |
| `DocumentaryChapterList` + chapter card | Present ordered chapters with data-driven review badges and resource counts |
| `ChapterEditorDrawer` | Edit editorial title, description, and narration — never canonical affidavit wording |
| `DocumentaryItemGrid` + resource picker | Add, remove, reorder, caption, and inspect eligible case resources |
| `RelationshipReviewPanel` | Display provenance, confidence, verification, and Accept / Modify / Reject controls |
| `AuditTimeline` + export dialog | Show who changed what, when, and exactly what an approved export contains |

## Slide 5

# Review gates form a deliberate state machine

```text
DRAFT  →  REVIEW  →  APPROVED  →  ARCHIVED
  ↑        ↓            ↓
  └── REJECTED      REOPEN
```

- Owner/Admin can submit a draft, approve, reject with a reason, reopen, or archive.
- Approval is blocked if included items have rejected/pending relationships or unauthorized visibility.
- Chapter and item decisions are tracked separately from the documentary’s overall status.

## Slide 6

# One aggregate payload keeps UI state coherent

```text
DocumentaryWorkspace
  ├─ documentary: status, version, title, updatedAt
  ├─ chapters[]: metadata, narration, status, ordered items
  ├─ item.resource: source, preview, provenance, verification
  ├─ item.relationship: type, confidence, approval, reviewer
  ├─ permissions: view, edit, review, export
  └─ audit: last action, actor, timestamp
```

- A single response prevents detached cards, missing relationship status, and inconsistent permissions.
- Optimistic concurrency uses `expectedVersion`; stale updates return a clear conflict instead of overwriting work.

## Slide 7

# API surface follows the documentary lifecycle

| Endpoint group | Representative operation | Outcome |
|---|---|---|
| Workspace | `GET /documentaries/:id/workspace` | One authorized aggregate response |
| Documentary | `PATCH /documentaries/:id` | Update editorial metadata with version check |
| Review | `POST /documentaries/:id/review-actions` | Submit, approve, reject, reopen, archive |
| Chapters | Create, edit, reorder, review | Persistent narrative structure |
| Items | Search resources, add, edit, reorder, remove | Traceable chapter composition |
| Relationships | Create and review mappings | Explicit evidence/source linkage |
| Audit and export | Read audit; validate export | Reproducible approved output |

## Slide 8

# Security and provenance are enforced at every layer

- **Role-aware API checks:** Owner/Admin mutations; Guest Reviewer view-only.
- **RLS-backed data access:** a linked resource is returned only if the current principal may view it.
- **Source integrity:** documentary routes cannot modify `affidavit_text_versions`.
- **Audit by transaction:** each mutation records actor, before/after values, request ID, and optional recommendation reference.
- **Media restraint:** embed only normalized, approved provider URLs; never invent external evidence links.

## Slide 9

# Implementation sequence reduces risk

1. Normalize table enums and add documentary version fields.
2. Add shared DTOs, error envelopes, API façade, and authorization tests.
3. Implement aggregate workspace read and role-aware resource search.
4. Add chapter/item CRUD, batch reorder, relationship review, and audit transactions.
5. Replace static cards with data-backed components and conflict-aware mutation states.
6. Add export readiness, snapshots, and end-to-end Owner/Admin/Guest verification.

## Slide 10

# The result: organized presentation without rewriting history

### The documentary becomes easier to build, review, and reproduce.

- **Official affidavit:** unchanged and source-preserving.
- **Evidence presentation:** linked, visible, and reviewable.
- **Documentary narrative:** flexible, auditable, and approval-gated.
- **Case authority:** remains with Owner and Admin — never with the system itself.
