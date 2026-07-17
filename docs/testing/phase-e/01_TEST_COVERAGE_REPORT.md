# 1. Test Coverage Report

## Executive summary

AcademyOS has **strong automated coverage of platform/intelligence/registry layers** and **weak coverage of operational school workflows, HTTP boundaries, and live multi-tenant RLS**.

Vitest **does not enforce coverage thresholds** (`vitest.config.ts` has no `coverage` block). Statement/branch % is therefore **not certified** in this phase.

## Coverage by layer

| Layer | Status | Evidence |
|-------|--------|----------|
| Build registry validators | Pass when build runs | `npm run validate:*` |
| Unit (business logic) | Strong for intelligence/IAM/integrations | `npm run test` |
| Integration (mocked DB) | Strong for platform services | `npm run test:integration` |
| Smoke E2E | Minimal unauthenticated guards | `npm run test:smoke` |
| Live DB / RLS | Not executed | No CI secrets/fixtures |
| A11y automated | Not executed | No axe/pa11y job |
| Perf regression automated | Partial unit probes only | `tests/unit/performance/` |
| Security regression | Partial (B.1 unit + IAM) | No DAST |

## Critical path coverage map

| Critical path | Covered? | Notes |
|---------------|----------|-------|
| Auth redirect (unauthenticated) | Yes | Playwright smoke |
| Permission deny (engine) | Yes | Unit + Phase E matrix |
| Tenant school scope | Yes (in-memory / helpers) | Not live RLS |
| Platform service CRUD (notes/tags/activity) | Yes | Mocked Supabase |
| Intelligence pipeline | Yes | Unit + one integration |
| Admissions → SIS | No | |
| Attendance → portals | No | |
| Finance billing | No | |
| Payroll | No | |
| Full role E2E | No | |

## Certification statement

**Coverage is insufficient for production certification of operational domains.** Platform core is regression-protected; school operations are not.
