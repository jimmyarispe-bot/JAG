# Document & Records Management

AcademyOS RC6 — unified Document & Records platform with version control, multi-entity relationships, templates, permissions, workflow lifecycle actions, Executive Intelligence events, and a future-ready e-signature extension API.

Legacy vaults (`student_documents`, `employee_documents`, admissions docs, portal Document Center) remain intact. Platform documents live in `platform_documents*` and coexist.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `supabase/migrations/193_document_records_platform.sql` |
| Core module | `src/lib/documents/` |
| E-sign adapters (stub) | `src/lib/documents/esign.ts` via Workflow extension API |
| Dashboard | `/dashboard/documents` |
| Detail / preview / history | `/dashboard/documents/[id]` |
| Workflow actions | `create_document`, `generate_document`, `request_document_upload`, `approve_document`, `reject_document`, `archive_document`, `route_document_for_review` |
| Executive Intelligence | activity catalog keys below |

```
Create / Upload / Template duplicate
        │
        ▼
 platform_documents (+ initial version snapshot)
        │
        ├── platform_document_relations (multi-entity)
        ├── recordActivity → EI + Workflow triggers
        └── never overwrite — edits insert versions
```

## Document model

### `platform_documents`

First-class entity with:

- Document ID, **audit_id**
- Title, description, category, type
- Owner, school, organization
- Status, current version
- File metadata (name, mime, URL, storage path, size)
- Tags, template_id, workflow_id
- Signature fields (status, provider, external id) — extension-ready
- `policy_locked` (blocks hard delete)
- Archived timestamp + metadata

### Categories

`admissions | enrollment | medical | iep | evaluation | behavior | scholarship | billing | financial | employee | hr | contracts | policies | meeting_notes | communications | other`

### Related tables

- `platform_document_versions` — immutable history (never overwrite)
- `platform_document_relations` — student, family, employee, school, workflow, scholarship, invoice, meeting, communication
- `platform_document_templates` — reusable templates with usage_count

## Version control

Every edit that mutates content creates a **new version** (`current_version + 1`) and inserts a row into `platform_document_versions`.

Supported:

| Capability | Behavior |
|------------|----------|
| View history | List versions newest-first |
| Restore | Copies prior snapshot forward as a new version |
| Compare | Diff title / description / file metadata between two versions |

## Entity relationships

One document may relate to multiple entities via `platform_document_relations`. Dashboard filters:

- All Documents  
- Student / Family / Employee / School Documents  
- Templates  
- Archived  

## Templates

Seeded examples: Enrollment Agreement, Scholarship Form, Behavior Report, Medical Authorization, Employment Contract, Incident Report, IEP Cover Sheet.

`duplicateFromTemplate()` creates a document instance, increments `usage_count`, and emits `template.used`.

## Archive / Delete (CRUD Standard)

| Action | Behavior |
|--------|----------|
| Edit | Creates a new version by default |
| Archive | Soft end-state (`status=archived`) |
| Restore | Returns to `active` |
| Delete | Hard delete with DELETE confirmation; **blocked** when `policy_locked` |

Prefer archive. UI uses shared `DestructiveConfirmDialog` + `EntityActionMenu`.

## Permissions

| Role | Access |
|------|--------|
| Founder / CEO | Full |
| School Leader | School documents |
| Teachers | Edit (student-scoped in product usage) |
| HR | Employee records |
| Finance | Billing / financial categories (permission-gated) |
| Parents | View (own family documents) |
| Students | View (allowed documents) |

Helpers: `canViewDocuments`, `canEditDocuments`, `canManageSchoolDocuments`, `canManageHrDocuments`, `canManageFinanceDocuments`.

## Workflow integration

| Action | Effect |
|--------|--------|
| `create_document` | Creates platform document |
| `generate_document` | Duplicate from template (or create draft) |
| `request_document_upload` | Draft document + portal notification |
| `approve_document` | Status → approved (new version) |
| `reject_document` | Status → rejected |
| `archive_document` | Soft archive |
| `route_document_for_review` | Status → pending_review |

Triggers: `documents.created`, `documents.versioned`, `documents.archived`, `documents.approved`.

## Extension API — e-signatures

No live DocuSign / Dropbox Sign / Adobe Sign integration in RC6.

`src/lib/documents/esign.ts` registers deferred adapters:

- `docusign`  
- `dropbox_sign`  
- `adobe_sign`  

`requestSignature()` invokes the Workflow extension API (`isConfigured()` currently `false`). Emits `signature.requested`.

## Preview & search

- Inline preview: PDF, images, text  
- Office docs: future provider  
- Metadata search on title, description, file name, category  
- OCR: future-ready (not implemented)

## Executive Intelligence events

| Event | When |
|-------|------|
| `document.created` | Document created |
| `document.uploaded` | File metadata attached on create |
| `document.updated` | Non-versioned update |
| `document.versioned` | New version written |
| `document.archived` | Archived |
| `document.restored` | Restored from archive |
| `document.deleted` | Hard deleted |
| `template.used` | Template duplication |
| `signature.requested` | E-sign request (deferred) |

These feed Timeline, Knowledge Graph, Workflow Engine, and Audit History via `recordActivity`.

## Upload types

PDF, DOCX, XLSX, images (PNG/JPEG/GIF/WebP), CSV, TXT — plus future media (`image/*`, `video/*` accepted by mime helper).

## Acceptance (RC6)

- Documents are first-class entities  
- Version history with restore / compare  
- Multi-entity relationships  
- Archive / restore / delete per CRUD Standard  
- Workflow lifecycle actions  
- EI events registered  
- E-signature provider interface only  
- Existing SIS / portal document surfaces unchanged  
