# RC-10 Go / No-Go

## Decision source

`npm run rc10:suite` writes:

- `perf-rc10-go-no-go.json`
- `docs/operations/rc10/artifacts/ga-sign-off.json`

## Decision meanings

| Decision | Meaning |
|----------|---------|
| `go` | All blocking gates pass; RC-4…RC-9 packages import + tests present |
| `conditional_go` | Blocking gates pass; non-blocking items remain (typically external pen-test engagement) |
| `no_go` | Missing packages, failed blocking gates, or CI script gaps |

## Blocking vs conditional

- **Blocking:** performance harness, load suite, security harnesses, DR/backup docs, monitoring/observability routes, a11y suite, CI workflow, e2e projects, deploy/rollback rehearsals, package matrix  
- **Conditional:** pen-test *execution* evidence (plan is required; third-party engagement report may be pending)

## Human approvals

Link executive approval to Phase H:

- `docs/launch/phase-h/00_EXECUTIVE_GA_DECISION.md`
- `docs/launch/phase-h/05_GO_LIVE_CHECKLIST.md`
