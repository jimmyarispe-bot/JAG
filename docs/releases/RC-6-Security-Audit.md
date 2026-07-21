# RC-6 Security Audit

**Scope:** RC-6.04 security hardening  
**Date:** 2026-07-19  
**Auditor:** RC-6 quality cycle (code review + targeted fixes)

---

## Findings

| Area | Pre-audit | Post-audit |
|------|-----------|------------|
| OAuth connect state | Forgeable / unbound | HMAC-signed; callbacks bind user, org, permission (`oauth-state.ts`) |
| Integration Hub sandbox/lab | Ungated | Requires `canManageIntegrationHub` |
| Config API org access | IDOR risk | `requireOrganizationAccess` + audit |
| Credential rotate | No security audit event | `logSecurityEvent` on rotate |
| Finance school scoping | Trusted client `school_id` | `requireActorSchool` |
| `/api/ready/deep` | Public | Cron / ops auth |
| Cron secret compare | `===` (timing leak) | `timingSafeEqual` |
| Admissions queue GET | Weak surface | POST + cron/session auth |
| Integration connections RLS | Permission-only gaps | Migration `181_rc604_integration_connections_org_rls.sql` |
| Env contract | Incomplete for OAuth | `OAUTH_STATE_SECRET` in env schema |
| Unit coverage | Gap on OAuth state | `tests/unit/platform/integrations/oauth-state.test.ts` |

Broader Phase B / B1 security packs remain authoritative for pen-test and dependency audit (`docs/security/`).

---

## Issues discovered

1. **Forgeable OAuth state** — attacker could craft callback state without binding actor/org.
2. **Hub sandbox/lab privilege gap** — management actions without hub-manage permission.
3. **Config API IDOR** — organization identifiers accepted without membership check.
4. **Silent credential rotation** — no durable security audit trail.
5. **Finance school spoofing** — client-supplied `school_id` trusted.
6. **Deep readiness endpoint exposure** — unauthenticated deep probe.
7. **Non–constant-time cron secret compare**.
8. **Admissions queue GET** — unsafe method / weak auth combination.
9. **RLS on integration connections** — org tenancy incomplete relative to permission checks.

---

## Fixes applied

| Issue | Fix |
|-------|-----|
| OAuth state | HMAC in `src/lib/platform/integrations/core/oauth-state.ts`; callback binding |
| Hub sandbox/lab | `canManageIntegrationHub` gate |
| Config org IDOR | `requireOrganizationAccess` + audit |
| Credential rotate | `logSecurityEvent` |
| Finance school | `requireActorSchool` |
| Deep ready | Cron/ops authorization |
| Cron compare | `src/lib/security/timing-safe.ts` / `timingSafeEqual` |
| Admissions queue | POST + cron/session |
| Connections RLS | `supabase/migrations/181_rc604_integration_connections_org_rls.sql` |
| Env | `OAUTH_STATE_SECRET` in `src/lib/platform/env/schema.ts` |
| Tests | OAuth state unit tests |

---

## Remaining risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration **181** not applied in all environments | **High** until applied | Apply via Supabase CLI/dashboard before production cutover |
| `OAUTH_STATE_SECRET` unset / weak in an environment | **High** | Required in production env checklist (`docs/launch/PRODUCTION_ENV.md`) |
| External pen-test not re-run after RC-6.04 | Medium | Schedule against Phase B pen-test plan |
| In-memory rate limiting across serverless | Medium | Known PLATFORM_CONTRACT risk; not RC-6.04 scope |
| Service-role client misuse | Medium | Keep elevated clients behind narrow server modules |
| RLS coverage outside integration_connections | Medium | Continue inventory / Phase B remediation |

---

## GO / NO-GO recommendation

### **CONDITIONAL GO**

Code fixes for RC-6.04 are in place and tested at unit level for OAuth state. **GO for merge / staging** once:

1. Migration `181_rc604_integration_connections_org_rls.sql` is applied to the target database.  
2. `OAUTH_STATE_SECRET` is set in production/staging secrets.  
3. Cron/ops secrets for deep ready and admissions queue are confirmed present.

**NO-GO for production** if either (1) or (2) is unmet.
