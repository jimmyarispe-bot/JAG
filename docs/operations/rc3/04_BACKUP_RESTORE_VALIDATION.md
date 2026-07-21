# RC-3 — Backup & Restore Validation

## Targets (from DR plan)

| Metric | Target | Evidenced? |
|--------|--------|------------|
| RPO | ≤ 24h (PITR window dependent on Supabase plan) | **Not evidenced** |
| RTO | ≤ 4h to scratch + config cutover | **Not evidenced** |

Canonical procedure: `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md`  
DR plan: `docs/operations/phase-f/10_DISASTER_RECOVERY_PLAN.md`

## What was validated this sprint

| Step | Result |
|------|--------|
| Procedure documented | Pass |
| App-level EDP backup/restore code paths authz-hardened | Pass (RC3-AUTHZ) |
| Supabase PITR / backup enabled in dashboard | **Operator action required** |
| Restore into non-production scratch project | **Not executed** (no project access in this environment) |
| Post-restore app integrity (health, login, sample RLS) | Pending scratch restore |

## Dry-run checklist (operator — close G-RC1-08 / F1-03)

1. [ ] Confirm Supabase plan includes PITR / daily backups; capture screenshot + timestamp.  
2. [ ] Record current PITR earliest restore point.  
3. [ ] Create **scratch** Supabase project (non-prod).  
4. [ ] Restore latest backup / PITR watermark into scratch.  
5. [ ] Point staging env at scratch (`NEXT_PUBLIC_SUPABASE_*`).  
6. [ ] Run `/api/health`, `/api/ready`, `/api/ready/deep`.  
7. [ ] Login as seeded admin; verify one school-scoped list (students or leads).  
8. [ ] Run a negative cross-tenant query (expect empty / deny).  
9. [ ] Record actual RTO (clock start→healthy) and effective RPO.  
10. [ ] Attach evidence under `docs/launch/phase-g/artifacts/` and close G-RC1-08.

## App-only rollback (no DB)

Vercel previous deployment promote — see `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md`. Can be rehearsed without Supabase CLI.
