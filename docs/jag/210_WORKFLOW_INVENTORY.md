# Sprint 210 — Complete Workflow Inventory

**Branch:** `release/ga-certification`  
**Scope:** Discovery only. No new product features.  
**Machine catalog:** `src/lib/jag-command-center/ga-certification/workflow-inventory.ts` (23 workflows)

---

## 1. How to use this inventory

Each workflow lists primary routes, key modules, and validation dimensions that Phase 2 must cover:

| Dimension | Meaning |
|-----------|---------|
| Happy path | Primary success journey |
| Permission failure | Unauthorized role blocked |
| Missing data | Empty / unbound states stated clearly |
| Deep links | Direct URL + refresh |
| Empty states | No fabricated content |
| A11y | Keyboard / labels / focus |
| Mobile | Usable narrow viewport |

---

## 2. Platform — Authentication

| | |
|--|--|
| **Routes** | `/login`, `/login/activate`, `/login/forgot`, `/login/reset-required`, `/login/mfa-required`, `/auth/callback`, `/jag/login` |
| **Modules** | `src/lib/auth/*`, `src/lib/platform/identity/*`, `src/lib/jag-platform/auth.ts`, `middleware.ts` |
| **Flows** | Invite → activate → create password; forgot/reset; normal login/logout; MFA; session cookie; JAG platform login/logout APIs |
| **Failure modes** | Expired/invalid invitation; expired reset; throttle; MFA required; password reset gate |

---

## 3. Platform — Authorization

| | |
|--|--|
| **Routes** | `/dashboard`, `/portal`, `/founder`, `/exec`, `/jag`, `/organizations`, `/users`, `/settings` |
| **Modules** | `page-guard.ts`, `api-guard.ts`, `action-guards.ts`, `route-authorization.ts`, middleware |
| **Roles (official)** | FOUNDER, EXECUTIVE_DIRECTOR, SCHOOL_LEADER, ADMINISTRATOR, ACCOUNTING, HR, ADMISSIONS, TEACHER, PARENT, STUDENT, BOARD_MEMBER |
| **Also used** | EMPLOYEE / TEAM_MEMBER (workspace landing); JAG roles FOUNDER, PLATFORM_OWNER, PLATFORM_ADMIN, ORG_OWNER, AUDITOR |

---

## 4. AcademyOS product workflows

| Workflow | Primary routes | Key modules |
|----------|----------------|-------------|
| Admissions | `/dashboard/admissions`, `/apply`, `/apply/portal` | `src/lib/admissions` |
| Students (SIS) | `/dashboard/students` | `src/lib/students`, academyos SIS |
| Families | `/portal`, family admin | `src/lib/families`, portal |
| Employees | `/dashboard/employee` | academyos workforce |
| HR | `/dashboard/hr` | `src/lib/hr` |
| Scheduling | `/dashboard/scheduling` | scheduling packages / dashboards |
| Attendance | student + portal progress | SIS / portal |
| Communications | `/portal/messages` | portal + communications |
| Documents | portal / admissions docs | portal DocumentCenter |
| Finance | `/dashboard/finance`, portal finance | `src/lib/finance` |
| Scholarships | `/dashboard/scholarships` | `src/lib/scholarships` |
| Calendar | `/portal/calendar` | portal calendar + ICS API |

---

## 5. Executive / JAG workflows

| Workflow | Primary routes | Key modules |
|----------|----------------|-------------|
| Executive dashboards | `/exec`, `/dashboard/executive`, `/jag`, `/jag/executive` | Command Center, ECC |
| Observability | `/jag/observability`, `/jag/health` | audit + intelligence ops |
| Production Readiness | `/jag/readiness` | Sprint 209 readiness service |
| Explainability | `/jag/graph` | Sprint 208 explain package |
| Memory | `/jag/memory` | Organizational Memory |
| Strategy | `/jag/strategy` | Strategic Intelligence |
| Watchers | `/jag/inbox` | Autonomous Executive Intelligence |
| Graph | `/jag/graph`, `/jag/intelligence-graph` | Graph explorer + legacy graph |
| Decision Intelligence | `/jag/decisions` | Decision Center |
| Evidence | `/jag/evidence` | Evidence Center surfaces |
| Capabilities | `/jag/capabilities` | Capability SDK |
| Release Management | `/dashboard/executive/release`, `/jag/readiness` | release registry + GA certification |

### JAG portal page map (39)

`/jag/dashboard`, `/jag/executive`, `/jag/inbox`, `/jag/briefings`, `/jag/decisions`, `/jag/chat`, `/jag/scenarios`, `/jag/strategy`, `/jag/memory`, `/jag/knowledge`, `/jag/policies`, `/jag/evidence`, `/jag/goals`, `/jag/risk`, `/jag/work`, `/jag/twin`, `/jag/graph`, `/jag/intelligence-graph`, `/jag/capabilities`, `/jag/capability-packs`, `/jag/domains`, `/jag/connectors`, `/jag/providers`, `/jag/blueprints`, `/jag/marketplace`, `/jag/organizations`, `/jag/governance`, `/jag/runtime`, `/jag/developer`, `/jag/settings`, `/jag/health`, `/jag/observability`, `/jag/readiness`, plus detail/share variants.

---

## 6. Cross-cutting production surfaces

| Surface | Location |
|---------|----------|
| Health | `GET /api/health` |
| Ready | `GET /api/ready`, `/api/ready/deep` |
| Env contract | `src/lib/platform/env/schema.ts` |
| Error boundaries | `src/app/error.tsx`, `global-error.tsx`, `jag/error.tsx` |
| 404 | `src/app/not-found.tsx` |
| Middleware auth | `middleware.ts` (AcademyOS session + JAG cookie) |

---

## 7. Validation matrix template (Phase 2)

For each workflow above, certify:

| Check | Pass criteria |
|-------|---------------|
| Happy path | Completes without console/server errors |
| Expected failures | User-facing message, no stack |
| Permission failures | Redirect or hide; no soft-disable leak |
| Missing data | Explicit empty state |
| Refresh | Same URL recovers |
| Navigation | Sidebar / deep link consistent |
| Deep links | Auth gate + correct org scope |
| Error messages | Actionable, non-technical |
| Recovery | Retry / back works |
| Mobile | Primary actions reachable |
| Accessibility | Focus order + labeled controls |
| Loading | Skeleton or busy indicator |
| Empty | No fabricated metrics |

Automated structural coverage is implemented in `GaCertificationService`. Authenticated persona E2E remains a residual GA condition (see `210_GA_CERTIFICATION.md`).
