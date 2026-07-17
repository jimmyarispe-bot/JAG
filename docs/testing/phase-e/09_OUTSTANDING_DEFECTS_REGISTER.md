# 9. Outstanding Defects Register

Severity: **Critical** > **High** > **Medium** > **Low**

| ID | Severity | Module | Defect | Repro / evidence | Status |
|----|----------|--------|--------|------------------|--------|
| E-001 | Critical | QA / E2E | No authenticated multi-role Playwright journeys | Inventory + smoke limited to unauth redirects | Open — Phase E.1 |
| E-002 | Critical | Multi-tenant | Live RLS two-org isolation not executed | No CI DB fixtures | Open — Phase E.1 |
| E-003 | Critical | Scheduling / Attendance | No automated tests for core ops workflows | Inventory gap | Open |
| E-004 | Critical | API / Server Actions | HTTP and action layers untested | Grep/inventory | Open |
| E-005 | High | Cross-browser | Only Chromium smoke | `playwright.config` | Open |
| E-006 | High | Mobile | Auth/nav/offline not validated | No suite | Open |
| E-007 | High | A11y | No axe/pa11y CI; WCAG AA not certified | Phase D/D.1 | Open (mitigated partially by D.1) |
| E-008 | High | Performance | Load/stress not re-executed in Phase E | Phase C docs | Open |
| E-009 | High | Recovery | Restart/reconnect/queue failure not tested | Charter Phase 10 | Open |
| E-010 | Medium | Coverage tooling | No Vitest coverage thresholds | `vitest.config.ts` | Open |
| E-011 | Medium | Lint hygiene | ~200 unused-var warnings remain | `npm run lint` | Open — non-blocking for CI |
| E-012 | Low | Docs drift | Some ops runbooks still Wave F.1 incomplete | Phase F package | Open |

## Resolved during Phase E (in scope)

| ID | Severity | Fix |
|----|----------|-----|
| E-R01 | High | Typecheck failures in tests (mock client, connectors, fixtures) |
| E-R02 | High | Lint errors (empty object types, `module` assignments, Sidebar refs) |
| E-R03 | Medium | Unit test expecting outdated production secret list (`VAULT_ENCRYPTION_KEY`) |

No Critical product defects were introduced by Phase E documentation work. Residual Critical items are **evidence gaps**, not newly discovered production crashes.
