# RC-5 — Production Launch Readiness & Go/No-Go

| Field | Value |
|-------|-------|
| **Sprint** | RC-5 |
| **Objective** | Close evidence gaps, rehearse deploy/rollback, Go/No-Go |
| **Constraint** | No feature development; fix release blockers only |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run rc5:suite` | Aggregate Go/No-Go + sub-harnesses |
| `npm run rc5:rls` | RLS soak harness (live with dual cookies) |
| `npm run rc5:restore` | Restore rehearsal harness |
| `npm run rc5:deploy` | Deploy rehearsal probes |
| `npm run rc5:rollback` | Rollback rehearsal |
| `npm run test:a11y` | axe-core critical routes (E-007) |
| `npm run test:acceptance-auth` | Authenticated journeys (E-001) |
| `npm run typecheck` | TypeScript |
| `npm run perf:audit` | Perf audit |
| `npm run perf:regression` | Perf regression gate |

## Documents

| Doc | Content |
|-----|---------|
| [00_GO_NO_GO.md](./00_GO_NO_GO.md) | Decision + evidence table |
| [01_E001_AUTHENTICATED_EVIDENCE.md](./01_E001_AUTHENTICATED_EVIDENCE.md) | Persona / storageState status |
| [02_E007_ACCESSIBILITY.md](./02_E007_ACCESSIBILITY.md) | axe CI report |
| [03_RLS_SOAK_EVIDENCE.md](./03_RLS_SOAK_EVIDENCE.md) | G-RC1-02 |
| [04_RESTORE_REHEARSAL.md](./04_RESTORE_REHEARSAL.md) | G-RC1-08 |
| [05_DEPLOYMENT_REHEARSAL.md](./05_DEPLOYMENT_REHEARSAL.md) | Deploy drill |
| [06_ROLLBACK_REHEARSAL.md](./06_ROLLBACK_REHEARSAL.md) | Rollback drill |
| [07_ACCEPTED_RISKS.md](./07_ACCEPTED_RISKS.md) | Residual risks |
| [08_RELEASE_TAG.md](./08_RELEASE_TAG.md) | Version / tag recommendation |

## Machine reports

- `perf-rc5-go-no-go.json`
- `perf-rc5-rls-soak.json`
- `perf-rc5-restore-rehearsal.json`
- `perf-rc5-deploy-rehearsal.json`
- `perf-rc5-rollback-rehearsal.json`
- `docs/operations/rc5/artifacts/axe-*.json`
