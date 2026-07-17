# Validation Test Results — B.1

| Field | Value |
|-------|-------|
| **Purpose** | Record security validation after remediation |
| **Version** | 1.0.0 |

## Automated

| Suite | Status | Notes |
|-------|--------|-------|
| `tests/unit/security/b1-remediation.test.ts` | Run locally / CI | Tenant filter, rate limit memory, vault prod key, MFA keys |
| Existing unit/integration | Must stay green | Regression |
| Typecheck / lint | Must stay green | After B.1 edits |

## Manual / ops (required for GO)

| Test | Status |
|------|--------|
| Apply `171`+`172` on staging | Pending env |
| School-access user cannot SELECT finance via `rpt_fi_*` | Pending after migrate |
| Parent cannot download other student storage object | Pending |
| Privileged user without MFA → `/login/mfa-required` when ENFORCE_MFA | Pending |
| Public inquiry 6th submit in 1 min → error | Pending |
| AI context with foreign orgId → 403 | Pending |

## Pen-test plan

Execute `docs/security/phase-b/14_PENETRATION_TEST_PLAN.md` T3/T4 after migrations.
