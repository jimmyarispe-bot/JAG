# Disaster recovery

## Backup / restore

- Use Supabase PITR / nightly backups  
- Rehearse restore: `npm run rc5:restore`  
- Document RPO/RTO with hosting provider  

## Validation

- [ ] Backup job healthy  
- [ ] Restore rehearsal completed in last 90 days  
- [ ] Migration rollback strategy understood (prefer forward-fix)  
- [ ] Chaos: kill cron worker briefly; queues catch up  

See `docs/operations/rc10/05_BACKUP_DR_STATUS.md` and `docs/operations/phase-f/` DR guides.
