# School Leader Workspace (Wave 1.5)

**Product experience layer** — presentation and orchestration over canonical platform services.  
**Does not** create engines or duplicate Learning Intelligence, Finance, Knowledge, Scheduling, or HR logic.

## Surfaces (`/dashboard/school-leader`)

| Area | Route |
|------|-------|
| Home | `/dashboard/school-leader` |
| Enrollment | `/dashboard/school-leader/enrollment` |
| Students | `/dashboard/school-leader/students` |
| Teachers | `/dashboard/school-leader/teachers` |
| Academics | `/dashboard/school-leader/academics` |
| Scheduling | `/dashboard/school-leader/scheduling` |
| Compliance | `/dashboard/school-leader/compliance` |
| Finance (read-only) | `/dashboard/school-leader/finance` |
| HR | `/dashboard/school-leader/hr` |
| Communications | `/dashboard/school-leader/communications` |
| Reports | `/dashboard/school-leader/reports` |
| Profile | `/dashboard/school-leader/profile` |

## Orchestration

`src/lib/school-leader/experience/`

- Home campus overview, enrollment/students/teachers/academics/scheduling/compliance/finance/HR summaries
- Finance + CFO operational summaries are **read-only**
- Academics via Learning Intelligence / AcademyOS learning dashboards
- Events → Twin, Evidence, Memory

## Engines consumed

Organization · Identity · Learning Intelligence · Knowledge · Finance · CFO (read-only ops) · Scheduling · Attendance · Communications · Workflow · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/school-leader/wave15-school-leader-experience.test.ts`
