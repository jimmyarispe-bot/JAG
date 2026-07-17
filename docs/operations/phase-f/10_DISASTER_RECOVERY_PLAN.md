# Disaster Recovery Plan — AcademyOS

| Field | Value |
|-------|-------|
| **Purpose** | Business continuity and recovery for production AcademyOS |
| **Scope** | App (Vercel), data (Supabase), email (SendGrid), storage |
| **Audience** | Ops, leadership, engineering |
| **Prerequisites** | Supabase backup tier; documented contacts |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |

---

## Recovery objectives (targets)

| Metric | Target | Notes |
|--------|--------|-------|
| **RTO** | 4 hours | Restore app + DB to usable login |
| **RPO** | 24 hours | Align to daily backups / confirm PITR window on plan |
| **Cron RTO** | 24 hours | Daily schedule; manual drain available |

*Targets must be validated with a DR test — not yet evidenced in-repo.*

---

## Failure scenarios

| Scenario | Response |
|----------|----------|
| Vercel regional outage | Wait/failover per Vercel status; redeploy if needed |
| Bad app release | Rollback deployment (`runbooks/12_DEPLOYMENT.md`) |
| DB corruption / bad migration | Restore (`runbooks/13_DATABASE_BACKUP_RESTORE.md`) |
| Key compromise | Rotate secrets; security incident |
| Full project loss | Recreate Supabase from backup; point Vercel env; redeploy git SHA |

---

## Failover procedures

1. Declare DR event (SEV-1).  
2. Choose: app rollback vs DB restore vs both.  
3. Execute runbooks; keep communications lead updating stakeholders.  
4. Validate: health, ready, staff login, portal login, one finance/admissions read-only.  
5. Re-enable cron after stability.  
6. Postmortem + DR test log update.

---

## Backup validation

| Cadence | Action |
|---------|--------|
| Quarterly | Restore to scratch project; smoke tests |
| Pre-major migrate | Manual backup / PITR mark |
| Annually | Tabletop + technical DR exercise |

---

## Communication plan

| Audience | Channel | Owner |
|----------|---------|-------|
| Internal eng | Incident channel | Incident commander |
| School admins | Status email / agreed channel | Customer success |
| Regulators/parents | Only if PII incident | Privacy lead |

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| RPO missed | Document actual data loss; improve backup tier |
| App/schema skew | Deploy matching git tag |

## Related documents

- `runbooks/11_INCIDENT_RESPONSE.md`
- `runbooks/13_DATABASE_BACKUP_RESTORE.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial targets; validation pending |
