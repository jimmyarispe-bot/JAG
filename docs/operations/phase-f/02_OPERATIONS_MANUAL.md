# Operations Manual — AcademyOS

| Field | Value |
|-------|-------|
| **Purpose** | Single ops handbook for deploy, run, monitor, recover |
| **Scope** | Production Vercel + Supabase AcademyOS |
| **Audience** | SRE / DevOps / on-call engineers |
| **Prerequisites** | Vercel + Supabase admin; secrets access; this Phase F package |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

---

## System overview

AcademyOS is a Next.js application on **Vercel** with data/auth/storage on **Supabase**. Background work runs via **Vercel Cron** calling `/api/platform/process-queues` with `CRON_SECRET`.

## Daily operations checklist

1. Confirm `GET /api/health` → 200.  
2. Confirm `GET /api/ready` → 200.  
3. Spot-check Vercel deployment status + error rate.  
4. Confirm last cron success (Vercel cron logs / queue side effects).  
5. Review critical alerts (when configured — see monitoring guide).  
6. Supabase: disk, connection count, auth errors.

## Runbook index

| Topic | Document |
|-------|----------|
| Deploy | `runbooks/12_DEPLOYMENT.md` |
| Rollback | `runbooks/12_DEPLOYMENT.md` § Rollback |
| Incident | `runbooks/11_INCIDENT_RESPONSE.md` |
| Security incident | `runbooks/11_INCIDENT_RESPONSE.md` § Security |
| DB backup/restore | `runbooks/13_DATABASE_BACKUP_RESTORE.md` |
| Secrets / certs | `runbooks/14_SECRETS_AND_CERTIFICATES.md` |
| Queues | `runbooks/15_QUEUE_RECOVERY.md` |
| Performance | `runbooks/16_PERFORMANCE_TROUBLESHOOTING.md` |
| Scaling / storage | `runbooks/17_SCALING_AND_STORAGE.md` |
| Monitoring | `13_MONITORING_AND_OPERATIONS.md` |
| DR | `10_DISASTER_RECOVERY_PLAN.md` |
| Release | `14_RELEASE_OPERATIONS_MANUAL.md` |

## Environments

| Env | App | Data |
|-----|-----|------|
| Local | `npm run dev` | Local or remote Supabase |
| Preview | Vercel preview | Linked preview project (org standard) |
| Production | Vercel production | Production Supabase |

Env vars: `docs/launch/PRODUCTION_ENV.md` + `src/lib/platform/env/schema.ts`.

## Escalation

See `16_SUPPORT_READINESS.md` severity and paths. Security → Phase B contacts / security owner.

## Troubleshooting

| Symptom | Start with |
|---------|------------|
| Site down | Deployment runbook + health/ready |
| Auth failures | Supabase Auth status + env keys |
| Stale automation | Queue recovery runbook |
| Data wrong tenant | Security incident path |

## Related documents

- `README.md` (this package)
- `00_DOCUMENTATION_READINESS_ASSESSMENT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
