# Academy Scheduling & Timetable

Phase 2B package contributions for The JAG OS.

**Scope:** Declarative calendars, programs, courses/classes/sections, assignments, schedules, constraints, permissions, and reports.

**Not in scope:** Attendance, teacher workspace, Google Calendar/Meet, automatic timetable generation, conflict resolution algorithms, UI, persistence.

## Layout

| Folder | Contents |
|--------|----------|
| `terms/` | AcademicYear, AcademicTerm |
| `school-calendar/` / `academic-calendar/` | CampusCalendar + day-type definitions |
| `programs/` | Academy program catalog + Program entity |
| `subjects/` `courses/` `classes/` `sections/` | Curriculum scheduling entities |
| `teachers/` | TeacherAssignment |
| `rooms/` `time-slots/` `bell-schedules/` | Facilities & periods |
| `student-schedules/` `teacher-schedules/` | Schedule horizons |
| `conflicts/` | Declarative constraints |
| `permissions/` `reports/` | Package contributions |
| `registration/` | Re-export of Package Runtime registration |

## Registration

`registerAcademyPackageScheduling()` in `packages/academy/registration/scheduling/register.ts`.

## Platform boundary

**No platform modifications required.**
