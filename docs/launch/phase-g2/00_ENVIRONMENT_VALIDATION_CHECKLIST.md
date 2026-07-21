# Phase 2 — Production Environment Validation Checklist

Use against staging then production. Desktop review of **docs/config** only completed in G.2 packaging.

| Component | Expected | Staging | Production | Notes |
|-----------|----------|---------|------------|-------|
| Application hosting | Vercel | ☐ | ☐ | |
| Database | Supabase Postgres | ☐ | ☐ | Apply through 172 |
| Storage | Supabase Storage (`student-documents` private) | ☐ | ☐ | Migration 172 policies |
| CDN | Vercel | ☐ | ☐ | |
| DNS | Customer domain → Vercel | ☐ | ☐ | |
| SSL | Valid cert | ☐ | ☐ | |
| Secrets / env | `PRODUCTION_ENV.md` + env schema | ☐ | ☐ | |
| Email | Resend | ☐ | ☐ | |
| Notifications | Platform + Resend/SMS as configured | ☐ | ☐ | |
| Background workers / queues | `/api/platform/process-queues` | ☐ | ☐ | Cron daily UTC |
| Cron | `vercel.json` `0 0 * * *` | ☐ | ☐ | `CRON_SECRET` |
| Monitoring / alerting / logging | APM + Vercel | ☐ | ☐ | F1-04 open |
| Backups | Supabase PITR/backup | ☐ | ☐ | |

**Config match to architecture:** Confirm against `docs/operations/phase-f/architecture/` and `CURRENT_ARCHITECTURE_REPORT.md`.
