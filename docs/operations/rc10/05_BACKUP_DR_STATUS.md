# RC-10 Backup & Disaster Recovery Status

| Artifact | Path / command |
|----------|----------------|
| DR plan | `docs/operations/phase-f/10_DISASTER_RECOVERY_PLAN.md` |
| Backup/restore runbook | `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md` |
| RC-3 validation checklist | `docs/operations/rc3/04_BACKUP_RESTORE_VALIDATION.md` |
| RC-5 restore rehearsal | `npm run rc5:restore` → `perf-rc5-restore-rehearsal.json` |
| Certification DR engine | `src/lib/certification/dr-engine.ts` |

## Validation expectation

CI runs restore *rehearsal harnesses*. Live environment restore evidence should be attached for the first production customer cutover.
