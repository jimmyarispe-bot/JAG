# Security Remediation Report — Release Phase B.1

| Field | Value |
|-------|-------|
| **Purpose** | Document Critical/High remediations from Phase B |
| **Scope** | Wave B.1 security hardening (no new product features) |
| **Audience** | Security, eng, release |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

---

## Go / No-Go recommendation

| Decision | **CONDITIONAL GO** for continuing engineering phases |
|----------|------------------------------------------------------|
| Critical code remediations | **Addressed in repo** (migration `172` + app hardening) |
| Ops gate | **Apply migrations `171` + `172` on every environment** before production |
| Live cross-tenant RLS suite | **Partial** — unit tests added; full JWT A/B suite still recommended |
| Residual High | Formal acceptances listed in Remaining Low/Medium + ops apply |

**Production Security Checklist:** see `07_PRODUCTION_SECURITY_CHECKLIST.md`.

---

## Summary of resolved issues

| ID | Finding | Resolution |
|----|---------|------------|
| C-01 / SEC-MT-01 | `rpt_*` RLS bypass via views | Migration `172`: `security_invoker = true` on all `public.rpt_%` views |
| C-02 / SEC-RLS-01 | Migration 171 must apply | Documented as ops prerequisite; still required on each DB |
| H-01 / SEC-MT-02 | Finance RLS school-only | `can_access_finance_school()` + policies on transactions/forecasts/allocations |
| H-02 / SEC-AUTH-01 | MFA not enforced | `mfa-enforce.ts` + dashboard `requireAuthorizedRoute`; `/login/mfa-required` |
| H-03 / SEC-SEC-01 | Service-role default client | `createAnonServerClient` / `createServiceRoleClient`; deprecated helper no longer prefers service role |
| H-04 / SEC-API-01 | Weak rate limit | Durable path: Upstash → RPC `check_rate_limit_bucket` → memory |
| H-05 / SEC-APP-01 | Missing headers | CSP, HSTS, frame deny, nosniff, referrer, permissions-policy in `next.config.ts` |
| H-06 / SEC-DATA-02 | Storage policies | `student-documents` staff + parent policies; bucket forced private |
| H-07 / SEC-PAY-01 | `square_planned` | Hard-fail in production (dev only with `ALLOW_SQUARE_PLANNED`) |
| H-08 / SEC-API-02/03 | Tenant IDOR / AI context | `tenant-access.ts`; AI context binds org/school/students |
| H-09 / SEC-DATA-01 | Medical overshare | Parent-safe select projection on medical profiles |
| SEC-AUTH-02 | Public inquiry abuse | Honeypot + durable rate limit + optional Turnstile |
| SEC-PLAT-01 | Notes/relationships null-school | Org membership required in RLS |
| Secrets | Vault key fallback | Production requires `VAULT_ENCRYPTION_KEY` |
| Auth | Login brute force | IP + email throttles via `assertLoginNotThrottled` |

---

## Files changed (primary)

- `supabase/migrations/172_b1_security_remediation.sql`
- `next.config.ts`
- `src/lib/supabase/server.ts`
- `src/lib/platform/api-rate-limit.ts`
- `src/lib/platform/identity/{tenant-access,mfa-enforce,page-guard,mfa}.ts`
- `src/lib/integration-hub/vault-crypto.ts`
- `src/lib/finance/actions.ts`
- `src/lib/admissions/portal/actions.ts`
- `src/components/admissions/portal/ParentInquiryForm.tsx`
- `src/app/api/intelligence/context/route.ts`
- `src/app/api/scholarship/route.ts`
- `src/lib/sis/queries.ts`
- `src/lib/auth/login-throttle.ts`
- `src/app/login/mfa-required/page.tsx`
- `src/lib/platform/env/schema.ts`
- `tests/unit/security/b1-remediation.test.ts`

---

## Validation

| Check | Command / artefact |
|-------|-------------------|
| Unit security tests | `tests/unit/security/b1-remediation.test.ts` |
| Typecheck / lint / integration | Run in CI / local after apply |
| Migration apply | `supabase db push` (171 + 172) |

## Related documents

- `01_RESOLVED_FINDINGS_MATRIX.md`
- `02_REMAINING_LOW_RISK_ITEMS.md`
- `docs/security/phase-b/SECURITY_REPORT.md` (original audit)

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | B.1 implementation |
