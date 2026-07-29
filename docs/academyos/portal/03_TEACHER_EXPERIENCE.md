# Teacher Workspace (Wave 1.4)

**Product experience layer** — presentation and orchestration over canonical platform services.  
**Does not** create engines or duplicate scheduling, attendance, Learning Intelligence, Knowledge, or payroll logic.

## Surfaces (`/dashboard/teacher`)

| Area | Route |
|------|-------|
| Home | `/dashboard/teacher` |
| My Classes | `/dashboard/teacher/classes` |
| Class session | `/dashboard/teacher/sessions/[id]` |
| Student profile | `/dashboard/teacher/students/[id]` |
| Attendance | `/dashboard/teacher/attendance` |
| Progress monitoring | `/dashboard/teacher/progress` |
| Lesson planning | `/dashboard/teacher/lessons` |
| AI Teaching Assistant | `/dashboard/teacher/assistant` |
| Parent communication | `/dashboard/teacher/communications` |
| Documents | `/dashboard/teacher/documents` |
| Timesheets | `/dashboard/teacher/timesheets` |
| Resources | `/dashboard/teacher/resources` |
| Profile | `/dashboard/teacher/profile` |

## Orchestration

`src/lib/teacher/experience/`

- Home, classes range views, timesheet preview, evidence-only AI assistant
- Attendance / session actions delegate to existing `@/lib/teacher/actions`
- Events → Digital Twin, Evidence Ledger, Organizational Memory
- Documents search via Knowledge bridge; timesheets via AcademyOS timekeeping / Finance preview only

## Engines consumed

Identity · Organization · Learning Intelligence · Knowledge · Scheduling · Attendance · Communications · Workflow · Finance (timesheets/pay preview) · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/teacher/wave14-teacher-experience.test.ts`
