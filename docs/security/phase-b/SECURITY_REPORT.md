# AcademyOS Release 1.0 — Phase B Security Report

**Date:** 2026-07-17  
**Scope:** Authentication, authorization, RLS, permissions, sessions, MFA, APIs, secrets, encryption, storage, rate limiting, validation, multi-tenant isolation  
**Method:** Full-codebase review (web, API routes, Server Actions, Supabase migrations/policies, platform services). No features added. No remediations applied in this assessment.  
**Companion package:** `docs/security/phase-b/` (detailed inventories, RLS, privacy, pen-test plan)

---

## Release recommendation

| Decision | **NO-GO for Release Phase C / production multi-tenant launch** |
|----------|----------------------------------------------------------------|
| Score | **42 / 100** Production Security Readiness |
| Gate | No Critical or High open + live cross-org isolation tests green |
| Status | **Not met** |

AcademyOS has a solid permission-catalog foundation and recent A.1 RLS fixes (migration `171`), but **Critical/High isolation and hardening gaps remain**. Do not proceed to Phase C until Wave B.1 remediations are implemented and retested.

---

## 1. Security assessment summary

### Authentication & sessions
| Area | Status | Notes |
|------|--------|-------|
| Login / logout | Partial | Supabase Auth cookie sessions |
| Password reset | Partial | Provider-backed; app lockout thin |
| Session expiry / refresh | Partial | Relies on Supabase JWT lifecycle |
| Token storage | OK (design) | SSR cookies preferred |
| MFA readiness | **Fail for prod** | `src/lib/platform/identity/mfa.ts` — readiness only, **not enforced** |
| OAuth / SSO | Partial | Architecture present; not a hardened enterprise SSO gate |
| Email verification | Partial | Provider-dependent |
| Brute-force / lockout | **Weak** | No durable app-layer account lockout |

### Authorization & permission model
| Area | Status | Notes |
|------|--------|-------|
| Permission catalog | Strong direction | Centralized keys/groups improving post A.1 |
| Hardcoded roles | Residual risk | Role strings still used for nav/labels; MFA deprecated role list remains; some surfaces still role-oriented |
| API / Server Actions | Inconsistent | Many paths check a permission then trust client `schoolId`/`orgId`; some rely on RLS alone |
| Duplicate / dead authz | Present | Overlapping layout vs action checks; unused/legacy role helpers |
| Page guards | Improving | Teacher/HR/portal layouts hardened in A.1 — verify deployment of `171` |

### Supabase RLS & multi-tenancy
| Area | Status | Notes |
|------|--------|-------|
| Core org/school scoping | Partial | Pattern exists via `can_access_school` / membership |
| Finance tables | **High risk** | `089`: `financial_transactions` (and peers) allow **any school-access** staff — not finance-permission scoped |
| Report views `rpt_*` | **Critical risk** | Granted to `authenticated`; no `security_invoker` found — views may bypass underlying table RLS |
| Migration 171 | **Ops Critical** | PAJ/ULR/payroll fixes — must be applied on **every** environment |
| Storage | **High risk** | `student-documents` bucket created; storage policies sparse vs admissions docs |
| Live cross-tenant suite | **Missing** | Isolation not empirically proven in CI |

### API / application security
| Area | Status | Notes |
|------|--------|-------|
| Rate limiting | **Weak** | In-memory only (`api-rate-limit.ts`); ineffective multi-instance |
| Security headers | **Missing** | No CSP / HSTS / frame-ancestors policy in app config |
| CSRF | Unclear/weak | Cookie sessions without explicit CSRF strategy documented/tested |
| Input validation | Partial | Inconsistent DTO validation across routes/actions |
| Output encoding | Partial | React default helps XSS; rich text / stored content needs review |
| Service-role client | **High** | `createServerClient()` prefers `SUPABASE_SERVICE_ROLE_KEY` → **RLS bypass** if used on request paths |
| Parent payments | **High** | `square_planned` simulated provider path in finance actions |
| Dependencies | Medium | Prior audit: moderate Next/postcss XSS transitive (re-run `npm audit` in CI) |

### Secrets, encryption, files
| Area | Status | Notes |
|------|--------|-------|
| `.env*` gitignored | OK | |
| Vault crypto | **High** | Falls back to service-role material when dedicated key missing |
| File signed URLs / expiry | Incomplete | Private buckets + permission-gated signed URLs not uniformly enforced |
| Audit logging | Partial | Gaps on finance immutability, exports, AI actions |

### Multi-tenant isolation (entities)

| Entity | Isolation confidence | Risk |
|--------|---------------------|------|
| Organizations / schools | Medium | Membership helpers — IDOR if service role / weak assert |
| Students / families | Medium | RLS + linkage; parent overshare risk on medical/service fields |
| Employees / HR / payroll | Medium* | *Depends on 171 applied |
| Finance | **Low** | School-access RLS + report views |
| Documents | **Low–Medium** | Storage policy gaps |
| Reports / dashboards | **Low** | `rpt_*` grants |
| Messages / notifications | Medium | Needs live cross-org tests |
| Audit logs | Medium | Incomplete coverage + access tests needed |

---

## 2. Critical findings

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| **C-01** | Critical | Executive/FI report views (`rpt_*`) granted to `authenticated` without `security_invoker` — likely **bypass table RLS** | Migrations `094`, `095`, `102`, others |
| **C-02** | Critical* | Migration **171** (PAJ/ULR/payroll RLS) may be unapplied in some DBs — open write/read until applied | `171_a1_architecture_security_rls.sql` |
| **H-01** | High | Finance operational RLS uses `can_access_school` only — not finance permissions | `089_release6_financial_operations_rls.sql` |
| **H-02** | High | MFA not enforced for privileged users | `src/lib/platform/identity/mfa.ts` |
| **H-03** | High | Server Supabase helper prefers service role (RLS off) | `src/lib/supabase/server.ts` |
| **H-04** | High | In-memory rate limit; public admissions abuse surface | `api-rate-limit.ts` + inquiry RPCs |
| **H-05** | High | Missing CSP/HSTS/clickjacking headers | App/Next config |
| **H-06** | High | Storage policies incomplete for student documents | Bucket in `078`; policies sparse |
| **H-07** | High | Simulated payments (`square_planned`) | `src/lib/finance/actions.ts` |
| **H-08** | High | Authorization often permission + client-supplied tenant IDs without hard membership bind | API/Server Actions pattern |
| **H-09** | High | Parent/PII minimization & medical overshare risk | Privacy assessment |
| **M-01** | Medium | Residual hardcoded/deprecated role lists | e.g. `MFA_EXECUTIVE_ROLES` |
| **M-02** | Medium | Dependency moderate CVE (Next→postcss) | `npm audit` |
| **M-03** | Medium | Incomplete immutable audit for finance/critical actions | Platform audit gaps |

\*Treat as Critical until every environment confirms `171` applied.

---

## 3. Risk matrix

| ID | Likelihood | Impact | Severity | Domain |
|----|------------|--------|----------|--------|
| C-01 | High | Critical | **Critical** | Multi-tenant / RLS |
| C-02 | Medium | Critical | **Critical*** | Ops / RLS |
| H-01 | High | High | **High** | Finance isolation |
| H-02 | High | High | **High** | Authentication |
| H-03 | Medium | High | **High** | Secrets / RLS |
| H-04 | High | Medium–High | **High** | API abuse |
| H-05 | Medium | High | **High** | App security |
| H-06 | Medium | High | **High** | Storage / FERPA |
| H-07 | Medium | High | **High** | Finance integrity |
| H-08 | Medium | High | **High** | Authorization / IDOR |
| H-09 | Medium | High | **High** | Privacy |
| M-01–M-03 | Low–Med | Med | **Medium** | Hygiene |

---

## 4. Recommended fixes (priority ranking)

### P0 — Block release (Wave B.1)

1. **Apply & verify migration 171** on all environments.  
2. **Fix `rpt_*` views** — `security_invoker = true` (or equivalent) + finance permission gates.  
3. **Tighten finance RLS** — require finance permissions + school/org scope (not school-access alone).  
4. **Split Supabase clients** — user-scoped (anon + JWT) vs explicit service-role; ban default service role on request paths.  
5. **Storage policies** for private document buckets + signed URL expiry + permission checks.  
6. **Disable/hard-fail `square_planned`** in production.  
7. **Enforce MFA** for privileged permission sets.  
8. **Durable rate limiting** + CAPTCHA on public admissions RPCs.  
9. **Security headers** (CSP, HSTS, `frame-ancestors`, etc.).  
10. **Explicit membership asserts** on every `orgId`/`schoolId`/`studentId` input (APIs + Server Actions).  
11. **Live cross-tenant penetration suite** (org A vs B) for students, finance, HR, docs, reports, messages, audit logs.

### P1 — Before broad production

12. Remove/replace hardcoded role authorization paths; permissions only.  
13. Dead policy / unused permission cleanup after inventory.  
14. CSRF strategy for cookie-mutating routes.  
15. Persist immutable audit for authz, finance, payroll, exports, AI.  
16. Dedicated `VAULT_ENCRYPTION_KEY`; secret scanning in CI.  
17. Parent/student DTO data minimization (medical/service fields).

### P2 — Hardening

18. Dependency CI gate (`npm audit --audit-level=high`).  
19. Account lockout / brute-force.  
20. Full pen-test execution per `14_PENETRATION_TEST_PLAN.md` + retest.

Detailed wave checklist: `09_PRIORITIZED_REMEDIATION_PLAN.md`.

---

## 5. OWASP Top 10 mapping (current posture)

| OWASP | Posture |
|-------|---------|
| A01 Broken Access Control | **Fail** — finance RLS, views, IDOR patterns |
| A02 Cryptographic Failures | Partial — vault key fallback |
| A03 Injection | Partial — parameterized Supabase; validate filters |
| A04 Insecure Design | Partial — MFA/rate-limit/payment design gaps |
| A05 Security Misconfiguration | **Fail** — headers, service-role default |
| A06 Vulnerable Components | Medium — moderate npm finding |
| A07 Auth Failures | **Fail** — MFA not enforced; weak lockout |
| A08 Software/Data Integrity | Partial — simulated payments; audit gaps |
| A09 Logging/Monitoring Failures | Partial — incomplete critical-action audit |
| A10 SSRF | Review AI/webhook URL fetches |

---

## 6. Permission audit notes

**Keep / strengthen:** centralized `PERMISSION_KEYS` / groups; page guards that assert permissions (post A.1 teacher/HR/portal).  

**Remove or refactor (remediation, not this doc pass):**
- Hardcoded role checks used as authorization (nav/display OK; authz not OK).  
- Deprecated `MFA_EXECUTIVE_ROLES` as any authz input.  
- Duplicate overlapping checks that skip membership binding.  
- Dead RLS policies superseded by later migrations (inventory during Wave B.1).  
- Unused permission keys after product freeze (catalog prune).  

**Do not** redesign the permission product model in this phase — only close security gaps.

---

## 7. Validation gaps (must close)

This assessment is **static**. Quality gates require:
- Automated RLS tests as JWT user (org A cannot read org B).  
- Endpoint matrix for every API + Server Action.  
- Storage download tests with forged paths/signed URLs.  
- Header and rate-limit abuse tests.

Plan: `14_PENETRATION_TEST_PLAN.md`.

---

## 8. Deliverables index

| Deliverable | Location |
|-------------|----------|
| **This Security Report** | `SECURITY_REPORT.md` |
| Risk Matrix | §3 above + `08_RISK_MATRIX.md` |
| Critical Findings | §2 above |
| Recommended Fixes | §4 above |
| Priority Ranking | §4 P0/P1/P2 |
| Release Recommendation | § top — **NO-GO** |
| Architecture / RLS / API / Privacy detail | `01`–`05` |
| Dependencies / Secrets | `06`–`07` |
| Remediation plan | `09_PRIORITIZED_REMEDIATION_PLAN.md` |
| Inventory | `10_SECURITY_SENSITIVE_INVENTORY.md` |
| Pen-test plan | `14_PENETRATION_TEST_PLAN.md` |
| Executive scorecard | `00_EXECUTIVE_SECURITY_REPORT.md` |

---

## 9. Next step

Stakeholder approval of findings → reply **`proceed Wave B.1`** to implement P0 remediations only. No feature work. No silent fixes before approval.
