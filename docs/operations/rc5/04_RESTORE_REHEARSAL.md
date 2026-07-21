# RC-5 — Database Restore Rehearsal

Generated: 2026-07-19T01:29:38.974Z
Overall: **deferred_with_harness**
Scratch URL configured: no

## Automated checks

- **[deferred] restore.scratch.missing** — RC5_RESTORE_BASE_URL not set — physical PITR restore requires operator Supabase access (G-RC1-08).

## Operator steps (G-RC1-08)

1. [ ] Confirm Supabase PITR / daily backups enabled (screenshot)
2. [ ] Record earliest restore point
3. [ ] Create non-prod scratch Supabase project
4. [ ] Restore PITR watermark into scratch
5. [ ] Point staging app at scratch NEXT_PUBLIC_SUPABASE_*
6. [ ] Run this harness with RC5_RESTORE_BASE_URL
7. [ ] Login as seeded admin; verify school-scoped list
8. [ ] Negative cross-tenant query (expect empty/deny)
9. [ ] Record RTO/RPO

Canonical procedure: `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md`
