# RC-5 — E-007 Accessibility CI

| Field | Value |
|-------|-------|
| **Defect** | E-007 / G-RC1-06 |
| **Status** | **Closed** (automation operational; `/login` axe green) |

## Implementation

- Dependency: `@axe-core/playwright`
- Spec: `tests/a11y/critical-routes.spec.ts`
- npm: `npm run test:a11y`
- CI: included in `npm run test:e2e` (project `a11y`)

## Routes

| Route | Auth | CI behavior |
|-------|------|-------------|
| `/login` | Public | Always analyzed; fail on critical/serious |
| `/portal` | Parent storageState | Skip if no auth |
| `/dashboard/teacher` | Teacher storageState | Skip if no auth |
| `/exec` | CEO storageState | Skip if no auth |

## Latest `/login` run

- Violations: **none** (critical/serious)
- Artifact: `docs/operations/rc5/artifacts/axe-login.json`

## Residual accepted issues

- Authenticated-route axe evidence requires staging personas (same as E-001).
- Staff shells lack portal a11y preference bar (low UX observation from RC-4).
- Full WCAG AA / assistive-tech certification deferred.

## Artifacts

`docs/operations/rc5/artifacts/axe-*.json` (written on test run).
