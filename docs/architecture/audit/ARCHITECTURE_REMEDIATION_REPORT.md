# Architecture Remediation Report — Release Phase A.1

**Date:** 2026-07-17  
**Input:** `docs/architecture/audit/ARCHITECTURE_AUDIT.md` (+ companion debt reports) and Critical security/authz findings from Release readiness reviews  
**Constraint:** No new business features  

## Executive summary

A.1 closed the highest-severity **security and authorization boundary** violations and documented intentional dual stacks (executive graph, platform finance). Intelligence boilerplate consolidation (A1–A4) was already partially done via `intelligence/common/`; remaining domain-copy debt is Medium and deferred.

**Critical open RLS (PAJ/ULR) and payroll over-exposure are remediated in migration `171`.**  
**Phase B readiness:** Critical architecture security violations addressed in code/migrations; Medium duplication and empty agent stubs remain documented.

---

## Issues resolved

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| A1-C1 | Critical | PAJ RLS `using (true)` | Migration `171` — student/parent scoped select; staff write via `sis_student_policy` / `teacher.manage` |
| A1-C2 | Critical | ULR authenticated write-all | Migration `171` — write limited to admin/schools.manage/teacher.manage; read remains catalog-wide |
| A1-C3 | Critical | Payroll RLS school-wide | Migration `171` — payroll/hr permissions + self-service own row |
| A1-H1 | High | Teacher layout wrong permissions | `teacher.view|manage|attendance` + `TEACHER_ACCESS` |
| A1-H2 | High | HR layout allowed self-service into HR console | `hr.view|manage` only |
| A1-H3 | High | Portal layout linkage bypass | Require `portal.parent.access` or `portal.student.access` |
| A1-H4 | High | HR leave/onboarding IDOR | Bind self-service to caller's employee record |
| A1-H5 | High | Attendance gated as `students.edit` | Use `students.attendance` |
| A1-H6 | High | Academic health stub returned critical/0 | Status `unavailable` + `stub: true`; excluded from OIOS aggregate |
| A1-H7 | High | Permission catalog missing teacher/attendance keys | Added to `PERMISSION_KEYS`; TEACHER_ACCESS group expanded |
| A1-M1 | Medium | Dual executive-graph packages | ADR-A1-001 (canonical import paths) |
| A1-M2 | Medium | Dual finance stacks | ADR-A1-002 (ops vs platform engines) |
| A1-M3 | Medium | Empty JAG agent modules | Documented as non-implemented; do not invent agents |

---

## Files modified

```
supabase/migrations/171_a1_architecture_security_rls.sql          (CREATE)
src/app/dashboard/teacher/layout.tsx
src/app/dashboard/hr/layout.tsx
src/app/portal/layout.tsx
src/lib/hr/actions.ts
src/lib/ssis/actions.ts
src/lib/platform/identity/types.ts
src/lib/platform/identity/permission-groups.ts
src/lib/platform/intelligence/organization-health/academic.ts
src/lib/platform/intelligence/infrastructure/modules/organization-health.ts
src/lib/platform/jag/agents/README.md                             (CREATE)
docs/architecture/adr/ADR-A1-001-executive-graph-packages.md      (CREATE)
docs/architecture/adr/ADR-A1-002-platform-finance-vs-operational.md (CREATE)
docs/architecture/audit/ARCHITECTURE_REMEDIATION_REPORT.md        (CREATE)
tests/unit/architecture/a1-remediation.test.ts                    (CREATE)
```

---

## Duplicated code removed / consolidated

| Area | Action |
|------|--------|
| Permission catalog drift (teacher/attendance) | Consolidated into typed catalog + TEACHER_ACCESS group |
| False academic health “measurement” | Stub honesty — stops poisoning aggregates |
| Authz layout sprawl | Aligned to platform permission keys |

**Not deleted in A.1 (intentional dual stacks):**  
`platform/executive-graph` vs `intelligence/executive-graph`; `lib/finance` vs `platform/finance|accounting`. See ADRs.

Intelligence scoring/`common/` extraction was already largely completed in Stabilization A1–A4 — no further mass domain rewrite in A.1.

---

## Technical debt reduced

- Cross-tenant PAJ/ULR write/read exposure  
- School-wide payroll visibility  
- Portal/Teacher/HR entry-path authz inconsistency  
- Self-service HR mutation IDOR  
- Catalog/type system missing keys used by RLS and actions  

---

## Remaining risks (before Phase B)

| Severity | Risk | Recommendation |
|----------|------|----------------|
| High | Apply migration `171` to all environments before claiming fix | Deploy migration + live RLS negative tests |
| High | Parent “Square planned” payment simulation still present | Disable or wire real checkout (Epic 10 / security) |
| High | `/exec/*` route auth still uneven vs `/dashboard/executive` | Gate `/exec` with `executive.*` |
| Medium | Empty agent files / unused wisdom UI | Productize or delete in later phase |
| Medium | Remaining intelligence domain boilerplate | Continue migrating stragglers to `intelligence/common` |
| Medium | In-memory intelligence results | Persist or label as session-only (PRODUCTION_GAP) |
| Medium | Report CSV engines per domain | Epic 13 unified reporting framework |
| Low | 280+ routes / dual exec homes | Compose via executive workspace (Epic 12) |

---

## Updated architecture notes

```
AuthZ boundary (A.1)
  Teacher UI  → teacher.* | TEACHER_ACCESS
  HR console  → hr.view | hr.manage
  Employee    → /dashboard/employee + employee.self_service
  Parent/Student portals → portal.*.access (linkage = scope only)
  PAJ tables  → sis_student_policy / is_parent_of_student
  ULR writes  → schools.manage | teacher.manage | enterprise admin
  Payroll     → payroll/finance/hr perms or self row
```

Module dependency intent unchanged; see ADRs for graph/finance duality.

---

## Recommendations before Release Phase B

1. **Apply `171_a1_architecture_security_rls.sql`** and run cross-tenant RLS attack tests.  
2. Close remaining High security items: fake payments, `/exec` gates, MFA enforcement (Epic 15 Wave A).  
3. Do **not** start Phase B feature work that depends on open PAJ/ULR policies.  
4. Schedule a follow-up A.2 for empty agent cleanup and `/exec` ↔ `/dashboard/executive` composition only after authz is green.  

---

## Quality gates

| Gate | Status |
|------|--------|
| Critical architecture security violations remediated in repo | **Met** (pending migration apply) |
| High authz boundary issues remediated | **Met** (layouts, portal, HR ownership, attendance perm) |
| TypeScript / unit tests for A.1 changes | Run in CI / local validation |
| Full test suite / lint | Must be green before Phase B |
| Clean dependency graph | **Partial** — dual stacks documented, not merged |
| Documentation updated | **Met** (this report + ADRs) |

**Phase B:** Proceed only after migration `171` is applied and CI is green.
