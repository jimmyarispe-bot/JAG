# RC-3 — Release Documentation Index

This index points to canonical ops docs (updated for RC-1–RC-3). Prefer these over inventing parallel guides.

| Document | Path | RC-3 notes |
|----------|------|------------|
| Production deployment | `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` | Use with PRODUCTION_ENV |
| Rollback | `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` + `docs/launch/phase-g/artifacts/04_ROLLBACK_GUIDE.md` | Rehearse in RC-5 |
| Incident response | `docs/operations/phase-f/runbooks/11_INCIDENT_RESPONSE.md` | Active |
| On-call / ops manual | `docs/operations/phase-f/02_OPERATIONS_MANUAL.md` | Active |
| Environment variables | `docs/launch/PRODUCTION_ENV.md` + `.env.example` + `src/lib/platform/env/schema.ts` | Aligned RC-3 |
| Secrets & certificates | `docs/operations/phase-f/runbooks/14_SECRETS_AND_CERTIFICATES.md` | Active |
| Monitoring & alerts | `docs/operations/phase-f/13_MONITORING_AND_OPERATIONS.md` | RC-1 endpoints |
| Backup / restore | `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md` + `rc3/04_BACKUP_RESTORE_VALIDATION.md` | Dry-run pending |
| Disaster recovery | `docs/operations/phase-f/10_DISASTER_RECOVERY_PLAN.md` | Targets not yet evidenced |
| Queue recovery | `docs/operations/phase-f/runbooks/15_QUEUE_RECOVERY.md` | Active |
| Security checklist | `docs/security/phase-b1/07_PRODUCTION_SECURITY_CHECKLIST.md` | Cross-link RC-3 |

## Commands for release engineers

```bash
npm run typecheck
npm run perf:audit
npm run perf:regression
npm run security:authz-inventory
npm run security:recovery
npm audit --audit-level=high
npm run load:suite   # optional staging
```
