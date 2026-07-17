# Phase E — Test Inventory

## Automated suite (as of 2026-07-17)

| Layer | Location | Files | Runner |
|-------|----------|------:|--------|
| Unit | `tests/unit/` | ~87 | Vitest |
| Integration | `tests/integration/` | ~25 | Vitest |
| Smoke / E2E | `tests/smoke/` | 2 | Playwright (Chromium) |
| Certification (Phase E) | `tests/unit/certification/` | 3 | Vitest |
| Build validators | `scripts/validate-*.mts` | 10 | `tsx` via `npm run build` |

**Total test files under `tests/`:** ~115 (plus helpers/setup)

## Module / surface inventory vs coverage

| Surface | Present in product | Automated coverage | Gap severity |
|---------|--------------------|--------------------|--------------|
| Permission / IAM engine | Yes | Unit (IAM, authz, tenant isolation, Phase E matrix) | Medium — no live RLS suite |
| Platform registries / workflows / ULR / PAJ | Yes | Integration + build validators | Low for registry integrity |
| Executive / OIOS intelligence | Yes | Heavy unit (~50 files) | Low for pure logic; Medium for live data accuracy |
| Integrations (Plaid, Square, QB, Google, AcademyOS) | Yes | Unit connector tests | Medium — no live vendor sandbox CI |
| Admissions | Yes | Partial integration (registry/case) | **High** — full enrollment journey untested |
| SIS / students | Yes | Profile route envelopes only | **High** |
| Scheduling | Yes | None dedicated | **Critical** |
| Attendance | Yes | KPI mentions only | **Critical** |
| Teacher workspace | Yes | Permission catalog checks only | **High** |
| Parent / student portal | Yes | Profile smoke partial | **High** |
| Finance / billing ops | Yes | Intelligence finance unit; not ops actions | **High** |
| HR / payroll | Yes | Human-capital intelligence only | **High** |
| API routes (`app/api/**`) | Yes | None | **Critical** |
| Server Actions | Yes | None | **Critical** |
| Edge / cron jobs (`vercel.json`) | Yes | None automated | **High** |
| AI runtime / copilot | Yes | Copilot unit + tenant boundary cert | Medium — no cross-tenant prompt soak |
| Storage (student-documents) | Yes | Policy in migration; no automated storage test | **High** |
| Accessibility | Partial (D.1) | Smoke label check only; no axe | **High** |
| Cross-browser / mobile | Claimed support | Chromium desktop smoke only | **Critical** |

## Untested / under-tested workflows (must close before Phase F)

1. Student enrollment (Admissions → SIS)
2. Class / section creation and scheduling conflicts
3. Attendance take → parent visibility
4. Assignment create → grade → portal
5. Messaging across teacher/parent
6. Billing invoice → payment → finance dashboard
7. Payroll run permissions and isolation
8. Executive dashboard freshness vs source systems
9. Authenticated multi-role Playwright journeys
10. Live Supabase RLS with two organizations
