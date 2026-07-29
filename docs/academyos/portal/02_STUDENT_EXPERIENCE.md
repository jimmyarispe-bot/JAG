# Student Experience (Wave 1.3)

**Product experience layer** — presentation and orchestration over canonical platform services.  
**Does not** create engines or duplicate Learning Intelligence, assessments, or Knowledge.

## Surfaces (`/portal/student`)

| Area | Route |
|------|-------|
| Home | `/portal/student` |
| My Learning | `/portal/student/learning` |
| Assignments | `/portal/student/assignments` |
| Assessments | `/portal/student/assessments` |
| Attendance | `/portal/student/attendance` |
| Calendar | `/portal/student/calendar` |
| Documents | `/portal/student/documents` |
| Goals | `/portal/student/goals` |
| Achievements | `/portal/student/achievements` |
| Learning Coach | `/portal/student/coach` |
| Profile | `/portal/student/profile` |
| Messages | `/portal/messages` (shared) |
| Schedule (legacy) | `/portal/student/schedule` |

## Orchestration

`src/lib/portal/student-experience/`

- Home, assignments, Learning Intelligence coach (evidence-only)
- Events → Twin, Evidence, Memory
- Documents via Knowledge bridge

## Engines consumed

Identity · Organization · Learning Intelligence · Knowledge · Finance (read-only if needed) · Communications · Scheduling · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/portal/wave13-student-experience.test.ts`
