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

## D. Student experience (Wave 1.3)

| Screen | Route | Engines |
|--------|-------|---------|
| Student home | `/portal/student` | Identity, Scheduling, Notifications |
| My Learning | `/portal/student/learning` | **LearningIntelligence**, Knowledge |
| Assignments | `/portal/student/assignments` | Workflow / compliance deadlines |
| Assessments | `/portal/student/assessments` | Learning, Knowledge |
| Attendance | `/portal/student/attendance` | SIS |
| Calendar | `/portal/student/calendar` | Scheduling, Calendar |
| Documents | `/portal/student/documents` | **Knowledge** |
| Goals | `/portal/student/goals` | Learning |
| Achievements | `/portal/student/achievements` | LearningIntelligence |
| Learning Coach | `/portal/student/coach` | **LearningIntelligence** (evidence-only) |
| Profile | `/portal/student/profile` | Identity |
| Schedule (legacy) | `/portal/student/schedule` | Scheduling |
| Messages | `/portal/messages` | Communications |

Staff view: `/dashboard/students/**`.

## E. Teacher workspace (Wave 1.4)

Product orchestration at `/dashboard/teacher/**` — no new engines; consumes Scheduling, Attendance, LI, Knowledge, Finance timekeeping, Communications.

| Screen | Route | Engines |
|--------|-------|---------|
| Teacher home / today | `/dashboard/teacher` | Scheduling, Attendance, Work, Notifications |
| My Classes | `/dashboard/teacher/classes` | Scheduling |
| Class session | `/dashboard/teacher/sessions/[id]` | Scheduling, Attendance, Learning |
| Student profile | `/dashboard/teacher/students/[id]` | SIS, **P-015**, Knowledge |
| Attendance | `/dashboard/teacher/attendance` | Attendance |
| Progress monitoring | `/dashboard/teacher/progress` | **P-015**, Learning |
| Lesson planning | `/dashboard/teacher/lessons` | Curriculum / Learning, Knowledge |
| AI Teaching Assistant | `/dashboard/teacher/assistant` | **P-015** (evidence-only) |
| Parent communication | `/dashboard/teacher/communications` | Communications, Notifications |
| Documents | `/dashboard/teacher/documents` | KnowledgeEngine |
| Timesheets | `/dashboard/teacher/timesheets` | Finance / workforce timekeeping |
| Resources | `/dashboard/teacher/resources` | Curriculum, Knowledge |
| Profile | `/dashboard/teacher/profile` | Identity |
| Spec | `docs/academyos/portal/03_TEACHER_EXPERIENCE.md` | — |

## F. School Leader Workspace (Wave 1.5)

Product orchestration at `/dashboard/school-leader/**` — no new engines; consumes Org, Admissions, SIS, LI, Scheduling, Compliance, Finance/CFO (read-only), HR, Communications.

| Screen | Route | Engines |
|--------|-------|---------|
| Campus home | `/dashboard/school-leader` | Org, Scheduling, Admissions, Notifications |
| Enrollment | `/dashboard/school-leader/enrollment` | Admissions, Scheduling capacity |
| Students | `/dashboard/school-leader/students` | SIS |
| Teachers | `/dashboard/school-leader/teachers` | Workforce, Scheduling |
| Academics | `/dashboard/school-leader/academics` | **P-015** Learning Intelligence |
| Scheduling | `/dashboard/school-leader/scheduling` | Scheduling, Calendar |
| Compliance | `/dashboard/school-leader/compliance` | Compliance, HR |
| Finance (read-only) | `/dashboard/school-leader/finance` | Finance, CFO (ops summaries) |
| HR | `/dashboard/school-leader/hr` | Workforce |
| Communications | `/dashboard/school-leader/communications` | Communications |
| Reports | `/dashboard/school-leader/reports` | Existing reporting surfaces |
| Profile | `/dashboard/school-leader/profile` | Identity |
| Deep links | `/dashboard/students`, `/admissions`, `/hr`, `/finance`, `/scheduling`, `/compliance` | Same engines |
| Spec | `docs/academyos/portal/04_SCHOOL_LEADER_EXPERIENCE.md` | — |

## G. Executive Workspace (Wave 1.6) / founder / board

Product orchestration at `/dashboard/executive/**` — no new engines; consumes Org, Finance/CFO (read-only), LI, Innovation, Strategy, Knowledge, Reporting, Twin/Memory.

| Screen | Route | Engines |
|--------|-------|---------|
| Executive home | `/dashboard/executive` | Org, EI, Work |
| Multi-school | `/dashboard/executive/multi-school` | Reporting / network |
| Academics | `/dashboard/executive/academics` | **P-015** Learning Intelligence |
| Operations | `/dashboard/executive/operations` | Admissions, Scheduling, Compliance |
| Finance (read-only) | `/dashboard/executive/finance` | Finance, CFO |
| People | `/dashboard/executive/people` | Workforce |
| Strategy | `/dashboard/executive/strategy` | StrategyEngine (@organization) |
| Innovation | `/dashboard/executive/innovation` | InnovationEngine |
| Org intelligence | `/dashboard/executive/intelligence` | Twin, Memory (evidence-only) |
| Reports | `/dashboard/executive/reports` | Existing reporting studio |
| Communications | `/dashboard/executive/communications` | Communications |
| Profile | `/dashboard/executive/profile` | Identity |
| KPIs / strategic / scenarios | `/dashboard/executive/{kpis,strategic,scenarios}` | Org, Innovation, CFO |
| Board | `/dashboard/executive/board` | CFO, Knowledge, Org |
| Finance executive (deep link) | `/dashboard/finance/executive` | Finance, CFO |
| Forecasting / risk / grants | `/dashboard/executive/**` | CFO, Finance, Planning |
| Founder | `/dashboard/founder`, `/founder` | Founder EI, Org |
| Mission control / network | `/dashboard/mission-control`, `/dashboard/executive/network` | Platform EI |
| Release / observability | `/dashboard/executive/release` | Release registry |
| Decisions / briefings | `/dashboard/executive/{decisions,briefings}` | Decision, Memory |
| Spec | `docs/academyos/portal/05_EXECUTIVE_EXPERIENCE.md` | — |

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
