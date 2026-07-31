# Academy SIS (Student Information System)

Phase 2A package contributions for The JAG OS.

**Scope:** Declarative entity, enrollment, academic, medical, accommodation, permission, and report definitions.

**Not in scope:** UI, persistence, attendance tracking, scheduling, gradebook, billing, parent portal, state reporting.

## Layout

| Folder | Contents |
|--------|----------|
| `students/` | Student entity metadata |
| `guardians/` | Parent/Guardian + relationships |
| `contacts/` | Emergency Contact, Authorized Pickup |
| `enrollment/` | Enrollment / Withdrawal / Transfer / Graduation / Re-enrollment |
| `academic-record/` | Academic + Structured Literacy profile |
| `medical/` | Allergies, medications, emergency notes |
| `accommodations/` | IEP, 504, accommodation flags |
| `attendance-profile/` | Student attendance profile metadata only |
| `permissions/` | SIS permission keys |
| `reports/` | Report definitions |
| `registration/` | Package Runtime registration entry |
| `testing/` | Test resets |

## Registration

`registerAcademyPackageSis()` (`packages/academy/registration/sis/register.ts`) runs after Phase 1 entity registration. It registers SIS entity contributions into the Entity Framework and package-local report/permission catalogs.

## Platform boundary

No JAG engine changes. No Academy SIS code under `src/jag`.
