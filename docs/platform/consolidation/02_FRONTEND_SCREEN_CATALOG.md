# 02 — Frontend Screen Catalog

Route families as of consolidation. Detail audits: `docs/applications/academyos/ui/04_ROUTE_AUDIT.md`.

---

## A. Public / marketing

| Screen | Route | Engines |
|--------|-------|---------|
| Marketing home | `/(marketing)` | Branding, Identity (guest) |
| About / Overview / Pricing / Products | `/(marketing)/…` | Branding |
| Solutions / Industry | `/(marketing)/solutions/**` | Branding, Org profiles |
| Contact / Start / Success | `/(marketing)/contact`, `/start` | Forms, Notifications |
| Login / MFA / Reset / Activate | `/login/**` | Identity |
| Auth callback | `/auth/callback` | Identity |

## B. Admissions & apply

| Screen | Route | Engines |
|--------|-------|---------|
| Admissions public site | `/admissions/**` | Branding, Admissions, Notifications |
| Interest / apply entry | `/apply` | Identity, Workflow, Admissions |
| Discovery call / tour / assessment | `/admissions/{discovery-call,schedule-tour,assessment}` | Admissions, Calendar, Learning |
| Apply portal / dashboard | `/apply/portal` | Admissions, Knowledge, Finance |
| Application detail | `/apply/portal/[applicationId]` | Admissions, Knowledge, Workflow |
| Application wizard | `/apply/portal/[applicationId]/wizard` | Admissions, Knowledge, Workflow |
| Apply finance / tuition | `/apply/portal/finance` | Finance, Admissions |
| Parent onboarding | `/admissions/onboarding` | Identity, Portal |
| Thank you | `/apply/thank-you` | Notifications |
| Admissions dashboard (staff) | `/dashboard/admissions/**` | Admissions, Workflow, Org |
| Admissions experience hub | `/dashboard/admissions/experience` | Admissions + platform engines |
| Admissions automation | `/dashboard/admissions/automation` | Workflow, Automation |
| Admissions workflows | `/dashboard/admissions/workflows` | Workflow |
| AcademyOS admissions shell | `/academyos/admissions` | Admissions |

## C. Parent portal

| Screen | Route | Engines |
|--------|-------|---------|
| Portal home (Wave 1.2) | `/portal` | Identity, Org, SIS, Notifications |
| My Children | `/portal/children` | SIS, Learning |
| Learning | `/portal/learning` | **LearningIntelligence**, Knowledge |
| Attendance | `/portal/attendance` | SIS / Attendance |
| Progress (legacy) | `/portal/progress` | Learning, Knowledge |
| Forms | `/portal/forms` | Forms, Workflow |
| Conferences | `/portal/conferences` | Calendar, Comms |
| Messages | `/portal/messages` | Communications |
| Billing | `/portal/billing` | Finance / Revenue |
| Finance (legacy alias) | `/portal/finance` | Finance / Revenue |
| Contracts | `/portal/contracts` | Knowledge, Admissions |
| Support | `/portal/support` | Communications |
| Profile | `/portal/profile` | Identity |
| Calendar | `/portal/calendar` | Calendar |
| Documents | `/portal/documents` | **Knowledge** |
| Portfolio | `/portal/portfolio` | Learning, Knowledge |
| Notifications | `/portal/notifications` | Notifications |
| Engagement | `/portal/engagement` | Comms, Analytics |
| Student overview | `/portal/student` | SIS, Learning |
| Student goals | `/portal/student/goals` | Learning, Org Goals |
| Student schedule | `/portal/student/schedule` | Scheduling |
| Student by id | `/portal/students/[studentId]` | SIS |
| AcademyOS parent shell | `/academyos/parent` | Portal composition |

## D. Student experience

Covered primarily under portal student routes (dashboard/schedule/goals/progress/messages/portfolio). Staff view: `/dashboard/students/**`.

## E. Teacher workspace

| Screen | Route family | Engines |
|--------|--------------|---------|
| Teacher home / today | `/dashboard/teacher/**` | Scheduling, Attendance, Learning |
| Attendance | Teacher + attendance APIs | Attendance, SIS |
| Lesson / resources | Teacher workspace APIs | Learning, Knowledge |
| Observations / session notes | Academic-ops | Knowledge, Learning |
| Mastery / progress | Learning APIs | **P-015**, Learning |
| Payroll / timesheets | Workforce APIs + HR | Workforce, Finance patterns |
| Parent communication | Communications | Notifications, Messaging |

## F. School leader

| Screen | Route family | Engines |
|--------|--------------|---------|
| Students / families | `/dashboard/students`, `/families` | SIS, Org |
| Enrollment / admissions | `/dashboard/admissions` | Admissions, Workflow |
| Teachers / HR | `/dashboard/hr`, `/employee` | Workforce |
| Scheduling / calendar | `/dashboard/scheduling`, `/calendar` | Scheduling, Calendar |
| Finance (school) | `/dashboard/finance/**` | Finance, Revenue |
| Compliance | `/dashboard/compliance` | Compliance, Workflow |
| KPIs / reports | Executive + reports surfaces | Analytics, CFO, Org |
| Scholarships | `/dashboard/scholarships` | Scholarships, Finance |
| Documents / workflows | `/dashboard/documents`, `/workflows` | Knowledge, Workflow |
| Communications | `/dashboard/communications/**` | Communications |

## G. Executive / founder / board

| Screen | Route family | Engines |
|--------|--------------|---------|
| Executive home | `/dashboard/executive` | Org, EI |
| KPIs / strategic / scenarios | `/dashboard/executive/{kpis,strategic,scenarios}` | Org, Innovation, CFO |
| Board | `/dashboard/executive/board` | CFO, Knowledge, Org |
| Finance executive | `/dashboard/finance/executive` | Finance, CFO |
| Forecasting / risk / grants | `/dashboard/executive/**` | CFO, Finance, Planning |
| Founder | `/dashboard/founder`, `/founder` | Founder EI, Org |
| Mission control / network | `/dashboard/mission-control`, `/network` | Platform EI |
| Release / observability | `/dashboard/executive/release` | Release registry |
| Decisions / briefings | `/dashboard/executive/{decisions,briefings}` | Decision, Memory |

## H. Finance (shared + education UI)

| Screen | Route / API | Engines |
|--------|-------------|---------|
| Finance dashboards | `/dashboard/finance/**` | FinanceEngine, Reporting, CFO |
| Banking / treasury APIs | `/api/finance/banking/**` | TreasuryEngine |
| Reconciliation APIs | `/api/finance/reconciliation/**` | ReconciliationEngine |
| Revenue / payables APIs | `/api/finance/{revenue,payables}/**` | Revenue, Payables |
| Reporting / planning APIs | `/api/finance/{reporting,planning}/**` | Reporting, Planning |
| CFO APIs | `/api/cfo/**` | ChiefFinancialOfficerEngine |
| Education tuition/invoices | `/api/academyos/{tuition,invoices,payments}` | Education on Finance rails |

## I. HR / workforce

| Screen | Route family | Engines |
|--------|--------------|---------|
| HR dashboard | `/dashboard/hr/**` | Workforce, Identity |
| Employee | `/dashboard/employee` | Workforce |
| Admin HR | `/dashboard/admin/hr` | Org, Workforce |
| Certification / training | `/dashboard/certification/**` | Workforce, Knowledge |
| Workforce APIs | `/api/academyos/{employees,payroll,timesheets,…}` | Workforce |

## J. Platform / admin / intelligence tooling

| Area | Route family | Engines |
|------|--------------|---------|
| Admin org / users / modules | `/dashboard/admin/**` | Identity, Org |
| Integrations / data | `/dashboard/integrations/**`, `/data/**` | Connectors, Persistence |
| Intelligence ops | `/dashboard/intelligence/**` | EI packs |
| Platform diagnostics | `/dashboard/platform/**` | Platform health |
| Mr. JAG | `/dashboard/jag/**` | Mr. JAG |
| Work / tasks / projects | `/dashboard/work`, `/tasks`, `/projects` | Work, Org |
| Settings / search | `/dashboard/settings`, `/search` | Identity, Search |

---

## Screen count note

~185 `src/app/dashboard/**/page.tsx` files plus portal, apply, marketing, and academyos shells. This catalog groups by **experience**; do not invent parallel screens — extend existing routes when implementing.
