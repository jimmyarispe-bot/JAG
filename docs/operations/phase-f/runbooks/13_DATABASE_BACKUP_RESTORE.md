# Runbook — Database Backup & Restore

| Field | Value |
|-------|-------|
| **Purpose** | Backup validation and restore procedures for Supabase Postgres |
| **Scope** | Production/staging Supabase projects |
| **Audience** | DBAs, on-call |
| **Prerequisites** | Supabase plan with backups; project owner access |
| **Version** | 1.0.0 |

---

## Procedures — Backup

1. Confirm **Point-in-Time Recovery / daily backups** enabled on Supabase plan (org standard).  
2. Before risky migrations: create manual backup / note PITR timestamp.  
3. Quarterly: restore backup to **non-production** project and smoke login + sample queries.  
4. Record evidence in DR test log (`../10_DISASTER_RECOVERY_PLAN.md`).

Storage buckets (documents) are separate — confirm Storage backup/replication settings in Supabase dashboard.

---

## Procedures — Restore

1. Declare incident if production restore.  
2. Put app in maintenance / scale down traffic if needed (Vercel).  
3. Restore per Supabase docs for your plan (PITR or backup restore).  
4. Verify migration version matches expected app release.  
5. Rotate credentials if compromise-related.  
6. Bring app up; run post-deploy validation (`12_DEPLOYMENT.md`).  
7. Communicate RPO achieved (time of restored data).

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Backup not available | Escalate to Supabase support; review plan tier |
| Restore schema mismatch | Deploy matching app git SHA |
| Storage objects missing | Restore/re-sync storage separately |

## Related documents

- `../10_DISASTER_RECOVERY_PLAN.md`
- `../04_DATABASE_DOCUMENTATION.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial — plan-dependent |
