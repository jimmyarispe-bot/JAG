# Student Management — Archive, Delete & Restore

AcademyOS RC1 student lifecycle controls for administrative soft-archive and rare hard-delete.

## Permissions

Only these roles see Archive / Delete / Restore controls:

| Role | Allowed |
|------|---------|
| CEO | Yes |
| Founder | Yes |
| School Leader | Yes |
| Executive Director | No |
| Admissions | No |
| Teacher | No |
| Parent | No |
| Student | No |
| Employee / other staff | No |

Buttons are **hidden** (not merely disabled) for unauthorized users.

Access helper: `canManageStudentLifecycle()` in `src/lib/students/lifecycle/access.ts`.

## Archive workflow

1. Authorized user selects **Archive Student** (list Actions menu or profile header).
2. Service sets:
   - `status = 'archived'`
   - `previous_status = <prior status>`
   - `archived_at`, `archived_by`
3. Student disappears from:
   - Active Students list (default filter)
   - Dashboard student counts
   - Active operational queries that filter `status = 'active'`
4. Historical attendance, grades, billing, scholarships, timeline, and audit remain intact.
5. Activity event: `student.archived` (who, when, reason).

## Restore workflow

1. Filter Student List to **Archived** (or open archived profile).
2. Select **Restore Student**.
3. Service restores `status` from `previous_status` (default `active`) and clears archive columns.
4. Student returns to Active Students.
5. Activity event: `student.restored`.

## Delete workflow

Delete is never immediate.

1. User selects **Delete Student** (shown in red).
2. Confirmation dialog requires:
   - Checkbox: “I understand this cannot be undone.”
   - Typed text: `DELETE` (exact)
3. System runs dependency inspection.
4. If blocking dependencies exist:
   - Permanent delete is unavailable
   - Dialog offers **Archive Student** instead
5. If no blocking dependencies and confirmation is valid:
   - Student row is hard-deleted
   - Toast: “Student deleted.”
   - List refreshes
6. Activity event: `student.deleted` (confirmed, dependencies checked).

### Imported students

If the student was created by Bulk Import, the dialog shows:

- Imported from Job
- Import ID
- Import Date

Warning: deleting the student does **not** delete import history.

## Dependency rules

Blocking dependencies (delete denied):

- Attendance / period / session attendance
- Grades / progress / assessments / learning records
- Scholarships
- Billing invoices / payments
- Class / SIS enrollments
- Family link (`family_id`) / parent (guardian) links
- Documents / communications / timesheet cost allocations

Informational (do not block):

- Audit / activity logs
- Import transaction history

## List filters

Student List supports:

| Filter | Meaning |
|--------|---------|
| Active (default) | `status != 'archived'` |
| Archived | `status = 'archived'` |
| All | No status filter |

## Service API (bulk-ready)

```ts
import {
  archiveStudent,
  restoreStudent,
  deleteStudent,
} from "@/lib/students/lifecycle";

await archiveStudent(supabase, { studentId, reason? });
await restoreStudent(supabase, { studentId });
await deleteStudent(supabase, {
  studentId,
  confirmationText: "DELETE",
  acknowledged: true,
});
```

Server actions (UI):

- `archiveStudentAction`
- `restoreStudentAction`
- `deleteStudentAction`
- `getStudentDeleteContextAction`

## Audit behavior

| Event | Catalog key | Payload highlights |
|-------|-------------|--------------------|
| Archive | `student.archived` | reason, previousStatus |
| Restore | `student.restored` | restoredStatus |
| Delete | `student.deleted` | confirmed, dependenciesChecked, importOrigin, studentSnapshot |

## Schema

Migration `188_student_archive_delete.sql` adds:

- `students.previous_status`
- `students.archived_at`
- `students.archived_by`

There is no `active` boolean; archive uses `status = 'archived'`.

## Related

- Bulk Import: `src/lib/platform/imports/`
- Student list: `/dashboard/students?view=students&status=active|archived|all`
- Profile: `/dashboard/students/[id]`
