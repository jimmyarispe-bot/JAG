# RC-5 — Go / No-Go

Generated: 2026-07-19T01:29:37.549Z
**Decision: CONDITIONAL_GO**

Deploy/rollback/a11y harness green; E-001 and/or operator RLS/restore remain — acceptable only for non-GA / limited pilot with accepted risks

## Evidence status

| Item | Status | Notes |
|------|--------|-------|
| E-001 authenticated journeys | open | Authenticated multi-role journeys require RC5_<ROLE>_EMAIL/PASSWORD + successful storageState |
| E-007 accessibility CI | closed | axe-core Playwright project operational on /login (+ authenticated routes when storageState present) |
| RLS soak (G-RC1-02) | deferred_accepted | deferred_with_harness |
| Restore rehearsal (G-RC1-08) | deferred_accepted | deferred_with_harness |
| Deployment rehearsal | pass | pass_with_notes |
| Rollback rehearsal | pass | pass_local_deferred_vercel |

## Accepted risks

- **RISK-NEXT-POSTCSS** — Next nested postcss moderate CVE: Accepted in RC-3; do not npm audit fix --force
- **G-RC1-02** — Live multi-tenant RLS soak: Harness ready; dual-org staging cookies not provisioned in this environment
- **G-RC1-08** — Physical Postgres PITR restore: Harness ready; scratch Supabase project not available in this environment
- **E-001** — Authenticated role E2E not executed: No RC5 persona passwords in CI/dev vault for this run — harness + skip markers in place

## Tag recommendation

- Pre-GA / conditional: `v1.0.0-rc5`
- GA (after E-001 + operator evidence): `v1.0.0`

## Before GA

- Provision seven RC5 staging personas and export storageState
- Run npm run test:acceptance-auth + capture traces/screenshots
- Run npm run test:a11y with auth for /portal /dashboard/teacher /exec
- Execute dual-org RLS soak (RC5_RLS_A_COOKIE / RC5_RLS_B_COOKIE)
- Execute scratch PITR restore (RC5_RESTORE_BASE_URL)
- Confirm Vercel previous-promote (RC5_ROLLBACK_CONFIRMED=1)
- Align package.json version with release tag
