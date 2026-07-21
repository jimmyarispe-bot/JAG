# Family Management Platform

AcademyOS RC2 — families as first-class entities. Students, guardians, billing, scholarships, communications, and emergency contacts are family-centric.

## Architecture

| Layer | Location |
|-------|----------|
| Schema | `supabase/migrations/189_family_management_platform.sql` |
| List queries | `src/lib/families/queries.ts` |
| Access / permissions | `src/lib/families/access.ts` |
| Lifecycle (archive/restore/delete) | `src/lib/families/lifecycle/` |
| Merge / split / move | `src/lib/families/merge.ts`, `split.ts`, `relationships.ts` |
| Profile workspace | `src/lib/families/profile/` + `src/components/families/profile/` |
| Dashboard UI | `/dashboard/families`, `FamilyDashboard.tsx` |
| Bulk import matching | `src/lib/platform/imports/entities/student/family-intelligence.ts` |
| Activity catalog | `src/lib/platform/activity/catalog.ts` |

Core tables: `families`, `guardians`, `students.family_id`, `family_households`, `family_billing_accounts`, plus profile-linked documents/communications.

## Relationships

```
Family (1)
 ├── Guardians (0–10), one Primary Guardian
 ├── Students (0–N) — each student has exactly one active family_id
 ├── Emergency contacts (separate from guardians)
 ├── Authorized pickup
 ├── Billing account / invoices / payments
 ├── Scholarships (family-level and student-level)
 ├── Documents (versioned)
 ├── Communications
 └── Timeline / audit (platform activity)
```

Siblings are derived: other students sharing the same `family_id` (plus legacy SSIS sibling links).

## Permissions

| Role | View | Create / Edit | Archive / Delete / Merge / Split |
|------|------|---------------|----------------------------------|
| CEO | Yes | Yes | Yes |
| Founder | Yes | Yes | Yes |
| School Leader | Yes | Yes | Yes |
| Executive Director | Yes | Yes | No |
| Admissions | Yes | Yes | No |
| Teacher | Read-only | No | No |
| Parent | Own family only | No (portal-limited) | No |
| Student | No family management | No | No |

Helpers: `canViewFamilies`, `canEditFamilies`, `canManageFamilyLifecycle` in `src/lib/families/access.ts`.

## Family entity fields

- Family Name, Household Name, Preferred Name
- Status: `active` | `inactive` | `archived` | `incomplete` | `prospective`
- Primary / secondary guardian (via guardians + `is_primary`)
- Preferred language, communication method, timezone, notes
- Created date, archive metadata (`previous_status`, `archived_at`, `archived_by`)

## Dashboard

Route: `/dashboard/families`

Columns: Family Name, Primary Guardian, Students, School(s), Email, Phone, Status, Last Activity, Actions.

Supports search, sort, pagination, and quick filters: Active, Archived, Incomplete, Prospective, All.

## Profile

Route: `/dashboard/families/[id]`

Sections: Overview, Parents, Students, Emergency Contacts, Authorized Pickup, Billing, Scholarships, Communications, Documents, Timeline, Audit History (existing AcademyOS profile workspace).

## Merge flow

1. Authorized user opens Merge on family A, selects target family B (same school).
2. Students, guardians, households move to B.
3. Billing account moves only if B has none.
4. Source A is archived (history preserved); activity `family.merged`.
5. Student platform relationships sync for moved students.

Never hard-deletes source history.

## Split flow

1. Select students on source family; provide new family name.
2. Create new active family; move selected students (optional guardians).
3. Source family retains remaining students and billing unless emptied by policy.
4. Activities: `family.split` (new) + `family.updated` (source).
5. Timeline/audit retained on both households.

## Archive / restore / delete

Same safety model as students:

- **Archive** — soft status `archived`; list filter hides from Active.
- **Restore** — restores `previous_status` (default `active`).
- **Delete** — requires checkbox + typed `DELETE`; blocked if any of:
  - Students
  - Billing / invoices
  - Documents
  - Communications
  - Scholarships
  - Related notes

If blocked, UI should offer Archive instead.

## Bulk Import behavior

Student import:

1. Groups sibling rows by guardian email → phone → household name → address.
2. `findExistingFamily` reuses by the same keys against existing guardians/families.
3. Creates a family when no match; avoids duplicate family links for the same student.

Matching keys: guardian email, guardian phone, household / family name, address.

## Timeline & Executive Intelligence events

Published via `recordActivity` / activity catalog:

| Event | When |
|-------|------|
| `family.created` | Family created (manual or import) |
| `family.updated` | Material updates / split source |
| `family.archived` | Archive |
| `family.restored` | Restore |
| `family.deleted` | Hard delete |
| `family.merged` | Merge complete |
| `family.split` | Split complete |
| `guardian.added` | Guardian added |
| `guardian.updated` | Guardian updated |
| `student.moved` | Student moved to another family |

These feed Executive Timeline, Knowledge Graph, Operational Loop, and Audit History.

## Acceptance criteria

- [x] Family is a first-class entity
- [x] Every student belongs to exactly one active `family_id`
- [x] Multiple guardians supported (primary designated)
- [x] Siblings visible on student profile
- [x] Merge / split preserve history
- [x] Archive / restore / delete match student safety model
- [x] Bulk Import creates or reuses families intelligently
- [x] Executive Intelligence receives lifecycle events
- [x] Existing student, admissions, scholarship, billing, import flows remain intact
