# Parent Experience (Wave 1.2)

**Product experience layer** — presentation and orchestration over canonical platform services.  
**Does not** create engines or duplicate finance / learning / document / workflow logic.

## Surfaces (`/portal`)

| Area | Route |
|------|-------|
| Home | `/portal` |
| My Children | `/portal/children` |
| Learning | `/portal/learning` |
| Attendance | `/portal/attendance` |
| Calendar | `/portal/calendar` |
| Messages | `/portal/messages` |
| Documents | `/portal/documents` |
| Forms | `/portal/forms` |
| Billing | `/portal/billing` (+ `/portal/finance`) |
| Contracts | `/portal/contracts` |
| Support | `/portal/support` |
| Profile | `/portal/profile` |

## Orchestration

`src/lib/portal/experience/`

- Home composition, attendance reads, Learning Intelligence summaries
- Events → Twin, Evidence, Memory
- Knowledge search bridge for documents

## Engines consumed

Identity · Organization · Knowledge · Learning Intelligence · Finance · CFO (read-only where appropriate) · Communications · Notifications · Twin · Evidence · Memory

## Tests

`tests/unit/portal/wave12-parent-experience.test.ts`
