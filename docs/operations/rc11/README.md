# RC11 — Production Readiness Program

Reliability, scalability, security, accessibility, observability, integrations, and operational excellence. **No new major business features.**

## Tracks

| Track | Focus |
|-------|--------|
| A | Platform hardening (a11y, mobile, performance, security) |
| B | Priority integrations via extension architecture |
| C | Intelligence operations (workers, observability, realtime) |
| D | Quality engineering (e2e, smoke, load, DR) |
| E | Operations runbooks |
| F | Release Dashboard expansion |

## Validation commands

```bash
npm run validate:a11y
npm run validate:mobile
npm run validate:performance
npm run validate:security
npm run validate:production
npm run validate:release
npm run rc11:suite
```

## Evidence docs

- [01_ACCESSIBILITY.md](./01_ACCESSIBILITY.md)
- [02_MOBILE.md](./02_MOBILE.md)
- [03_PERFORMANCE.md](./03_PERFORMANCE.md)
- [04_SECURITY.md](./04_SECURITY.md)
- [05_INTEGRATIONS.md](./05_INTEGRATIONS.md)
- [06_WORKERS_OBSERVABILITY.md](./06_WORKERS_OBSERVABILITY.md)
- [07_DEPLOYMENT_RUNBOOK.md](./07_DEPLOYMENT_RUNBOOK.md)
- [08_ROLLBACK.md](./08_ROLLBACK.md)
- [09_MONITORING_PLAYBOOK.md](./09_MONITORING_PLAYBOOK.md)
- [10_INCIDENT_RESPONSE.md](./10_INCIDENT_RESPONSE.md)
- [11_PRODUCTION_CHECKLIST.md](./11_PRODUCTION_CHECKLIST.md)
- [12_DISASTER_RECOVERY.md](./12_DISASTER_RECOVERY.md)
- [00_GO_NO_GO.md](./00_GO_NO_GO.md)
