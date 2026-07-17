# RC1 — Release Blocker List

Severity rules: Critical blocks RC progression; High must be fixed or formally accepted.

| ID | Sev | Area | Blocker | Owner lane | Status |
|----|-----|------|---------|------------|--------|
| G-RC1-01 | Critical | E2E | No authenticated multi-role Playwright journeys | QA / Eng | Open (E-001) |
| G-RC1-02 | Critical | Multi-tenant | Live two-org RLS + storage soak not executed | Security / Eng | Open (E-002) |
| G-RC1-03 | Critical | Staging | Staging deployment + smoke against staging URL not evidenced | Release / Ops | Open |
| G-RC1-04 | Critical | Migrations | Staging/prod apply of 171+172 not evidenced in this RC | Ops / DBA | Open |
| G-RC1-05 | Critical | Ops workflows | Scheduling/attendance/API-action packs untested | Eng / QA | Open (E-003/E-004) |
| G-RC1-06 | High | A11y | Accessibility regression suite not in CI | Eng / UX | Open (E-007) |
| G-RC1-07 | High | Perf | Performance load/stress not executed | Eng | Open (Phase C / E-008) |
| G-RC1-08 | High | Recovery | Rollback / restore rehearsal not executed | Ops | Open (F1-03) |
| G-RC1-09 | High | Observability | APM + alerting not operational | Ops | Open (F1-04) |
| G-RC1-10 | Medium | Lint debt | ~200 unused-var warnings | Eng | Deferred OK for RC if tracked |
| G-RC1-11 | Medium | Coverage | No Vitest coverage thresholds | Eng | Deferred |

### Cleared in tree (not blockers for compile/test)

| ID | Note |
|----|------|
| G-RC1-OK-01 | Typecheck / lint errors / 890 tests / production build pass on 2026-07-17 |

Traceability: linked to Phase E defect register and Phase F Wave F.1.
