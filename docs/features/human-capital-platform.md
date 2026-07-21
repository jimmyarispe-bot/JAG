# Human Capital Management (HCM) Platform

AcademyOS RC8 — full employee lifecycle platform for recruiting, hiring, onboarding, records, assignments, contracts, certifications, evaluations, time off, performance, professional development, and offboarding.

Built on the existing HR foundation (`src/lib/hr/`, `src/lib/employees/`, Release-8 recruiting/compliance tables) without replacing the employee portal or legacy HR tabs.

## Architecture

| Layer | Location |
|-------|----------|
| Schema (RC8) | `supabase/migrations/195_human_capital_platform.sql` |
| Legacy foundation | Migrations `092` / `093`, `employees`, recruiting, leave, performance |
| Platform module | `src/lib/hr-platform/` |
| Existing actions | `src/lib/hr/actions.ts`, `src/lib/employees/lifecycle/` |
| Dashboard | `/dashboard/hr` (Operations default + legacy tabs) |
| Employee portal | `/dashboard/employee` |
| HRIS adapters | ADP, Paychex, BambooHR, UKG, Rippling (stubs) |

```
Applicant → Interviewing → Offer Extended → Hired → Onboarding → Active
                                                              ↓
                                              Leave of Absence / Inactive
                                                              ↓
                                                    Terminated / Retired
```

Every lifecycle transition writes service history, emits Executive Intelligence activity, and is available to the Workflow Engine.

## Data model

Primary tables: `employees`, `employee_profiles`, `hr_job_postings`, `hr_job_applications`, `hr_candidate_interviews`, `hr_onboarding_tasks`, `hr_employment_contracts`, `employee_certifications`, `leave_requests`, `performance_evaluations`, `performance_goals`, `hr_performance_notes`, `employee_training_records`, `hr_employee_assignments`, `employee_service_history`.

RC8 adds `lifecycle_stage`, `audit_id`, `seniority_years`, `background_check_status`, `performance_rating` on employees; contracts and multi-entity assignments with effective dates. Data remains school-scoped with RLS.

## Employee lifecycle

| State | Description |
|-------|-------------|
| `applicant` | Candidate in ATS |
| `interviewing` | Interviews scheduled |
| `offer_extended` | Offer letter sent |
| `hired` | Hire recorded |
| `onboarding` | Checklist in progress |
| `active` | Employed and productive |
| `leave_of_absence` | Approved leave (`on_leave` DB alias) |
| `inactive` | Not currently working |
| `terminated` | Separated |
| `retired` | Retired |

Transitions are validated in `LIFECYCLE_TRANSITIONS` (`src/lib/hr-platform/types.ts`).

## Employee profile

Expanded fields include: Employee ID / number, role / job title, school assignment(s), supervisor, employment type, hire date, seniority, certifications, licenses, background check status, contracts, performance rating, emergency contacts, documents, and **audit_id**.

## Recruiting

Position management, applicant tracking, resume storage, interview scheduling, offer management, and hiring pipeline via `hr_job_postings`, `hr_job_applications`, `hr_candidate_interviews`, and `hireApplicant` → employee + onboarding.

## Onboarding

Automated tasks: required documents, handbook acknowledgement, training, technology checklist, background verification, payroll readiness. Integrates with Workflow Engine (`start_employee_onboarding`). Completing all tasks transitions to `active` and emits `employee.onboarding.completed`.

## Contracts

Multiple contracts per employee (`hr_employment_contracts`): draft → active → expiring → renewed → archived. Linked to Document Management (`platform_documents`).

## Certifications & compliance

Teaching certifications, CPR, First Aid, state credentials, background checks, fingerprinting, mandatory trainings. `emitCertificationExpiringAlerts` generates reminders and EI events before expiration.

## Performance & professional development

Annual / mid-year reviews, goals, observations, improvement plans, recognition notes. PD courses, workshops, conferences, CEUs, internal trainings with completion history.

## Time off

Types: vacation, sick, personal, bereavement, jury duty, unpaid (plus legacy `pto` / `fmla`). Approval via `decideLeaveRequest` and workflow action `approve_leave_request`.

## Assignments

Employees may belong to multiple schools, programs, and classes with effective dates (`hr_employee_assignments`). Emits `employee.assigned`.

## Permissions

| Role | Access |
|------|--------|
| Founder / CEO | Full |
| HR (`hr.manage` / `HR_ACCESS`) | All employee records |
| School Leader | Employees assigned to their school |
| Teachers | Own profile only (portal) |
| Finance | Payroll-related information only |

Helpers: `canManageAllHcm`, `canViewSchoolEmployees`, `canViewOwnEmployeeProfile`, `canViewPayrollInfo`, `canEditHcm`.

## Workflow integration

| Action | Effect |
|--------|--------|
| `transition_employee_lifecycle` | Validated lifecycle move |
| `approve_leave_request` | Approve pending leave |
| `start_employee_onboarding` | Seed extended tasks + stage |
| `send_hcm_reminder` | Communications queue |
| `emit_certification_alerts` | Cert expiration fan-out |

Triggers cover hire, update, promote, assign, cert expiring, review completed, leave approved, terminated, onboarding completed, offer extended.

## Communications

Automatic fan-out via `platform_communications`:

- Offer letters  
- Onboarding reminders  
- Certification alerts  
- Review reminders  
- Contract renewals  
- Time-off decisions  

## Executive Intelligence events

| Event | When |
|-------|------|
| `employee.hired` | Hire / onboarding from recruiting |
| `employee.updated` | Lifecycle / profile changes |
| `employee.promoted` | Promotion recorded |
| `employee.assigned` | School / program / class assignment |
| `employee.certification.expiring` | Credential nearing expiration |
| `employee.review.completed` | Performance review completed |
| `employee.leave.approved` | Leave approved |
| `employee.terminated` | Termination |
| `employee.onboarding.completed` | All onboarding tasks done |
| `employee.offer.extended` | Offer extended |

Also retains `employee.created`, `employee.deactivated`, `employee.restored`. Feeds Timeline, Knowledge Graph, and workforce analytics via `recordActivity` / `recordHcmActivity`.

## Extension interfaces

**HRIS / payroll (deferred):** ADP, Paychex, BambooHR, UKG, Rippling  

Registered via Workflow extension API (`ensureHrisExtensionsRegistered`). No live sync in RC8.

## API

- Legacy: `src/lib/hr/actions.ts` (create employee, payroll, etc.)  
- Platform: `src/lib/hr-platform/server-actions.ts` (lifecycle, recruiting, contracts, leave, performance, PD, assignments)  

## Security

HR dashboard gated by existing HR admin access. Teachers use the employee portal for self-service. Finance payroll surfaces remain behind `payroll.run` / `finance.payroll`.

## Acceptance (RC8)

- Employee lifecycle fully managed with audit + workflow + EI  
- Recruiting and onboarding operational  
- Contracts integrate with Document Management  
- Certifications and compliance tracking implemented  
- Performance management and professional development available  
- Time-off workflows integrate with Workflow Engine  
- Executive Intelligence receives HCM lifecycle events  
- Future payroll/HRIS extension interfaces exist  
- Existing Students, Families, Admissions, Communications, Workflows, Documents, Calendar, Finance, EI, Auth, and HR features remain intact  
