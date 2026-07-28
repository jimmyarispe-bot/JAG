# AcademyOS RC-3 — Backup & Recovery

Production backups are host-managed (typically Supabase). AcademyOS validates the operational workflow; it does not implement a proprietary backup agent.

## Full backup

Perform a **full backup** of the managed Supabase project (database + storage) on the cadence required by the customer RPO. Verify backup job success in the host console.

## Configuration backup

Capture a **configuration backup** of environment variables / secret references (names only in git; values in the secret store), feature flags, and connector connection metadata.

## Metadata backup

Capture a **metadata backup** of extension catalog entries, Studio release artifacts, and certification history exports used for audit.

## Restore verification

Run **restore verification** in a non-production project:

1. Restore from the latest full backup into a staging Supabase project.
2. Point a staging app instance at the restored project.
3. Execute `POST /api/academyos/operations/diagnostics` and confirm health is not Critical.
4. Smoke major workflows (login, student list, admissions queue).

## Recovery / rollback

**Recovery** after failed deploy: restore previous image + prior configuration backup, then re-run deployment validation. **Rollback** application releases independently of database restores when migrations are backward-compatible; otherwise restore DB from the pre-migration backup first.

## Checklist

- [ ] Full backup job green
- [ ] Configuration backup recorded
- [ ] Metadata backup recorded
- [ ] Restore verification completed in staging
- [ ] Rollback owner identified
